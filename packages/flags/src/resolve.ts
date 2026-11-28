import { parseFlagList } from './parse';

/** How long a provider may take before it's skipped. */
export const FLAG_PROVIDER_TIMEOUT_MS = 300;

/** A source of flag values. It may name only some flags; the next provider fills in the rest. */
export type FlagProvider = {
  name: string;
  read(): Promise<Partial<Record<string, boolean>>>;
};

/** Flags from a list in an environment variable (the blog's VITE_FEATURES syntax). */
export function envProvider(raw: string | undefined, names: readonly string[], warn?: (message: string) => void): FlagProvider {
  return { name: 'env', read: async () => parseFlagList(raw, names, warn) };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Every flag's value: from the first provider (highest priority first) that names it, else its
 * default. A provider that throws or takes longer than the timeout is skipped, so a flag service
 * outage never breaks a page.
 */
export async function resolveFlags<N extends string>(
  defaults: Record<N, boolean>,
  providers: FlagProvider[],
  options: { timeoutMs?: number } = {},
): Promise<Record<N, boolean>> {
  const timeoutMs = options.timeoutMs ?? FLAG_PROVIDER_TIMEOUT_MS;
  const answers = await Promise.all(
    providers.map(provider =>
      withTimeout(provider.read(), timeoutMs).catch((error): Partial<Record<string, boolean>> => {
        console.warn(`Flags: skipping the ${provider.name} provider`, error);
        return {};
      }),
    ),
  );
  const flags = { ...defaults };
  for (const name of Object.keys(defaults) as N[]) {
    const answer = answers.find(values => typeof values[name] === 'boolean');
    if (answer) flags[name] = answer[name] as boolean;
  }
  return flags;
}
