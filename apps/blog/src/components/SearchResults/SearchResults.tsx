import { FunctionComponent, ReactNode } from 'react';
import { MIN_QUERY_LENGTH, type SearchStatus } from '@/hooks/search';
import type { SearchDocument } from '@/services/search/SearchDocument';

type SearchResultsProps = {
  query: string;
  status: SearchStatus;
  results: SearchDocument[];
  onRetry: () => void;
  /** Renders the results, once there are any. The modal lists them; the page shows cards. */
  children: (results: SearchDocument[]) => ReactNode;
};

const Message: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">
    {children}
  </p>
);

/**
 * The states every search shows the same way, around the results: too short a query, loading,
 * an index that failed to load, and no matches. The number of results is announced.
 */
const SearchResults: FunctionComponent<SearchResultsProps> = ({ query, status, results, onRetry, children }) => {
  if (status === 'error') {
    return (
      <div role="alert" className="px-4 py-8 text-center text-sm text-muted-foreground">
        <p>Search couldn&apos;t load.</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-full border border-border px-4 py-1.5 font-medium hover:bg-muted/60">
          Try again
        </button>
      </div>
    );
  }
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return <Message>Type at least {MIN_QUERY_LENGTH} characters to search posts.</Message>;
  }
  if (status === 'loading') {
    return <Message>Loading search…</Message>;
  }
  if (results.length === 0) {
    return <Message>No posts match &ldquo;{trimmed}&rdquo;.</Message>;
  }
  return (
    <>
      <p role="status" className="sr-only">
        {results.length === 1 ? '1 post found' : `${results.length} posts found`}
      </p>
      {children(results)}
    </>
  );
};

export default SearchResults;
