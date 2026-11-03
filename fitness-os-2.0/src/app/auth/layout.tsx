import type { Metadata } from "next";
import "./auth.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "个人账户", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
