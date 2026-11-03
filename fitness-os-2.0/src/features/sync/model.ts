import type { AccountRecord, AccountSnapshot, Entity, Mutation, MutationResult } from "@/lib/account/types";

export type QueueItem = {
  mutation: Mutation; status: "pending" | "conflict" | "failed";
  attempts: number; nextAttemptAt: number; error?: string; conflict?: MutationResult;
};
export type LocalState = { snapshot: AccountSnapshot | null; queue: QueueItem[]; lastSyncedAt: string | null };
export const emptyState = (): LocalState => ({ snapshot: null, queue: [], lastSyncedAt: null });
export const recordFor = (snapshot: AccountSnapshot, entity: Entity): AccountRecord => entity === "profile" ? snapshot.profile : snapshot.preferences;
export function setRecord(snapshot: AccountSnapshot, entity: Entity, record: AccountRecord): AccountSnapshot {
  return { ...snapshot, [entity === "profile" ? "profile" : "preferences"]: record } as AccountSnapshot;
}
export function projectSnapshot(state: LocalState): AccountSnapshot | null {
  let snapshot = state.snapshot;
  if (!snapshot) return null;
  for (const item of state.queue) {
    const {entity, patch, baseVersion} = item.mutation;
    const record = recordFor(snapshot, entity);
    snapshot = setRecord(snapshot, entity, { ...record, ...patch, version: Math.max(record.version, baseVersion + 1) } as AccountRecord);
  }
  return snapshot;
}
export function appendMutation(state: LocalState, mutation: Omit<Mutation, "baseVersion">): LocalState {
  const projected = projectSnapshot(state);
  if (!projected) throw new Error("请先联网读取账户，再进行离线修改。");
  if (state.queue.length >= 200) throw new Error("待同步操作达到 200 条，请先恢复同步或导出待同步内容。");
  const baseVersion = recordFor(projected, mutation.entity).version;
  return { ...state, queue: [...state.queue, { mutation: {...mutation, baseVersion}, status: "pending", attempts: 0, nextAttemptAt: 0 }] };
}
export function applyResult(state: LocalState, id: string, result: MutationResult): LocalState {
  const current = state.queue.find((q) => q.mutation.mutationId === id);
  if (!current) return state;
  const snapshot = state.snapshot ? setRecord(state.snapshot, result.entity, result.record) : null;
  if (result.status === "applied") return { ...state, snapshot, queue: state.queue.filter((q) => q.mutation.mutationId !== id), lastSyncedAt: new Date().toISOString() };
  return { ...state, snapshot, queue: state.queue.map((q) => q.mutation.mutationId === id ? { ...q, status: "conflict", error: "云端版本已变化，请选择保留云端内容或重新提交本地修改。", conflict: result } : q) };
}
export function resolveItem(state: LocalState, id: string, choice: "cloud" | "local", uuid: () => string): LocalState {
  const index = state.queue.findIndex((q) => q.mutation.mutationId === id);
  const item = state.queue[index];
  if (!item?.conflict || item.status !== "conflict") throw new Error("该冲突已经处理，请刷新队列。");
  const entity = item.mutation.entity;
  let version = item.conflict.version;
  const queue: QueueItem[] = [];
  for (let n=0; n<state.queue.length; n++) {
    const q=state.queue[n];
    if (n===index) {
      if (choice === "local") { queue.push({ mutation: { ...q.mutation, mutationId: uuid(), baseVersion: version++ }, status: "pending", attempts: 0, nextAttemptAt: 0 }); }
    } else if (n>index && q.mutation.entity===entity && q.attempts===0) {
      // These operations were never transmitted. Rebase them after the explicit choice.
      queue.push({ ...q, mutation: {...q.mutation, mutationId: uuid(), baseVersion: version++}, nextAttemptAt: 0 });
    } else queue.push(q);
  }
  return {...state,queue};
}
export function nextMutation(state: LocalState, now: number): QueueItem | undefined {
  const seen = new Set<Entity>();
  return state.queue.find((q) => {
    if (seen.has(q.mutation.entity)) return false;
    seen.add(q.mutation.entity);
    return q.status === "pending" && q.nextAttemptAt <= now;
  });
}
export function retryDelay(attempts: number, random = Math.random()): number {
  return Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6)) + Math.floor(Math.max(0,Math.min(random,1))*500);
}
