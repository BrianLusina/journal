/** axe rule ids in `actual` that the baseline doesn't already record, sorted and unique. */
export function newViolations(baseline: readonly string[], actual: readonly string[]): string[] {
  const known = new Set(baseline);

  return [...new Set(actual.filter(rule => !known.has(rule)))].sort();
}
