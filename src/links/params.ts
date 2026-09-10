import type { LinkListOptions, LinkSort, LinkStatusFilter } from "./queries";

/** Search params arrive untrusted; anything unrecognised falls back to a default. */

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const STATUSES: LinkStatusFilter[] = ["ALL", "ACTIVE", "PAUSED", "ARCHIVED"];
const SORTS: LinkSort[] = ["newest", "oldest", "clicks"];

export function parseLinkListParams(params: Params): Required<
  Pick<LinkListOptions, "q" | "status" | "sort" | "page">
> & { projectId: string | null } {
  const status = first(params.status)?.toUpperCase() as LinkStatusFilter | undefined;
  const sort = first(params.sort) as LinkSort | undefined;
  const page = Number.parseInt(first(params.page) ?? "1", 10);

  return {
    q: (first(params.q) ?? "").slice(0, 100),
    status: status && STATUSES.includes(status) ? status : "ALL",
    projectId: first(params.project) || null,
    sort: sort && SORTS.includes(sort) ? sort : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** True when anything narrows the list — distinguishes "no links" from "no matches". */
export function isFiltered(options: ReturnType<typeof parseLinkListParams>): boolean {
  return Boolean(options.q) || options.status !== "ALL" || Boolean(options.projectId);
}
