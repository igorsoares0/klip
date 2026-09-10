"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LinkGlyph } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input } from "@/components/ui/form";
import { requestPasswordReset, resetPassword } from "@/auth/actions";
import { passwordStrength } from "@/auth/password";

function Brand() {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-nav bg-ink text-lime">
        <LinkGlyph size={15} />
      </span>
      <span className="text-brand font-bold tracking-tight text-ink">Klip</span>
    </div>
  );
}

/** Step one: ask for the email. */
export function RequestResetScreen() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(form);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  }

  return (
    <div className="animate-klip-in">
      <Brand />
      <h1 className="mt-8 text-auth-h1 font-bold tracking-tighter text-ink">
        Reset your password
      </h1>

      {sent ? (
        <>
          <p className="mt-2 text-body text-muted">
            If that address has an account, a link to choose a new password is on
            its way. It is good for one hour.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block text-cell font-semibold text-accent hover:text-accent-hover"
          >
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-body text-muted">
            Enter the email on your account and we will send you a link.
          </p>
          <form action={onSubmit} className="mt-7 flex flex-col gap-4">
            <Field label="Email">
              <Input
                name="email"
                type="email"
                required
                className="h-10"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            <Button type="submit" variant="primary" size="lg" block disabled={pending}>
              {pending ? "Sending…" : "Send the link"}
            </Button>
          </form>
          <p className="mt-5 text-center text-cell text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

/** Step two: the emailed link, carrying the token. */
export function ChoosePasswordScreen({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const strength = passwordStrength(password);

  function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetPassword(form);
      if (result.ok) {
        router.push("/login?reset=1");
        return;
      }
      setError(result.error);
    });
  }

  return (
    <div className="animate-klip-in">
      <Brand />
      <h1 className="mt-8 text-auth-h1 font-bold tracking-tighter text-ink">
        Choose a new password
      </h1>
      <p className="mt-2 text-body text-muted">
        This link works once. After saving, use the new password to sign in.
      </p>

      <form action={onSubmit} className="mt-7 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Field label="New password">
          <Input
            name="password"
            type="password"
            required
            className="h-10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={
                index < strength
                  ? "h-[3px] flex-1 rounded-pill bg-positive"
                  : "h-[3px] flex-1 rounded-pill bg-disabled-bg"
              }
            />
          ))}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <Button type="submit" variant="primary" size="lg" block disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}
