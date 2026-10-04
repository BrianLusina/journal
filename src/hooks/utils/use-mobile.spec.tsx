import { act, renderHook } from '@testing-library/react-hooks';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  let changeListener: () => void;
  const removeEventListener = jest.fn();

  const setWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  };

  beforeEach(() => {
    window.matchMedia = jest.fn().mockReturnValue({
      addEventListener: (_: string, listener: () => void) => {
        changeListener = listener;
      },
      removeEventListener,
    });
  });

  it('is true below the mobile breakpoint and follows viewport changes', () => {
    setWidth(500);
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    setWidth(1024);
    act(() => changeListener());
    expect(result.current).toBe(false);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', changeListener);
  });
});
