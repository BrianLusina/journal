import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SearchDocument } from '@/services/search/SearchDocument';
import SearchResults from './SearchResults';

const result: SearchDocument = {
  key: 'contentful:c1',
  id: 'c1',
  source: 'contentful',
  slug: 'c1',
  title: 'React Hooks',
  tags: [],
  authors: [],
  publishDate: '2024-01-01',
};

const list = (results: SearchDocument[]) => (
  <ul>
    {results.map(post => (
      <li key={post.key}>{post.title}</li>
    ))}
  </ul>
);

describe('SearchResults', () => {
  it('asks for a longer query', () => {
    render(<SearchResults query=" r " status="ready" results={[]} onRetry={jest.fn()}>{list}</SearchResults>);

    expect(screen.getByRole('status')).toHaveTextContent('Type at least 2 characters to search posts.');
  });

  it('says it is loading', () => {
    render(<SearchResults query="react" status="loading" results={[]} onRetry={jest.fn()}>{list}</SearchResults>);

    expect(screen.getByRole('status')).toHaveTextContent('Loading search…');
  });

  it('offers a retry when search failed to load', async () => {
    const onRetry = jest.fn();
    render(<SearchResults query="" status="error" results={[]} onRetry={onRetry}>{list}</SearchResults>);

    expect(screen.getByRole('alert')).toHaveTextContent("Search couldn't load.");
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('says when nothing matches', () => {
    render(<SearchResults query="zebra " status="ready" results={[]} onRetry={jest.fn()}>{list}</SearchResults>);

    expect(screen.getByRole('status')).toHaveTextContent('No posts match “zebra”.');
  });

  it('renders the results and announces how many there are', () => {
    render(<SearchResults query="react" status="ready" results={[result]} onRetry={jest.fn()}>{list}</SearchResults>);

    expect(screen.getByRole('status')).toHaveTextContent('1 post found');
    expect(screen.getByRole('listitem')).toHaveTextContent('React Hooks');
  });
});
