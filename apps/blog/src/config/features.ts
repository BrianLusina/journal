import { parseFlagList } from '@brianlusina/flags';
import { readEnv } from './runtimeEnv';

/**
 * Every feature flag and its value when VITE_FEATURES doesn't set it. A new, unfinished feature
 * defaults to false.
 */
export const FEATURE_DEFAULTS = {
  newsletter: false,
  search: false,
  notion: true,
  // Sanity posts: off until the source is configured and its datasets are private.
  sanity: false,
  legal: false,
  explore: false,
} as const satisfies Record<string, boolean>;

export type FeatureName = keyof typeof FEATURE_DEFAULTS;
export type Features = Record<FeatureName, boolean>;

const NAMES = Object.keys(FEATURE_DEFAULTS) as FeatureName[];

/**
 * The defaults with the overrides in raw applied, a comma-separated list such as
 * "search=on,newsletter=off". A bare name turns its feature on. An unknown name or value is
 * skipped (with a warning in development), so a typo never breaks the app. The syntax lives in
 * @brianlusina/flags, shared with apps/sites.
 */
export const parseFeatures = (raw: string | undefined): Features => ({
  ...FEATURE_DEFAULTS,
  ...parseFlagList(raw, NAMES, message => {
    if (import.meta.env.DEV) {
      console.warn(`VITE_FEATURES: ${message}`);
    }
  }),
});

export default parseFeatures(readEnv('VITE_FEATURES'));
