import { Suspense } from "react";
import { AuthForm } from "@/components/screens/auth-form";

export const metadata = { title: "Sign in · Klip" };

export default function LoginPage() {
  // AuthForm reads `?callbackUrl` with useSearchParams, which bails out of
  // prerendering unless it sits behind a boundary.
  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
