import {
  logEvent,
  getAnalytics,
  Analytics as FirebaseAnalytics,
  EventParams,
  CustomEventName,
} from 'firebase/analytics';
import firebaseApp from '@firebaseClient';
import config from '@config';

const {
  env: { isProduction },
  firebase: { projectId },
} = config;

/**
 * Analytics Service.
 * This will handle all analytics events.
 * This could be a wrapper around any analytics library.
 */
export class Analytics {
  private analytics: FirebaseAnalytics | null = null;

  logEvent(eventName: CustomEventName<string>, eventParams?: EventParams): void {
    // Firebase throws when it is not configured, which would take the whole app down, so it is
    // only created on first use and only where events are actually sent.
    if (!isProduction || !projectId) {
      return;
    }
    this.analytics = this.analytics || getAnalytics(firebaseApp);
    logEvent(this.analytics, eventName, eventParams);
  }
}

export default new Analytics();
