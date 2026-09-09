import { QrCodesScreen } from "@/components/screens/qr-codes";
import { getCurrentWorkspaceId } from "@/workspaces/current";
import { listQrCodes } from "@/qr/queries";

export const metadata = { title: "QR Codes · Klip" };
export const dynamic = "force-dynamic";

export default async function QrCodesPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const qrCodes = await listQrCodes(workspaceId);
  return <QrCodesScreen qrCodes={qrCodes} />;
}
