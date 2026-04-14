import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Migrated Vite storefront: keep strict rules on `src/app` / `src/components` first;
  // relax React Compiler hook rules here until patterns are refactored incrementally.
  {
    files: ["src/storefront/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      // Vite/React-Router storefront: product art uses dynamic CDN URLs, `imgUrl()` query params,
      // and many client-only flows — native <img> is intentional; Next/Image is for `src/app` RSC routes.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
