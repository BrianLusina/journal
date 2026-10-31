import { FunctionComponent, KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { CornerDownLeft, Search } from 'lucide-react';
import SearchResults from '@/components/SearchResults';
import { useSearch, useSettledSearchLog } from '@/hooks/search';
import { logSearch, logSearchSelection } from '@/services/search/searchAnalytics';
import type { SearchDocument } from '@/services/search/SearchDocument';
import { SEARCH_PAGE_ROUTE } from '@/routes/links';

/** The modal is the quick path: a few best matches, then "See all results". */
const MAX_RESULTS = 8;

type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Search in a modal. The input is a combobox over the results: ↑/↓ move, Enter opens, Esc closes.
 * Radix traps focus while it is open and returns it on close.
 */
const SearchDialog: FunctionComponent<SearchDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const { status, results, retry } = useSearch(query);
  const listboxId = useId();
  // Radix only gives focus back to a Dialog.Trigger, and this dialog also opens from shortcuts,
  // so it remembers what had focus. A layout effect runs before Radix moves focus into the dialog.
  const returnFocusTo = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open) returnFocusTo.current = document.activeElement as HTMLElement | null;
  }, [open]);
  useSettledSearchLog(query, results.length, 'modal', open && status === 'ready');

  const shown = results.slice(0, MAX_RESULTS);
  // The last option, after the results, is "See all results".
  const optionCount = shown.length > 0 ? shown.length + 1 : 0;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
  });

  const go = (path: string) => {
    logSearch(query, results.length, 'modal');
    onOpenChange(false);
    navigate(path);
  };
  const openResult = (post: SearchDocument) => {
    logSearchSelection(post.slug, 'modal');
    go(`/article/${post.id}/${post.slug}`);
  };
  const seeAll = () => go(`${SEARCH_PAGE_ROUTE}?${new URLSearchParams({ q: query.trim() })}`);
  const choose = (index: number) => (index < shown.length ? openResult(shown[index]) : seeAll());

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (optionCount === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(index => (index + 1) % optionCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(index => (index - 1 + optionCount) % optionCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(active);
    }
  };

  const optionClass = (index: number, layout: string) =>
    `flex cursor-pointer rounded-2xl px-4 py-3 ${layout} ${index === active ? 'bg-muted' : ''}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={event => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
          className="fixed left-1/2 top-[10vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
        >
          <Dialog.Title className="sr-only">Search posts</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              role="combobox"
              aria-label="Search posts"
              aria-autocomplete="list"
              aria-expanded={optionCount > 0}
              aria-controls={listboxId}
              aria-activedescendant={optionCount > 0 ? optionId(active) : undefined}
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search posts"
              autoComplete="off"
              spellCheck={false}
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:block">
              Esc
            </kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            <SearchResults query={query} status={status} results={results} onRetry={retry}>
              {() => (
                <ul role="listbox" id={listboxId} aria-label="Results">
                  {shown.map((post, index) => (
                    <li
                      key={post.key}
                      id={optionId(index)}
                      role="option"
                      aria-selected={index === active}
                      tabIndex={-1}
                      className={optionClass(index, 'flex-col gap-0.5')}
                      onMouseMove={() => setActive(index)}
                      onClick={() => choose(index)}
                    >
                      <span className="font-medium">{post.title}</span>
                      {(post.category || post.description) && (
                        <span className="truncate text-sm text-muted-foreground">
                          {[post.category, post.description].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </li>
                  ))}
                  <li
                    id={optionId(shown.length)}
                    role="option"
                    aria-selected={active === shown.length}
                    tabIndex={-1}
                    className={optionClass(shown.length, 'items-center justify-between text-sm font-medium')}
                    onMouseMove={() => setActive(shown.length)}
                    onClick={seeAll}
                  >
                    See all results
                    <CornerDownLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </li>
                </ul>
              )}
            </SearchResults>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SearchDialog;
