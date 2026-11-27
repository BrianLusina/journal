import { eventParams, type SiteEvent } from './events';

type Gtag = (...args: unknown[]) => void;
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag };

export type SiteAnalytics = {
  /** The reader accepted analytics cookies: load gtag.js and start sending. */
  grant(): void;
  pageview(path: string): void;
  event(event: SiteEvent): void;
};

/**
 * GA4 for one site, over gtag.js with no SDK. Nothing is sent outside production, or without a
 * measurement ID, or before `grant()`: gtag.js isn't even loaded until then ("basic" Consent Mode),
 * so a reader who declines makes no request to Google. Calls before `grant()` are dropped.
 * Vercel Web Analytics, which is cookieless, counts page views separately.
 */
export function createAnalytics(options: {
  site: 'home' | 'folio';
  isProduction: boolean;
  measurementId: string | undefined;
  window?: Window;
}): SiteAnalytics {
  const { site, isProduction, measurementId } = options;
  const win = (options.window ?? window) as GtagWindow;
  const enabled = isProduction && Boolean(measurementId);
  let gtag: Gtag | undefined;

  return {
    grant() {
      if (!enabled || gtag) return;
      win.dataLayer = win.dataLayer ?? [];
      // gtag.js reads the queued `arguments` objects, exactly as Google's snippet pushes them.
      gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        win.dataLayer!.push(arguments);
      };
      win.gtag = gtag;
      gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      gtag('js', new Date());
      gtag('consent', 'update', { analytics_storage: 'granted' });
      gtag('config', measurementId, { send_page_view: false, cookie_domain: 'auto' });
      const script = win.document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId!)}`;
      win.document.head.appendChild(script);
    },
    pageview(path) {
      gtag?.('event', 'page_view', { page_path: path, site });
    },
    event(event) {
      gtag?.('event', event.name, { ...eventParams(event), site });
    },
  };
}
