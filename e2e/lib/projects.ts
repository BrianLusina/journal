/**
 * The Playwright projects for a deployment, from its GitHub deployment environment, which Vercel
 * names "<Preview|Production> – <project>" once more than one project deploys the repository, and
 * just "Preview" or "Production" while the journal is the only one. The journal project is the
 * blog; yggdrasil (apps/sites) serves home and folio. An unknown name throws, so a new project fails CI instead of
 * being silently untested.
 */
export function projectsFor(environment: string): string[] {
  const name = environment.trim();
  if (/^(preview|production)$/i.test(name) || /(^|\s)journal$/i.test(name)) return ['lib', 'setup', 'blog'];
  if (/(^|\s)yggdrasil$/i.test(name)) return ['lib', 'home', 'folio'];
  throw new Error(`Unknown deployment environment: ${environment}`);
}
