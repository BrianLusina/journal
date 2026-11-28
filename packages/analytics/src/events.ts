/** The sites' custom events (spec §6.4). Page views are sent with `pageview`, not as an event. */
export type SiteEvent =
  | { name: 'resume_download' }
  | { name: 'contact_submit'; outcome: 'success' | 'failure' }
  | { name: 'outbound_click'; target: 'blog' | 'github' | 'project'; url: string }
  | { name: 'project_filter'; filter: string; value: string };

/** A link's origin and path: a query string or fragment can carry personal data or tokens. */
function bareUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return undefined;
  }
}

/** The GA4 parameters for an event, without its name. */
export function eventParams(event: SiteEvent): Record<string, string> {
  const { name: _name, ...params } = event;
  if (event.name !== 'outbound_click') return params as Record<string, string>;
  const url = bareUrl(event.url);
  return { target: event.target, ...(url ? { url } : {}) };
}
