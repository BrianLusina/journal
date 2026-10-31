import { Meta, StoryFn } from '@storybook/react';
import ArticleCard from '@/components/ArticleCard';
import type { SearchDocument } from '@/services/search/SearchDocument';
import SearchResults from './SearchResults';

export default {
  title: 'Components/SearchResults',
  component: SearchResults,
} as Meta<typeof SearchResults>;

const results: SearchDocument[] = [
  {
    key: 'contentful:1',
    id: '1',
    source: 'contentful',
    slug: 'understanding-react-hooks',
    title: 'Understanding React Hooks',
    category: 'Engineering',
    description: 'State, effects and the rules that keep them predictable.',
    tags: ['React'],
    authors: ['Brian'],
    publishDate: '2024-03-01',
    thumbnailUrl: 'https://picsum.photos/seed/hooks/800/600',
  },
  {
    key: 'notion:2',
    id: '2',
    source: 'notion',
    slug: 'decision-making',
    title: 'Navigating Decision-Making in Engineering',
    category: 'Leadership',
    tags: ['Decision'],
    authors: ['Brian'],
    publishDate: '2024-02-07',
    thumbnailUrl: 'https://picsum.photos/seed/decide/800/600',
  },
];

/** As the modal lists them. */
const list = (found: SearchDocument[]) => (
  <ul className="max-w-xl">
    {found.map(post => (
      <li key={post.key} className="flex flex-col gap-0.5 rounded-2xl px-4 py-3 hover:bg-muted">
        <span className="font-medium">{post.title}</span>
        <span className="truncate text-sm text-muted-foreground">
          {[post.category, post.description].filter(Boolean).join(' · ')}
        </span>
      </li>
    ))}
  </ul>
);

/** As the search page shows them. */
const cards = (found: SearchDocument[]) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {found.map(post => (
      <ArticleCard
        key={post.key}
        id={post.id}
        slug={post.slug}
        title={post.title}
        category={post.category || ''}
        date={post.publishDate}
        thumbnail={post.thumbnailUrl || ''}
      />
    ))}
  </div>
);

const Template: StoryFn<typeof SearchResults> = args => <SearchResults {...args} />;

const base = { query: 'react', status: 'ready' as const, results, onRetry: () => undefined, children: list };

export const Listed = Template.bind({});
Listed.args = base;

export const AsCards = Template.bind({});
AsCards.args = { ...base, children: cards };

export const TooShort = Template.bind({});
TooShort.args = { ...base, query: 'r', results: [] };

export const Loading = Template.bind({});
Loading.args = { ...base, status: 'loading', results: [] };

export const NoMatches = Template.bind({});
NoMatches.args = { ...base, query: 'zebra', results: [] };

export const FailedToLoad = Template.bind({});
FailedToLoad.args = { ...base, status: 'error', results: [] };
