/**
 * Minimal Shopify Admin GraphQL client.
 * No external dependencies beyond native fetch.
 */

import * as logger from './utils/logger.js';

interface ClientConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
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
    logger.info(`GraphQL request: ${query.slice(0, 60).replace(/\s+/g, ' ')}...`);

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
    Array<{
      id: string;
      type: string;
      name: string;
      fieldDefinitions: Array<{ key: string; name: string; type: { name: string } }>;
    }>
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
              type {
                name
              }
            }
          }
        }
      }
    `;

    const res = await this.request<{
      metaobjectDefinitions: { nodes: Array<Record<string, unknown>> };
    }>(query);

    return (res.data?.metaobjectDefinitions.nodes ?? []) as Array<{
      id: string;
      type: string;
      name: string;
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
            type {
              name
            }
            ownerType
          }
        }
      }
    `;

    const res = await this.request<{
      metafieldDefinitions: { nodes: Array<Record<string, unknown>> };
    }>(query, { ownerType });

    return (res.data?.metafieldDefinitions.nodes ?? []) as Array<{
      id: string;
      namespace: string;
      key: string;
      type: { name: string };
      ownerType: string;
    }>;
  }

  /**
   * Create a metaobject definition.
   */
  async createMetaobjectDefinition(definition: {
    type: string;
    name: string;
    fieldDefinitions: Array<{
      key: string;
      name: string;
      type: string;
      required?: boolean;
      description?: string;
      validations?: Array<{ name: string; value?: string }>;
    }>;
  }): Promise<{ id: string; type: string } | null> {
    const mutation = `
      mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
            type
            name
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const res = await this.request<{
      metaobjectDefinitionCreate: {
        metaobjectDefinition: { id: string; type: string; name: string } | null;
        userErrors: Array<{ field: string; message: string; code: string }>;
      };
    }>(mutation, { definition });

    const result = res.data?.metaobjectDefinitionCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metaobjectDefinitionCreate error: ${errors}`);
    }

    return result?.metaobjectDefinition ?? null;
  }

  /**
   * Delete a metaobject definition.
   */
  async deleteMetaobjectDefinition(id: string): Promise<boolean> {
    const mutation = `
      mutation DeleteMetaobjectDefinition($id: ID!) {
        metaobjectDefinitionDelete(id: $id) {
          deletedDefinitionId
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const res = await this.request<{
      metaobjectDefinitionDelete: {
        deletedDefinitionId: string | null;
        userErrors: Array<{ field: string; message: string; code: string }>;
      };
    }>(mutation, { id });

    const result = res.data?.metaobjectDefinitionDelete;

    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metaobjectDefinitionDelete error: ${errors}`);
    }

    return !!result?.deletedDefinitionId;
  }

  /**
   * Create a metafield definition.
   */
  async createMetafieldDefinition(definition: {
    name: string;
    namespace: string;
    key: string;
    type: string;
    ownerType: 'PRODUCT' | 'COLLECTION';
    description?: string;
    pin?: boolean;
    validations?: Array<{ name: string; value?: string }>;
  }): Promise<{ id: string; namespace: string; key: string } | null> {
    const mutation = `
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            namespace
            key
            name
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const res = await this.request<{
      metafieldDefinitionCreate: {
        createdDefinition: { id: string; namespace: string; key: string; name: string } | null;
        userErrors: Array<{ field: string; message: string; code: string }>;
      };
    }>(mutation, { definition });

    const result = res.data?.metafieldDefinitionCreate;

    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metafieldDefinitionCreate error: ${errors}`);
    }

    return result?.createdDefinition ?? null;
  }
}
