import { renderHook } from '@testing-library/react';
import { logSearch } from '@/services/search/searchAnalytics';
import { SETTLE_DELAY_MS, useSettledSearchLog } from './useSettledSearchLog';

vi.mock('@/services/search/searchAnalytics', () => ({ logSearch: vi.fn() }));

describe('useSettledSearchLog', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('logs the query once typing has paused, not on every keystroke', () => {
    const { rerender } = renderHook(({ query }) => useSettledSearchLog(query, 2, 'modal', true), {
      initialProps: { query: 're' },
    });
    vi.advanceTimersByTime(SETTLE_DELAY_MS - 1);
    rerender({ query: 'rea' });
    vi.advanceTimersByTime(SETTLE_DELAY_MS - 1);
    rerender({ query: 'react' });

    expect(logSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(SETTLE_DELAY_MS);

    expect(logSearch).toHaveBeenCalledTimes(1);
    expect(logSearch).toHaveBeenCalledWith('react', 2, 'modal');
  });

  it('logs nothing until the results are ready', () => {
    renderHook(() => useSettledSearchLog('react', 0, 'page', false));
    vi.advanceTimersByTime(SETTLE_DELAY_MS * 2);

    expect(logSearch).not.toHaveBeenCalled();
  });
});
