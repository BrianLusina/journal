import { parseFlagList } from './parse';

// The blog's VITE_FEATURES semantics (apps/blog/src/config/features.spec.ts), moved as they were.
const NAMES = ['search', 'newsletter', 'notion'] as const;

describe('parseFlagList', () => {
  const warn = vi.fn();

  it.each([undefined, '', ' , '])('names no flag when the list is %p', raw => {
    expect(parseFlagList(raw, NAMES, warn)).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['on', true],
    ['true', true],
    ['1', true],
    ['ON', true],
    ['off', false],
    ['false', false],
    ['0', false],
    ['Off', false],
  ])('reads %p as %p', (value, enabled) => {
    expect(parseFlagList(`search=${value}`, NAMES, warn)).toEqual({ search: enabled });
  });

  it('turns a bare name on', () => {
    expect(parseFlagList('search', NAMES, warn)).toEqual({ search: true });
  });

  it('reads several entries, spaces around them ignored', () => {
    expect(parseFlagList(' search = on , notion=off ', NAMES, warn)).toEqual({ search: true, notion: false });
  });

  it('lets a later entry win', () => {
    expect(parseFlagList('search=on,search=off', NAMES, warn)).toEqual({ search: false });
  });

  it.each(['serch=on', 'search=maybe', 'search=on=off', '=on', 'toString=on', 'search=constructor'])(
    'skips %p, reports it, and still reads the valid entries',
    entry => {
      expect(parseFlagList(`${entry},notion=off`, NAMES, warn)).toEqual({ notion: false });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(entry));
    },
  );

  it('skips silently without a warn function', () => {
    expect(parseFlagList('serch=on', NAMES)).toEqual({});
  });
});
