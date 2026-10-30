import { render, screen } from '@testUtils/rtlUtils';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import MainLayout from './MainLayout';

jest.mock('@components', () => ({
  Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  Navbar: () => <nav>navbar</nav>,
  Footer: () => <footer>footer</footer>,
}));

describe('MainLayout', () => {
  it.each([
    [true, 'shows'],
    [false, 'hides'],
  ])('with the search feature %p, %s the search bar', async (search) => {
    render(
      <FeaturesProvider value={{ ...FEATURE_DEFAULTS, search }}>
        <MainLayout>page</MainLayout>
      </FeaturesProvider>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('page');
    if (search) {
      expect(await screen.findByPlaceholderText('Search')).toBeInTheDocument();
    } else {
      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    }
  });
});
