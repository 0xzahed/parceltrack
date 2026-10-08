import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Live parcel statuses — never serve cached API responses. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
