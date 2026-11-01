import { render, screen } from '@testing-library/react';
import faker from 'faker';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import Footer from './Footer';

describe('Footer', () => {
  it('should be able to render with default props', () => {
    render(<Footer />);
  });

  it('should render with provided title', () => {
    const title = faker.lorem.word();
    render(<Footer title={title} />);
  });

  it('does not link to the old lifestyle sections, whatever features are on', () => {
    const allOn = Object.fromEntries(Object.keys(FEATURE_DEFAULTS).map(name => [name, true]));

    render(
      <FeaturesProvider value={{ ...FEATURE_DEFAULTS, ...allOn }}>
        <Footer />
      </FeaturesProvider>,
    );

    for (const href of ['/wellness', '/travel', '/creativity', '/growth']) {
      expect(document.querySelector(`a[href="${href}"]`)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('heading', { name: 'Explore' })).not.toBeInTheDocument();
  });
});
