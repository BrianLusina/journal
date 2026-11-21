import { test, expect } from '@playwright/test';
import { projectsFor } from './projects';

// Both Vercel projects send deployment_status events to the same workflow; each deployment runs
// only its own app's projects (blog parity on a sites preview, or the reverse, fails for nothing).
test.describe('projectsFor', () => {
  for (const environment of ['Preview – journal', 'Production – journal', 'journal']) {
    test(`runs the blog projects for ${environment}`, () => {
      expect(projectsFor(environment)).toEqual(['lib', 'setup', 'blog']);
    });
  }

  for (const environment of ['Preview – sites', 'Production – sites']) {
    test(`runs the site projects for ${environment}`, () => {
      expect(projectsFor(environment)).toEqual(['lib', 'home', 'folio']);
    });
  }

  test('fails loudly for a deployment it does not know, rather than run nothing', () => {
    expect(() => projectsFor('Preview – other')).toThrow('Unknown deployment environment: Preview – other');
  });
});
