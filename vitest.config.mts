import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: true,
    __MAP_SET__: true,
    __PATCHES__: true,
    __ARRAY_METHODS__: true,
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
