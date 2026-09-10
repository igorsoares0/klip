"use client";

import { createContext, useContext } from "react";

export interface ToastState {
  /** The link that was just created — the toast links straight to it. */
  id: string;
  slug: string;
  host: string;
}

export interface AppShellValue {
  expanded: boolean;
  toggleSidebar: () => void;
  openDrawer: () => void;
  /** Opens the same drawer in edit mode, loaded with the link's current values. */
  editLink: (id: string) => void;
  closeDrawer: () => void;
  drawerOpen: boolean;
  toast: ToastState | null;
  showToast: (toast: ToastState) => void;
  dismissToast: () => void;
}

export const AppShellContext = createContext<AppShellValue | null>(null);

export function useAppShell(): AppShellValue {
  const value = useContext(AppShellContext);
  if (!value) {
    throw new Error("useAppShell must be used inside <AppShell>");
  }
  return value;
}
