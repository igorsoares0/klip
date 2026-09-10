"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { ensureQrCode } from "@/qr/actions";
import type { ToastState } from "./app-shell-context";

const AUTO_DISMISS_MS = 4500;

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const shortUrl = `${toast.host}/${toast.slug}`;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-pill bg-ink py-[10px] pl-[14px] pr-[10px] shadow-toast animate-klip-in"
    >
      <span className="flex items-center gap-2 text-[13px] text-white">
        <CheckIcon size={15} className="text-lime" />
        Link created ·{" "}
        <span className="font-mono font-semibold text-white">{shortUrl}</span>
      </span>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(`https://${shortUrl}`)}
        className="cursor-pointer rounded-pill px-3 py-[5px] text-meta font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        Copy
      </button>
      {/* Spec §21 lists QR Code among the actions after creating a link. */}
      <button
        type="button"
        onClick={async () => {
          onDismiss();
          const result = await ensureQrCode(toast.id);
          if (result.ok) router.push("/dashboard/qr-codes");
        }}
        className="cursor-pointer rounded-pill px-3 py-[5px] text-meta font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        QR code
      </button>
      <button
        type="button"
        onClick={() => {
          onDismiss();
          router.push(`/dashboard/links/${toast.id}`);
        }}
        className="cursor-pointer rounded-pill bg-white/10 px-3 py-[5px] text-meta font-semibold text-white transition-colors hover:bg-white/20"
      >
        Analytics
      </button>
    </div>
  );
}
