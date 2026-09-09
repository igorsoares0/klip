"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAppShell } from "./app-shell-context";

/** Lets server-rendered screens open the drawer that lives in the shell. */
export function CreateLinkButton({ children = "Create link", ...props }: ButtonProps) {
  const { openDrawer } = useAppShell();
  return (
    <Button onClick={openDrawer} {...props}>
      {children}
    </Button>
  );
}
