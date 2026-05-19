import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/cards/:name.png",
        destination: "/cards/art/:name.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
