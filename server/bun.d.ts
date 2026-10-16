/**
 * The Bun APIs the server uses, declared here rather than installing @types/bun for three calls.
 * See https://bun.sh/docs/api/http and https://bun.sh/docs/bundler.
 */
declare const Bun: {
  serve(options: {
    port: number;
    idleTimeout?: number;
    fetch(request: Request): Promise<Response>;
  }): { port: number };
  file(path: string): Blob;
  build(options: {
    entrypoints: string[];
    outdir: string;
    root?: string;
    target: 'bun';
  }): Promise<{ success: boolean; logs: unknown[] }>;
};
