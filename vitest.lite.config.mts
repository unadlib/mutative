import { defineConfig, mergeConfig } from 'vitest/config';
import config from './vitest.config.mts';

// The test suite with the constants of `mutative/lite`: no Map and Set drafts,
// no patch generation and no native array methods. `pnpm test:lite` runs it
// and checks that every test passes or fails with an error of the lite build.
export default mergeConfig(
  config,
  defineConfig({
    define: {
      __MAP_SET__: false,
      __PATCHES__: false,
      __ARRAY_METHODS__: false,
    },
  })
);
