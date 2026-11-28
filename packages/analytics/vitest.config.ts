import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts'],
      reporter: ['clover', 'json', 'lcov', 'text'],
      thresholds: { lines: 85, statements: 85 },
    },
  },
});
