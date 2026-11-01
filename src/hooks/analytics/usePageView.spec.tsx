import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import analytics from '@analytics';
import usePageViews from './usePageView';

jest.mock('@analytics', () => ({ __esModule: true, default: { logEvent: jest.fn() } }));

const wrapper = ({ children }: PropsWithChildren) => <MemoryRouter initialEntries={['/search']}>{children}</MemoryRouter>;

describe('usePageViews', () => {
  it('logs a page view per page, not per change of its query', () => {
    const { result } = renderHook(
      () => {
        usePageViews();
        return useNavigate();
      },
      { wrapper },
    );

    act(() => result.current('/search?q=r', { replace: true }));
    act(() => result.current('/search?q=re', { replace: true }));
    act(() => result.current('/about'));

    expect((analytics.logEvent as jest.Mock).mock.calls).toEqual([
      ['page_view', { page_path: '/search' }],
      ['page_view', { page_path: '/about' }],
    ]);
  });
});
