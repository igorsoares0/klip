import type { NavIconName } from "@/components/icons";

/** Sidebar order is fixed by the handoff and by spec §20. */
export const navItems: Array<{
  icon: NavIconName;
  label: string;
  href: string;
}> = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "links", label: "Links", href: "/dashboard/links" },
  { icon: "projects", label: "Projects", href: "/dashboard/projects" },
  { icon: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  { icon: "qr", label: "QR Codes", href: "/dashboard/qr-codes" },
  { icon: "domains", label: "Domains", href: "/dashboard/domains" },
  { icon: "api", label: "API", href: "/dashboard/api" },
  { icon: "billing", label: "Billing", href: "/dashboard/billing" },
  { icon: "settings", label: "Settings", href: "/dashboard/settings" },
];
