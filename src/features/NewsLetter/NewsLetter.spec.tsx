import { render, screen } from '@testUtils/rtlUtils';
import NewsLetterSection from './NewsLetter';

describe('NewsLetterSection', () => {
  // There is no newsletter provider yet, so a signup form would discard what readers enter.
  it('renders no signup form until a provider is wired up', () => {
    const { container } = render(<NewsLetterSection />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
