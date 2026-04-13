import type { NextConfig } from "next";
import path from "node:path";
import webpack from "webpack";

const medusaBackendUrl =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000";
const medusaPublishableKey =
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "";

const nextConfig: NextConfig = {
  /** Monorepo: trace shared `../web` from repo root (root + web-next lockfiles). */
  outputFileTracingRoot: path.join(__dirname, ".."),
  experimental: {
    externalDir: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;",
          },
        ],
      },
    ];
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
          VITE_MEDUSA_BACKEND_URL: medusaBackendUrl,
          VITE_MEDUSA_PUBLISHABLE_KEY: medusaPublishableKey,
          VITE_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
          VITE_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
          VITE_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
          VITE_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "",
          VITE_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        }),
      }),
    );
    return config;
  },
};

export default nextConfig;
