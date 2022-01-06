import { render, screen } from '@testing-library/react';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('should be able to render', () => {
    const onClick = jest.fn();
    const hasNextPage = true;

    render(<Pagination onClick={onClick} hasNextPage={hasNextPage} />);
  });

  it('should be able to handle click events when hasNextPage is true', () => {
    const onClick = jest.fn();
    const hasNextPage = true;

    render(<Pagination onClick={onClick} hasNextPage={hasNextPage} />);

    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();

    buttonElement.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be able to handle click events when hasNextPage is false', () => {
    const onClick = jest.fn();
    const hasNextPage = false;

    render(<Pagination onClick={onClick} hasNextPage={hasNextPage} />);

    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();

    buttonElement.click();
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});
