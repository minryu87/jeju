/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  // GitHub Pages 배포를 위한 설정
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['cdnjs.cloudflare.com']
  },
  // GitHub Pages 배포를 위한 basePath 설정
  basePath: '/jeju',
  assetPrefix: '/jeju'
};

module.exports = nextConfig;