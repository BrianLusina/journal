import { fireEvent, render, screen } from '@testUtils/rtlUtils';
import ArticleCard from '@/components/ArticleCard';

// The blog renders the design system's links through React Router, so moving between pages never
// reloads the app. jsdom can't do a full navigation: a plain anchor would leave the location alone.
describe('links from @brianlusina/ui in the blog', () => {
  afterEach(() => window.history.pushState({}, '', '/'));

  it('navigate client-side through the router', () => {
    render(<ArticleCard id="1" slug="x" title="A post" category="Travel" date="March 3, 2024" />);

    fireEvent.click(screen.getByRole('link', { name: /a post/i }));

    expect(window.location.pathname).toBe('/article/1/x');
  });
});
