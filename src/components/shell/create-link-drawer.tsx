"use client";

import { useEffect, useId, useState, useTransition } from "react";
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
  buildFinalUrl,
  normalizeSlug,
  randomSlug,
  validateDestination,
  validateSlug,
} from "@/lib/utils";
import {
  checkSlugAvailability,
  createLink,
  updateLink,
} from "@/links/actions";
import type { CreatedLink, EditableLink } from "@/links/actions";

const UTM_FIELDS: Array<{ label: string; key: keyof Utm; name: string; placeholder: string; wide?: boolean }> = [
  { label: "Source", key: "source", name: "utmSource", placeholder: "instagram" },
  { label: "Medium", key: "medium", name: "utmMedium", placeholder: "social" },
  { label: "Campaign", key: "campaign", name: "utmCampaign", placeholder: "summer-sale", wide: true },
  { label: "Term", key: "term", name: "utmTerm", placeholder: "optional" },
  { label: "Content", key: "content", name: "utmContent", placeholder: "video-01" },
];

const EMPTY_UTM: Utm = {
  source: "",
  medium: "",
  campaign: "",
  term: "",
  content: "",
};

export interface DrawerOptions {
  projects: Array<{ id: string; name: string }>;
  /** In tree order, each carrying its project so the list can be narrowed. */
  folders: Array<{ id: string; name: string; projectId: string | null; parentId: string | null }>;
  domains: Array<{ id: string; host: string }>;
}

/**
 * One drawer, two modes. Passing `editing` switches it to edit: fields arrive
 * pre-filled, the slug is shown but locked, and submit updates instead of
 * creating. The shell remounts it (via `key`) whenever the link being edited
 * changes, so its initial state is always the right one.
 */
