import { render, screen } from '@testUtils/rtlUtils';
import { Tags } from './Tag';

describe('Tags', () => {
  it('links each tag to its tag page', () => {
    render(<Tags tags={['Personal Growth', 'Travel']} />);

    expect(screen.getByText('#Personal Growth')).toHaveAttribute('href', '/article/tag/personalGrowth');
    expect(screen.getByText('#Travel')).toHaveAttribute('href', '/article/tag/travel');
  });
});
