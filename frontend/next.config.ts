import type { NextConfig } from "next";

// Get basePath from environment variable (set by GitHub Actions)
// If BASE_PATH is not set, use empty string (for local development)
const basePath = process.env.BASE_PATH || "";

// Check if we're in static export mode (GitHub Pages)
const isStaticExport = process.env.NODE_ENV === "production" && process.env.GITHUB_ACTIONS;

const nextConfig: NextConfig = {
  basePath: basePath,
  assetPrefix: basePath,
  output: isStaticExport ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore @fhevm/mock-utils in production builds
    // This module is only used for local development with Hardhat
    // The mock file uses dynamic import, but Next.js still tries to resolve it during build
    const webpack = require("webpack");
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@fhevm\/mock-utils$/,
      })
    );
    return config;
  },
  // Headers are not supported in static export mode
  // Only include headers for non-static builds
  ...(isStaticExport
    ? {}
    : {
        headers() {
          return Promise.resolve([
            {
              source: '/:path*',
              headers: [
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
              ],
            },
            {
              source: '/:path*.wasm',
              headers: [
                { key: 'Content-Type', value: 'application/wasm' },
                { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
              ],
            },
          ]);
        },
      }),
};

export default nextConfig;

