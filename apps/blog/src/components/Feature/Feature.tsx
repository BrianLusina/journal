import { FunctionComponent, PropsWithChildren, ReactNode } from 'react';
import { FeatureName } from '@/config/features';
import { useFeatureFlag } from '@/hooks/features';

type FeatureProps = PropsWithChildren<{
  name: FeatureName;
  /** Rendered instead of the children while the feature is off. */
  fallback?: ReactNode;
}>;

/** Renders its children only while the named feature is on. */
const Feature: FunctionComponent<FeatureProps> = ({ name, fallback = null, children }) => (
  <>{useFeatureFlag(name) ? children : fallback}</>
);

export default Feature;
