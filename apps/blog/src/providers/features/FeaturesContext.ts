import { createContext } from 'react';
import features, { Features } from '@/config/features';

/**
 * The feature flags in effect. Without a provider it holds the flags from VITE_FEATURES, so the
 * app needs none; tests and stories use FeaturesProvider to set their own.
 */
export const FeaturesContext = createContext<Features>(features);
