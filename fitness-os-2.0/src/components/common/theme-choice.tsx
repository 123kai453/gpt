"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";

export function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  return <div className="theme-choice" role="group" aria-label="主题偏好"><button type="button" onClick={() => setTheme("dark")} aria-pressed={theme === "dark"}><Moon size={17}/><span>深色模式</span><span className="theme-choice-check">{theme === "dark" ? "已选择" : "选择"}</span></button><button type="button" onClick={() => setTheme("light")} aria-pressed={theme === "light"}><Sun size={17}/><span>浅色模式</span><span className="theme-choice-check">{theme === "light" ? "已选择" : "选择"}</span></button></div>;
}
