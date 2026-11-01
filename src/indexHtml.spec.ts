import { readFileSync } from 'fs';
import { join } from 'path';

describe('index.html', () => {
  it('describes the site as technology writing, not lifestyle', () => {
    const html = new DOMParser().parseFromString(readFileSync(join(__dirname, '..', 'index.html'), 'utf8'), 'text/html');
    const description = html.querySelector('meta[name="description"]')?.getAttribute('content');

    expect(description).toMatch(/engineering/i);
    expect(description).not.toMatch(/wellness|travel|lifestyle|personal growth/i);
  });
});
