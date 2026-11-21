/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** The site this request is served as, set by the middleware for every site page. */
    site?: {
      id: import('./sites/registry').SiteId;
      env: import('./sites/registry').EnvName | 'preview';
      via: 'host' | 'override';
    };
    /** Set by the middleware before it rewrites, so it lets the rewritten request through. */
    rewritten?: boolean;
  }
}
