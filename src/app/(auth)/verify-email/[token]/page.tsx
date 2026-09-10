import Link from "next/link";
import { LinkGlyph } from "@/components/icons";
import { verifyEmail } from "@/auth/actions";

export const metadata = { title: "Confirm your email · Klip" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage(
  props: PageProps<"/verify-email/[token]">,
) {
  const { token } = await props.params;
  const result = await verifyEmail(token);

  return (
    <div className="animate-klip-in">
      <div className="flex items-center gap-[10px]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-nav bg-ink text-lime">
          <LinkGlyph size={15} />
        </span>
        <span className="text-brand font-bold tracking-tight text-ink">Klip</span>
      </div>

      <h1 className="mt-8 text-auth-h1 font-bold tracking-tighter text-ink">
        {result.ok ? "Email confirmed" : "That link did not work"}
      </h1>
      <p className="mt-2 text-body text-muted">
        {result.ok
          ? "Your address is verified. You can head back to the dashboard."
          : "It may have expired or already been used. Sign in and ask for a new one."}
      </p>

      <Link
        href={result.ok ? "/dashboard" : "/login"}
        className="mt-7 inline-block text-cell font-semibold text-accent hover:text-accent-hover"
      >
        {result.ok ? "Go to dashboard" : "Back to sign in"}
      </Link>
    </div>
  );
}
