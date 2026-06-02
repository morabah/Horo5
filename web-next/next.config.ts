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

function buildConnectSrc() {
  const sources = new Set([
    "'self'",
    "https://*.googletagmanager.com",
    "https://*.facebook.com",
    "https://*.clarity.ms",
    "https://us.i.posthog.com",
    "https://*.i.posthog.com",
  ]);
  const medusa = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    ""
  ).trim();

  const localMedusaOrigins =
    process.env.NODE_ENV === "production" ? [] : ["http://localhost:9000", "http://127.0.0.1:9000"];

  for (const raw of [medusa, ...localMedusaOrigins]) {
    if (!raw) continue;
    try {
      sources.add(new URL(raw).origin);
    } catch {
      // ignore invalid URL
    }
  }

  return Array.from(sources).join(" ");
}

function buildImgSrc() {
  const sources = new Set(["'self'", "data:", "blob:", "https:"]);
  const medusa = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    ""
  ).trim();

  const localMedusaOrigins =
    process.env.NODE_ENV === "production" ? [] : ["http://localhost:9000", "http://127.0.0.1:9000"];

  for (const raw of [medusa, ...localMedusaOrigins]) {
    if (!raw) continue;
    try {
      sources.add(new URL(raw).origin);
    } catch {
      // ignore invalid URL
    }
  }

  return Array.from(sources).join(" ");
}

const connectSrc = buildConnectSrc();
const imgSrc = buildImgSrc();

const nextConfig: NextConfig = {
  devIndicators: false,
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
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms; " +
              `connect-src ${connectSrc}; ` +
              `img-src ${imgSrc}; ` +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "frame-src 'self'; " +
              "object-src 'none'; " +
              "base-uri 'self';",
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
        : {})
      // react-router-dom alias removed
    };
    return config;
  },
  async rewrites() {
    const medusa = (
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      process.env.MEDUSA_BACKEND_URL ||
      ""
    )
      .trim()
      .replace(/\/+$/, "");

    if (!medusa || medusa.includes("localhost") || medusa.includes("127.0.0.1")) {
      return [];
    }

    return [
      {
        source: "/store/:path*",
        destination: `${medusa}/store/:path*`,
      },
      {
        source: "/storefront/:path*",
        destination: `${medusa}/storefront/:path*`,
      },
    ];
  },
};

export default nextConfig;
