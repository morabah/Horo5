const required = [
  "NEXT_PUBLIC_SITE_URL",
  "SHOPIFY_STORE_DOMAIN",
  "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  "SHOPIFY_STOREFRONT_API_VERSION",
  "SHOPIFY_WEBHOOK_SECRET",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing required env vars for payment/checkout validation:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/webhooks/shopify/orders-paid`;

console.log("Checkout readiness baseline passed.");
console.log(`Register a signed Shopify webhook for topic "orders/paid" to: ${webhookUrl}`);
console.log("Manual Egypt gateway validation checklist:");
console.log("1) Confirm the Shopify checkout is using the intended Egypt payment gateway and methods.");
console.log("2) Run through checkout with a successful card or wallet payment in sandbox.");
console.log("3) Confirm the orders/paid webhook is delivered and a local order event is written.");
console.log("4) Run a declined or failed payment scenario and verify the paid webhook is not recorded.");
console.log("5) Run a user-cancelled payment flow and verify storefront return handling does not imply purchase success.");
console.log("6) Verify Egypt shipping zones, taxes, and final charged totals inside Shopify checkout.");
