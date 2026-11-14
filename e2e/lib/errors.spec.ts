import { test, expect } from '@playwright/test';
import { isFirstPartyFailure, isRelevantConsoleError } from './errors';

const base = 'https://b.com';

test('isFirstPartyFailure only counts requests to the base origin', () => {
  expect(isFirstPartyFailure('https://b.com/api/x', base)).toBe(true);
  expect(isFirstPartyFailure('https://www.googletagmanager.com/gtag/js', base)).toBe(false);
  expect(isFirstPartyFailure('not a url', base)).toBe(false);
});

test('isRelevantConsoleError ignores errors raised by third-party resources', () => {
  const error = {
    text: 'Failed to load resource: net::ERR_FAILED',
    sourceUrl: 'https://images.ctfassets.net/x.jpg',
    pathname: '/',
  };
  expect(isRelevantConsoleError(error, base)).toBe(false);
});

test('isRelevantConsoleError allows the 404 message only on 404 pages', () => {
  const text = '404 Error: User attempted to access non-existent route: /404';
  const sourceUrl = 'https://b.com/assets/index.js';
  expect(isRelevantConsoleError({ text, sourceUrl, pathname: '/404' }, base)).toBe(false);
  expect(isRelevantConsoleError({ text, sourceUrl, pathname: '/about' }, base)).toBe(true);
});

test('isRelevantConsoleError counts first-party errors without a source', () => {
  expect(isRelevantConsoleError({ text: 'TypeError: x is undefined', sourceUrl: '', pathname: '/' }, base)).toBe(true);
});
