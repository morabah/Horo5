const baseUrl = (process.env.LHCI_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const productSlug = process.env.LHCI_PRODUCT_SLUG || "quiet-revolt";
const useExternalTarget = Boolean(process.env.LHCI_BASE_URL);

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/`,
        `${baseUrl}/products`,
        `${baseUrl}/products/${encodeURIComponent(productSlug)}`,
        `${baseUrl}/cart`,
        `${baseUrl}/checkout`,
      ],
      numberOfRuns: Number(process.env.LHCI_RUNS || 3),
      settings: {
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
      ...(useExternalTarget
        ? {}
        : {
            startServerCommand: "npm run start",
            startServerReadyPattern: "Ready",
            startServerReadyTimeout: 30000,
          }),
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        "interactive": ["warn", { maxNumericValue: 5000 }],
      },
    },
    upload: {
      target: process.env.LHCI_UPLOAD_TARGET || "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
