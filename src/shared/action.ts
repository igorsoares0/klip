/**
 * Server actions return a result instead of throwing, so a form can put the
 * message on the field that caused it.
 */

export type ActionField =
  | "destination"
  | "slug"
  | "name"
  | "workspaceSlug"
  | "form";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field: ActionField };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, field: ActionField = "form"): ActionResult<never> {
  return { ok: false, error, field };
}

/** FormData values arrive as string | File; this narrows and trims. */
export function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value === "" ? null : value;
}

export function checkbox(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}
