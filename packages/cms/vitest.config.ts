import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // The specs moved from apps/blog use Vitest's globals, as the blog does.
    globals: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/__fixtures__.ts'],
      reporter: ['clover', 'json', 'lcov', 'text'],
      thresholds: { lines: 85, statements: 85 },
    },
  },
});
