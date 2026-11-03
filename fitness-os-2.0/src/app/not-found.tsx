import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
export default function NotFound() {
  return <div className="module-page"><div className="module-heading"><span className="eyebrow">OFF THE TRACK</span><h1>这个页面还未抵达。</h1><p>地址可能已变更，或页面不存在。你的浏览不会创建任何记录。</p></div><div className="module-grid"><Link className="module-link" href="/"><h2><ArrowLeft size={20} /> 返回总览</h2></Link><Link className="module-link" href="/explore"><h2><Compass size={20} /> 探索全部入口</h2></Link></div></div>;
}
