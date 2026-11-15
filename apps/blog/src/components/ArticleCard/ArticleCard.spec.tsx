import { fireEvent, render, screen } from '@testUtils/rtlUtils';
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

  it('replaces a thumbnail that fails to load with the placeholder', () => {
    const { container } = render(<ArticleCard {...props} thumbnail="https://example.com/expired.jpg" />);

    fireEvent.error(screen.getByRole('img', { name: props.title }));

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('article-card-placeholder')).toHaveClass('tag-travel');
  });

  it('shows the image again when a failed thumbnail is replaced with a new one', () => {
    const { rerender } = render(<ArticleCard {...props} thumbnail="https://example.com/expired.jpg" />);
    fireEvent.error(screen.getByRole('img', { name: props.title }));

    rerender(<ArticleCard {...props} thumbnail="https://example.com/refreshed.jpg" />);

    expect(screen.getByRole('img', { name: props.title })).toHaveAttribute(
      'src',
      'https://example.com/refreshed.jpg',
    );
    expect(screen.queryByTestId('article-card-placeholder')).not.toBeInTheDocument();
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
