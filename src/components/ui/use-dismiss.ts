"use client";

import { useEffect, type RefObject } from "react";

/**
 * Closes a popover on a click outside it or on Escape.
 *
 * Takes several refs because a popover rendered through a portal is not inside
 * its trigger's DOM subtree — both must count as "inside".
 */
export function useDismiss(
  refs: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const list = Array.isArray(refs) ? refs : [refs];

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!list.some((ref) => ref.current?.contains(target))) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    // Any scroll moves the trigger out from under a fixed-position menu.
    function onScroll() {
      close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
    // refs are stable ref objects; listing the array identity would re-run on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close]);
}
