import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /** Monorepo root: include `medusa-backend` etc. when tracing serverless bundles. */
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
      /** Client only: single React instance for storefront + App Router. */
      ...(!isServer
        ? {
            react: reactRoot,
            "react-dom": reactDomRoot,
          }
        : {}),
      "react-router-dom": path.resolve(__dirname, "src/lib/react-router-dom-shim.tsx"),
      "react-helmet-async": path.resolve(__dirname, "src/lib/react-helmet-async-shim.tsx"),
    };
    return config;
  },
};

export default nextConfig;
