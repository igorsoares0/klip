"use client";

import { useEffect, useId, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldSuccess,
  Input,
  Label,
  Select,
} from "@/components/ui/form";
import type { Utm } from "@/lib/types";
import {
  DEFAULT_DOMAIN,
  buildFinalUrl,
  normalizeSlug,
  randomSlug,
  validateDestination,
  validateSlug,
} from "@/lib/utils";

const UTM_FIELDS: Array<{ label: string; key: keyof Utm; placeholder: string; wide?: boolean }> = [
  { label: "Source", key: "source", placeholder: "instagram" },
  { label: "Medium", key: "medium", placeholder: "social" },
  { label: "Campaign", key: "campaign", placeholder: "summer-sale", wide: true },
  { label: "Term", key: "term", placeholder: "optional" },
  { label: "Content", key: "content", placeholder: "video-01" },
];

const EMPTY_UTM: Utm = {
  source: "instagram",
  medium: "social",
  campaign: "summer-sale",
  term: "",
  content: "video-01",
};

export interface DrawerOptions {
  projects: Array<{ id: string; name: string }>;
  folders: Array<{ id: string; name: string }>;
  domains: Array<{ id: string; host: string }>;
}

export function CreateLinkDrawer({
  open,
  onClose,
  onCreated,
  options,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (slug: string) => void;
  options: DrawerOptions;
}) {
  const [destination, setDestination] = useState("https://example.com/product");
  const [slug, setSlug] = useState("summer-sale");
  const [title, setTitle] = useState("");
  const [utm, setUtm] = useState<Utm>(EMPTY_UTM);
  const [utmOpen, setUtmOpen] = useState(true);
  const [touched, setTouched] = useState<{ destination?: boolean; slug?: boolean }>({});
  const destinationId = useId();
  const slugId = useId();

  // The handoff calls for Escape to close; the prototype never wired it up.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const destinationError = validateDestination(destination);
  const slugError = validateSlug(slug);
  const slugOk = Boolean(slug.trim()) && !slugError;
  const invalid = !destination.trim() || Boolean(destinationError) || Boolean(slugError);
  const previewSlug = slug || "summer-sale";
  const finalUrl = buildFinalUrl(destination || "https://example.com", utm);

  const setUtmField = (key: keyof Utm, value: string) =>
    setUtm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[rgba(20,20,26,.32)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Create link"
        className="fixed inset-y-0 right-0 z-[60] flex w-[520px] max-w-full flex-col bg-surface shadow-drawer animate-klip-slide"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-[22px] py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Create link</h2>
            <p className="mt-1 text-meta text-muted">
              Short link → tracking → optimization
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-chip p-1 text-faint transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-[22px]">
          <Field
            label="Destination URL"
            htmlFor={destinationId}
            hint={
              touched.destination && destinationError ? (
                <FieldError>{destinationError}</FieldError>
              ) : null
            }
          >
            <Input
              id={destinationId}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, destination: true }))}
              invalid={Boolean(touched.destination && destinationError)}
              placeholder="https://example.com/product"
              className="h-[38px]"
            />
          </Field>

          <div className="grid grid-cols-[150px_1fr] gap-3">
            <Field label="Domain">
              <Select defaultValue={DEFAULT_DOMAIN} className="h-[38px]">
                {options.domains.map((domain) => (
                  <option key={domain.id} value={domain.host}>
                    {domain.host}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Slug"
              htmlFor={slugId}
              hint={
                touched.slug && slugError ? (
                  <FieldError>{slugError}</FieldError>
                ) : slugOk ? (
                  <FieldSuccess>Available</FieldSuccess>
                ) : null
              }
            >
              <div className="relative">
                <Input
                  id={slugId}
                  mono
                  value={slug}
                  onChange={(event) => setSlug(normalizeSlug(event.target.value))}
                  onBlur={() => setTouched((t) => ({ ...t, slug: true }))}
                  invalid={Boolean(touched.slug && slugError)}
                  className="h-[38px] pr-[74px]"
                />
                <button
                  type="button"
                  onClick={() => setSlug(randomSlug())}
                  className="absolute right-[5px] top-1/2 -translate-y-1/2 cursor-pointer rounded-chip bg-surface-muted px-[9px] py-[5px] text-[11.5px] font-semibold text-ink-secondary transition-colors hover:bg-surface-track"
                >
                  Random
                </button>
              </div>
            </Field>
          </div>

          <div className="rounded-block bg-surface-sunken p-[14px]">
            <p className="text-eyebrow font-semibold tracking-eyebrow text-faint uppercase">
              Preview
            </p>
            <p className="mt-[9px] font-mono text-body font-semibold text-ink">
              {DEFAULT_DOMAIN}/{previewSlug}
            </p>
            <p className="mt-[6px] break-all font-mono text-[11.5px] text-muted">
              → {finalUrl}
            </p>
          </div>

          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summer sale — product"
              className="h-[38px]"
            />
          </Field>

          <div>
            <button
              type="button"
              onClick={() => setUtmOpen((open) => !open)}
              className="flex w-full cursor-pointer items-center justify-between"
            >
              <Label>UTM parameters</Label>
              <span className="text-caption font-semibold text-accent">
                {utmOpen ? "Hide" : "5 available"}
              </span>
            </button>
            {utmOpen ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {UTM_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className={field.wide ? "col-span-2" : undefined}
                  >
                    <Field label={field.label}>
                      <Input
                        mono
                        value={utm[field.key]}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          setUtmField(field.key, event.target.value)
                        }
                        className="h-[34px] text-cell"
                      />
                    </Field>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <Select className="h-[38px]" defaultValue="">
                <option value="">No project</option>
                {options.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Folder">
              <Select className="h-[38px]" defaultValue="">
                <option value="">No folder</option>
                {options.folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-sunken px-[22px] py-[14px]">
          <label className="flex cursor-pointer items-center gap-2 text-cell text-ink-secondary">
            <input
              type="checkbox"
              defaultChecked
              className="h-[14px] w-[14px] cursor-pointer accent-[var(--color-accent)]"
            />
            Generate QR code
          </label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={invalid}
              onClick={() => {
                onCreated(previewSlug);
                onClose();
              }}
            >
              Create link
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
