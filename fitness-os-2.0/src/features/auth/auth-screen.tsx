"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Fingerprint, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorialImage } from "@/components/media/editorial-image";
import { useAuth } from "./auth-provider";
import { authCallbackUrl, safeAuthNextPath } from "./redirects";
import { emailSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./validation";

export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password" | "verify-email";

const copy: Record<AuthMode, { eyebrow: string; title: string; description: string; button: string }> = {
  "sign-in": { eyebrow: "WELCOME BACK", title: "每一次回归，\n都是新的开始。", description: "登录你的账户，让每一份努力在不同设备之间延续。", button: "登录账户" },
  "sign-up": { eyebrow: "YOUR NEXT CHAPTER", title: "为长期进步，\n建立一个起点。", description: "创建个人账户，开启属于你的 FITNESS OS。", button: "创建账户" },
  "forgot-password": { eyebrow: "FIND YOUR WAY BACK", title: "重新连接，\n继续向前。", description: "输入注册邮箱，我们将发送安全的密码重置指引。", button: "发送重置邮件" },
  "reset-password": { eyebrow: "A FRESH START", title: "设置新密码，\n准备再次出发。", description: "使用至少 12 个字符的独立密码，保护你的个人空间。", button: "保存新密码" },
  "verify-email": { eyebrow: "ONE MORE STEP", title: "确认邮箱，\n让账户属于你。", description: "打开邮件中的确认链接。若没有收到，请检查垃圾邮件文件夹。", button: "重新发送确认邮件" },
};

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const { client, user, loading, configured, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const content = copy[mode];
  const callbackFailed = searchParams.get("error") === "callback";
  const next = safeAuthNextPath(searchParams.get("next"));
  const hasPassword = mode === "sign-in" || mode === "sign-up" || mode === "reset-password";
  const needsRecovery = mode === "reset-password" && !loading && !user;
  const accountEntry = mode === "sign-in" || mode === "sign-up";
  const alreadySignedIn = accountEntry && Boolean(user);
  const checkingAccount = accountEntry && loading;

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy || cooldown || resetComplete || alreadySignedIn || checkingAccount) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "");
    const password = String(values.get("password") ?? "");
    setError(null);
    setMessage(null);

    const parsed = mode === "sign-in"
      ? signInSchema.safeParse({ email, password })
      : mode === "sign-up"
        ? signUpSchema.safeParse({ email, password, displayName: String(values.get("displayName") ?? "") })
        : mode === "reset-password"
          ? resetPasswordSchema.safeParse({ password, confirmation: String(values.get("confirmation") ?? "") })
          : emailSchema.safeParse(email);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "请检查输入内容。"); return; }

    setBusy(true);
    setCooldown(5);
    try {
      const redirectTo = authCallbackUrl(window.location.origin);
      if (mode === "sign-in") {
        const data = signInSchema.parse({ email, password });
        const result = await client.auth.signInWithPassword(data);
        if (result.error) { setError("登录未完成，请检查邮箱和密码，或稍后再试。"); return; }
        await refreshUser();
        router.replace(next);
        router.refresh();
      } else if (mode === "sign-up") {
        const data = signUpSchema.parse({ email, password, displayName: String(values.get("displayName") ?? "") });
        const result = await client.auth.signUp({ email: data.email, password: data.password, options: { emailRedirectTo: redirectTo, data: { display_name: data.displayName } } });
        if (result.error) { setError("注册请求暂未完成。请检查输入，或稍后重试。"); return; }
        await refreshUser();
        router.push("/auth/verify-email");
      } else if (mode === "forgot-password") {
        const result = await client.auth.resetPasswordForEmail(emailSchema.parse(email), { redirectTo: authCallbackUrl(window.location.origin, "/auth/reset-password") });
        if (result.error) { setError("暂时无法发送邮件，请稍后重试。"); return; }
        setMessage("如果该邮箱可以接收账户恢复邮件，你会收到重置指引。请检查邮箱和垃圾邮件文件夹。");
      } else if (mode === "verify-email") {
        const result = await client.auth.resend({ type: "signup", email: emailSchema.parse(email), options: { emailRedirectTo: redirectTo } });
        if (result.error) { setError("暂时无法发送邮件，请稍后重试。"); return; }
        setMessage("如果账户需要验证，我们会向该邮箱发送确认邮件。请稍候再检查收件箱。");
      } else {
        const currentUser = await client.auth.getUser();
        if (currentUser.error || !currentUser.data.user) { setError("恢复会话已过期，请重新申请重置邮件。"); return; }
        const result = await client.auth.updateUser({ password: resetPasswordSchema.parse({ password, confirmation: String(values.get("confirmation") ?? "") }).password });
        if (result.error) { setError("密码更新未完成。请尝试不同的新密码，或重新申请恢复链接。"); return; }
        await refreshUser();
        setResetComplete(true);
        setMessage("新密码已保存。你可以继续管理个人账户。");
      }
    } catch {
      setError("暂时无法连接账户服务，请检查网络后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-experience" aria-labelledby="auth-title">
    <div className="auth-visual">
      <EditorialImage src="/images/hero/athlete-desktop.webp" smallSrc="/images/hero/athlete-desktop-960.webp" mobileSrc="/images/hero/athlete-mobile.webp" mobileSmallSrc="/images/hero/athlete-mobile-390.webp" width={1536} height={1024} alt="运动员在安静的训练空间中准备下一次训练" priority sizes="(max-width: 900px) 100vw, 45vw" />
      <div className="auth-visual-shade" />
      <div className="auth-visual-top"><span className="auth-wordmark">FITNESS OS <span>2.0</span></span><span className="auth-live-pill"><i /> YOUR PERSONAL OS</span></div>
      <div className="auth-visual-copy"><span className="auth-eyebrow">BUILT FOR THE LONG RUN</span><h2>把努力，<br />变成自己的轨迹。</h2><p>训练 · 营养 · 恢复 · 长期进步</p><div className="auth-visual-rule" /><span className="auth-visual-caption">ONE ACCOUNT. EVERY NEXT STEP.</span></div>
    </div>
    <div className="auth-panel">
      <Link href="/" className="auth-back-link">← 返回运动空间</Link>
      <div className="auth-heading"><span className="auth-icon"><Fingerprint size={24} strokeWidth={1.4} /></span><p className="auth-eyebrow">{content.eyebrow}</p><h1 id="auth-title">{content.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><p>{content.description}</p></div>
      {!configured && <div className="auth-notice" role="status"><ShieldCheck size={19} /><div><strong>账户服务尚未配置</strong><p>请在环境设置中配置 Supabase 项目地址和公开的 publishable / anon key，然后重新构建应用。当前不能注册或登录。</p></div></div>}
      {alreadySignedIn && <div className="auth-notice" role="status"><ShieldCheck size={19} /><div><strong>当前已登录 {user?.email}</strong><p>切换账户前，请先在账号安全中退出，并处理尚未同步的修改。</p><Link href="/account/security">管理当前账户与退出 <ArrowRight size={14} /></Link></div></div>}
      {mode === "sign-in" && !user && configured && <p className="auth-privacy-note">不同账号的待同步修改隔离保存。重新登录原账号，可以恢复其待同步修改。</p>}
      {callbackFailed && <p className="auth-message auth-error" role="alert">确认链接无效、已使用或已过期。请重新登录，或申请新的确认 / 重置邮件。</p>}
      {mode === "verify-email" && user?.email_confirmed_at && <div className="auth-notice auth-positive"><CheckCircle2 size={20} /><div><strong>邮箱已确认</strong><p>{user.email}</p><Link href="/account/profile">进入个人账户 <ArrowRight size={14} /></Link></div></div>}
      {mode === "reset-password" && loading && <p className="auth-session-check" role="status"><LoaderCircle size={16} className="auth-spin" /> 正在检查恢复会话…</p>}
      {needsRecovery && <div className="auth-notice" role="status"><Mail size={20} /><div><strong>请先打开邮件中的恢复链接</strong><p>此页面需要有效的账户恢复会话。链接过期时，可以重新申请。</p><Link href="/auth/forgot-password">发送新的重置邮件 <ArrowRight size={14} /></Link></div></div>}
      <form className="auth-form" onSubmit={submit} noValidate>
        {mode === "sign-up" && <label className="auth-field">怎么称呼你 <span>可选</span><input name="displayName" autoComplete="nickname" maxLength={64} placeholder="你的称呼" disabled={busy || !configured || alreadySignedIn || checkingAccount} /></label>}
        {mode !== "reset-password" && <label className="auth-field">邮箱地址<input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required defaultValue={user?.email ?? ""} placeholder="you@example.com" disabled={busy || !configured || alreadySignedIn || checkingAccount} /></label>}
        {hasPassword && <label className="auth-field">{mode === "reset-password" ? "新密码" : "密码"}<div className="auth-password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} maxLength={128} minLength={mode === "sign-in" ? 1 : 12} required placeholder={mode === "sign-in" ? "输入你的密码" : "至少 12 个字符"} disabled={busy || !configured || needsRecovery || resetComplete || alreadySignedIn || checkingAccount} /><button type="button" aria-label={showPassword ? "隐藏密码" : "显示密码"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}
        {mode === "reset-password" && <label className="auth-field">再次输入新密码<input name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={128} required placeholder="再次输入新密码" disabled={busy || !configured || needsRecovery || resetComplete} /></label>}
        {mode === "sign-in" && <Link className="auth-forgot" href="/auth/forgot-password">忘记密码？</Link>}
        {error && <p className="auth-message auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message auth-success" role="status">{message}</p>}
        <Button type="submit" className="auth-submit" disabled={!configured || busy || cooldown > 0 || needsRecovery || (mode === "reset-password" && loading) || resetComplete || alreadySignedIn || checkingAccount}>{busy ? <><LoaderCircle size={18} className="auth-spin" /> 正在处理…</> : cooldown > 0 ? `${cooldown} 秒后可重试` : <>{content.button}<ArrowRight size={18} /></>}</Button>
        {resetComplete && <Button asChild variant="secondary"><Link href="/account/profile">进入个人账户</Link></Button>}
      </form>
      <div className="auth-switch">{mode === "sign-in" ? <>还没有账户？ <Link href="/auth/sign-up">创建账户 <ArrowRight size={14} /></Link></> : <>已有账户？ <Link href="/auth/sign-in">返回登录 <ArrowRight size={14} /></Link></>}</div>
      <p className="auth-privacy-note"><ShieldCheck size={15} /> 账户验证由 Supabase Auth 处理。请勿分享密码、邮件确认链接或恢复链接。</p>
    </div>
  </section>;
}
