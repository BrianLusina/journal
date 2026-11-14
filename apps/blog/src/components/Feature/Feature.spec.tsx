import { render, screen } from '@testing-library/react';
import { FEATURE_DEFAULTS, FeatureName } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import Feature from './Feature';

const renderWith = (name: FeatureName, enabled: boolean, fallback?: string) =>
  render(
    <FeaturesProvider value={{ ...FEATURE_DEFAULTS, [name]: enabled }}>
      <Feature name={name} fallback={fallback}>
        <p>Search bar</p>
      </Feature>
    </FeaturesProvider>,
  );

describe('Feature', () => {
  it('renders its children while the feature is on', () => {
    renderWith('search', true);

    expect(screen.getByText('Search bar')).toBeInTheDocument();
  });

  it('hides the fallback while the feature is on', () => {
    renderWith('search', true, 'Search is coming soon');

    expect(screen.getByText('Search bar')).toBeInTheDocument();
    expect(screen.queryByText('Search is coming soon')).not.toBeInTheDocument();
  });

  it('renders nothing while the feature is off', () => {
    const { container } = renderWith('search', false);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the fallback while the feature is off', () => {
    renderWith('search', false, 'Search is coming soon');

    expect(screen.queryByText('Search bar')).not.toBeInTheDocument();
    expect(screen.getByText('Search is coming soon')).toBeInTheDocument();
  });
});
