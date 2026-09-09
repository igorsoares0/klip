import type { ApiKey } from "../types";

export const apiKeys: ApiKey[] = [
  {
    id: "key_prod",
    name: "Production server",
    masked: "klip_live_••••••••••••4f2a",
    lastUsed: "Used 2h ago",
    scope: "FULL",
  },
  {
    id: "key_zapier",
    name: "Zapier integration",
    masked: "klip_live_••••••••••••91c7",
    lastUsed: "Used 3d ago",
    scope: "LINKS",
  },
  {
    id: "key_staging",
    name: "Staging",
    masked: "klip_test_••••••••••••0b18",
    lastUsed: "Never used",
    scope: "READ",
  },
];
