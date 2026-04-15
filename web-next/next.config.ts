import type { NextConfig } from "next";
import path from "node:path";

function buildImageRemotePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "9000", pathname: "/**" },
    { protocol: "https", hostname: "horo5-production.up.railway.app", pathname: "/**" },
  ];

  const medusa = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    ""
  ).trim();
  if (medusa) {
    try {
      const u = new URL(medusa);
      const protocol = u.protocol.replace(":", "") as "http" | "https";
      if (protocol === "http" || protocol === "https") {
        patterns.push({
          protocol,
          hostname: u.hostname,
          ...(u.port ? { port: u.port } : {}),
          pathname: "/**",
        });
      }
    } catch {
      // ignore invalid URL
    }
  }

  const extra = (process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS || "").trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const host = part.trim().replace(/^https?:\/\//, "").split("/")[0];
      if (!host) continue;
      const hostname = host.includes(":") ? host.split(":")[0]! : host;
      const port = host.includes(":") ? host.split(":")[1] : undefined;
      patterns.push({
        protocol: "https",
        hostname,
        ...(port ? { port } : {}),
        pathname: "/**",
      });
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
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
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
