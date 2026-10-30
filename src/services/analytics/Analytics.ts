import type { EventParams, CustomEventName } from 'firebase/analytics';
import config from '@config';

const {
  env: { isProduction },
  firebase: { projectId },
} = config;

type SendEvent = (eventName: CustomEventName<string>, eventParams?: EventParams) => void;

/**
 * Loads the Firebase SDK, which is kept out of the bundle every visit downloads first.
 */
const loadFirebaseAnalytics = async (): Promise<SendEvent> => {
  const [{ getAnalytics, logEvent }, { default: firebaseApp }] = await Promise.all([
    import('firebase/analytics'),
    import('@firebaseClient'),
  ]);
  const analytics = getAnalytics(firebaseApp);
  return (eventName, eventParams) => logEvent(analytics, eventName, eventParams);
};

/**
 * Analytics Service.
 * This will handle all analytics events.
 * This could be a wrapper around any analytics library.
 */
export class Analytics {
  private sendEvent: Promise<SendEvent> | null = null;

  logEvent(eventName: CustomEventName<string>, eventParams?: EventParams): void {
    // Firebase throws when it is not configured, which would take the whole app down, so it is
    // only created on first use and only where events are actually sent.
    if (!isProduction || !projectId) {
      return;
    }
    // Events logged while the SDK loads wait on the same promise, so they are sent in order once
    // it has loaded.
    this.sendEvent = this.sendEvent || loadFirebaseAnalytics();
    // Analytics is best effort: when the SDK cannot load (a failed download or a blocked
    // storage), the event is dropped rather than surfacing as an error on the page.
    this.sendEvent.then(send => send(eventName, eventParams)).catch(() => undefined);
  }
}

export default new Analytics();
