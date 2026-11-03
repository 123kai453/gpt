"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, Boxes, ChartNoAxesCombined, ChevronRight, Dumbbell, HeartPulse, House, LayoutGrid, Moon, ScanLine, Settings2, Sparkles, Sun, Utensils, Watch, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { AccountStatus } from "./account-status";

const nav: { href: string; label: string; icon: LucideIcon; section?: string }[] = [
  { href: "/", label: "总览", icon: House },
  { href: "/sports", label: "运动中心", icon: Dumbbell, section: "你的日常" },
  { href: "/nutrition", label: "营养中心", icon: Utensils },
  { href: "/data", label: "数据中心", icon: ChartNoAxesCombined },
  { href: "/ai", label: "AI 私人教练", icon: Sparkles, section: "智能与连接" },
  { href: "/import", label: "智能导入", icon: ScanLine },
  { href: "/devices", label: "设备中心", icon: Watch },
  { href: "/community", label: "计划社区", icon: Boxes, section: "发现" },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand" aria-label="FITNESS OS 首页"><span className="brand-mark" aria-hidden="true"><Activity size={23} strokeWidth={2.7} /></span><span className="brand-word">FITNESS<span className="brand-os">OS</span></span>{!compact && <span className="brand-version">2.0</span>}</Link>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { theme, toggleTheme } = useTheme();
  const activeLabel = nav.find((item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))?.label ?? "探索模块";
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">跳至主要内容</a>
    <aside className="sidebar" aria-label="桌面导航">
      <Brand />
      <div className="workspace-label"><span className="workspace-avatar"><HeartPulse size={17} /></span><span>个人健康空间<small>THE LONG GAME</small></span></div>
      <nav className="sidebar-nav" aria-label="主导航">{nav.map(({ href, label, icon: Icon, section }) => <div key={href}>
        {section && <div className="nav-section-label">{section}</div>}
        <Link className={`nav-item ${isActive(href) ? "is-active" : ""}`} href={href} aria-current={isActive(href) ? "page" : undefined}>{isActive(href) && <motion.span className="nav-selection" layoutId="sidebar-selection" transition={{ type: "spring", stiffness: 350, damping: 35, duration: reducedMotion ? 0 : undefined }} />}<Icon size={18} /><span>{label}</span>{isActive(href) && <span className="nav-active-dot" />}</Link>
      </div>)}</nav>
      <div className="sidebar-bottom">
        <Link href="/explore" className="phase-note"><span className="phase-note-icon"><LayoutGrid size={18} /></span><div><strong>你的健康系统，正在生长</strong><span>查看全部模块与开发阶段</span></div><ArrowUpRight size={15} /></Link>
        <Link href="/settings" className={`nav-item ${isActive("/settings") ? "is-active" : ""}`}><Settings2 size={18} /><span>设置与偏好</span></Link>
        <Link href="/account/profile" className="nav-item"><HeartPulse size={18} /><span>我的账户与同步</span></Link>
        <div className="sidebar-status"><span className="status-dot" /><span>账户与同步基础</span><span className="mono">PHASE 2</span></div>
      </div>
    </aside>
    <div className="app-body">
      <header className="topbar">
        <div className="desktop-breadcrumb"><span>FITNESS OS</span><ChevronRight size={13} /><strong>{activeLabel}</strong></div>
        <div className="mobile-brand"><Brand compact /></div>
        <div className="topbar-actions"><AccountStatus /><Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换主题" title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</Button><Link href="/explore" className="topbar-explore" aria-label="浏览全部模块"><LayoutGrid size={17} /></Link></div>
      </header>
      <motion.main key={pathname} id="main-content" className="main-content" tabIndex={-1} initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .22 }}>{children}</motion.main>
      <footer className="app-footer"><span>FITNESS OS <span className="muted">/</span> 为长期进步而设计</span><span>PHASE 2 <span className="footer-divider">·</span> 账户与同步基础</span></footer>
    </div>
    <nav className="mobile-bottom-nav" aria-label="手机导航">
      {[{ href: "/", label: "总览", icon: House }, { href: "/sports", label: "运动", icon: Dumbbell }, { href: "/nutrition", label: "营养", icon: Utensils }, { href: "/ai", label: "AI 教练", icon: Sparkles }, { href: "/explore", label: "全部", icon: LayoutGrid }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "is-active" : ""} aria-current={isActive(href) ? "page" : undefined}><Icon size={20} /><span>{label}</span></Link>)}
    </nav>
  </div>;
}
