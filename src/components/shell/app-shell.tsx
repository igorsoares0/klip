"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AppShellContext, type ToastState } from "./app-shell-context";
import { CreateLinkDrawer, type DrawerOptions } from "./create-link-drawer";
import type { CreatedLink } from "@/links/actions";
import { Header } from "./header";
import { Sidebar, type UsageMeter } from "./sidebar";
import { Toast } from "./toast";
import * as sidebarStore from "./sidebar-store";

export interface ShellWorkspace {
  name: string;
  avatar: string;
}

export function AppShell({
  children,
  workspace,
  user,
  usage,
  drawerOptions,
}: {
  children: ReactNode;
  workspace: ShellWorkspace;
  user: { initials: string };
  usage: UsageMeter;
  drawerOptions: DrawerOptions;
}) {
  const expanded = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
    sidebarStore.getServerSnapshot,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const router = useRouter();

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
        <Sidebar expanded={expanded} onToggle={toggleSidebar} usage={usage} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            onCreateLink={openDrawer}
            workspace={workspace}
            userInitials={user.initials}
          />
          <main className="flex-1 px-6 pb-[60px] pt-[26px]">{children}</main>
        </div>
      </div>

      <CreateLinkDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onCreated={(link: CreatedLink) => {
          showToast(link);
          // The action revalidated on the server; pull the fresh render in.
          router.refresh();
        }}
        options={drawerOptions}
      />
      {toast ? <Toast toast={toast} onDismiss={dismissToast} /> : null}
    </AppShellContext.Provider>
  );
}
