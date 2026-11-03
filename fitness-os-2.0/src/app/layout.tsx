import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PwaControls } from "@/components/pwa/pwa-controls";
import "./globals.css";
import "./premium.css";
export const metadata: Metadata = {
  title: { default: "FITNESS OS · 突破极限，持续进化", template: "%s · FITNESS OS" },
  description: "你的运动、营养与长期进步，在同一个系统中。FITNESS OS PHASE 1.1。",
  applicationName: "FITNESS OS", manifest: "/manifest.json",
  icons: { icon: "/icons/mark.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FITNESS OS" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#090b0f" }, { media: "(prefers-color-scheme: light)", color: "#f2f4f7" }],
};
const themeScript = `(function(){try{var t=localStorage.getItem('fitness-os-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';document.documentElement.style.colorScheme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})();`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" data-theme="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><ThemeProvider><AppShell>{children}</AppShell><PwaControls /></ThemeProvider></body></html>;
}
