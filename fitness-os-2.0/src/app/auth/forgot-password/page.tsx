import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
export default function ForgotPasswordPage() { return <Suspense fallback={<p role="status">正在准备账户恢复…</p>}><AuthScreen mode="forgot-password" /></Suspense>; }
