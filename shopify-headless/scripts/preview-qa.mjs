const baseUrl = process.env.PREVIEW_URL ?? "http://localhost:3000";
const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2025-01";

const routes = ["/", "/products", "/cart"];

async function checkRoute(route) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) {
    throw new Error(`${route} returned status ${response.status}`);
  }

  const html = await response.text();
  if (!html.includes("<html")) {
    throw new Error(`${route} did not return HTML content`);
  }
}

async function checkApiContracts() {
  const cartGetResponse = await fetch(`${baseUrl}/api/cart`);
  if (!cartGetResponse.ok) {
    throw new Error(`/api/cart returned status ${cartGetResponse.status}`);
  }
  const cartGetPayload = await cartGetResponse.json();
  if (!Object.prototype.hasOwnProperty.call(cartGetPayload, "cart")) {
    throw new Error("/api/cart response missing `cart` key");
  }

  const cartPostResponse = await fetch(`${baseUrl}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lines: [] }),
  });
  if (cartPostResponse.status !== 400) {
    throw new Error(`/api/cart validation should return 400, got ${cartPostResponse.status}`);
  }

  const cartLinesResponse = await fetch(`${baseUrl}/api/cart/lines`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (cartLinesResponse.status !== 400) {
    throw new Error(`/api/cart/lines validation should return 400, got ${cartLinesResponse.status}`);
  }
}

async function getOneProductHandle() {
  if (!shopDomain || !storefrontToken) {
    return null;
  }

  const endpoint = `https://${shopDomain}/api/${apiVersion}/graphql.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({
      query: `query QaProductHandle {
        products(first: 1, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            handle
          }
        }
      }`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify handle query failed with status ${response.status}`);
  }

  const payload = await response.json();
  const handle = payload?.data?.products?.nodes?.[0]?.handle;

  if (typeof handle !== "string" || handle.length === 0) {
    return null;
  }

  return handle;
}

async function checkProductDetailRoute() {
  const handle = await getOneProductHandle();
  if (!handle) {
    console.log("SKIP /products/[handle] smoke (Shopify env missing or no products).");
    return;
  }

  await checkRoute(`/products/${handle}`);
  console.log(`PASS /products/${handle}`);
}

async function main() {
  console.log(`Running preview QA against ${baseUrl}`);

  for (const route of routes) {
    await checkRoute(route);
    console.log(`PASS ${route}`);
  }

  await checkApiContracts();
  console.log("PASS /api/cart contract");
  console.log("PASS /api/cart/lines contract");
  await checkProductDetailRoute();

  console.log("Preview QA complete.");
  console.log("Manual step: Validate add-to-cart + checkout redirect from a product detail page.");
}

main().catch((error) => {
  console.error("Preview QA failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
