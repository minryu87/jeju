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
  // GitHub Pages 서브패스 설정 (필요시)
  basePath: process.env.NODE_ENV === 'production' ? '/jeju' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/jeju' : ''
};

module.exports = nextConfig;