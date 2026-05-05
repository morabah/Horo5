/**
 * Shopify Admin GraphQL client for data migration.
 */

import * as logger from './utils/logger.js';

interface ClientConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

export class ShopifyAdminClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(config: ClientConfig) {
    const domain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.endpoint = `https://${domain}/admin/api/${config.apiVersion}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken,
    };
  }

  async request<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    logger.info(`GraphQL: ${query.slice(0, 60).replace(/\s+/g, ' ')}...`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors && json.errors.length > 0) {
      const messages = json.errors.map((e) => e.message).join('; ');
      throw new Error(`GraphQL errors: ${messages}`);
    }

    return json;
  }

  /**
   * Fetch all existing metaobject definitions.
   */
  async getMetaobjectDefinitions(): Promise<
    Array<{ id: string; type: string; name: string; fieldDefinitions: Array<{ key: string; name: string; type: { name: string } }> }>
  > {
    const query = `
      query GetMetaobjectDefinitions {
        metaobjectDefinitions(first: 100) {
          nodes {
            id
            type
            name
            fieldDefinitions {
              key
              name
              type { name }
            }
          }
        }
      }
    `;
    const res = await this.request<{ metaobjectDefinitions: { nodes: Array<Record<string, unknown>> } }>(query);
    return (res.data?.metaobjectDefinitions.nodes ?? []) as Array<{
      id: string; type: string; name: string;
      fieldDefinitions: Array<{ key: string; name: string; type: { name: string } }>;
    }>;
  }

  /**
   * Fetch all existing metafield definitions for an owner type.
   */
  async getMetafieldDefinitions(
    ownerType: 'PRODUCT' | 'COLLECTION'
  ): Promise<
    Array<{
      id: string;
      namespace: string;
      key: string;
      type: { name: string };
      ownerType: string;
    }>
  > {
    const query = `
      query GetMetafieldDefinitions($ownerType: MetafieldOwnerType!) {
        metafieldDefinitions(first: 250, ownerType: $ownerType) {
          nodes {
            id
            namespace
            key
            type { name }
            ownerType
          }
        }
      }
    `;
    const res = await this.request<{
      metafieldDefinitions: { nodes: Array<Record<string, unknown>> };
    }>(query, { ownerType });
    return (res.data?.metafieldDefinitions.nodes ?? []) as Array<{
      id: string; namespace: string; key: string; type: { name: string }; ownerType: string;
    }>;
  }

  /**
   * Create a metaobject entry.
   */
  async createMetaobjectEntry(
    definitionType: string,
    handle: string,
    fields: Array<{ key: string; value: string }>
  ): Promise<{ id: string; handle: string } | null> {
    const mutation = `
      mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject { id handle }
          userErrors { field message code }
        }
      }
    `;
    const res = await this.request<{
      metaobjectCreate: { metaobject: { id: string; handle: string } | null; userErrors: Array<{ field: string; message: string; code: string }> };
    }>(mutation, {
      metaobject: { type: definitionType, handle, fields },
    });

    const result = res.data?.metaobjectCreate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metaobjectCreate error: ${errors}`);
    }
    return result?.metaobject ?? null;
  }

  /**
   * Fetch all metaobject entries for a type.
   */
  async getMetaobjectEntries(type: string): Promise<Array<{ id: string; handle: string; fields: Array<{ key: string; value: string }> }>> {
    const query = `
      query GetMetaobjects($type: String!) {
        metaobjects(first: 250, type: $type) {
          nodes {
            id
            handle
            fields { key value }
          }
        }
      }
    `;
    const res = await this.request<{ metaobjects: { nodes: Array<Record<string, unknown>> } }>(query, { type });
    return (res.data?.metaobjects.nodes ?? []) as Array<{
      id: string; handle: string; fields: Array<{ key: string; value: string }>;
    }>;
  }

  /**
   * Create a product.
   */
  async createProduct(input: {
    title: string;
    descriptionHtml?: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    variants?: Array<{ price: string; sku?: string; options?: string[] }>;
  }): Promise<{ id: string; handle: string } | null> {
    const mutation = `
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product { id handle title }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      productCreate: { product: { id: string; handle: string; title: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, { input });

    const result = res.data?.productCreate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`productCreate error: ${errors}`);
    }
    return result?.product ?? null;
  }

  /**
   * Get product by handle.
   */
  async getProductByHandle(handle: string): Promise<{ id: string; handle: string } | null> {
    const query = `
      query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          handle
        }
      }
    `;
    const res = await this.request<{ productByHandle: { id: string; handle: string } | null }>(query, { handle });
    return res.data?.productByHandle ?? null;
  }

  /**
   * Create a collection.
   */
  async createCollection(input: {
    title: string;
    descriptionHtml?: string;
    handle?: string;
    ruleSet?: { appliedDisjunctively: boolean; rules: Array<{ column: string; relation: string; condition: string }> };
  }): Promise<{ id: string; handle: string } | null> {
    const mutation = `
      mutation CreateCollection($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { id handle title }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      collectionCreate: { collection: { id: string; handle: string; title: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, { input });

    const result = res.data?.collectionCreate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`collectionCreate error: ${errors}`);
    }
    return result?.collection ?? null;
  }

  /**
   * Get collection by handle.
   */
  async getCollectionByHandle(handle: string): Promise<{ id: string; handle: string } | null> {
    const query = `
      query GetCollectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          handle
        }
      }
    `;
    const res = await this.request<{ collectionByHandle: { id: string; handle: string } | null }>(query, { handle });
    return res.data?.collectionByHandle ?? null;
  }

  /**
   * Set metafield value on a product.
   */
  async setProductMetafield(productId: string, namespace: string, key: string, value: string, type: string): Promise<void> {
    const mutation = `
      mutation SetProductMetafield($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      productUpdate: { product: { id: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, {
      input: {
        id: productId,
        metafields: [{ namespace, key, value, type }],
      },
    });

    const result = res.data?.productUpdate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`productUpdate metafield error: ${errors}`);
    }
  }

  /**
   * Set metafield value on a collection.
   */
  async setCollectionMetafield(collectionId: string, namespace: string, key: string, value: string, type: string): Promise<void> {
    const mutation = `
      mutation SetCollectionMetafield($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      collectionUpdate: { collection: { id: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, {
      input: {
        id: collectionId,
        metafields: [{ namespace, key, value, type }],
      },
    });

    const result = res.data?.collectionUpdate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`collectionUpdate metafield error: ${errors}`);
    }
  }

  /**
   * Add products to a collection.
   */
  async addProductsToCollection(collectionId: string, productIds: string[]): Promise<void> {
    const mutation = `
      mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection { id }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      collectionAddProducts: { collection: { id: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, { id: collectionId, productIds });

    const result = res.data?.collectionAddProducts;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`collectionAddProducts error: ${errors}`);
    }
  }
}
