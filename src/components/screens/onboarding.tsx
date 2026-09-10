"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, LinkGlyph } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/form";
import { FieldError } from "@/components/ui/form";
import { cn, normalizeSlug } from "@/lib/utils";
import { nameWorkspace } from "@/workspaces/onboarding-actions";
import { createLink } from "@/links/actions";

const STEPS = ["Workspace", "First link", "Done"];
const USE_CASES = [
  "Creator / influencer",
  "Marketing team",
  "Agency",
  "Developer",
];

export function OnboardingScreen({
  initialName,
  domain,
}: {
  initialName: string;
  domain: { id: string; host: string } | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState(initialName);
  const [useCase, setUseCase] = useState("Marketing team");
  const [destination, setDestination] = useState("");
  const [slug, setSlug] = useState("summer-sale");

  const slugSample = `${(workspaceName || "acme")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .split("-")[0]}-launch`;

  const host = domain?.host ?? "klip.to";
  const cta = step === 1 ? "Continue" : step === 2 ? "Create link" : "Go to dashboard";

  function advance() {
    setError(null);

    if (step === 1) {
      startTransition(async () => {
        const form = new FormData();
        form.set("name", workspaceName);
        const result = await nameWorkspace(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
        setStep(2);
      });
      return;
    }

    if (step === 2) {
      // An empty destination means they would rather skip making a link.
      if (!destination.trim()) {
        setStep(3);
        return;
      }
      startTransition(async () => {
        const form = new FormData();
        form.set("destination", destination);
        form.set("slug", slug);
        form.set("domainId", domain?.id ?? "");
        const result = await createLink(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
        setStep(3);
      });
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-onboarding px-6 pb-[60px] pt-10 animate-klip-in">
      <div className="flex items-center gap-[10px]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-nav bg-ink text-lime">
          <LinkGlyph size={15} />
        </span>
        <span className="text-brand font-bold tracking-tight text-ink">Klip</span>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2">
        {STEPS.map((label, index) => {
          const reached = step >= index + 1;
          return (
            <div key={label}>
              <span
                className={cn(
                  "block h-1 rounded-pill",
                  reached ? "bg-ink" : "bg-[rgba(20,20,26,.12)]",
                )}
              />
              <span
                className={cn(
                  "mt-2 block text-caption",
                  step === index + 1 ? "font-semibold" : "font-medium",
                  reached ? "text-ink" : "text-faint",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-panel border border-border bg-surface p-7">
        {step === 1 ? (
          <>
            <h1 className="text-[19px] font-semibold tracking-tight text-ink">
              Name your workspace
            </h1>
            <p className="mt-2 text-body text-muted">
              Everything — links, projects, analytics — lives inside a workspace.
              You can rename it later.
            </p>
            <div className="mt-6">
              <Field label="Workspace name">
                <Input
                  className="h-10"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </Field>
              <p className="mt-2 text-caption text-faint">
                Your links will look like{" "}
                <span className="font-mono text-muted">
                  {host}/{slugSample}
                </span>
              </p>
            </div>

            <p className="mt-7 text-label font-medium text-ink-secondary">
              What are you shortening links for?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {USE_CASES.map((option) => (
                <Chip
                  key={option}
                  selected={useCase === option}
                  onClick={() => setUseCase(option)}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="text-[19px] font-semibold tracking-tight text-ink">
              Create your first link
            </h1>
            <p className="mt-2 text-body text-muted">
              Paste where it should go, then pick the short path people will see.
            </p>
            <div className="mt-6 flex flex-col gap-[18px]">
              <Field label="Destination URL">
                <Input
                  className="h-10"
                  placeholder="https://example.com/product"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </Field>
              <Field label="Short link">
                <div className="flex h-10 items-center rounded-input border border-border-strong bg-surface transition-colors hover:border-border-hover">
                  <span className="pl-3 font-mono text-body text-muted">
                    {host}/
                  </span>
                  <input
                    value={slug}
                    onChange={(event) => setSlug(normalizeSlug(event.target.value))}
                    className="h-full min-w-0 flex-1 rounded-r-input border-0 bg-transparent pr-3 font-mono text-body text-ink outline-none focus:shadow-none"
                  />
                </div>
              </Field>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-positive-bg text-positive">
              <CheckIcon size={24} />
            </span>
            <h1 className="mt-5 text-[19px] font-semibold tracking-tight text-ink">
              You&apos;re live
            </h1>
            <p className="mt-2 text-body text-muted">
              Share it anywhere — the first click will show up in analytics within
              seconds.
            </p>
            <div className="mt-6 flex w-full items-center justify-between gap-3 rounded-block bg-surface-sunken px-4 py-3">
              <span className="truncate font-mono text-body text-ink">
                {host}/{slug || "summer-sale"}
              </span>
              <Button
                size="sm"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    `https://${host}/${slug || "summer-sale"}`,
                  )
                }
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5">
            <FieldError>{error}</FieldError>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} disabled={pending}>
            Skip for now
          </Button>
          <Button variant="primary" onClick={advance} disabled={pending}>
            {pending ? "Saving…" : cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
