import { render, screen } from '@testUtils/rtlUtils';
import NewsLetterCTA from './NewsLetterCTA';

describe('NewsLetterCTA', () => {
  // There is no newsletter provider yet, so a signup form would discard what readers enter.
  it('renders no signup form until a provider is wired up', () => {
    const { container } = render(<NewsLetterCTA />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
