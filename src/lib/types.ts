/**
 * Domain types for the Klip UI.
 *
 * These are the contract the real Prisma queries will have to satisfy — the
 * mock modules in `src/lib/mock/` are the only thing filling them today.
 * Field names follow the entity lists in docs/link-management-saas-spec.md §8.
 */

export type LinkStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export type DomainStatus = "ACTIVE" | "PENDING_DNS" | "ERROR";

export type ApiKeyScope = "FULL" | "LINKS" | "READ";

export type ProjectDot = 1 | 2 | 3 | 4 | 5 | 6;

export interface Utm {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

export interface Link {
  id: string;
  workspaceId: string;
  projectId: string | null;
  folderId: string | null;
  slug: string;
  domain: string;
  destinationUrl: string;
  title: string | null;
  utm: Utm;
  status: LinkStatus;
  clicks: number;
  createdAt: string;
  /** Decorative placeholder until real favicons are fetched from the host. */
  favicon: string;
  projectName: string | null;
  projectDot: ProjectDot | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  links: number;
  clicks: number;
  dot: ProjectDot;
  updatedAt: string;
}

export interface FolderNode {
  id: string;
  name: string;
  count: number;
  /** 0 = group, 1 = leaf. Drives indentation and the marker glyph. */
  depth: 0 | 1;
}

export interface Stat {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down";
  sub?: string;
}

/** One bar of the clicks-over-time chart. */
export interface SeriesPoint {
  clicks: number;
  unique: number;
  label: string;
}

export interface BreakdownItem {
  label: string;
  value: string;
  pct: number;
  icon?: string;
}

export interface BreakdownPanel {
  title: string;
  color: string;
  rows: BreakdownItem[];
}

export interface TopLink {
  slug: string;
  destinationUrl: string;
  clicks: string;
  pct: number;
}

export interface QrCode {
  id: string;
  slug: string;
  scans: number;
  createdAt: string;
}

export interface CustomDomain {
  id: string;
  host: string;
  note: string;
  links: number;
  status: DomainStatus;
}

export interface ApiKey {
  id: string;
  name: string;
  masked: string;
  lastUsed: string;
  scope: ApiKeyScope;
}

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "custom";
