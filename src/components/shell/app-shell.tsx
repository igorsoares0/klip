"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppShellContext, type ToastState } from "./app-shell-context";
import { CreateLinkDrawer } from "./create-link-drawer";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Toast } from "./toast";
import * as sidebarStore from "./sidebar-store";

export function AppShell({ children }: { children: ReactNode }) {
  const expanded = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
    sidebarStore.getServerSnapshot,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const toggleSidebar = useCallback(() => sidebarStore.toggle(), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((next: ToastState) => setToast(next), []);

  const value = useMemo(
    () => ({
      expanded,
      toggleSidebar,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toast,
      showToast,
      dismissToast,
    }),
    [
      expanded,
      toggleSidebar,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toast,
      showToast,
      dismissToast,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar expanded={expanded} onToggle={toggleSidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onCreateLink={openDrawer} />
          <main className="flex-1 px-6 pb-[60px] pt-[26px]">{children}</main>
        </div>
      </div>

      <CreateLinkDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onCreated={(slug) => showToast({ slug })}
      />
      {toast ? <Toast toast={toast} onDismiss={dismissToast} /> : null}
    </AppShellContext.Provider>
  );
}
