import { test, expect } from '@playwright/test';
import { resolveBaseURL, bypassHeadersFor } from './env';

test('resolveBaseURL trims and drops the trailing slash', () => {
  expect(resolveBaseURL({ E2E_BASE_URL: ' https://x.vercel.app/ ' })).toBe('https://x.vercel.app');
  expect(resolveBaseURL({})).toBeUndefined();
  expect(resolveBaseURL({ E2E_BASE_URL: '' })).toBeUndefined();
});

test('bypassHeadersFor only targets the base origin', () => {
  const base = 'https://x.vercel.app';
  expect(bypassHeadersFor('https://x.vercel.app/api/notion/posts', base, 's3cret')).toEqual({
    'x-vercel-protection-bypass': 's3cret',
    'x-vercel-set-bypass-cookie': 'true',
  });
  expect(bypassHeadersFor('https://images.ctfassets.net/a.jpg', base, 's3cret')).toEqual({});
  expect(bypassHeadersFor('https://x.vercel.app.evil.com/', base, 's3cret')).toEqual({});
  expect(bypassHeadersFor('https://x.vercel.app/', base, undefined)).toEqual({});
  expect(bypassHeadersFor('https://x.vercel.app/', base, '')).toEqual({});
});
