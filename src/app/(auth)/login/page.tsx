import { AuthForm } from "@/components/screens/auth-form";

export const metadata = { title: "Sign in · Klip" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
