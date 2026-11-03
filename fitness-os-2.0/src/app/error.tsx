"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="module-page"><div className="module-heading" role="alert"><span className="eyebrow">LET’S RESET</span><h1>页面暂时遇到了问题。</h1><p>可以重试加载，或返回总览。当前未进行任何健康数据写入。</p></div><div className="error-actions"><button className="primary-button" onClick={reset}>重新加载</button><Link className="back-link" href="/">返回总览</Link></div></div>;
}
