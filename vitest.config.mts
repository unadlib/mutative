import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    globals: true,
    include: ['test/**/*.test.ts', 'test/**/__tests__/**/*.ts'],
    coverage: {
      include: ['src/**'],
      reporter: ['clover', 'json', 'lcov', 'text'],
    },
  },
});
