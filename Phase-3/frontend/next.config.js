/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/hackaton2pages' : '';

const nextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Base path for GitHub Pages (repo name)
  basePath: basePath,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
