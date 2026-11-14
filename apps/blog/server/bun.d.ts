/**
 * The Bun APIs the server uses, declared here rather than installing @types/bun for the few it calls.
 * See https://bun.sh/docs/api/http and https://bun.sh/docs/bundler.
 */
interface BunServer {
  port: number;
  requestIP(request: Request): { address: string } | null;
}

declare const Bun: {
  serve(options: {
    port: number;
    idleTimeout?: number;
    fetch(request: Request, server: BunServer): Promise<Response>;
  }): BunServer;
  file(path: string): Blob;
  build(options: {
    entrypoints: string[];
    outdir: string;
    root?: string;
    target: 'bun';
  }): Promise<{ success: boolean; logs: unknown[] }>;
};
