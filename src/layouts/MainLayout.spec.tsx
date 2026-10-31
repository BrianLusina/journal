import { render, screen, waitFor } from '@testUtils/rtlUtils';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import * as Monitoring from '@monitoring';
import MainLayout from './MainLayout';

jest.mock('@components', () => ({
  Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  Navbar: () => <nav>navbar</nav>,
  Footer: () => <footer>footer</footer>,
}));
jest.mock('@monitoring', () => ({ captureAndLogError: jest.fn() }));

let mockMenuFails = false;
jest.mock('@/components/Menu', () => {
  const { default: Menu } = jest.requireActual('@/components/Menu');
  return {
    __esModule: true,
    default: (props: object) => {
      if (mockMenuFails) {
        throw new Error('Failed to fetch dynamically imported module');
      }
      return <Menu {...props} />;
    },
  };
});

const layoutWith = (search: boolean) => (
  <FeaturesProvider value={{ ...FEATURE_DEFAULTS, search }}>
    <MainLayout>page</MainLayout>
  </FeaturesProvider>
);

describe('MainLayout', () => {
  afterEach(() => {
    mockMenuFails = false;
  });

  it('shows the search bar while the search feature is on', async () => {
    render(layoutWith(true));

    expect(screen.getByRole('main')).toHaveTextContent('page');
    expect(await screen.findByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('hides the search bar while the search feature is off', async () => {
    // Load the lazy search modules first, so their absence below comes from the flag, not from a
    // chunk that hasn't resolved yet.
    const { unmount } = render(layoutWith(true));
    await screen.findByPlaceholderText('Search');
    unmount();

    render(layoutWith(false));

    expect(screen.getByRole('main')).toHaveTextContent('page');
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
  });

  it('keeps the page when the search menu fails, and reports the error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockMenuFails = true;

    render(layoutWith(true));

    await waitFor(() =>
      expect(Monitoring.captureAndLogError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to fetch dynamically imported module' }),
        expect.anything(),
      ),
    );
    expect(screen.getByRole('main')).toHaveTextContent('page');
    expect(screen.getByText('footer')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    (console.error as jest.Mock).mockRestore();
  });
});
