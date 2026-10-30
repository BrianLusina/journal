import { readEnv } from './runtimeEnv';

/**
 * Every feature flag and its value when VITE_FEATURES doesn't set it. A new, unfinished feature
 * defaults to false.
 */
export const FEATURE_DEFAULTS = {
  newsletter: false,
  search: false,
  notion: true,
} as const satisfies Record<string, boolean>;

export type FeatureName = keyof typeof FEATURE_DEFAULTS;
export type Features = Record<FeatureName, boolean>;

const VALUES = new Map([
  ['on', true],
  ['true', true],
  ['1', true],
  ['off', false],
  ['false', false],
  ['0', false],
]);

const NAMES = new Set<string>(Object.keys(FEATURE_DEFAULTS));

const isFeatureName = (name: string): name is FeatureName => NAMES.has(name);

/**
 * The defaults with the overrides in raw applied, a comma-separated list such as
 * "search=on,newsletter=off". A bare name turns its feature on. An unknown name or value is
 * skipped (with a warning in development), so a typo never breaks the app.
 */
export const parseFeatures = (raw: string | undefined): Features => {
  const features: Features = { ...FEATURE_DEFAULTS };
  for (const entry of (raw ?? '').split(',')) {
    if (!entry.trim()) continue;
    const [name, value = 'on', ...rest] = entry.split('=').map(part => part.trim());
    const enabled = VALUES.get(value.toLowerCase());
    if (!isFeatureName(name) || enabled === undefined || rest.length > 0) {
      if (import.meta.env.DEV) {
        console.warn(`VITE_FEATURES: ignoring "${entry.trim()}"`);
      }
      continue;
    }
    features[name] = enabled;
  }
  return features;
};

export default parseFeatures(readEnv('VITE_FEATURES'));
