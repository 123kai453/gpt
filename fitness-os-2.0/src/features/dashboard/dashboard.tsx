"use client";

import Link from "next/link";
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, CalendarDays, ChartNoAxesCombined, HeartPulse, History, ScanLine, Sparkles, Utensils, Watch } from "lucide-react";
import { PhaseBadge } from "@/components/common/phase-badge";
import { PremiumHero } from "./premium-hero";
import { SportCard } from "@/features/visual/sport-card";
import { sportsArt } from "@/features/visual/sports-art";

export function Dashboard() {
  return <div className="dashboard">
    <div className="dashboard-context"><span><i />YOUR DAILY SPACE</span><span>今日总览 / 每一种运动，都是进化的开始</span></div>
    <PremiumHero />
    <div className="editorial-bridge"><p>不止于训练，<span>更在于进化。</span></p><span>MORE THAN TRAINING. BUILT TO EVOLVE.</span></div>
    <section className="daily-summary" aria-label="今日状态">
      {[{ title: "今日运动", icon: Activity, value: "等待开始", detail: "训练与运动记录将在 PHASE 03 开放", href: "/sports" }, { title: "营养摄入", icon: Utensils, value: "尚未记录", detail: "饮食与食品管理将在 PHASE 05 开放", href: "/nutrition" }, { title: "身体趋势", icon: HeartPulse, value: "等待数据", detail: "身体资料与云端数据将在后续阶段接入", href: "/data/body" }].map(({ title, icon: Icon, value, detail, href }) => <Link href={href} className="summary-item" key={title}><div className="summary-top"><span><Icon size={16} />{title}</span><ArrowUpRight size={15} /></div><strong>{value}</strong><p>{detail}</p></Link>)}
    </section>

    <section className="sports-section" aria-labelledby="movement-title"><div className="section-heading"><div><span className="section-index">01 / FIND YOUR MOVEMENT</span><h2 id="movement-title">让热爱，有自己的主场。</h2></div><Link href="/sports" className="subtle-link">探索全部运动 <ArrowUpRight size={17} /></Link></div><div className="editorial-sport-grid">{sportsArt.slice(0, 3).map((sport, i) => <SportCard key={sport.slug} sport={sport} index={`0${i + 1}`} description={i === 0 ? "每一次发力，都在定义自己。" : i === 1 ? "在呼吸之间，找到自己的节奏。" : "把今天的极限，留在身后。"} />)}</div></section>

    <div className="dashboard-lower-grid">
      <section className="panel activity-panel" aria-labelledby="activity-title"><div className="section-heading compact"><div><span className="section-index">02 / YOUR ACTIVITY</span><h2 id="activity-title">最近活动</h2></div><History size={18} className="muted" /></div><div className="activity-empty"><span className="empty-orbit"><Activity size={27} strokeWidth={1.5}/></span><h3>你的故事，从这里开始</h3><p>还没有训练或运动记录。记录功能上线后，<br/>每一次真实付出都会留在这里。</p><Link href="/data/history" className="subtle-link">了解训练历史 <ArrowRight size={14} /></Link></div><div className="activity-panel-bottom"><span className="status-dot neutral" />运动记录尚未开放<span>PHASE 03</span></div></section>
      <section className="panel companion-panel" aria-labelledby="companion-title"><div className="section-heading compact"><div><span className="section-index">03 / YOUR COMPANION</span><h2 id="companion-title">更多支持，按需连接</h2></div></div><Link href="/ai" className="companion-row"><span className="companion-icon ai-color"><Sparkles size={20}/></span><div><h3>AI 私人教练</h3><p>基于你的真实记录提供建议</p><PhaseBadge phase={7}/></div><ArrowUpRight size={17}/></Link><Link href="/devices" className="companion-row"><span className="companion-icon device-color"><Watch size={20}/></span><div><h3>连接你的健康数据</h3><p>Apple Health / Huawei Health</p><span className="connection-state"><span/>未连接 · 接入能力待验证</span></div><ArrowUpRight size={17}/></Link><div className="companion-note">当前未调用 AI 服务，也未读取任何设备数据。</div></section>
    </div>

    <section className="quick-section" aria-labelledby="quick-title"><div className="section-heading"><div><span className="section-index">04 / SHORTCUTS</span><h2 id="quick-title">从这里继续</h2></div></div><div className="quick-links">{[{ href: "/sports/plans", icon: CalendarDays, name: "训练计划", detail: "自主安排你的训练 · PHASE 03" }, { href: "/nutrition", icon: Utensils, name: "营养中心", detail: "饮食记录与食品库 · PHASE 05" }, { href: "/import", icon: ScanLine, name: "智能导入", detail: "长文本、图片与文档 · PHASE 06" }, { href: "/data", icon: ChartNoAxesCombined, name: "数据中心", detail: "让长期变化清晰可见" }].map(({ href, icon: Icon, name, detail }) => <Link key={href} href={href} className="quick-link"><Icon size={19}/><span><strong>{name}</strong><small>{detail}</small></span><ArrowRight size={16}/></Link>)}</div></section>
    <div className="dashboard-disclosure"><ArrowDownToLine size={14}/><span>账户资料与偏好支持云同步，需完成 Supabase 配置与登录。运动记录、AI 及设备能力将在对应阶段逐步接入。</span></div>
  </div>;
}
