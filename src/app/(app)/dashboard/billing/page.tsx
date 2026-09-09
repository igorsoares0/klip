import { BillingScreen } from "@/components/screens/billing";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { LIFETIME_ENTITLEMENTS, getBilling } from "@/billing/queries";

export const metadata = { title: "Billing · Klip" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const billing = await getBilling(workspaceId);

  return (
    <BillingScreen
      data={{ ...billing, entitlements: LIFETIME_ENTITLEMENTS }}
    />
  );
}
