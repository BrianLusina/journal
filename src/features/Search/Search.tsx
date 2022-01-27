import { FunctionComponent, useState } from 'react';
import SearchBar from '@components/SearchBar';

const Search: FunctionComponent = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<string[]>([]);

  const getSearchResults = (query: string): void => {
    setSearchTerm(query);
    // if (!query || !window.__LUNR__) return [];
    // const results = window.__LUNR__.index.search(query);
    // setResults(results.map(({ ref }) => ref));
  };

  return <SearchBar onSearch={getSearchResults} />;
};

export default Search;
