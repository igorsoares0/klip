import type { CustomDomain } from "../types";

export const domains: CustomDomain[] = [
  {
    id: "dom_klip",
    host: "klip.to",
    note: "Default shared domain",
    links: 248,
    status: "ACTIVE",
  },
  {
    id: "dom_acme",
    host: "go.acme.com",
    note: "Verified Mar 14 · TLS issued",
    links: 96,
    status: "ACTIVE",
  },
  {
    id: "dom_northwind",
    host: "go.northwind.io",
    note: "Waiting for CNAME record",
    links: 0,
    status: "PENDING_DNS",
  },
];

/** DNS record shown in the verification card. */
export const verification = {
  host: "go.northwind.io",
  record: [
    { key: "TYPE", value: "CNAME" },
    { key: "NAME", value: "go" },
    { key: "VALUE", value: "edge.klip.to" },
  ],
};
