const STORAGE_KEY = "klip:sidebar-expanded";

/**
 * The collapse preference lives in localStorage, which the server cannot read.
 * Exposing it as an external store lets `useSyncExternalStore` hydrate with the
 * expanded default and swap in the stored value without a setState-in-effect.
 */
const listeners = new Set<() => void>();
let cache: boolean | null = null;

function read(): boolean {
  if (cache === null) {
    try {
      cache = window.localStorage.getItem(STORAGE_KEY) !== "false";
    } catch {
      // Private mode or blocked storage — the expanded default stands.
      cache = true;
    }
  }
  return cache;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): boolean {
  return read();
}

export function getServerSnapshot(): boolean {
  return true;
}

export function toggle(): void {
  cache = !read();
  try {
    window.localStorage.setItem(STORAGE_KEY, String(cache));
  } catch {
    // Ignore — collapsing still works for this session.
  }
  for (const listener of listeners) listener();
}
