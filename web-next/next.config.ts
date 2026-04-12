import type { NextConfig } from "next";
import path from "node:path";
import webpack from "webpack";

const nextConfig: NextConfig = {
  /** Monorepo: one lockfile at repo root + web-next; trace shared `../web` from repo root. */
  outputFileTracingRoot: path.join(__dirname, ".."),
  experimental: {
    externalDir: true,
  },
  webpack: (config, { isServer }) => {
    const reactRoot = path.resolve(__dirname, "node_modules/react");
    const reactDomRoot = path.resolve(__dirname, "node_modules/react-dom");
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
      /** Client only: dedupe `../web` vs `web-next` so shared Context (UiLocaleProvider) works. */
      ...(!isServer
        ? {
            react: reactRoot,
            "react-dom": reactDomRoot,
          }
        : {}),
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
