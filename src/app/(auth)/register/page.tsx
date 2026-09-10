import { Suspense } from "react";
import { AuthForm } from "@/components/screens/auth-form";

export const metadata = { title: "Create your account · Klip" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
