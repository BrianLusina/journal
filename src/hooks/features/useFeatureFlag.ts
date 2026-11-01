import { useContext } from 'react';
import { FeatureName } from '@/config/features';
import { FeaturesContext } from '@/providers/features';

/** Whether the feature is on. */
export const useFeatureFlag = (name: FeatureName): boolean => useContext(FeaturesContext)[name];
