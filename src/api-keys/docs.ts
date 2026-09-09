/** Static documentation rendered on the API screen. */

export const quickStartCurl = `curl -X POST https://api.klip.to/v1/links \\
  -H "Authorization: Bearer $KLIP_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destinationUrl":"https://example.com","slug":"summer"}'

{ "id": "link_123", "url": "https://klip.to/summer" }`;

/** Endpoints from spec §17. */
export const endpoints = [
  { method: "POST", path: "/v1/links", tone: "positive" as const },
  { method: "GET", path: "/v1/links", tone: "accent" as const },
  { method: "GET", path: "/v1/links/:id", tone: "accent" as const },
  { method: "PATCH", path: "/v1/links/:id", tone: "warning" as const },
  { method: "DELETE", path: "/v1/links/:id", tone: "danger" as const },
  { method: "GET", path: "/v1/links/:id/analytics", tone: "accent" as const },
];
