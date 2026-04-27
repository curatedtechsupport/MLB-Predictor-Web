/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional: rewrite /api/proxy/* → backend so we never need CORS in dev.
  // Uncomment if you'd rather proxy than hit the Railway URL directly.
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/proxy/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/:path*`,
  //     },
  //   ];
  // },
};

export default nextConfig;
