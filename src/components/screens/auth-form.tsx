"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { GoogleMark, LinkGlyph } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Label } from "@/components/ui/form";
import { register } from "@/auth/actions";
import { passwordStrength } from "@/auth/password";

const COPY = {
  register: {
    title: "Create your account",
    sub: "One workspace, unlimited links. No credit card until you decide on the lifetime deal.",
    cta: "Create account",
    switchText: "Already have an account?",
    switchCta: "Sign in",
    switchHref: "/login",
  },
  login: {
    title: "Welcome back",
    sub: "Sign in to your workspace.",
    cta: "Sign in",
    switchText: "New to Klip?",
    switchCta: "Create one",
    switchHref: "/register",
  },
} as const;

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

export function AuthForm({ mode }: { mode: "register" | "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = COPY[mode];

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const strength = passwordStrength(password);

  function onSubmit(form: FormData) {
    setError(null);
    startTransition(async () => {
      if (mode === "register") {
        const result = await register(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }

      const outcome = await signIn("credentials", {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        redirect: false,
      });

      if (outcome?.error) {
        setError(
          mode === "login"
            ? "That email and password do not match."
            : "Account created, but signing in failed. Try signing in.",
        );
        return;
      }

      router.push(mode === "register" ? "/onboarding" : callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="animate-klip-in">
      <div className="flex items-center gap-[10px]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-nav bg-ink text-lime">
          <LinkGlyph size={15} />
        </span>
        <span className="text-brand font-bold tracking-tight text-ink">Klip</span>
      </div>

      <h1 className="mt-8 text-auth-h1 font-bold tracking-tighter text-ink">
        {copy.title}
      </h1>
      <p className="mt-2 text-body text-muted">{copy.sub}</p>

      <button
        type="button"
        disabled={pending}
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-7 flex h-[42px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-block border border-border-strong bg-surface text-body font-medium text-ink transition-colors hover:border-border-hover disabled:cursor-not-allowed"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption text-faint">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={onSubmit} className="flex flex-col gap-4">
        {mode === "register" ? (
          <Field label="Name">
            <Input name="name" className="h-10" placeholder="Maria Rocha" autoComplete="name" />
          </Field>
        ) : null}

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

        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            {mode === "login" ? (
              <Link
                href="/reset-password"
                className="text-caption font-medium text-accent hover:text-accent-hover"
              >
                Forgot?
              </Link>
            ) : null}
          </div>
          <Input
            name="password"
            type="password"
            required
            className="h-10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {mode === "register" && password ? (
            <div className="mt-1 flex items-center gap-[10px]">
              <div className="flex flex-1 gap-1">
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
              <span
                className={
                  strength >= 3
                    ? "text-[11px] font-semibold text-positive"
                    : "text-[11px] font-semibold text-muted"
                }
              >
                {STRENGTH_LABELS[strength]}
              </span>
            </div>
          ) : null}
        </div>

        {error ? <FieldError>{error}</FieldError> : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          className="mt-2"
          disabled={pending}
        >
          {pending ? "Working…" : copy.cta}
        </Button>
      </form>

      <p className="mt-5 text-center text-cell text-muted">
        {copy.switchText}{" "}
        <Link
          href={copy.switchHref}
          className="font-semibold text-accent hover:text-accent-hover"
        >
          {copy.switchCta}
        </Link>
      </p>

      <p className="mt-8 text-caption text-faint">
        By continuing you agree to the Terms and Privacy Policy. We hash visitor
        IPs and never sell click data.
      </p>
    </div>
  );
}
