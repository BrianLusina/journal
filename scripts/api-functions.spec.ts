import { readdirSync } from 'fs';
import path from 'path';
import ts from 'typescript';

const apiDir = path.resolve(__dirname, '..', 'api');

// Every TypeScript file Vercel compiles for the functions: specs are only run by Jest.
const functionSources = readdirSync(apiDir, { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
  .map(file => path.join(apiDir, file));

// Vercel compiles each function with the nearest tsconfig.json above it, as TypeScript does.
const compilerOptionsFor = (source: string): ts.CompilerOptions => {
  const configPath = ts.findConfigFile(path.dirname(source), ts.sys.fileExists) as string;
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath)).options;
};

describe('Vercel functions in api/', () => {
  it('has functions to check', () => {
    expect(functionSources.length).toBeGreaterThan(0);
  });

  // Node loads the emitted .js as CommonJS (package.json has no "type": "module"), and only Node
  // resolution finds the functions' dependencies in node_modules.
  it.each(functionSources.map(source => [path.relative(apiDir, source), source]))(
    'compiles %s to CommonJS with Node module resolution',
    (_, source) => {
      const options = compilerOptionsFor(source);

      expect(options.module).toBe(ts.ModuleKind.CommonJS);
      expect(options.moduleResolution).toBe(ts.ModuleResolutionKind.Node10);
    },
  );
});
