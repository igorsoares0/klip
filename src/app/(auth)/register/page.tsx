import { AuthForm } from "@/components/screens/auth-form";

export const metadata = { title: "Create your account · Klip" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
