import fileConfig from '../../sites.config.json';

export const SITE_IDS = ['home', 'folio'] as const;
export type SiteId = (typeof SITE_IDS)[number];
/** Anything a page can link to: a site this app serves, or the blog. */
export type LinkTarget = SiteId | 'blog';
export type EnvName = 'production' | 'staging' | 'development';

export const ENV_NAMES: EnvName[] = ['production', 'staging', 'development'];
const LINK_TARGETS: LinkTarget[] = [...SITE_IDS, 'blog'];

/**
 * Every site's host in every environment, plus hosts that redirect to another (www → apex). Hosts
 * carry a port where they need one (localhost:4321).
 */
export type RegistryConfig = {
  environments: Record<EnvName, Record<LinkTarget, string>>;
  redirects: Record<string, string>;
};

const isHostMap = (value: unknown): value is Record<LinkTarget, string> =>
  typeof value === 'object' &&
  value !== null &&
  LINK_TARGETS.every(target => typeof (value as Record<string, unknown>)[target] === 'string');

function validate(value: unknown): RegistryConfig {
  const config = value as Partial<RegistryConfig> | null;
  const environments = config?.environments as Record<string, unknown> | undefined;
  if (!environments || !ENV_NAMES.every(name => isHostMap(environments[name]))) {
    throw new Error(`Invalid SITES_CONFIG: every environment (${ENV_NAMES.join(', ')}) needs a host for ${LINK_TARGETS.join(', ')}`);
  }
  const redirects = config?.redirects as unknown;
  if (
    typeof redirects !== 'object' ||
    redirects === null ||
    Array.isArray(redirects) ||
    !Object.values(redirects).every(target => typeof target === 'string')
  ) {
    throw new Error('Invalid SITES_CONFIG: redirects must map each host to a host');
  }
  // Requests are compared normalized, so the configured hosts are too.
  const normalizeMap = (hosts: Record<string, string>) =>
    Object.fromEntries(Object.entries(hosts).map(([key, host]) => [key, normalizeHost(host)]));
  return {
    environments: Object.fromEntries(
      ENV_NAMES.map(name => [name, normalizeMap(environments[name] as Record<string, string>)]),
    ) as RegistryConfig['environments'],
    redirects: Object.fromEntries(
      Object.entries(redirects as Record<string, string>).map(([from, to]) => [normalizeHost(from), to]),
    ),
  };
}

/**
 * The registry for this deployment. SITES_CONFIG (the same JSON shape as sites.config.json)
 * replaces the file entirely, so the same build serves other hosts, such as a Docker deployment.
 */
export function loadRegistry(env: Record<string, string | undefined>): RegistryConfig {
  if (env.SITES_CONFIG === undefined) return validate(fileConfig);
  let parsed: unknown;
  try {
    parsed = JSON.parse(env.SITES_CONFIG);
  } catch {
    throw new Error('Invalid SITES_CONFIG: not JSON');
  }
  return validate(parsed);
}

/** A Host header as the registry spells hosts: lowercase, no trailing dot, no default port. */
export function normalizeHost(host: string): string {
  const [name, port] = host.trim().toLowerCase().split(':');
  const hostname = name.replace(/\.$/, '');
  return port && port !== '443' && port !== '80' ? `${hostname}:${port}` : hostname;
}
