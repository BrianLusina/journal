import { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import { useFeatureFlag } from './useFeatureFlag';

describe('useFeatureFlag', () => {
  it('reads the defaults without a provider', () => {
    const { result } = renderHook(() => useFeatureFlag('search'));

    expect(result.current).toBe(FEATURE_DEFAULTS.search);
  });

  it('reads the flags the provider sets', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <FeaturesProvider value={{ ...FEATURE_DEFAULTS, search: true, newsletter: false }}>
        {children}
      </FeaturesProvider>
    );

    expect(renderHook(() => useFeatureFlag('search'), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useFeatureFlag('newsletter'), { wrapper }).result.current).toBe(false);
  });
});
