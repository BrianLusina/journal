import { fireEvent, render, screen } from '@testing-library/react';
import { ConsentBanner } from './ConsentBanner';

describe('ConsentBanner', () => {
  let cookie: string;
  let written: string[];

  beforeEach(() => {
    cookie = '';
    written = [];
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookie,
      set: (value: string) => written.push(value),
    });
  });

  it('asks for consent when there is no choice yet, with a link to the privacy page', () => {
    render(<ConsentBanner onGrant={vi.fn()} />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'privacy' })).toHaveAttribute('href', '/privacy');
  });

  it('remembers an accept, grants once, and goes away', () => {
    const onGrant = vi.fn();
    render(<ConsentBanner onGrant={onGrant} />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(written.at(-1)).toMatch(/^consent=granted;/);
    expect(onGrant).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('remembers a decline, grants nothing, and goes away', () => {
    const onGrant = vi.fn();
    render(<ConsentBanner onGrant={onGrant} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

    expect(written.at(-1)).toMatch(/^consent=denied;/);
    expect(onGrant).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('grants on load, without asking, when the reader accepted before', () => {
    cookie = 'consent=granted';
    const onGrant = vi.fn();
    render(<ConsentBanner onGrant={onGrant} />);

    expect(onGrant).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('stays away, granting nothing, when the reader declined before', () => {
    cookie = 'consent=denied';
    const onGrant = vi.fn();
    render(<ConsentBanner onGrant={onGrant} />);

    expect(onGrant).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('asks again when the saved choice is unreadable', () => {
    cookie = 'consent=granted; consent=denied';
    const onGrant = vi.fn();
    render(<ConsentBanner onGrant={onGrant} privacyHref="/legal/privacy" />);

    expect(onGrant).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'privacy' })).toHaveAttribute('href', '/legal/privacy');
  });
});
