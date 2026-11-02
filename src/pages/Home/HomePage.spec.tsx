import { render, screen } from '@testUtils/rtlUtils';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import HomePage from './HomePage';

vi.mock('@components', () => ({
  HeroSection: () => <section>hero</section>,
  IntroSection: () => <section>intro</section>,
}));
vi.mock('@features', () => ({ FeaturedArticles: () => <section>featured articles</section> }));
vi.mock('@/features/NewsLetter', () => ({ __esModule: true, default: () => <section>newsletter</section> }));

describe('HomePage', () => {
  it.each([
    [true, 'shows'],
    [false, 'hides'],
  ])('with the newsletter feature %p, %s the newsletter section', (newsletter) => {
    render(
      <FeaturesProvider value={{ ...FEATURE_DEFAULTS, newsletter }}>
        <HomePage />
      </FeaturesProvider>,
    );

    expect(screen.getByText('featured articles')).toBeInTheDocument();
    expect(screen.queryByText('newsletter') !== null).toBe(newsletter);
  });
});
