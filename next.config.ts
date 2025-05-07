import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',  // Enable static exports
  basePath: '/rad-report', // Base path for GitHub Pages
  assetPrefix: '/rad-report/',
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
