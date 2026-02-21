const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const SENTRY_TRACES_SAMPLE_RATE = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.5;


export default {
  sentryDsn: SENTRY_DSN,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE || 0.5,
};
