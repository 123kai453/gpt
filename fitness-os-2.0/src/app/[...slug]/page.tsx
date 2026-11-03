import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Layers3, ShieldCheck } from "lucide-react";
import { getModule, getChildren, modules, topModules, phaseLabel } from "@/lib/navigation";
import { SectionVisual } from "@/features/visual/section-visual";
import { SportCard } from "@/features/visual/sport-card";
import { getSportArt } from "@/features/visual/sports-art";
import { ThemeChoice } from "@/components/common/theme-choice";
export function generateStaticParams() { return modules.map((entry) => ({ slug: entry.slug.split("/") })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params; return { title: getModule(slug.join("/"))?.title ?? "页面未找到" };
}
export default async function ModuleRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const entry = getModule(slug.join("/")); if (!entry) notFound();
  const children = entry.slug === "explore" ? topModules : getChildren(entry.slug);
  return <div className="module-page">
    <Link className="back-link" href={entry.parent ? `/${entry.parent}` : "/"}><ArrowLeft size={15} />{entry.parent ? "返回中心" : "返回总览"}</Link>
    <header className="module-heading module-featured-heading"><div className="module-heading-copy"><span className="eyebrow">{entry.eyebrow}</span><h1>{entry.title}<span className="accent-dot">.</span></h1><p>{entry.description}</p><span className="phase-badge">{phaseLabel(entry.phase)}</span></div><SectionVisual slug={entry.slug} /></header>
    {entry.slug === "settings" && <ThemeChoice />}
    {["settings", "data/personal", "community/profile"].includes(entry.slug) && <section className="module-grid" aria-label="账户功能入口">{[{href:"/account/profile",title:"个人资料与偏好"},{href:"/account/security",title:"账号安全"},{href:"/account/sync",title:"同步状态"},{href:"/account/privacy",title:"隐私、导出与删除"}].map(item => <Link key={item.href} className="module-link" href={item.href}><h2>{item.title}</h2><ArrowUpRight size={21}/></Link>)}</section>}
    {children.length > 0 && <section className={entry.slug === "sports" ? "module-grid sports-catalog" : "module-grid"} aria-label={`${entry.title}功能入口`}>{children.map((child) => getSportArt(child.slug) ? <SportCard key={child.slug} sport={getSportArt(child.slug)!} description={child.description} /> : <Link className="module-link" key={child.slug} href={`/${child.slug}`}><div><span className="eyebrow">{child.eyebrow}</span><h2>{child.title}</h2><p>{child.description}</p><span className="phase-caption">{phaseLabel(child.phase)}</span></div><ArrowUpRight size={21} aria-hidden="true" /></Link>)}</section>}
    <section className="module-status panel"><div className="module-status-icon"><Layers3 size={25} /></div><div><span className="eyebrow">{entry.phase === 1 ? "FOUNDATION" : "BUILT WITH INTENT"}</span><h2>{entry.phase === 1 ? "基础界面，已准备就绪" : "功能尚未开放，入口已准备好"}</h2><p>{entry.phase === 1 ? "当前可浏览完整导航、切换外观，并体验基础 PWA。" : `以下能力属于 PHASE ${entry.phase}，当前仅展示实施范围，不采集或保存业务数据。`}</p><ul>{entry.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul></div></section>
    <div className="privacy-note"><ShieldCheck size={17} /><span>私人健康数据默认私人 · 账户功能请前往「我的账户与同步」· 真实设备连接待后续实施</span></div>
  </div>;
}
