"use client";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { useSync } from "@/features/sync/sync-provider";
export function AccountStatus() {
  const {user, loading, configured} = useAuth();
  const sync = useSync();
  const label = !configured ? "尚未连接云端" : loading ? "验证会话…" : !user ? "登录 / 注册" : !sync.online ? "离线 · 查看待同步" : sync.error ? "同步需要处理" : sync.pending.length ? `待同步 ${sync.pending.length}` : sync.snapshot ? "账户已同步" : "读取账户…";
  return <Link href={user ? "/account/sync" : "/auth/sign-in"} className="account-status-link" aria-label={user ? "账户同步状态" : "登录或注册账户"}><UserRound size={17} /><span>{label}</span><style jsx>{`.account-status-link{display:inline-flex;align-items:center;gap:7px;color:var(--muted);font-size:11px;text-decoration:none;min-height:44px}.account-status-link:hover{color:var(--text)}@media(max-width:767px){.account-status-link{width:32px;justify-content:center}.account-status-link span{display:none}}`}</style></Link>;
}
