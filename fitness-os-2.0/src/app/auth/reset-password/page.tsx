import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
export default function ResetPasswordPage() { return <Suspense fallback={<p role="status">正在检查恢复会话…</p>}><AuthScreen mode="reset-password" /></Suspense>; }
