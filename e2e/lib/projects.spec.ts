import { test, expect } from '@playwright/test';
import { projectsFor } from './projects';

// Both Vercel projects send deployment_status events to the same workflow; each deployment runs
// only its own app's projects (blog parity on a sites preview, or the reverse, fails for nothing).
test.describe('projectsFor', () => {
  // A bare name ("Preview", seen on this repo's deployments) is the journal: Vercel adds the " – <project>"
  // suffix only once more than one project deploys the repository.
  for (const environment of ['Preview', 'Production', 'Preview – journal', 'Production – journal', 'journal']) {
    test(`runs the blog projects for ${environment}`, () => {
      expect(projectsFor(environment)).toEqual(['lib', 'setup', 'blog']);
    });
  }

  for (const environment of ['Preview – yggdrasil', 'Production – yggdrasil', 'yggdrasil']) {
    test(`runs the site projects for ${environment}`, () => {
      expect(projectsFor(environment)).toEqual(['lib', 'home', 'folio']);
    });
  }

  test('treats only Preview and Production as bare journal names', () => {
    expect(() => projectsFor('Staging')).toThrow('Unknown deployment environment: Staging');
  });

  test('fails loudly for a deployment it does not know, rather than run nothing', () => {
    expect(() => projectsFor('Preview – other')).toThrow('Unknown deployment environment: Preview – other');
  });
});
