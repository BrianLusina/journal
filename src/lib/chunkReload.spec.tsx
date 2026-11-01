import { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/Errors/ErrorBoundary';
import type * as ChunkReload from './chunkReload';

const originalLocation = window.location;
const reload = jest.fn();
// jsdom's location can't be spied on, so these tests replace it.
const testWindow = window as { location?: Location };

/** A fresh copy of the module, as after a page load: it remembers a reload in progress. */
const loadModule = async () => {
  jest.resetModules();
  return import('./chunkReload');
};

const preloadError = () => new Event('vite:preloadError', { cancelable: true });

describe('handlePreloadError', () => {
  let chunkReload: typeof ChunkReload;

  beforeEach(async () => {
    chunkReload = await loadModule();
    window.sessionStorage.clear();
    delete testWindow.location;
    testWindow.location = { ...originalLocation, reload };
  });

  afterEach(() => {
    testWindow.location = originalLocation;
    jest.restoreAllMocks();
  });

  it('reloads on the first error and not on a second one within the window', async () => {
    const first = preloadError();
    chunkReload.handlePreloadError(first, 1_000_000);

    expect(first.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    // After the reload the page starts again with only sessionStorage to go on.
    chunkReload = await loadModule();
    const second = preloadError();
    chunkReload.handlePreloadError(second, 1_000_000 + chunkReload.RELOAD_WINDOW_MS - 1);

    expect(second.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again once the window has passed', () => {
    window.sessionStorage.setItem(chunkReload.RELOAD_STORAGE_KEY, '1000000');

    const event = preloadError();
    chunkReload.handlePreloadError(event, 1_000_000 + chunkReload.RELOAD_WINDOW_MS);

    expect(event.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('swallows further errors on the same page while the reload is under way', () => {
    chunkReload.handlePreloadError(preloadError(), 1_000_000);

    const next = preloadError();
    chunkReload.handlePreloadError(next, 1_000_000);

    expect(next.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['reading', 'getItem'],
    ['writing', 'setItem'],
  ] as const)('does not reload when sessionStorage throws on %s', (_, method) => {
    jest.spyOn(window.sessionStorage, method).mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const event = preloadError();
    chunkReload.handlePreloadError(event, 1_000_000);

    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('is wired to vite:preloadError on window by reloadOnChunkLoadError', () => {
    chunkReload.reloadOnChunkLoadError();

    const event = preloadError();
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('lazy', () => {
  const Page = () => <p>Loaded page</p>;

  it('renders the component once it loads', async () => {
    const { lazy } = await loadModule();
    const LazyPage = lazy(() => Promise.resolve({ default: Page }));

    render(
      <Suspense fallback={<p>Loading</p>}>
        <LazyPage />
      </Suspense>,
    );

    expect(await screen.findByText('Loaded page')).toBeInTheDocument();
  });

  it('keeps waiting instead of throwing when a swallowed error resolves the import to undefined', async () => {
    const { lazy } = await loadModule();
    const onError = jest.fn();
    // This is what Vite's preload helper resolves to once handlePreloadError prevents the error.
    const LazyPage = lazy(() => Promise.resolve(undefined as unknown as { default: typeof Page }));

    render(
      <ErrorBoundary onError={onError}>
        <Suspense fallback={<p>Loading</p>}>
          <LazyPage />
        </Suspense>
      </ErrorBoundary>,
    );
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
  });
});
