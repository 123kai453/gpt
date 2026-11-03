import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
export default function VerifyEmailPage() { return <Suspense fallback={<p role="status">正在检查邮箱状态…</p>}><AuthScreen mode="verify-email" /></Suspense>; }
