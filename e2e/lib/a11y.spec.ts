import { test, expect } from '@playwright/test';
import { newViolations } from './a11y';

test('newViolations reports only rules missing from the baseline', () => {
  expect(newViolations(['color-contrast'], ['color-contrast', 'image-alt', 'image-alt'])).toEqual(['image-alt']);
  expect(newViolations(['color-contrast', 'region'], ['region'])).toEqual([]);
});
