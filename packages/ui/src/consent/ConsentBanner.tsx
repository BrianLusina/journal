import { useEffect, useState, type FC } from 'react';
import Button from '../button/Button';
import { readConsentCookie, serializeConsentCookie, type Consent } from './consentCookie';

export type ConsentBannerProps = {
  /** Called once the reader has accepted: now, or on load when they accepted before. */
  onGrant: () => void;
  privacyHref?: string;
};

/**
 * Asks once whether analytics cookies may be used, and remembers the answer in the shared consent
 * cookie. Nothing is granted until the reader accepts (GA4 Consent Mode, analytics storage denied by
 * default). It renders nothing on the server, and until it has read the cookie.
 */
export const ConsentBanner: FC<ConsentBannerProps> = ({ onGrant, privacyHref = '/privacy' }) => {
  const [consent, setConsent] = useState<Consent | undefined | 'unread'>('unread');

  useEffect(() => {
    const saved = readConsentCookie(document.cookie);
    setConsent(saved);
    if (saved === 'granted') onGrant();
    // Read once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (choice: Consent) => {
    document.cookie = serializeConsentCookie(choice, window.location);
    setConsent(choice);
    if (choice === 'granted') onGrant();
  };

  if (consent !== undefined) return null;

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-foreground shadow-lg sm:flex-row sm:items-center"
    >
      <p className="flex-1">
        This site uses cookies for analytics, only if you accept. See the{' '}
        <a href={privacyHref} className="underline">
          privacy
        </a>{' '}
        page.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => choose('denied')}>
          Decline
        </Button>
        <Button size="sm" onClick={() => choose('granted')}>
          Accept
        </Button>
      </div>
    </section>
  );
};
