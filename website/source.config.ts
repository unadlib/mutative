import { defineConfig } from 'fumadocs-mdx/config';

export default defineConfig({
  mdxOptions: {
    remarkNpmOptions: {
      // Keep the chosen package manager across pages, as npm2yarn did.
      persist: {
        id: 'package-manager',
      },
    },
  },
});
