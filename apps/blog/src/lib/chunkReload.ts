/**
 * Recovers lazily loaded components whose chunk fails to load, most often because a deploy
 * replaced the chunk hashes while a tab was open. Retrying the same URL can't fix that; reloading
 * the page can. See https://vite.dev/guide/build#load-error-handling.
 */

import { ComponentType, LazyExoticComponent, lazy as reactLazy } from 'react';

export const RELOAD_STORAGE_KEY = 'chunk-reload-at';
export const RELOAD_WINDOW_MS = 60_000;

let reloading = false;

/**
 * Reloads the page after a chunk load error, at most once per RELOAD_WINDOW_MS, and returns
 * whether it did. It doesn't reload offline, where the reload would replace the app with the
 * browser's offline page, or without sessionStorage, where no guard survives the reload to stop a
 * loop.
 */
export function reloadOnce(now = Date.now()): boolean {
  if (reloading) return true;
  if (!navigator.onLine) return false;

  try {
    const elapsed = now - Number(window.sessionStorage.getItem(RELOAD_STORAGE_KEY));
    // A negative elapsed time means the clock went back since the last reload; don't trust it.
    if (elapsed >= 0 && elapsed < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_STORAGE_KEY, String(now));
  } catch {
    return false;
  }

  reloading = true;
  window.location.reload();
  return true;
}

/**
 * React.lazy that reloads the page once when the component's chunk fails to load, and waits on
 * Suspense for the reload. When it doesn't reload, the error goes on to the error boundaries and
 * Sentry. Use it instead of React.lazy.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Matches React.lazy's own signature.
export function lazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return reactLazy(() =>
    factory().catch(error => {
      if (reloadOnce()) return new Promise<never>(() => {});
      throw error;
    }),
  );
}
