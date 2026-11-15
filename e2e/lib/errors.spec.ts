import { test, expect } from '@playwright/test';
import { isExpectedFailure, isFirstPartyFailure, isRelevantConsoleError } from './errors';

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

test('a CMS answering 404 for a slug it does not have is expected', () => {
  const sourceUrl = 'https://b.com/api/notion/posts/perspective';
  expect(isExpectedFailure(sourceUrl, 404)).toBe(true);
  expect(
    isRelevantConsoleError(
      { text: 'Failed to load resource: the server responded with a status of 404 ()', sourceUrl, pathname: '/article/x/perspective' },
      base,
    ),
  ).toBe(false);
  // A listing route answering 404 is not expected.
  expect(isExpectedFailure('https://b.com/api/notion/posts?limit=10', 404)).toBe(false);
});

test('known defects are tolerated only for their own URL and status', () => {
  const related = 'https://b.com/api/notion/posts?limit=10&category=Life';
  expect(isExpectedFailure(related, 502)).toBe(true);
  expect(isExpectedFailure(related, 500)).toBe(false);
  expect(isExpectedFailure('https://b.com/api/contentful/posts?limit=10&category=Life', 502)).toBe(false);
  expect(
    isRelevantConsoleError(
      { text: 'Failed to load resource: the server responded with a status of 502 ()', sourceUrl: related, pathname: '/article/x/y' },
      base,
    ),
  ).toBe(false);
});
