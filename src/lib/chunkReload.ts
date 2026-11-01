/**
 * Recovers from lazily loaded chunks that fail to load, most often because a deploy replaced the
 * chunk hashes while a tab was open. Retrying the same URL can't fix that; reloading the page can.
 * See https://vite.dev/guide/build#load-error-handling.
 */

import { ComponentType, LazyExoticComponent, lazy as reactLazy } from 'react';

export const RELOAD_STORAGE_KEY = 'chunk-reload-at';
export const RELOAD_WINDOW_MS = 60_000;

let reloading = false;

/**
 * Reloads the page on the first chunk load error, at most once per RELOAD_WINDOW_MS. Otherwise
 * the error goes on to the error boundaries and Sentry. Without sessionStorage there is no guard
 * that survives the reload, so it never reloads rather than risk a loop.
 */
export function handlePreloadError(event: Event, now = Date.now()): void {
  // One import() can fail several times (each of its deps, then the chunk itself); once a reload
  // is under way, swallow the rest so they don't reach the error boundary first.
  if (reloading) {
    event.preventDefault();
    return;
  }

  try {
    const lastReload = Number(window.sessionStorage.getItem(RELOAD_STORAGE_KEY));
    if (now - lastReload < RELOAD_WINDOW_MS) return;
    window.sessionStorage.setItem(RELOAD_STORAGE_KEY, String(now));
  } catch {
    return;
  }

  reloading = true;
  event.preventDefault();
  window.location.reload();
}

export function reloadOnChunkLoadError(): void {
  window.addEventListener('vite:preloadError', event => handlePreloadError(event));
}

/**
 * React.lazy that waits for the reload instead of failing. When handlePreloadError swallows a
 * failed import, Vite resolves it to undefined, and React.lazy would throw a TypeError into the
 * error boundary and Sentry while the page reloads.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Matches React.lazy's own signature.
export function lazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return reactLazy(() => factory().then(module => module ?? new Promise<never>(() => {})));
}
