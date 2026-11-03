import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
export default function SignUpPage() { return <Suspense fallback={<p role="status">正在准备注册…</p>}><AuthScreen mode="sign-up" /></Suspense>; }
