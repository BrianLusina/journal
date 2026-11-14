import { ComponentType } from 'react';
import type { Decorator } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preview from '../../../.storybook/preview';
import { DefaultNavbar } from './Navbar.stories';

// Wraps the story in the Storybook preview's decorators, later ones outermost, as Storybook does.
// The decorators ignore the story context, so none is passed.
const withPreviewDecorators = (Story: ComponentType) =>
  (preview.decorators as Decorator[]).reduce<ComponentType>(
    (Inner, decorator) => () => decorator(Inner as never, {} as never),
    Story,
  );

describe('Navbar story', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('class');
    document.documentElement.removeAttribute('style');
  });

  it('switches the theme when the toggle is clicked', async () => {
    const Story = withPreviewDecorators(() => <DefaultNavbar {...DefaultNavbar.args} />);
    render(<Story />);

    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(document.documentElement).toHaveClass('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
