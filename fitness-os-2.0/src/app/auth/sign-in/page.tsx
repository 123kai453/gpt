import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
export default function SignInPage() { return <Suspense fallback={<p role="status">正在准备登录…</p>}><AuthScreen mode="sign-in" /></Suspense>; }
