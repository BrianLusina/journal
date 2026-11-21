import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    mockReset: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'tailwind-preset.ts'],
      exclude: ['**/*.spec.{ts,tsx}', '**/*.stories.{ts,tsx}'],
      reporter: ['clover', 'json', 'lcov', 'text'],
      thresholds: { lines: 85, statements: 85 },
    },
  },
});
