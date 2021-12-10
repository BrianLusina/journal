import { render } from '@testing-library/react';
import MockAppWithRouter from '@testUtils/MockAppWithRouter';
import faker from 'faker';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('should be able to mount', () => {
    const nextUrl = faker.internet.url();
    const prevUrl = faker.internet.url();

    render(
      <MockAppWithRouter>
        <Pagination previousUrl={prevUrl} nextUrl={nextUrl} />
      </MockAppWithRouter>,
    );
  });
});
