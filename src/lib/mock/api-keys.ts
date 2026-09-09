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

export const quickStartCurl = `curl -X POST https://api.klip.to/v1/links \\
  -H "Authorization: Bearer $KLIP_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destinationUrl":"https://example.com","slug":"summer"}'

{ "id": "link_123", "url": "https://klip.to/summer" }`;

export const endpoints = [
  { method: "POST", path: "/v1/links", tone: "positive" as const },
  { method: "GET", path: "/v1/links", tone: "accent" as const },
  { method: "GET", path: "/v1/links/:id", tone: "accent" as const },
  { method: "PATCH", path: "/v1/links/:id", tone: "warning" as const },
  { method: "DELETE", path: "/v1/links/:id", tone: "danger" as const },
  { method: "GET", path: "/v1/links/:id/analytics", tone: "accent" as const },
];
