/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Real product photos: local files in /public need no config. For remote photos,
  // add the host here (only hosts you are licensed to use), e.g.
  // images: { remotePatterns: [{ protocol: "https", hostname: "cdn.yourbrand.com" }] }
  images: { remotePatterns: [] },
};
export default nextConfig;
