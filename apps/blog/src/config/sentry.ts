import { readEnv } from './runtimeEnv';

const SENTRY_DSN = readEnv('VITE_SENTRY_DSN') || '';
// Env values are strings; Sentry needs a number between 0 and 1.
const parsedSampleRate = Number.parseFloat(readEnv('VITE_SENTRY_TRACES_SAMPLE_RATE'));
const SENTRY_TRACES_SAMPLE_RATE = Number.isFinite(parsedSampleRate) ? parsedSampleRate : 0.5;

export default {
  sentryDsn: SENTRY_DSN,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
};
