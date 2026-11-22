// Prints the --project flags for a deployment environment: `bun e2e/lib/projects-cli.ts "Preview – sites"`.
import { projectsFor } from './projects';

console.log(projectsFor(process.argv[2] ?? '').map(project => `--project=${project}`).join(' '));
