import type { NextConfig } from "next";
import path from "node:path";
import webpack from "webpack";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-router-dom": path.resolve(__dirname, "src/lib/react-router-dom-shim.tsx"),
      "react-helmet-async": path.resolve(__dirname, "src/lib/react-helmet-async-shim.tsx"),
    };
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        "import.meta.env": JSON.stringify({
          VITE_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
          VITE_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          VITE_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
          VITE_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
          VITE_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
          VITE_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "",
        }),
      }),
    );
    return config;
  },
};

export default nextConfig;
