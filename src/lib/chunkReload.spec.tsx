import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/Errors/ErrorBoundary';
import type * as ChunkReload from './chunkReload';

const originalLocation = window.location;
const reload = vi.fn();
// jsdom's location can't be spied on, so these tests replace it.
const testWindow = window as { location?: Location };

/** A fresh copy of the module, as after a page load: it remembers a reload in progress. */
const loadModule = async () => {
  vi.resetModules();
  return import('./chunkReload');
};

const setOnline = (onLine: boolean) => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: onLine });
};

let chunkReload: typeof ChunkReload;

beforeEach(async () => {
  chunkReload = await loadModule();
  window.sessionStorage.clear();
  setOnline(true);
  delete testWindow.location;
  testWindow.location = { ...originalLocation, reload };
});

afterEach(() => {
  testWindow.location = originalLocation;
  vi.restoreAllMocks();
});

describe('reloadOnce', () => {
  it('reloads on the first error and not on a second one within the window', async () => {
    expect(chunkReload.reloadOnce(1_000_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    // After the reload the page starts again with only sessionStorage to go on.
    chunkReload = await loadModule();

    expect(chunkReload.reloadOnce(1_000_000 + chunkReload.RELOAD_WINDOW_MS - 1)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again once the window has passed', () => {
    window.sessionStorage.setItem(chunkReload.RELOAD_STORAGE_KEY, '1000000');

    expect(chunkReload.reloadOnce(1_000_000 + chunkReload.RELOAD_WINDOW_MS)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads when the clock went back since the last reload', () => {
    window.sessionStorage.setItem(chunkReload.RELOAD_STORAGE_KEY, '2000000');

    expect(chunkReload.reloadOnce(1_000_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reports the reload under way to further errors on the same page without reloading again', () => {
    chunkReload.reloadOnce(1_000_000);

    expect(chunkReload.reloadOnce(1_000_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload offline', () => {
    setOnline(false);

    expect(chunkReload.reloadOnce(1_000_000)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([
    ['reading', 'getItem'],
    ['writing', 'setItem'],
  ] as const)('does not reload when sessionStorage throws on %s', (_, method) => {
    vi.spyOn(window.sessionStorage, method).mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(chunkReload.reloadOnce(1_000_000)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('lazy', () => {
  const Page = () => <p>Loaded page</p>;
  const chunkError = new TypeError('Failed to fetch dynamically imported module');

  const renderLazy = (factory: () => Promise<{ default: typeof Page }>) => {
    const onError = vi.fn();
    const LazyPage = chunkReload.lazy(factory);
    render(
      <ErrorBoundary onError={onError}>
        <Suspense fallback={<p>Loading</p>}>
          <LazyPage />
        </Suspense>
      </ErrorBoundary>,
    );
    return onError;
  };

  it('renders the component once it loads', async () => {
    renderLazy(() => Promise.resolve({ default: Page }));

    expect(await screen.findByText('Loaded page')).toBeInTheDocument();
  });

  it('reloads when the chunk fails, and waits for the reload instead of failing', async () => {
    const onError = renderLazy(() => Promise.reject(chunkError));

    await screen.findByText('Loading');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
  });

  it('passes the error to the error boundary when it already reloaded within the window', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.sessionStorage.setItem(chunkReload.RELOAD_STORAGE_KEY, String(Date.now()));

    const onError = renderLazy(() => Promise.reject(chunkError));

    await screen.findByText(/Something terrible went wrong/);
    expect(reload).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(chunkError, expect.anything());
  });
});
