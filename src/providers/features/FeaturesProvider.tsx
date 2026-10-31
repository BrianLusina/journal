import { FunctionComponent, PropsWithChildren } from 'react';
import features, { Features } from '@/config/features';
import { FeaturesContext } from './FeaturesContext';

type FeaturesProviderProps = PropsWithChildren<{ value?: Features }>;

const FeaturesProvider: FunctionComponent<FeaturesProviderProps> = ({ value = features, children }) => (
  <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>
);

export default FeaturesProvider;
