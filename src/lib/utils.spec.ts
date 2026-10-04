import { cn, getCategoryClass } from './utils';

describe('cn', () => {
  it('joins classes and lets later Tailwind classes win', () => {
    const hidden = false;

    expect(cn('px-2', hidden && 'hidden', 'px-4')).toBe('px-4');
  });
});

describe('getCategoryClass', () => {
  it.each([
    ['Personal Finance', 'tag-financing'],
    ['Lifestyle', 'tag-lifestyle'],
    ['Community', 'tag-community'],
    ['WELLNESS', 'tag-wellness'],
    ['Travel', 'tag-travel'],
    ['Creativity', 'tag-creativity'],
    ['Growth', 'tag-growth'],
    ['Anything else', 'tag-lifestyle'],
  ])('maps %s to %s', (category, expected) => {
    expect(getCategoryClass(category)).toBe(expected);
  });
});
