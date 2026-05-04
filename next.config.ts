import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'export',
  basePath: '/helm', // IMPORTANT for GitHub Pages
  assetPrefix: '/helm/',
  trailingSlash: true,
};

export default nextConfig;
