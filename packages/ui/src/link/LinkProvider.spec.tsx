import { render, screen } from '@testing-library/react';
import { Link, LinkProvider, type LinkProps } from './LinkProvider';

describe('Link', () => {
  it('renders an anchor with the href when no provider is given', () => {
    render(<Link href="/a">x</Link>);

    expect(screen.getByRole('link', { name: 'x' })).toHaveAttribute('href', '/a');
  });

  it('renders the provided component with every prop', () => {
    const received: LinkProps[] = [];
    const Stub = (props: LinkProps) => {
      received.push(props);
      return <a href={props.href}>{props.children}</a>;
    };
    const onClick = vi.fn();

    render(
      <LinkProvider component={Stub}>
        <Link href="/b" className="c" onClick={onClick} aria-label="label">
          y
        </Link>
      </LinkProvider>,
    );

    expect(screen.getByRole('link', { name: 'y' })).toHaveAttribute('href', '/b');
    expect(received[0]).toEqual({ href: '/b', className: 'c', onClick, 'aria-label': 'label', children: 'y' });
  });
});
