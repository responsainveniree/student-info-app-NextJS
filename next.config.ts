import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/forgot-password",
        destination: "/", // or just '/'
        permanent: false, // Use false (307) so search engines don't cache it forever
      },
      {
        source: "/reset-password",
        destination: "/", // or just '/'
        permanent: false, // Use false (307) so search engines don't cache it forever
      },
      {
        source: "/api/auth/forgot-password/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/api/auth/reset-password/:path*",
        destination: "/404",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
