import { test, expect } from '@playwright/test';
import { missingPaths } from './inventory';

test('missingPaths ignores newly published posts', () => {
  expect(missingPaths(['/article/a/x'], ['/article/a/x', '/article/b/new'])).toEqual([]);
});

test('missingPaths reports posts that disappeared, in baseline order', () => {
  expect(missingPaths(['/article/a/x', '/article/b/y', '/article/c/z'], ['/article/b/y'])).toEqual([
    '/article/a/x',
    '/article/c/z',
  ]);
});
