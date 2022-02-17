import { render } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('should render', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
  });
});
