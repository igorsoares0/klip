"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { GoogleMark, LinkGlyph } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";

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

/** Three filled segments plus one empty — the "Strong" state from the handoff. */
const STRENGTH = [true, true, true, false];

export function AuthForm({ mode }: { mode: "register" | "login" }) {
  const router = useRouter();
  const copy = COPY[mode];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    router.push("/onboarding");
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
        onClick={() => router.push("/onboarding")}
        className="mt-7 flex h-[42px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-block border border-border-strong bg-surface text-body font-medium text-ink transition-colors hover:border-border-hover"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption text-faint">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {mode === "register" ? (
          <Field label="Name">
            <Input className="h-10" placeholder="Maria Rocha" autoComplete="name" />
          </Field>
        ) : null}

        <Field label="Email">
          <Input
            type="email"
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
                href="/login"
                className="text-caption font-medium text-accent hover:text-accent-hover"
              >
                Forgot?
              </Link>
            ) : null}
          </div>
          <Input
            type="password"
            className="h-10"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {mode === "register" ? (
            <div className="mt-1 flex items-center gap-[10px]">
              <div className="flex flex-1 gap-1">
                {STRENGTH.map((filled, index) => (
                  <span
                    key={index}
                    className={
                      filled
                        ? "h-[3px] flex-1 rounded-pill bg-positive"
                        : "h-[3px] flex-1 rounded-pill bg-disabled-bg"
                    }
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-positive">
                Strong
              </span>
            </div>
          ) : null}
        </div>

        <Button type="submit" variant="primary" size="lg" block className="mt-2">
          {copy.cta}
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
