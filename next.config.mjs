/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 生成精简的独立产物（.next/standalone），用于低配服务器部署：
  // 服务器上无需 npm install / next build，只要 node server.js 即可。
  // 详见 DEPLOY.md 的「低配服务器部署」章节。
  output: 'standalone',
};

export default nextConfig;
