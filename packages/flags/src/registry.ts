/** Where a flag applies. */
export type FlagSite = 'blog' | 'home' | 'folio';

export type FlagDefinition = {
  /** The value when no provider names the flag. A new, unfinished feature defaults to false. */
  default: boolean;
  description: string;
  sites: ReadonlyArray<FlagSite>;
};

/** Declares a flag registry; its keys are the flag names, checked by TypeScript. */
export function defineFlags<T extends Record<string, FlagDefinition>>(flags: T): T {
  return flags;
}
