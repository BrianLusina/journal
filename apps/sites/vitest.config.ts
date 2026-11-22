import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/env.d.ts', 'src/pages/**'],
      reporter: ['clover', 'json', 'lcov', 'text'],
      thresholds: { lines: 85, statements: 85 },
    },
  },
});
