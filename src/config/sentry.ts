const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
// Env values are strings; Sentry needs a number between 0 and 1.
const parsedSampleRate = Number.parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);
const SENTRY_TRACES_SAMPLE_RATE = Number.isFinite(parsedSampleRate) ? parsedSampleRate : 0.5;

export default {
  sentryDsn: SENTRY_DSN,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
};
