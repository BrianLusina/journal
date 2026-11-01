import { render, screen } from '@testUtils/rtlUtils';
import ArticleCard from './ArticleCard';

const props = {
  id: 'post-1',
  slug: 'a-trip-north',
  title: 'A trip north',
  category: 'Travel',
  date: 'March 3, 2024',
};

describe('ArticleCard', () => {
  it('renders the thumbnail when one is given', () => {
    render(<ArticleCard {...props} thumbnail="https://example.com/cover.jpg" />);

    const image = screen.getByRole('img', { name: props.title });
    expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg');
    expect(screen.queryByTestId('article-card-placeholder')).not.toBeInTheDocument();
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
  ])('renders a category-tinted placeholder instead of an image when the thumbnail is %s', (_, thumbnail) => {
    const { container } = render(<ArticleCard {...props} thumbnail={thumbnail} />);

    expect(container.querySelector('img')).toBeNull();
    const placeholder = screen.getByTestId('article-card-placeholder');
    expect(placeholder).toHaveClass('tag-travel');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder.parentElement).toHaveClass('aspect-[4/3]');
  });

  it('keeps the title, date, category and link without a thumbnail', () => {
    render(<ArticleCard {...props} />);

    expect(screen.getByRole('link', { name: /a trip north/i })).toHaveAttribute(
      'href',
      '/article/post-1/a-trip-north',
    );
    expect(screen.getByRole('heading', { name: props.title })).toBeInTheDocument();
    expect(screen.getByText(props.date)).toBeInTheDocument();
    expect(screen.getByText(props.category)).toBeInTheDocument();
  });
});
