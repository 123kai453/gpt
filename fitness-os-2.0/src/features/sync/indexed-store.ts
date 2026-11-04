import { emptyState, type LocalState } from "./model";
const PREFIX = "fitness-os-private-";
const openHandles = new Map<string, IDBDatabase>();
const purges = new Map<string, Promise<void>>();
function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve,reject) => { value.onsuccess=()=>resolve(value.result); value.onerror=()=>reject(value.error ?? new Error("本地存储失败")); });
}
function complete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error ?? new Error("本地存储失败"));tx.onabort=()=>reject(tx.error ?? new Error("本地存储被中断"));});
}
async function open(userId: string): Promise<IDBDatabase> {
  const existing=openHandles.get(userId); if(existing) return existing;
  if(typeof indexedDB === "undefined") throw new Error("浏览器不支持 IndexedDB，无法安全保存离线队列。");
  const req=indexedDB.open(PREFIX+userId,1);
  req.onupgradeneeded=()=>{ req.result.createObjectStore("state"); req.result.createObjectStore("leases"); };
  const db=await request(req);
  db.onversionchange=()=>{db.close();openHandles.delete(userId);};
  openHandles.set(userId,db); return db;
}
export async function readState(userId: string): Promise<LocalState> {
  const db=await open(userId); const tx=db.transaction("state","readonly");
  const done=complete(tx); const value=await request(tx.objectStore("state").get("current")); await done;
  return value ?? emptyState();
}
export async function updateState(userId: string, transform: (state: LocalState)=>LocalState): Promise<LocalState> {
  const db=await open(userId); const tx=db.transaction("state","readwrite"); const done=complete(tx); const store=tx.objectStore("state");
  let result:LocalState=emptyState(); let error:unknown;
  const read=store.get("current");
  read.onsuccess=()=>{ try {result=transform(read.result ?? emptyState());store.put(result,"current");}catch(e){error=e;tx.abort();} };
  try {await done;} catch(e) {throw error ?? e;} return result;
}
export function clearPrivateStore(userId: string): Promise<void> {
  const existing=purges.get(userId);if(existing)return existing;
  const task=(async()=>{
    openHandles.get(userId)?.close(); openHandles.delete(userId);
    await new Promise<void>((resolve,reject)=>{const req=indexedDB.deleteDatabase(PREFIX+userId);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error("其他页面仍在使用账户缓存，请关闭该页面后重试退出。"));});
    try{localStorage.removeItem("fitness-os-device-"+userId);if(localStorage.getItem("fitness-os-last-account")===userId)localStorage.removeItem("fitness-os-last-account");}catch{ /* not health data */ }
  })();
  const pending=task.finally(()=>{if(purges.get(userId)===pending)purges.delete(userId);});
  purges.set(userId,pending);return pending;
}

async function lease(userId:string, owner:string, release=false):Promise<boolean> {
  if(release && !openHandles.has(userId))return false;
  const db=await open(userId);const tx=db.transaction("leases","readwrite");const done=complete(tx);const store=tx.objectStore("leases");let acquired=false;
  const req=store.get("sync");req.onsuccess=()=>{const row=req.result as {owner:string,expires:number}|undefined; if(release){if(row?.owner===owner)store.delete("sync");return;} if(!row || row.expires<Date.now() || row.owner===owner){store.put({owner,expires:Date.now()+45_000},"sync");acquired=true;}};
  await done;return acquired;
}
export async function withSyncLock(userId:string, work:()=>Promise<void>):Promise<void> {
  if(typeof navigator!=="undefined" && navigator.locks) {
    await navigator.locks.request(PREFIX+userId,{ifAvailable:true},async(lock)=>{if(lock)await work();});return;
  }
  const owner=crypto.randomUUID();if(!await lease(userId,owner))return;
  const timer=setInterval(()=>{void lease(userId,owner).catch(()=>{});},10_000);
  try{await work();}finally{clearInterval(timer);await lease(userId,owner,true);}
}
export function closePrivateStore(userId:string):void {openHandles.get(userId)?.close();openHandles.delete(userId);}
