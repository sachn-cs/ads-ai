import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@strands-agents/sdk', 'better-sqlite3'],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  logging: {
    fetches: { fullUrl: false },
  },
};

export default config;
