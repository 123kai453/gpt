"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, CloudOff, LockKeyhole, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { useSync } from "./sync-provider";
import "./account.css";

const tabs = [
  { href: "/account/profile", label: "个人资料", icon: UserRound },
  { href: "/account/security", label: "账号安全", icon: LockKeyhole },
  { href: "/account/sync", label: "同步状态", icon: RefreshCw },
  { href: "/account/privacy", label: "隐私与数据", icon: ShieldCheck },
];
export function AccountShell({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const sync = useSync();
  const pathname = usePathname();
  return <section className="account-shell">
    <header className="account-heading">
      <div><span className="eyebrow"><span className="eyebrow-dot" />YOUR PERSONAL FOUNDATION</span><h1>属于你的 FITNESS OS<span className="accent-dot">.</span></h1><p>你的账号、偏好与私人数据，由你掌控。</p></div>
      <Link href="/account/sync" className="account-connection">{sync.online ? <Cloud size={16} /> : <CloudOff size={16} />}<span>{!configured ? "云端尚未配置" : !user ? "尚未登录" : !sync.online ? "离线 · 更改将保留" : sync.syncing ? "正在同步" : sync.pending.length ? `${sync.pending.length} 项待处理` : "云端同步"}</span></Link>
    </header>
    <nav className="account-tabs" aria-label="账号设置">{tabs.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}><Icon size={16} />{label}</Link>)}</nav>
    {!configured ? <div className="account-panel account-gate"><ShieldCheck size={32} /><h2>等待云端环境配置</h2><p>当前环境尚未提供 Supabase 公开连接配置。完成环境配置后，才能注册、登录和读取真实账号数据。</p><Link href="/" className="button button-secondary button-default">返回首页</Link></div>
      : loading ? <p className="loading-line" role="status">正在验证登录状态…</p>
      : !user ? <div className="account-panel account-gate"><LockKeyhole size={32} /><h2>登录后访问你的私人空间</h2><p>资料、同步队列和私人文件均按账号隔离。</p><Link href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`} className="button button-primary button-default">邮箱登录</Link><Link href="/auth/sign-up" className="subtle-link">创建账号</Link></div>
      : <div key={user.id} className="account-private-content">{children}</div>}
  </section>;
}

export function AccountNotice({ text, error = false }: { text: string; error?: boolean }) {
  return text ? <p className={`account-notice${error ? " account-error" : ""}`} role={error ? "alert" : "status"}>{text}</p> : null;
}
export async function accountRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : body?.error?.message || `请求失败（${response.status}），请稍后重试。`);
  return body as T;
}
export function saveDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function messageOf(error: unknown): string { return error instanceof Error ? error.message : "操作失败，请重试。"; }
