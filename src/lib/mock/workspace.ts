export const workspace = {
  name: "Acme Growth",
  slug: "acme-growth",
  avatar: "A",
  defaultDomain: "klip.to",
};

export const currentUser = {
  initials: "MR",
};

/** Sidebar usage meter. */
export const clickUsage = {
  label: "Tracked clicks",
  display: "84.4k / 100k",
  pct: 84,
  note: "Lifetime plan · resets Oct 1",
};

export const privacyToggles = [
  {
    id: "hash-ips",
    label: "Hash visitor IPs",
    description: "Raw IPs are discarded after geo lookup.",
    enabled: true,
  },
  {
    id: "city-geo",
    label: "Store city-level geo",
    description: "Adds city column to analytics exports.",
    enabled: true,
  },
  {
    id: "dnt",
    label: "Respect Do Not Track",
    description: "Skip analytics for DNT visitors.",
    enabled: false,
  },
];
