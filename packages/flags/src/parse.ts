const VALUES = new Map([
  ['on', true],
  ['true', true],
  ['1', true],
  ['off', false],
  ['false', false],
  ['0', false],
]);

/**
 * The flags a comma-separated list such as "search=on,newsletter=off" names. A value is on/off,
 * true/false or 1/0 (any case), and a bare name means on. An unknown name, an unknown value or a
 * malformed entry is skipped and passed to `warn`, so a typo never breaks a page.
 */
export function parseFlagList<N extends string>(
  raw: string | undefined,
  names: readonly N[],
  warn?: (message: string) => void,
): Partial<Record<N, boolean>> {
  const known = new Set<string>(names);
  const flags: Partial<Record<N, boolean>> = {};
  for (const entry of (raw ?? '').split(',')) {
    if (!entry.trim()) continue;
    const [name, value = 'on', ...rest] = entry.split('=').map(part => part.trim());
    const enabled = VALUES.get(value.toLowerCase());
    if (!known.has(name) || enabled === undefined || rest.length > 0) {
      warn?.(`ignoring "${entry.trim()}"`);
      continue;
    }
    flags[name as N] = enabled;
  }
  return flags;
}
