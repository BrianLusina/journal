import { FunctionComponent, useState, ChangeEvent } from 'react';
import { SearchBarProps } from './SearchBar.props';

const SearchBar: FunctionComponent<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { value } = e.target;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <form className="search" method="get" action="#">
      <input
        type="text"
        name="query"
        placeholder="Search"
        onChange={handleSearchChange}
        value={searchTerm}
      />
    </form>
  );
};

export default SearchBar;
