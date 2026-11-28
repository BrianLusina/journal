# @brianlusina/analytics

GA4 for `apps/sites`, over `gtag.js` with no SDK. There are no runtime dependencies. It also holds the search-term sanitisers the blog uses. See "Analytics and consent" in `docs/ARCHITECTURE.md` for how the sites use it.

```ts
const analytics = createAnalytics({ site: 'home', isProduction, measurementId });
analytics.grant(); // the reader accepted: load gtag.js, grant analytics_storage
analytics.pageview('/projects');
analytics.event({ name: 'contact_submit', outcome: 'success' });
```

- **Consent-gated:** nothing loads, and every call is dropped, until `grant()`. Calls made before consent aren't replayed afterwards. After `grant()`, calls queue on `dataLayer` until `gtag.js` has loaded, and are sent in order.
- **Production only:** with `isProduction: false`, or no `measurementId`, `grant()` does nothing either.
- **Server-safe:** it reads `window` only in `grant()`, so it can be created while an island renders on the server.
- **Events** (`SiteEvent`): `resume_download`, `contact_submit` (`outcome`), `outbound_click` (`target`, plus the URL's origin and path only, never its query string) and `project_filter` (`filter`, `value`). Every event carries `site`.
- **`normalizeSearchTerm`, `mayBePersonal`:** the blog's `search` event sanitisers. A search term is trimmed, lowercased, whitespace-collapsed and cut to 100 characters. A term that looks like an email or a long number is never sent.
