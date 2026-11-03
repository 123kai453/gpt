"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, ImagePlus, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import type { MediaRecord } from "@/lib/account/types";
import { useSync } from "./sync-provider";
import { AccountNotice, accountRequest, messageOf, saveDownload } from "./account-shell";

type PageData<T> = { nextOffset?: number | null; current?: Record<string, Consent> } & T;
function uniqueIds<T extends { id: string }>(records: T[]): T[] { return [...new Map(records.map((record) => [record.id, record])).values()]; }
type Consent = { id: string; scope: string; granted: boolean; policy_version: string; created_at: string };
const scopes = [
  { key: "privacy_policy", title: "隐私政策确认", detail: "记录你是否已确认当前隐私政策版本。" },
  { key: "terms", title: "使用条款确认", detail: "记录你对当前使用条款的选择。" },
  { key: "analytics", title: "可选使用分析", detail: "只保存你的偏好；本阶段未启用分析追踪。" },
  { key: "health_data", title: "健康数据授权偏好", detail: "只保存授权选择；本阶段不连接设备或采集健康记录。" },
] as const;
const jsonHeaders = { "Content-Type": "application/json" };
const fileLimit = 5 * 1024 * 1024;
export function AccountPrivacy() {
  const { user } = useAuth();
  const { pending, logout, exportPending } = useSync();
  const router = useRouter();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [currentConsents, setCurrentConsents] = useState<Record<string, Consent> | null>(null);
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [consentNextOffset, setConsentNextOffset] = useState<number | null>(null);
  const [mediaNextOffset, setMediaNextOffset] = useState<number | null>(null);
  const [consentsLoaded, setConsentsLoaded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [consentNotice, setConsentNotice] = useState({ text: "", error: false });
  const [mediaNotice, setMediaNotice] = useState({ text: "", error: false });
  const [exportNotice, setExportNotice] = useState({ text: "", error: false });
  const [deleteNotice, setDeleteNotice] = useState({ text: "", error: false });
  const [consentBusy, setConsentBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [deleteStep, setDeleteStep] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const loadConsents = useCallback(async (signal?: AbortSignal) => {
    const data = await accountRequest<PageData<{ consents: Consent[] }>>("/api/account/consents", { signal });
    setConsents(data.consents); setCurrentConsents(data.current ?? null); setConsentNextOffset(data.nextOffset ?? null); setConsentsLoaded(true);
  }, []);
  const loadMedia = useCallback(async (signal?: AbortSignal) => {
    const data = await accountRequest<PageData<{ media: MediaRecord[] }>>("/api/account/media", { signal });
    setMedia(data.media); setMediaNextOffset(data.nextOffset ?? null); setMediaLoaded(true);
  }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void accountRequest<PageData<{ consents: Consent[] }>>("/api/account/consents", { signal: controller.signal }).then((data) => { setConsents(data.consents); setCurrentConsents(data.current ?? null); setConsentNextOffset(data.nextOffset ?? null); setConsentsLoaded(true); }).catch((error) => { if (!controller.signal.aborted) setConsentNotice({ text: messageOf(error), error: true }); });
    void accountRequest<PageData<{ media: MediaRecord[] }>>("/api/account/media", { signal: controller.signal }).then((data) => { setMedia(data.media); setMediaNextOffset(data.nextOffset ?? null); setMediaLoaded(true); }).catch((error) => { if (!controller.signal.aborted) setMediaNotice({ text: messageOf(error), error: true }); });
    return () => controller.abort();
  }, [user, loadConsents, loadMedia]);
  async function moreConsents() {
    if (consentNextOffset === null) return;
    setConsentBusy(true);
    try { const data = await accountRequest<PageData<{ consents: Consent[] }>>(`/api/account/consents?offset=${consentNextOffset}&limit=100`); setConsents((current) => uniqueIds([...current, ...data.consents])); setConsentNextOffset(data.nextOffset ?? null); }
    catch (error) { setConsentNotice({ text: messageOf(error), error: true }); }
    finally { setConsentBusy(false); }
  }
  async function moreMedia() {
    if (mediaNextOffset === null) return;
    setMediaBusy(true);
    try { const data = await accountRequest<PageData<{ media: MediaRecord[] }>>(`/api/account/media?offset=${mediaNextOffset}&limit=100`); setMedia((current) => uniqueIds([...current, ...data.media])); setMediaNextOffset(data.nextOffset ?? null); }
    catch (error) { setMediaNotice({ text: messageOf(error), error: true }); }
    finally { setMediaBusy(false); }
  }
  async function changeConsent(scope: string, granted: boolean) {
    setConsentBusy(true); setConsentNotice({ text: "", error: false });
    try { await accountRequest("/api/account/consents", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ scope, granted, policy_version: "2.0-phase2" }) }); await loadConsents(); setConsentNotice({ text: "授权选择已记录。撤回会增加一条新的记录，以保留授权历史。", error: false }); }
    catch (error) { setConsentNotice({ text: messageOf(error), error: true }); }
    finally { setConsentBusy(false); }
  }
  async function downloadExport(format: "json" | "csv") {
    setExportBusy(true); setExportNotice({ text: "", error: false });
    try {
      const response = await fetch("/api/account/export", { method: "POST", credentials: "same-origin", cache: "no-store", headers: jsonHeaders, body: JSON.stringify({ format }) });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message || "导出失败，请重试。"); }
      saveDownload(await response.blob(), `fitness-os-account-${new Date().toISOString().slice(0, 10)}.${format}`);
      setExportNotice({ text: "云端账号数据导出已生成。下载文件包含私人信息，请妥善保存。未同步的本地更改请另外下载队列备份。", error: false });
    } catch (error) { setExportNotice({ text: messageOf(error), error: true }); }
    finally { setExportBusy(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setMediaNotice({ text: "", error: false });
    if (!file) { setMediaNotice({ text: "请先选择图片。", error: true }); return; }
    if (file.size > fileLimit || file.size === 0) { setMediaNotice({ text: "请选择大于 0 且不超过 5 MB 的图片。", error: true }); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setMediaNotice({ text: "当前只接受 PNG、JPEG 或 WebP 图片。", error: true }); return; }
    setMediaBusy(true);
    try { const body = new FormData(); body.set("file", file); await accountRequest("/api/account/media", { method: "POST", body }); setFile(null); form.reset(); await loadMedia(); setMediaNotice({ text: "图片已保存到你的私有存储空间。", error: false }); }
    catch (error) { setMediaNotice({ text: messageOf(error), error: true }); }
    finally { setMediaBusy(false); }
  }
  async function removeMedia(id: string) {
    if (!window.confirm("确认删除这张私人图片及其关联记录？")) return;
    setMediaBusy(true); setMediaNotice({ text: "", error: false });
    try { await accountRequest(`/api/account/media/${encodeURIComponent(id)}`, { method: "DELETE" }); await loadMedia(); setMediaNotice({ text: "私人图片及关联记录已删除。", error: false }); }
    catch (error) { setMediaNotice({ text: messageOf(error), error: true }); }
    finally { setMediaBusy(false); }
  }
  async function downloadMedia(item: MediaRecord) {
    setMediaBusy(true); setMediaNotice({ text: "", error: false });
    try { const response = await fetch(`/api/account/media/${encodeURIComponent(item.id)}`, { credentials: "same-origin", cache: "no-store" }); if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message || "图片读取失败。"); } const ext = item.mime_type === "image/jpeg" ? "jpg" : item.mime_type === "image/png" ? "png" : "webp"; saveDownload(await response.blob(), `fitness-os-private-${item.id}.${ext}`); }
    catch (error) { setMediaNotice({ text: messageOf(error), error: true }); }
    finally { setMediaBusy(false); }
  }
  async function deleteAccount(event: FormEvent) {
    event.preventDefault(); if (confirmation !== "DELETE" || !acknowledged || !password) return;
    setDeleting(true); setDeleteNotice({ text: "正在删除私人文件、数据库记录和登录账号，请保持页面打开。", error: false });
    try {
      const result = await accountRequest<{ deleted: boolean }>("/api/account/delete", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ confirmation, password }) });
      if (!result.deleted) throw new Error("服务端尚未确认账号完整删除，请稍后重试。");
      setPassword("");
      await logout({ discardPending: true });
      router.replace("/auth/sign-in?deleted=1");
    } catch (error) { setDeleteNotice({ text: messageOf(error), error: true }); }
    finally { setDeleting(false); }
  }
  return <>
    <div className="account-grid"><section className="account-panel"><span className="eyebrow"><Download size={14} />DATA PORTABILITY</span><h2>你的数据，可以带走</h2><p className="account-description">导出当前云端保存的账户资料、偏好、授权记录和附件元数据。私人图片请从下方单独下载；离线队列未确认的更改不包含在云端导出中。</p><div className="account-actions"><button className="button button-primary button-default" disabled={exportBusy} onClick={() => void downloadExport("json")}>导出 JSON</button><button className="button button-secondary button-default" disabled={exportBusy} onClick={() => void downloadExport("csv")}>导出 CSV</button>{pending.length > 0 && <button className="button button-secondary button-default" onClick={exportPending}>下载待同步备份（{pending.length}）</button>}</div><AccountNotice {...exportNotice} /></section>
    <section className="account-panel"><span className="eyebrow"><ShieldCheck size={14} />YOUR CONSENT</span><h2>每一次授权，都由你决定</h2><p className="account-description">默认私人。本阶段仅记录授权选择，不会因为勾选而启用未来的分析、健康采集或分享功能。</p>
      {!consentsLoaded ? <><p className="account-empty">{consentNotice.error ? "尚未取得授权记录。" : "正在读取授权记录…"}</p>{consentNotice.error && <button className="button button-secondary button-sm" onClick={() => void loadConsents().catch((e) => setConsentNotice({ text: messageOf(e), error: true }))}>重新读取</button>}</> : scopes.map((scope) => {
        const current = currentConsents?.[scope.key] || consents.filter((item) => item.scope === scope.key).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return <label key={scope.key} className="account-consent-row"><input type="checkbox" checked={Boolean(current?.granted)} disabled={consentBusy || (!current && currentConsents === null && consentNextOffset !== null)} onChange={(e) => void changeConsent(scope.key, e.target.checked)} /><span><strong>{scope.title}</strong><small>{scope.detail}{!current && currentConsents === null && consentNextOffset !== null ? " 当前已加载记录中尚无此项，请继续加载历史记录确认。" : ""}</small></span></label>;
      })}<AccountNotice {...consentNotice} /><details className="account-conflict"><summary>查看已加载授权历史（{consents.length}{consentNextOffset !== null ? "+" : ""}）</summary><ul className="account-list">{consents.map((consent) => <li key={consent.id}>{scopes.find((s) => s.key === consent.scope)?.title || consent.scope} · {consent.granted ? "同意" : "撤回 / 未同意"}<p>{consent.policy_version} · {new Date(consent.created_at).toLocaleString("zh-CN")}</p></li>)}</ul>{consentNextOffset !== null && <button className="button button-secondary button-sm" disabled={consentBusy} onClick={() => void moreConsents()}>加载更多授权记录</button>}</details>
    </section></div>
    <section className="account-panel" style={{ marginTop: 20 }}><span className="eyebrow"><ImagePlus size={14} />PRIVATE MEDIA</span><h2>属于你的私人媒体空间</h2><p className="account-description">当前提供图片存储基础，不进行食品识别。PNG、JPEG 或 WebP，每张最多 5 MB；服务端会再次检查文件内容和权限。品牌图片继续保留在公开素材目录。</p>
      <form className="account-form" onSubmit={upload}><label>选择私人图片<input type="file" name="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label><div className="account-actions"><button className="button button-primary button-default" disabled={mediaBusy || !file} type="submit">{mediaBusy ? "正在处理…" : "上传私人图片"}</button><button className="button button-secondary button-default" type="button" disabled={mediaBusy} onClick={() => void loadMedia().catch((e) => setMediaNotice({ text: messageOf(e), error: true }))}>刷新文件列表</button></div></form><AccountNotice {...mediaNotice} />
      <p className="account-mini-copy">{mediaNextOffset !== null ? "当前已加载图片" : "当前账号已登记图片"} {media.length} 张 · {(media.reduce((total, item) => total + item.size_bytes, 0) / 1024 / 1024).toFixed(2)} MB。此统计为已加载元数据合计，不代表 Supabase 整个项目的计费使用量。</p>
      {!mediaLoaded ? <p className="account-empty">尚未取得私人文件列表。</p> : media.length === 0 ? <p className="account-empty">目前还没有私人图片。</p> : <ul className="account-list">{media.map((item) => <li key={item.id}><div className="account-media-title"><code>{item.id}</code><span className="account-pill">{item.status === "ready" ? "可读取" : item.status === "pending" ? "等待上传完成" : item.status === "deleting" ? "等待删除完成" : "处理失败"}</span></div><p>{item.mime_type} · {(item.size_bytes / 1024).toFixed(1)} KB · {new Date(item.created_at).toLocaleString("zh-CN")}</p><div className="account-actions"><button className="button button-secondary button-sm" disabled={mediaBusy || item.status !== "ready"} onClick={() => void downloadMedia(item)}>下载图片</button><button className="button button-secondary button-sm" disabled={mediaBusy} onClick={() => void removeMedia(item.id)}><Trash2 size={13} />删除图片</button></div></li>)}</ul>}{mediaNextOffset !== null && <div className="account-actions"><button className="button button-secondary button-default" disabled={mediaBusy} onClick={() => void moreMedia()}>加载更多私人图片</button></div>}
    </section>
    <section className="account-panel account-danger"><span className="eyebrow"><Trash2 size={14} />ACCOUNT DELETION</span><h2>删除账号与关联数据</h2><p className="account-description">这会删除账号、关联数据库记录和私人存储文件。删除不可撤销，请先导出需要保留的数据。服务端只有在完成清理后才会报告成功；遇到失败会保留可重试的删除状态。</p>
      {!deleteStep ? <button className="button button-default account-danger-button" onClick={() => setDeleteStep(true)}>开始删除账号</button> : <form className="account-form account-delete-step" onSubmit={deleteAccount}>
        {pending.length > 0 && <><p className="account-description">此设备仍有 {pending.length} 项未同步操作，删除账号会一并清除。建议先下载备份。</p><div className="account-actions"><button type="button" className="button button-secondary button-sm" onClick={exportPending}>下载待同步备份</button></div></>}
        <label className="account-check"><input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} required />我已确认删除不可撤销，已保存需要保留的数据。</label>
        <label>输入 DELETE 确认<input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required autoComplete="off" spellCheck={false} pattern="DELETE" /></label>
        <label>当前密码（再次验证身份）<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} /></label>
        <div className="account-actions"><button type="submit" className="button button-default account-danger-button" disabled={deleting || !acknowledged || confirmation !== "DELETE" || !password}>{deleting ? "正在删除…" : "最终确认：永久删除我的账号"}</button><button className="button button-secondary button-default" type="button" disabled={deleting} onClick={() => { setDeleteStep(false); setPassword(""); setConfirmation(""); setAcknowledged(false); }}>取消删除</button></div>
      </form>}<AccountNotice {...deleteNotice} />
    </section>
  </>;
}
