import { ChangeEvent, FormEvent, FunctionComponent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Search } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import Feature from '@/components/Feature';
import SearchResults from '@/components/SearchResults';
import NotFoundPage from '@/pages/NotFound';
import { useSearch, useSettledSearchLog } from '@/hooks/search';
import { logSearch, logSearchSelection } from '@/services/search/searchAnalytics';
import { humanizeDateTime } from '@timeUtils';
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY } from '@timeConstants';

/**
 * The shareable search: the query lives in `?q=`, so a search can be linked, reloaded and
 * reached with back and forward.
 */
const SearchContent: FunctionComponent = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const { status, results, retry } = useSearch(query);
  useSettledSearchLog(query, results.length, 'page', status === 'ready');

  // Replace rather than push, so history doesn't keep an entry per keystroke.
  const onChange = (event: ChangeEvent<HTMLInputElement>) =>
    setParams(event.target.value ? { q: event.target.value } : {}, { replace: true });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (status === 'ready') logSearch(query, results.length, 'page');
  };

  return (
    <div>
      <Helmet>
        <title>Search</title>
        {/* Internal search results are thin content to a crawler, but the posts they link to aren't. */}
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="mb-12 space-y-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">Search</h1>
        <form role="search" onSubmit={onSubmit} className="mx-auto max-w-2xl">
          <label className="flex items-center gap-3 rounded-full border border-border bg-background px-5">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search posts"
              placeholder="Search posts"
              value={query}
              onChange={onChange}
              autoComplete="off"
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>
      </div>

      <SearchResults query={query} status={status} results={results} onRetry={retry}>
        {found => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {found.map(post => (
              <ArticleCard
                key={post.key}
                size="small"
                id={post.id}
                slug={post.slug}
                title={post.title}
                category={post.category || ''}
                date={humanizeDateTime(post.publishDate, DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_FORMAT_MMMM_D_YYYY)}
                thumbnail={post.thumbnailUrl || ''}
                onClick={() => {
                  logSearch(query, results.length, 'page');
                  logSearchSelection(post.slug, 'page');
                }}
              />
            ))}
          </div>
        )}
      </SearchResults>
    </div>
  );
};

/** Not found while the search feature is off. */
const SearchPage: FunctionComponent = () => (
  <Feature name="search" fallback={<NotFoundPage />}>
    <SearchContent />
  </Feature>
);

export default SearchPage;
