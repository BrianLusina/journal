import path from 'node:path';
import preset, { uiContent, uiContentWithoutConsent } from './tailwind-preset';

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
    const [files] = uiContent;
    expect(path.isAbsolute(files)).toBe(true);
    expect(files.endsWith(path.join('src', '**', '*.{ts,tsx}'))).toBe(true);
  });

  // The blog doesn't render the consent banner until it adopts it after cutover, so its CSS must not
  // gain the banner's classes; apps/sites uses the whole of uiContent.
  it('offers the blog the same files without the consent banner', () => {
    expect(uiContentWithoutConsent).toEqual([...uiContent, `!${path.join(__dirname, 'src', 'consent', '**')}`]);
    expect(uiContent.some(glob => glob.startsWith('!'))).toBe(false);
  });
});
