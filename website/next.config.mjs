import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  // GitHub Pages serves `/docs/intro/` from `docs/intro/index.html`.
  trailingSlash: true,
  reactStrictMode: true,
  // Multiple root layouts need one shared 404 for the static host.
  experimental: { globalNotFound: true },
  images: {
    unoptimized: true,
  },
};

export default withMDX(config);
