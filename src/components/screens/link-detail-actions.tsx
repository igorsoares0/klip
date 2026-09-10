"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppShell } from "@/components/shell/app-shell-context";
import { setLinkStatus } from "@/links/actions";
import type { LinkStatus } from "@/lib/types";

/** Copy · QR code · Edit · Pause — the header actions on a link's detail page. */
export function LinkDetailActions({
  id,
  shortUrl,
  status,
}: {
  id: string;
  shortUrl: string;
  status: LinkStatus;
}) {
  const router = useRouter();
  const { editLink } = useAppShell();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function copy() {
    navigator.clipboard?.writeText(`https://${shortUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function toggleStatus() {
    startTransition(async () => {
      const result = await setLinkStatus(id, status === "PAUSED" ? "ACTIVE" : "PAUSED");
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <Button onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
      <Button onClick={() => router.push("/dashboard/qr-codes")}>QR code</Button>
      <Button onClick={() => editLink(id)}>Edit</Button>
      {/* An archived link is restored from the table menu, not paused here. */}
      {status === "ARCHIVED" ? null : (
        <Button onClick={toggleStatus} disabled={pending}>
          {status === "PAUSED" ? "Resume" : "Pause"}
        </Button>
      )}
    </>
  );
}
