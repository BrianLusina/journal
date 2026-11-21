import { loadRegistry } from './registry';

/** This deployment's registry, loaded once per server instance. */
export const registry = loadRegistry(process.env);
