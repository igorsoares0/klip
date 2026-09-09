import type { FolderNode, Project } from "../types";

export const projects: Project[] = [
  {
    id: "prj_summer",
    name: "Summer Campaign",
    description: "Seasonal promo across paid + organic",
    links: 86,
    clicks: 41204,
    dot: 1,
    updatedAt: "2d ago",
  },
  {
    id: "prj_creator",
    name: "Creator Program",
    description: "Affiliate links per creator",
    links: 54,
    clicks: 22918,
    dot: 2,
    updatedAt: "4d ago",
  },
  {
    id: "prj_always",
    name: "Always-on",
    description: "Bio, newsletter, app store",
    links: 31,
    clicks: 14660,
    dot: 3,
    updatedAt: "1w ago",
  },
  {
    id: "prj_paid",
    name: "Paid Social",
    description: "Meta + TikTok ad destinations",
    links: 48,
    clicks: 9431,
    dot: 4,
    updatedAt: "6d ago",
  },
  {
    id: "prj_northwind",
    name: "Client · Northwind",
    description: "Agency workspace links",
    links: 29,
    clicks: 5120,
    dot: 5,
    updatedAt: "3w ago",
  },
];

/** Folder tree for the "Summer Campaign" panel. */
export const folderTree: FolderNode[] = [
  { id: "fld_ig", name: "Instagram", count: 24, depth: 0 },
  { id: "fld_ig_v1", name: "video-01", count: 5120, depth: 1 },
  { id: "fld_ig_v2", name: "video-02", count: 3880, depth: 1 },
  { id: "fld_ig_story", name: "story-launch", count: 2410, depth: 1 },
  { id: "fld_fb", name: "Facebook", count: 12, depth: 0 },
  { id: "fld_fb_c1", name: "campaign-01", count: 1904, depth: 1 },
  { id: "fld_inf", name: "Influencers", count: 18, depth: 0 },
  { id: "fld_inf_a", name: "creator-a", count: 986, depth: 1 },
  { id: "fld_inf_b", name: "creator-b", count: 742, depth: 1 },
];
