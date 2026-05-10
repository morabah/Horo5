import { hasShopifyEnv } from "@/lib/env";
import { shopifyFetch } from "@/lib/shopify/client";
import type {
  ShopifyCart,
  ShopifyCartLine,
  ShopifyCollection,
  ShopifyImage,
  ShopifyProduct,
  ShopifyProductVariant,
  ShopifyUserError,
} from "@/lib/shopify/types";

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
    nodes: ShopifyProductConnectionNode[];
  };
};

type CollectionsQueryResponse = {
  collections: {
    nodes: ShopifyCollection[];
  };
};

type ProductByHandleResponse = {
  productByHandle: ShopifyProductConnectionNode | null;
};

type CartQueryResponse = {
  cart: ShopifyCartConnectionNode | null;
};

type CartMutationResponse = {
  cartCreate?: { cart: ShopifyCartConnectionNode | null; userErrors: ShopifyUserError[] };
  cartLinesAdd?: { cart: ShopifyCartConnectionNode | null; userErrors: ShopifyUserError[] };
  cartLinesUpdate?: { cart: ShopifyCartConnectionNode | null; userErrors: ShopifyUserError[] };
};

type ShopifyConnection<TNode> = {
  nodes: TNode[];
};

type ShopifyProductConnectionNode = Omit<ShopifyProduct, "images" | "variants"> & {
  images: ShopifyConnection<ShopifyImage>;
  variants: ShopifyConnection<ShopifyProductVariant>;
};

type ShopifyCartConnectionNode = Omit<ShopifyCart, "lines"> & {
  lines: ShopifyConnection<ShopifyCartLine>;
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

function normalizeProduct(product: ShopifyProductConnectionNode): ShopifyProduct {
  return {
    ...product,
    images: product.images.nodes,
    variants: product.variants.nodes,
  };
}

function normalizeCart(cart: ShopifyCartConnectionNode): ShopifyCart {
  return {
    ...cart,
    lines: cart.lines.nodes,
  };
}

function assertNoUserErrors(scope: string, userErrors: ShopifyUserError[] | undefined): void {
  if (!userErrors?.length) {
    return;
  }

  const [firstError] = userErrors;
  throw new Error(`${scope}: ${firstError?.message ?? "Shopify rejected the request."}`);
}

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

  return data.products.nodes.map(normalizeProduct);
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

  return data.productByHandle ? normalizeProduct(data.productByHandle) : null;
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

  return data.cart ? normalizeCart(data.cart) : null;
}

export async function createCart(lines: Array<{ merchandiseId: string; quantity: number }>): Promise<ShopifyCart> {
  const data = await shopifyFetch<CartMutationResponse, { lines: Array<{ merchandiseId: string; quantity: number }> }>({
    query: `mutation CreateCart($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart {
          ${CART_FIELDS}
        }
        userErrors {
          field
          message
        }
      }
    }`,
    variables: { lines },
  });

  assertNoUserErrors("Failed to create cart", data.cartCreate?.userErrors);

  if (!data.cartCreate?.cart) {
    throw new Error("Failed to create cart.");
  }

  return normalizeCart(data.cartCreate.cart);
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
        userErrors {
          field
          message
        }
      }
    }`,
    variables: { cartId, lines },
  });

  assertNoUserErrors("Failed to add cart lines", data.cartLinesAdd?.userErrors);

  if (!data.cartLinesAdd?.cart) {
    throw new Error("Failed to add cart lines.");
  }

  return normalizeCart(data.cartLinesAdd.cart);
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
        userErrors {
          field
          message
        }
      }
    }`,
    variables: { cartId, lines },
  });

  assertNoUserErrors("Failed to update cart lines", data.cartLinesUpdate?.userErrors);

  if (!data.cartLinesUpdate?.cart) {
    throw new Error("Failed to update cart lines.");
  }

  return normalizeCart(data.cartLinesUpdate.cart);
}
