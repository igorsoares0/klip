import { OnboardingScreen } from "@/components/screens/onboarding";
import { requireSession } from "@/auth/session";
import { db } from "@/lib/db";
import { getDefaultDomain } from "@/workspaces/onboarding-actions";

export const metadata = { title: "Get started · Klip" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { workspaceId } = await requireSession();
  const [workspace, domain] = await Promise.all([
    db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
    getDefaultDomain(),
  ]);

  return (
    <OnboardingScreen initialName={workspace?.name ?? ""} domain={domain} />
  );
}
