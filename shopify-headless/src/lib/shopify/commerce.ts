import { hasShopifyEnv } from "@/lib/env";
import { shopifyFetch } from "@/lib/shopify/client";
import type { ShopifyCart, ShopifyCollection, ShopifyProduct } from "@/lib/shopify/types";

const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  featuredImage {
    url
    altText
    width
    height
  }
  images(first: 8) {
    nodes {
      url
      altText
      width
      height
    }
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 10) {
    nodes {
      id
      title
      availableForSale
      quantityAvailable
      selectedOptions {
        name
        value
      }
      price {
        amount
        currencyCode
      }
    }
  }
`;

type ProductsQueryResponse = {
  products: {
    nodes: ShopifyProduct[];
  };
};

type CollectionsQueryResponse = {
  collections: {
    nodes: ShopifyCollection[];
  };
};

type ProductByHandleResponse = {
  productByHandle: ShopifyProduct | null;
};

type CartQueryResponse = {
  cart: ShopifyCart | null;
};

type CartMutationResponse = {
  cartCreate?: { cart: ShopifyCart | null };
  cartLinesAdd?: { cart: ShopifyCart | null };
  cartLinesUpdate?: { cart: ShopifyCart | null };
};

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount {
      amount
      currencyCode
    }
    totalAmount {
      amount
      currencyCode
    }
  }
  lines(first: 50) {
    nodes {
      id
      quantity
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
      merchandise {
        ... on ProductVariant {
          id
          title
          selectedOptions {
            name
            value
          }
          product {
            title
            handle
            featuredImage {
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  }
`;

export async function getProducts(first = 12): Promise<ShopifyProduct[]> {
  if (!hasShopifyEnv()) {
    return [];
  }

  const data = await shopifyFetch<ProductsQueryResponse, { first: number }>({
    query: `query GetProducts($first: Int!) {
      products(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          ${PRODUCT_FIELDS}
        }
      }
    }`,
    variables: { first },
    cache: "force-cache",
    tags: ["shopify-products"],
    revalidate: 60,
  });

  return data.products.nodes;
}

export async function getCollections(first = 8): Promise<ShopifyCollection[]> {
  if (!hasShopifyEnv()) {
    return [];
  }

  const data = await shopifyFetch<CollectionsQueryResponse, { first: number }>({
    query: `query GetCollections($first: Int!) {
      collections(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          handle
          title
          description
          image {
            url
            altText
            width
            height
          }
        }
      }
    }`,
    variables: { first },
    cache: "force-cache",
    tags: ["shopify-collections"],
    revalidate: 120,
  });

  return data.collections.nodes;
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  if (!hasShopifyEnv()) {
    return null;
  }

  const data = await shopifyFetch<ProductByHandleResponse, { handle: string }>({
    query: `query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        ${PRODUCT_FIELDS}
      }
    }`,
    variables: { handle },
    cache: "force-cache",
    tags: [`shopify-product-${handle}`],
    revalidate: 60,
  });

  return data.productByHandle;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<CartQueryResponse, { cartId: string }>({
    query: `query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ${CART_FIELDS}
      }
    }`,
    variables: { cartId },
  });

  return data.cart;
}

export async function createCart(lines: Array<{ merchandiseId: string; quantity: number }>): Promise<ShopifyCart> {
  const data = await shopifyFetch<CartMutationResponse, { lines: Array<{ merchandiseId: string; quantity: number }> }>({
    query: `mutation CreateCart($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart {
          ${CART_FIELDS}
        }
      }
    }`,
    variables: { lines },
  });

  if (!data.cartCreate?.cart) {
    throw new Error("Failed to create cart.");
  }

  return data.cartCreate.cart;
}

export async function addCartLines(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<ShopifyCart> {
  const data = await shopifyFetch<CartMutationResponse, { cartId: string; lines: Array<{ merchandiseId: string; quantity: number }> }>({
    query: `mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ${CART_FIELDS}
        }
      }
    }`,
    variables: { cartId, lines },
  });

  if (!data.cartLinesAdd?.cart) {
    throw new Error("Failed to add cart lines.");
  }

  return data.cartLinesAdd.cart;
}

export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<ShopifyCart> {
  const data = await shopifyFetch<CartMutationResponse, { cartId: string; lines: Array<{ id: string; quantity: number }> }>({
    query: `mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ${CART_FIELDS}
        }
      }
    }`,
    variables: { cartId, lines },
  });

  if (!data.cartLinesUpdate?.cart) {
    throw new Error("Failed to update cart lines.");
  }

  return data.cartLinesUpdate.cart;
}
