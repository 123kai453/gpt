"use client";
import { useState } from "react";
import { Cloud, RefreshCw, ShieldCheck } from "lucide-react";
import { useSync } from "./sync-provider";
import { AccountNotice, messageOf } from "./account-shell";

export function AccountSyncStatus() {
  const { snapshot, pending, online, syncing, loading, error, retry, resolveConflict, discardMutation, exportPending, lastSyncedAt } = useSync();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(operation: () => Promise<void>) { setBusy(true); setNotice(""); try { await operation(); } catch (e) { setNotice(messageOf(e)); } finally { setBusy(false); } }
  return <><section className="account-panel"><span className="eyebrow"><Cloud size={14} />SYNC ENGINE</span><h2>你的进步，跨设备连续</h2><p className="account-description">同一账号通过云端数据库共享资料与偏好。离线队列保存在此设备的 IndexedDB；网络恢复后自动重试，冲突由你选择。</p>
    <div className="account-metrics"><div><strong>{online ? "在线" : "离线"}</strong><span>当前网络</span></div><div><strong>{pending.length}</strong><span>待确认操作</span></div><div><strong>{syncing || loading ? "同步中" : pending.length ? "待处理" : snapshot ? "已就绪" : "未连接"}</strong><span>同步引擎</span></div></div>
    <div className="account-actions"><button className="button button-primary button-default" onClick={() => void act(retry)} disabled={busy || syncing || !online}><RefreshCw size={15} />{syncing ? "同步处理中…" : "立即同步 / 重试"}</button><button className="button button-secondary button-default" onClick={exportPending} disabled={!pending.length}>下载待同步备份</button></div><AccountNotice text={error || notice} error />
    {snapshot && <p className="account-mini-copy">资料版本 {snapshot.profile.version} · 偏好版本 {snapshot.preferences.version} · 最近云端确认：{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString("zh-CN") : "尚未确认"}。页面显示包含尚未确认的本地修改；以待同步操作清空且服务器读取成功为准。</p>}
  </section>
  <section className="account-panel"><h2>本设备待同步操作</h2>{!pending.length ? <p className="account-empty">当前没有待同步更改。另一台设备更新后，在线页面将在定时检查、重新聚焦或重新联网时读取更新。</p> : <ul className="account-list">{pending.map((item) => <li key={item.mutation.mutationId}>
    <div className="account-queue-title"><h3>{item.mutation.entity === "profile" ? "个人资料" : "个人偏好"}</h3><span className="account-pill">{item.status === "conflict" ? "需要处理冲突" : item.status === "failed" ? "同步失败" : "等待云端确认"}</span></div>
    <p>基础版本 {item.mutation.baseVersion} · 重试 {item.attempts} 次</p>{item.error && <AccountNotice text={item.error} error />}
    <details className="account-conflict"><summary>查看此操作修改内容</summary><pre>{JSON.stringify(item.mutation.patch, null, 2)}</pre></details>
    {item.status === "failed" && <div className="account-actions"><button className="button button-secondary button-sm" onClick={exportPending}>先下载队列备份</button><button className="button button-secondary button-sm" disabled={busy} onClick={() => { if (window.confirm("确认放弃这项未同步修改？此操作不可撤销，可先下载待同步备份。")) void act(() => discardMutation(item.mutation.mutationId)); }}>放弃此项失败修改</button></div>}
    {item.status === "conflict" && item.conflict && <div className="account-conflict"><h3>云端已有更新（版本 {item.conflict.version}）</h3><p className="account-description">本地更改已保留。选择使用云端版本将放弃本项本地修改；保留本地修改会基于最新版本再次提交，仍可能遇到新的冲突。</p><details><summary>查看云端记录</summary><pre>{JSON.stringify(item.conflict.record, null, 2)}</pre></details><div className="account-actions"><button className="button button-secondary button-sm" disabled={busy} onClick={() => void act(() => resolveConflict(item.mutation.mutationId, "cloud"))}>使用云端版本</button><button className="button button-primary button-sm" disabled={busy} onClick={() => void act(() => resolveConflict(item.mutation.mutationId, "local"))}>保留本地修改并重试</button></div></div>}
  </li>)}</ul>}</section>
  <p className="account-mini-copy"><ShieldCheck size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />私人快照和队列不会进入公共 Service Worker 缓存。请避免在公共或共享设备保留登录状态。</p></>;
}
