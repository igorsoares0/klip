/**
 * CSV for the click export.
 *
 * Two separate problems, both handled per cell:
 *
 * - RFC 4180 quoting: commas, quotes and line breaks inside a value.
 * - Formula injection. The referrer column comes from the visitor's Referer
 *   header — whoever clicks the link controls it. A value like
 *   `=HYPERLINK("http://evil","click")` becomes a live formula the moment the
 *   file opens in Excel or Sheets. Any cell starting with a formula trigger is
 *   prefixed with a quote so it is read as text (OWASP's recommendation).
 */

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;

  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function csvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map(csvCell).join(",") + "\r\n";
}
