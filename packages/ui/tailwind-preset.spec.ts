import path from 'node:path';
import preset, { uiContent } from './tailwind-preset';

describe('the Tailwind preset', () => {
  it('switches dark mode on the dark class, as the theme scripts set it', () => {
    expect(preset.darkMode).toEqual(['class']);
  });

  it('maps the design tokens onto the CSS variables in styles.css', () => {
    const extend = preset.theme?.extend as Record<string, Record<string, unknown>>;

    expect(extend.colors.background).toBe('hsl(var(--background))');
    expect((extend.fontFamily.serif as string[])[0]).toBe('Merriweather');
    expect(extend.borderRadius.lg).toBe('var(--radius)');
  });

  it('brings the animation plugin', () => {
    expect(preset.plugins).toHaveLength(1);
  });

  it("names the package's own files for every app's content, wherever the app is", () => {
    expect(uiContent.length).toBeGreaterThan(0);
    for (const glob of uiContent) {
      expect(path.isAbsolute(glob)).toBe(true);
      expect(glob.endsWith(path.join('src', '**', '*.{ts,tsx}'))).toBe(true);
    }
  });
});
