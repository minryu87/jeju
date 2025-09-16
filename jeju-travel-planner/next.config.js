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
  // GitHub Pages에서는 basePath가 자동으로 처리되므로 빈 값으로 설정
  basePath: '',
  assetPrefix: ''
};

module.exports = nextConfig;