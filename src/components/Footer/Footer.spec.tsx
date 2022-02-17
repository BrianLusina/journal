import { render } from '@testing-library/react';
import faker from 'faker';
import Footer from './Footer';

describe('Footer', () => {
  it('should be able to render with default props', () => {
    render(<Footer />);
  });

  it('should render with provided title', () => {
    const title = faker.lorem.word();
    render(<Footer title={title} />);
  });
});
