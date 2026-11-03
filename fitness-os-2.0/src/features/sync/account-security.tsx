"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { resetPasswordSchema } from "@/features/auth/validation";
import { useSync } from "./sync-provider";
import { AccountNotice, messageOf } from "./account-shell";

export function AccountSecurity() {
  const { user, client } = useAuth();
  const { logout, pending, exportPending } = useSync();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ text: "", error: false });
  const [logoutStep, setLogoutStep] = useState(false);
  async function changePassword(event: FormEvent) {
    event.preventDefault(); setNotice({ text: "", error: false });
    const parsed = resetPasswordSchema.safeParse({ password, confirmation });
    if (!parsed.success) { setNotice({ text: parsed.error.issues[0].message, error: true }); return; }
    if (!client) return;
    setBusy(true);
    try { const { error } = await client.auth.updateUser({ password }); if (error) throw new Error("密码更新失败，请检查会话是否有效，或使用邮件重置密码。"); setPassword(""); setConfirmation(""); setNotice({ text: "密码已更新。请妥善保存新密码。", error: false }); }
    catch (error) { setNotice({ text: messageOf(error), error: true }); }
    finally { setBusy(false); }
  }
  async function signOut(discardPending = false) {
    if (pending.length && !discardPending) { setLogoutStep(true); return; }
    setBusy(true);
    try { await logout({ discardPending }); router.replace("/auth/sign-in"); }
    catch (error) { setNotice({ text: messageOf(error), error: true }); }
    finally { setBusy(false); }
  }
  return <div className="account-grid"><section className="account-panel"><span className="eyebrow"><LockKeyhole size={14} />ACCOUNT SECURITY</span><h2>安全地管理登录凭据</h2><p className="account-description">密码由 Supabase Auth 管理，不会存入 FITNESS OS 的资料数据库。</p>
    <form className="account-form" onSubmit={changePassword}><label>新密码<input type="password" name="new-password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><label>确认新密码<input type="password" name="confirm-password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label><small>至少 12 个字符。若身份验证已过期，请通过邮件重新验证。</small><div className="account-actions"><button type="submit" disabled={busy} className="button button-primary button-default">{busy ? "正在处理…" : "更新密码"}</button><Link href="/auth/forgot-password" className="subtle-link">通过邮件重置</Link></div></form><AccountNotice {...notice} />
  </section><section className="account-panel"><span className="eyebrow"><LogOut size={14} />YOUR SESSION</span><h2>账号与设备会话</h2><dl className="account-info"><div><dt>登录邮箱</dt><dd>{user?.email}</dd></div><div><dt>邮箱验证</dt><dd>{user?.email_confirmed_at ? "已验证" : "尚未验证"}</dd></div><div><dt>账号标识</dt><dd className="mono">{user?.id}</dd></div><div><dt>注册日期</dt><dd>{user?.created_at ? new Date(user.created_at).toLocaleDateString("zh-CN") : "—"}</dd></div></dl><p className="account-mini-copy">退出会清除此设备的账号私人快照与同步队列。公共品牌素材和主题显示偏好可继续保留。</p>
    <div className="account-actions"><button className="button button-secondary button-default" disabled={busy} onClick={() => void signOut()}><LogOut size={15} />退出登录</button></div>
    {logoutStep && <div className="account-delete-step"><h3>还有 {pending.length} 项更改未得到云端确认</h3><p className="account-description">现在退出将清除此设备的待同步更改。你可以先下载队列备份，也可以取消并等待同步完成。</p><div className="account-actions"><button className="button button-secondary button-sm" onClick={exportPending}>下载待同步备份</button><button className="button button-secondary button-sm" onClick={() => setLogoutStep(false)}>取消退出</button><button className="button button-default account-danger-button" disabled={busy} onClick={() => void signOut(true)}>确认清除并退出</button></div></div>}
  </section></div>;
}