export function CreateLinkDrawer({
  open,
  onClose,
  onCreated,
  onSaved,
  options,
  editing = null,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (link: CreatedLink) => void;
  onSaved?: (id: string) => void;
  options: DrawerOptions;
  editing?: EditableLink | null;
}) {
  const isEdit = editing !== null;
  const [destination, setDestination] = useState(editing?.destination ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [domainId, setDomainId] = useState(options.domains[0]?.id ?? "");
  const [utm, setUtm] = useState<Utm>(editing?.utm ?? EMPTY_UTM);
  const [projectId, setProjectId] = useState(editing?.projectId ?? "");
  const [folderId, setFolderId] = useState(editing?.folderId ?? "");
  // A folder belongs to one project, so only that project's folders are offered.
  // The server enforces the same rule: the folder decides the project.
  const folderChoices = options.folders.filter(
    (folder) => projectId && folder.projectId === projectId,
  );
  const [utmOpen, setUtmOpen] = useState(true);
  const [touched, setTouched] = useState<{ destination?: boolean; slug?: boolean }>({});
  // The verdict is stored with the slug it answered for. Deriving from that
  // key means a late reply for an older slug is ignored by construction —
  // no reset, no sequence counter.
  const [checked, setChecked] = useState<{
    slug: string;
    domainId: string;
    available: boolean;
    message: string | null;
  } | null>(null);
  const [serverError, setServerError] = useState<{ slug: string; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  const formatError = validateSlug(slug);
  const trimmedSlug = slug.trim();

  // Live availability, debounced. Format problems are answered locally, so a
  // half-typed slug never reaches the server.
  useEffect(() => {
    // An existing link's slug is locked, so there is nothing to check.
    if (!open || isEdit) return;
    if (!trimmedSlug || formatError || !domainId) return;

    const timer = setTimeout(async () => {
      const result = await checkSlugAvailability(domainId, trimmedSlug);
      setChecked({
        slug: trimmedSlug,
        domainId,
        available: result.available,
        message: result.message,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedSlug, domainId, formatError, open, isEdit]);

  const verdict =
    checked && checked.slug === trimmedSlug && checked.domainId === domainId
      ? checked
      : null;
  const available = verdict?.available ?? false;
  const takenMessage =
    (verdict && !verdict.available ? verdict.message : null) ??
    (serverError?.slug === trimmedSlug ? serverError.message : null);

  if (!open) return null;

  const destinationError = validateDestination(destination);
  const slugError = isEdit ? null : (formatError ?? takenMessage);
  const invalid =
    !destination.trim() ||
    Boolean(destinationError) ||
    !slug.trim() ||
    Boolean(slugError);

  const previewSlug = slug || "your-slug";
  const previewHost = isEdit
    ? editing.host
    : (options.domains.find((domain) => domain.id === domainId)?.host ?? "klip.to");
  const finalUrl = buildFinalUrl(destination || "https://example.com", utm);

  const setUtmField = (key: keyof Utm, value: string) =>
    setUtm((current) => ({ ...current, [key]: value }));

  function reset() {
    setDestination("");
    setSlug("");
    setTitle("");
    setUtm(EMPTY_UTM);
    setTouched({});
    setChecked(null);
    setServerError(null);
    setFormError(null);
  }

  function onSubmit(form: FormData) {
    setFormError(null);

    if (isEdit) {
      startTransition(async () => {
        const result = await updateLink(editing.id, form);
        if (result.ok) {
          onSaved?.(editing.id);
          onClose();
          return;
        }
        setTouched({ destination: true });
        setFormError(result.error);
      });
      return;
    }

    startTransition(async () => {
      const result = await createLink(form);
      if (result.ok) {
        onCreated(result.data);
        reset();
        onClose();
        return;
      }
      // The server is the authority — surface its verdict on the right field.
      setTouched({ destination: true, slug: true });
      if (result.field === "slug") {
        setServerError({ slug: trimmedSlug, message: result.error });
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[rgba(20,20,26,.32)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <form
        action={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit link" : "Create link"}
        className="fixed inset-y-0 right-0 z-[60] flex w-[520px] max-w-full flex-col bg-surface shadow-drawer animate-klip-slide"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-[22px] py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              {isEdit ? "Edit link" : "Create link"}
            </h2>
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
              name="destination"
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
              <Select
                name="domainId"
                value={domainId}
                onChange={(event) => setDomainId(event.target.value)}
                disabled={isEdit}
                className="h-[38px] disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted"
              >
                {isEdit ? (
                  <option value="">{editing.host}</option>
                ) : (
                  options.domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.host}
                    </option>
                  ))
                )}
              </Select>
            </Field>

            <Field
              label="Slug"
              htmlFor={slugId}
              hint={
                isEdit ? (
                  <p className="text-caption text-faint">
                    Locked — links already shared and QR codes already printed
                    depend on it.
                  </p>
                ) : touched.slug && slugError ? (
                  <FieldError>{slugError}</FieldError>
                ) : available ? (
                  <FieldSuccess>Available</FieldSuccess>
                ) : null
              }
            >
              <div className="relative">
                <Input
                  id={slugId}
                  name="slug"
                  mono
                  value={slug}
                  readOnly={isEdit}
                  onChange={(event) => setSlug(normalizeSlug(event.target.value))}
                  onBlur={() => setTouched((t) => ({ ...t, slug: true }))}
                  invalid={Boolean(touched.slug && slugError)}
                  placeholder="summer-sale"
                  className={
                    isEdit
                      ? "h-[38px] cursor-not-allowed bg-surface-sunken text-muted"
                      : "h-[38px] pr-[74px]"
                  }
                />
                {isEdit ? null : (
                  <button
                    type="button"
                    onClick={() => setSlug(randomSlug())}
                    className="absolute right-[5px] top-1/2 -translate-y-1/2 cursor-pointer rounded-chip bg-surface-muted px-[9px] py-[5px] text-[11.5px] font-semibold text-ink-secondary transition-colors hover:bg-surface-track"
                  >
                    Random
                  </button>
                )}
              </div>
            </Field>
          </div>

          <div className="rounded-block bg-surface-sunken p-[14px]">
            <p className="text-eyebrow font-semibold tracking-eyebrow text-faint uppercase">
              Preview
            </p>
            <p className="mt-[9px] font-mono text-body font-semibold text-ink">
              {previewHost}/{previewSlug}
            </p>
            <p className="mt-[6px] break-all font-mono text-[11.5px] text-muted">
              → {finalUrl}
            </p>
          </div>

          <Field label="Title">
            <Input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summer sale — product"
              className="h-[38px]"
            />
          </Field>

          <div>
            <button
              type="button"
              onClick={() => setUtmOpen((current) => !current)}
              className="flex w-full cursor-pointer items-center justify-between"
            >
              <Label>UTM parameters</Label>
              <span className="text-caption font-semibold text-accent">
                {utmOpen ? "Hide" : "5 available"}
              </span>
            </button>
            {/* Kept mounted when collapsed: unmounting would drop the values
                from the submitted FormData while the preview still shows them. */}
            <div
              className={
                utmOpen
                  ? "mt-3 grid grid-cols-2 gap-3"
                  : // `hidden` the attribute would lose to the `grid` class,
                    // which also sets display — use the utility instead.
                    "hidden"
              }
            >
              {UTM_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={field.wide ? "col-span-2" : undefined}
                >
                  <Field label={field.label}>
                    <Input
                      mono
                      name={field.name}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <Select
                name="projectId"
                className="h-[38px]"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  // A folder from the previous project no longer applies.
                  setFolderId("");
                }}
              >
                <option value="">No project</option>
                {options.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Folder">
              <Select
                name="folderId"
                className="h-[38px] disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted"
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                disabled={!projectId || folderChoices.length === 0}
              >
                <option value="">
                  {!projectId
                    ? "Pick a project first"
                    : folderChoices.length === 0
                      ? "No folders in this project"
                      : "No folder"}
                </option>
                {folderChoices.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {/* Subfolders are indented under their parent. */}
                    {folder.parentId ? `\u00a0\u00a0\u00a0${folder.name}` : folder.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {formError ? <FieldError>{formError}</FieldError> : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-sunken px-[22px] py-[14px]">
          {isEdit ? (
            <span />
          ) : (
            <label className="flex cursor-pointer items-center gap-2 text-cell text-ink-secondary">
              <input
                type="checkbox"
                name="generateQr"
                defaultChecked
                className="h-[14px] w-[14px] cursor-pointer accent-[var(--color-accent)]"
              />
              Generate QR code
            </label>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={invalid || pending}>
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create link"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
