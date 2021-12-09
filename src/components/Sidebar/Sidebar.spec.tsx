import { render, screen } from '@testing-library/react';
import faker from 'faker';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('should render with default props', () => {
    render(<Sidebar />);
  });

  it('should render children', () => {
    const title = faker.company.companyName();

    render(
      <Sidebar>
        <h2>{title}</h2>
      </Sidebar>,
    );

    const titleElement = screen.getByText(title);

    expect(titleElement).toBeInTheDocument();
  });
});
