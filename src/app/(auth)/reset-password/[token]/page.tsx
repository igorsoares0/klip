import { ChoosePasswordScreen } from "@/components/screens/reset-password";

export const metadata = { title: "Choose a new password · Klip" };

export default async function ChoosePasswordPage(
  props: PageProps<"/reset-password/[token]">,
) {
  const { token } = await props.params;
  return <ChoosePasswordScreen token={token} />;
}
