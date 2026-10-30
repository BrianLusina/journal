import type { VercelResponse } from '@vercel/node';
import vercelConfig from '../vercel.json';
import { getLimit, getParam, methodNotAllowed } from './_routes';

describe('vercel.json rewrites', () => {
  // Vercel tries user rewrites before the routes of dynamic functions such as
  // api/notion/posts/[slug].ts, so a rewrite that matches /api/... serves index.html in their place.
  it.each(['/api/contentful/posts/hello', '/api/notion/posts/hello'])('leave %s to its function', path => {
    vercelConfig.rewrites.forEach(({ source }) => {
      expect(new RegExp(`^${source}$`).test(path)).toBe(false);
    });
  });

  it('still send every page to the app', () => {
    expect(vercelConfig.rewrites.some(({ source }) => new RegExp(`^${source}$`).test('/article/1/hello'))).toBe(true);
  });
});

describe('getLimit', () => {
  it.each([
    [undefined, 100],
    ['abc', 100],
    ['10', 10],
    ['2.9', 2],
    ['0', 1],
    ['-5', 1],
    ['500', 100],
  ])('turns %p into %p', (value, expected) => {
    expect(getLimit(value)).toBe(expected);
  });
});

describe('getParam', () => {
  it.each([
    ['cursor-1', 'cursor-1'],
    ['', undefined],
    [undefined, undefined],
    [['a', 'b'], undefined],
  ])('turns %p into %p', (value, expected) => {
    expect(getParam(value)).toBe(expected);
  });
});

describe('methodNotAllowed', () => {
  it('answers 405 and names the allowed method', () => {
    const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    methodNotAllowed(res as unknown as VercelResponse);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
