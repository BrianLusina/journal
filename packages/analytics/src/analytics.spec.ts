import { createAnalytics } from './analytics';

const ID = 'G-TEST123';
type Gtag = IArguments | unknown[];
const dataLayer = () => ((window as unknown as { dataLayer?: Gtag[] }).dataLayer ?? []).map(entry => Array.from(entry as ArrayLike<unknown>));
const scripts = () => Array.from(document.head.querySelectorAll('script')).map(script => script.src);

beforeEach(() => {
  document.head.innerHTML = '';
  delete (window as unknown as { dataLayer?: unknown }).dataLayer;
  delete (window as unknown as { gtag?: unknown }).gtag;
});

const production = () => createAnalytics({ site: 'home', isProduction: true, measurementId: ID });

describe('createAnalytics before consent', () => {
  it('loads nothing and records nothing', () => {
    const analytics = production();

    analytics.pageview('/');
    analytics.event({ name: 'resume_download' });

    expect(scripts()).toEqual([]);
    expect(dataLayer()).toEqual([]);
  });
});

describe('createAnalytics once consent is granted', () => {
  it('loads gtag.js once, then sets consent and the config, in order', () => {
    const analytics = production();

    analytics.grant();
    analytics.grant();

    expect(scripts()).toEqual([`https://www.googletagmanager.com/gtag/js?id=${ID}`]);
    expect(dataLayer()).toEqual([
      ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
      ['js', expect.any(Date)],
      ['consent', 'update', { analytics_storage: 'granted' }],
      ['config', ID, { send_page_view: false, cookie_domain: 'auto' }],
    ]);
  });

  it('sends page views and events with the site, queued in order while gtag.js loads', () => {
    const analytics = production();
    analytics.grant();

    analytics.pageview('/projects');
    analytics.event({ name: 'contact_submit', outcome: 'failure' });

    expect(dataLayer().slice(4)).toEqual([
      ['event', 'page_view', { page_path: '/projects', site: 'home' }],
      ['event', 'contact_submit', { outcome: 'failure', site: 'home' }],
    ]);
  });

  it('drops what was sent before consent instead of replaying it', () => {
    const analytics = production();
    analytics.pageview('/before');

    analytics.grant();

    expect(dataLayer().some(entry => entry[0] === 'event')).toBe(false);
  });
});

describe.each([
  ['outside production', { site: 'folio' as const, isProduction: false, measurementId: ID }],
  ['without a measurement ID', { site: 'folio' as const, isProduction: true, measurementId: undefined }],
])('createAnalytics %s', (_, options) => {
  it('never loads gtag.js or records anything, even after consent', () => {
    const analytics = createAnalytics(options);

    analytics.grant();
    analytics.pageview('/');
    analytics.event({ name: 'project_filter', filter: 'stack', value: 'Go' });

    expect(scripts()).toEqual([]);
    expect(dataLayer()).toEqual([]);
  });
});

