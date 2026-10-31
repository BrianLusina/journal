import { FunctionComponent, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import ErrorBoundary from '@/components/Errors/ErrorBoundary';

// Loaded the first time search opens, so it and the search index stay out of the initial bundle.
const SearchDialog = lazy(() => import('@/components/SearchDialog'));

const isTypingIn = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** ⌘K, Ctrl+K or a bare /. */
const isShortcut = (event: KeyboardEvent): boolean =>
  ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') ||
  (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey);

/**
 * The navbar's search button, and the ⌘K / Ctrl+K / `/` shortcuts that open search from any
 * page. The shortcuts are left alone while the reader is typing in a field.
 */
const SearchLauncher: FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);

  const show = useCallback(() => {
    setRequested(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingIn(event.target) || !isShortcut(event)) return;
      event.preventDefault();
      show();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [show]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search posts"
        aria-keyshortcuts="Meta+K Control+K /"
        aria-haspopup="dialog"
        className="p-1.5 sm:p-2 rounded-full hover:bg-muted/60 transition-all"
      >
        <Search className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      {requested && (
        // If the search chunk fails to load, drop the dialog instead of the navbar.
        <ErrorBoundary fallback={<></>}>
          <Suspense fallback={null}>
            <SearchDialog open={open} onOpenChange={setOpen} />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
};

export default SearchLauncher;
