import { render, screen } from '@testing-library/react';
import MarkdownComponents from './Markdown';

describe('MarkdownComponents', () => {
  it.each(['h1', 'h2', 'h3', 'ul', 'ol'] as const)('renders %s with the design-system styles', tag => {
    const Component = MarkdownComponents[tag] as React.ComponentType<Record<string, unknown>>;

    const { container } = render(<Component node={{}}>content</Component>);

    const element = container.querySelector(tag);
    expect(element).toHaveTextContent('content');
    expect(element?.className).not.toBe('');
  });

  it('wraps paragraphs and drops the markdown node prop', () => {
    const Paragraph = MarkdownComponents.p as React.ComponentType<Record<string, unknown>>;

    const { container } = render(<Paragraph node={{ type: 'element' }}>text</Paragraph>);

    expect(container.querySelector('div > p')).toHaveTextContent('text');
    expect(container.querySelector('p')).not.toHaveAttribute('node');
  });

  it('renders blockquotes with the Blockquote component', () => {
    const Quote = MarkdownComponents.blockquote as React.ComponentType<Record<string, unknown>>;

    render(<Quote node={{}}>Be curious.</Quote>);

    expect(screen.getByText('Be curious.')).toBeInTheDocument();
  });
});
