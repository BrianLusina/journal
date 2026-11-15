import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const BASELINE_DIR = path.resolve(__dirname, '..', 'baseline');

/** Whether this run records baselines (`E2E_RECORD=1`) instead of comparing against them. */
export function isRecording(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.E2E_RECORD === '1';
}

/** Reads `e2e/baseline/<name>.json`, or returns `fallback` when it hasn't been recorded yet. */
export function readBaseline<T>(name: string, fallback: T): T {
  const file = path.join(BASELINE_DIR, `${name}.json`);

  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback;
}

/** Writes `e2e/baseline/<name>.json`. The caller sorts the data so diffs stay small. */
export function writeBaseline(name: string, data: unknown): void {
  mkdirSync(BASELINE_DIR, { recursive: true });
  writeFileSync(path.join(BASELINE_DIR, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
}
