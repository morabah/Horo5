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
  private restBase: string;
  private headers: Record<string, string>;
  private quiet: boolean;

  constructor(config: ClientConfig & { quiet?: boolean }) {
    const domain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.endpoint = `https://${domain}/admin/api/${config.apiVersion}/graphql.json`;
    this.restBase = `https://${domain}/admin/api/${config.apiVersion}`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken,
    };
    this.quiet = config.quiet ?? false;
  }

  async request<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    if (!this.quiet) {
      logger.info(`GraphQL request: ${query.slice(0, 60).replace(/\s+/g, ' ')}...`);
    }

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
  async updateMetaobjectDefinitionAccess(
    definitionId: string,
    storefront: 'PUBLIC_READ' | 'NONE' = 'PUBLIC_READ'
  ): Promise<void> {
    const mutation = `
      mutation UpdateMetaobjectAccess($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
        metaobjectDefinitionUpdate(id: $id, definition: $definition) {
          metaobjectDefinition {
            id
            access {
              admin
              storefront
            }
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
      metaobjectDefinitionUpdate: {
        metaobjectDefinition: { id: string; access: { admin: string; storefront: string } } | null;
        userErrors: Array<{ field: string; message: string; code: string }>;
      };
    }>(mutation, {
      id: definitionId,
      definition: {
        access: {
          storefront,
        },
      },
    });

    const result = res.data?.metaobjectDefinitionUpdate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metaobjectDefinitionUpdate error: ${errors}`);
    }
  }

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
    }>(mutation, {
      definition: {
        ...definition,
        access: {
          storefront: 'PUBLIC_READ',
        },
      },
    });

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
          deletedId
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
        deletedId: string | null;
        userErrors: Array<{ field: string; message: string; code: string }>;
      };
    }>(mutation, { id });

    const result = res.data?.metaobjectDefinitionDelete;

    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metaobjectDefinitionDelete error: ${errors}`);
    }

    return !!result?.deletedId;
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

  /**
   * Append field definitions to an existing metaobject definition.
   */
  async addMetaobjectFieldDefinitions(
    definitionId: string,
    fields: Array<{ key: string; name: string; type: string; description?: string; required?: boolean }>
  ): Promise<void> {
    const mutation = `
      mutation AddMetaobjectFields($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
        metaobjectDefinitionUpdate(id: $id, definition: $definition) {
          metaobjectDefinition {
            id
            fieldDefinitions {
              key
            }
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
      metaobjectDefinitionUpdate: {
        metaobjectDefinition: { id: string } | null;
        userErrors: Array<{ field: string; message: string; code: string }>;
      };
    }>(mutation, {
      id: definitionId,
      definition: {
        fieldDefinitions: fields.map((field) => ({
          create: {
            key: field.key,
            name: field.name,
            type: field.type,
            description: field.description,
            required: field.required,
          },
        })),
      },
    });

    const result = res.data?.metaobjectDefinitionUpdate;
    if (result?.userErrors && result.userErrors.length > 0) {
      const errors = result.userErrors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`metaobjectDefinitionUpdate error: ${errors}`);
    }
  }

  async listMetaobjectHandles(type: string, limit = 25): Promise<Array<{ id: string; handle: string }>> {
    const query = `
      query ListMetaobjects($type: String!) {
        metaobjects(first: ${limit}, type: $type) {
          nodes { id handle }
        }
      }
    `;
    const res = await this.request<{ metaobjects: { nodes: Array<{ id: string; handle: string }> } }>(
      query,
      { type }
    );
    return res.data?.metaobjects.nodes ?? [];
  }

  async getMetaobjectByHandle(
    type: string,
    handle: string
  ): Promise<{ id: string; handle: string } | null> {
    const query = `
      query MetaobjectByHandle($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
          handle
        }
      }
    `;
    const res = await this.request<{
      metaobjectByHandle: { id: string; handle: string } | null;
    }>(query, { handle: { type, handle } });
    return res.data?.metaobjectByHandle ?? null;
  }

  async createMetaobjectEntry(
    type: string,
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
      metaobjectCreate: {
        metaobject: { id: string; handle: string } | null;
        userErrors: Array<{ field: string; message: string; code?: string }>;
      };
    }>(mutation, { metaobject: { type, handle, fields } });

    const result = res.data?.metaobjectCreate;
    if (result?.userErrors?.length) {
      const taken = result.userErrors.every((e) => /taken|exists|unique/i.test(e.message));
      if (taken) return this.getMetaobjectByHandle(type, handle);
      throw new Error(
        `metaobjectCreate(${type}/${handle}): ${result.userErrors.map((e) => e.message).join('; ')}`
      );
    }
    return result?.metaobject ?? null;
  }

  async updateMetaobjectEntry(
    id: string,
    fields: Array<{ key: string; value: string }>
  ): Promise<void> {
    const mutation = `
      mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject { id }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      metaobjectUpdate: { metaobject: { id: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, { id, metaobject: { fields } });

    const result = res.data?.metaobjectUpdate;
    if (result?.userErrors?.length) {
      throw new Error(`metaobjectUpdate: ${result.userErrors.map((e) => e.message).join('; ')}`);
    }
  }

  async getCollectionByHandle(
    handle: string
  ): Promise<{ id: string; handle: string; title: string; legacyId?: number } | null> {
    const query = `
      query CollectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          legacyResourceId
        }
      }
    `;
    const res = await this.request<{
      collectionByHandle: {
        id: string;
        handle: string;
        title: string;
        legacyResourceId?: string;
      } | null;
    }>(query, { handle });
    const node = res.data?.collectionByHandle;
    if (!node) return null;
    return {
      id: node.id,
      handle: node.handle,
      title: node.title,
      legacyId: node.legacyResourceId ? Number(node.legacyResourceId) : undefined,
    };
  }

  async createCollection(input: {
    title: string;
    handle?: string;
    descriptionHtml?: string;
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
      collectionCreate: {
        collection: { id: string; handle: string; title: string } | null;
        userErrors: Array<{ field: string; message: string }>;
      };
    }>(mutation, { input });

    const result = res.data?.collectionCreate;
    if (result?.userErrors?.length) {
      throw new Error(`collectionCreate: ${result.userErrors.map((e) => e.message).join('; ')}`);
    }
    return result?.collection ?? null;
  }

  async setCollectionMetafield(
    collectionId: string,
    namespace: string,
    key: string,
    value: string,
    type: string
  ): Promise<void> {
    const mutation = `
      mutation UpdateCollection($input: CollectionInput!) {
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
    if (result?.userErrors?.length) {
      throw new Error(`collectionUpdate: ${result.userErrors.map((e) => e.message).join('; ')}`);
    }
  }

  async getPageByHandle(handle: string): Promise<{ id: string; handle: string } | null> {
    const query = `
      query PageByHandle($query: String!) {
        pages(first: 1, query: $query) {
          nodes { id handle title }
        }
      }
    `;
    const res = await this.request<{
      pages: { nodes: Array<{ id: string; handle: string; title: string }> };
    }>(query, { query: `handle:${handle}` });
    return res.data?.pages.nodes[0] ?? null;
  }

  async createPage(input: {
    title: string;
    handle: string;
    body?: string;
    templateSuffix?: string;
    isPublished?: boolean;
  }): Promise<{ id: string; handle: string } | null> {
    const mutation = `
      mutation CreatePage($page: PageCreateInput!) {
        pageCreate(page: $page) {
          page { id handle }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      pageCreate: { page: { id: string; handle: string } | null; userErrors: Array<{ field: string; message: string }> };
    }>(mutation, {
      page: {
        title: input.title,
        handle: input.handle,
        body: input.body ?? '',
        isPublished: input.isPublished ?? true,
        templateSuffix: input.templateSuffix,
      },
    });

    const result = res.data?.pageCreate;
    if (result?.userErrors?.length) {
      const exists = result.userErrors.some((e) => /taken|exists|unique/i.test(e.message));
      if (exists) return this.getPageByHandle(input.handle);
      throw new Error(`pageCreate: ${result.userErrors.map((e) => e.message).join('; ')}`);
    }
    return result?.page ?? null;
  }

  /** GraphQL pageCreate with REST /pages.json fallback when content scopes are missing. */
  async ensurePage(input: {
    title: string;
    handle: string;
    body?: string;
    templateSuffix?: string;
    isPublished?: boolean;
  }): Promise<{ id: string; handle: string } | null> {
    try {
      const existing = await this.getPageByHandle(input.handle);
      if (existing) return existing;
    } catch {
      /* read_content may be missing — try create paths below */
    }
    try {
      return await this.createPage(input);
    } catch (gqlErr) {
      const rest = await this.createPageRest({
        title: input.title,
        handle: input.handle,
        body: input.body,
        templateSuffix: input.templateSuffix,
        published: input.isPublished,
      });
      if (rest) {
        return { id: `gid://shopify/Page/${rest.id}`, handle: rest.handle };
      }
      const again = await this.getPageByHandle(input.handle);
      if (again) return again;
      throw gqlErr;
    }
  }

  async getOnlineStorePublicationId(): Promise<string | null> {
    const query = `
      query Publications {
        publications(first: 20) {
          nodes { id name }
        }
      }
    `;
    const res = await this.request<{
      publications: { nodes: Array<{ id: string; name: string }> };
    }>(query);
    const nodes = res.data?.publications.nodes ?? [];
    const online = nodes.find((p) => /online store/i.test(p.name));
    return online?.id ?? nodes[0]?.id ?? null;
  }

  async publishToOnlineStore(resourceId: string): Promise<void> {
    let publicationId: string | null = null;
    try {
      publicationId = await this.getOnlineStorePublicationId();
    } catch (err) {
      logger.warn(
        `publish skipped (add read_publications/write_publications scope and re-authorize): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return;
    }
    if (!publicationId) return;

    const mutation = `
      mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          publishable { availablePublicationsCount { count } }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      publishablePublish: { userErrors: Array<{ field: string; message: string }> };
    }>(mutation, { id: resourceId, input: [{ publicationId }] });

    const errors = res.data?.publishablePublish?.userErrors ?? [];
    const ignorable = errors.every((e) => /already|published/i.test(e.message));
    if (errors.length && !ignorable) {
      throw new Error(`publishablePublish: ${errors.map((e) => e.message).join('; ')}`);
    }
  }

  async restRequest<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.restBase}${path}`, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`REST ${method} ${path}: ${response.status} ${text.slice(0, 300)}`);
    }
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  productGid(numericId: number | string): string {
    return `gid://shopify/Product/${numericId}`;
  }

  async getProductByHandle(handle: string): Promise<{ id: string; handle: string; legacyId?: number } | null> {
    const query = `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          handle
          legacyResourceId
        }
      }
    `;
    const res = await this.request<{
      productByHandle: { id: string; handle: string; legacyResourceId: string } | null;
    }>(query, { handle });
    const p = res.data?.productByHandle;
    if (!p) return null;
    return { id: p.id, handle: p.handle, legacyId: Number(p.legacyResourceId) };
  }

  async createProductWithSizeVariants(input: {
    title: string;
    handle: string;
    descriptionHtml?: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    status?: 'active' | 'draft';
    variants: Array<{ size: string; sku: string; price: string; quantity: number }>;
  }): Promise<{ id: string; handle: string; legacyId: number }> {
    const existing = await this.getProductByHandle(input.handle);
    if (existing?.legacyId) {
      return { id: existing.id, handle: existing.handle, legacyId: existing.legacyId };
    }

    const res = await this.restRequest<{ product: { id: number; handle: string; admin_graphql_api_id: string } }>(
      'POST',
      '/products.json',
      {
        product: {
          title: input.title,
          handle: input.handle,
          body_html: input.descriptionHtml ?? '',
          vendor: input.vendor ?? 'HORO',
          product_type: input.productType ?? 'T-Shirt',
          tags: input.tags?.join(', ') ?? '',
          status: input.status ?? 'active',
          options: [{ name: 'Size' }],
          variants: input.variants.map((v) => ({
            option1: v.size,
            sku: v.sku,
            price: v.price,
            inventory_management: 'shopify',
            inventory_quantity: v.quantity,
            requires_shipping: true,
          })),
        },
      }
    );

    const product = res.product;
    return {
      id: product.admin_graphql_api_id ?? this.productGid(product.id),
      handle: product.handle,
      legacyId: product.id,
    };
  }

  async metafieldsSet(
    ownerId: string,
    metafields: Array<{ namespace: string; key: string; type: string; value: string }>
  ): Promise<void> {
    if (metafields.length === 0) return;
    const mutation = `
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message }
        }
      }
    `;
    const chunkSize = 25;
    for (let i = 0; i < metafields.length; i += chunkSize) {
      const chunk = metafields.slice(i, i + chunkSize);
      const res = await this.request<{
        metafieldsSet: { userErrors: Array<{ field: string; message: string }> };
      }>(mutation, {
        metafields: chunk.map((m) => ({
          ownerId,
          namespace: m.namespace,
          key: m.key,
          type: m.type,
          value: m.value,
        })),
      });
      const errors = res.data?.metafieldsSet?.userErrors ?? [];
      if (errors.length) {
        throw new Error(`metafieldsSet: ${errors.map((e) => e.message).join('; ')}`);
      }
    }
  }

  async addProductToCollectionRest(collectionLegacyId: number, productLegacyId: number): Promise<void> {
    try {
      await this.restRequest('POST', '/collects.json', {
        collect: { collection_id: collectionLegacyId, product_id: productLegacyId },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/already|duplicate|exists/i.test(msg)) return;
      throw err;
    }
  }

  async addProductsToCollection(
    collectionId: string,
    productIds: string[],
    opts?: { collectionLegacyId?: number; productLegacyIds?: Map<string, number> }
  ): Promise<void> {
    if (productIds.length === 0) return;
    const mutation = `
      mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection { id }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      collectionAddProducts: { userErrors: Array<{ field: string; message: string }> };
    }>(mutation, { id: collectionId, productIds });

    const errors = res.data?.collectionAddProducts?.userErrors ?? [];
    const ignorable = errors.every((e) => /already|duplicate|member/i.test(e.message));
    if (!errors.length || ignorable) return;

    if (opts?.collectionLegacyId && opts.productLegacyIds) {
      for (const pid of productIds) {
        const legacy = opts.productLegacyIds.get(pid);
        if (legacy) {
          await this.addProductToCollectionRest(opts.collectionLegacyId, legacy);
        }
      }
      return;
    }

    throw new Error(`collectionAddProducts: ${errors.map((e) => e.message).join('; ')}`);
  }

  /** Main (live) theme: GraphQL GID + numeric id for REST. */
  async resolveMainTheme(): Promise<{ gid: string; numericId: string; name: string }> {
    const query = `
      query MainTheme {
        themes(roles: [MAIN], first: 1) {
          nodes { id name role }
        }
      }
    `;
    const res = await this.request<{
      themes: { nodes: Array<{ id: string; name: string; role: string }> };
    }>(query);
    const node = res.data?.themes.nodes[0];
    if (!node) throw new Error('No MAIN theme found on store');
    const numericId = node.id.replace(/^gid:\/\/shopify\/OnlineStoreTheme\//, '');
    return { gid: node.id, numericId, name: node.name };
  }

  async getThemeSettingsJson(themeGid: string): Promise<string | null> {
    const filename = 'config/settings_data.json';
    const query = `
      query ThemeSettings($id: ID!) {
        theme(id: $id) {
          files(filenames: ["${filename}"], first: 1) {
            nodes {
              filename
              body {
                ... on OnlineStoreThemeFileBodyText { content }
              }
            }
          }
        }
      }
    `;
    const res = await this.request<{
      theme: {
        files: {
          nodes: Array<{ body?: { content?: string } }>;
        };
      } | null;
    }>(query, { id: themeGid });

    return res.data?.theme?.files.nodes[0]?.body?.content ?? null;
  }

  async putThemeSettingsJson(themeGid: string, content: string): Promise<void> {
    const mutation = `
      mutation ThemeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
        themeFilesUpsert(themeId: $themeId, files: $files) {
          upsertedThemeFiles { filename }
          userErrors { field message }
        }
      }
    `;
    const res = await this.request<{
      themeFilesUpsert: {
        userErrors: Array<{ field: string; message: string }>;
      };
    }>(mutation, {
      themeId: themeGid,
      files: [
        {
          filename: 'config/settings_data.json',
          body: { type: 'TEXT', value: content },
        },
      ],
    });
    const errors = res.data?.themeFilesUpsert?.userErrors ?? [];
    if (errors.length) {
      throw new Error(`themeFilesUpsert: ${errors.map((e) => e.message).join('; ')}`);
    }
  }

  async patchThemeSettings(
    themeGidOrNumericId: string,
    patch: Record<string, string | boolean>
  ): Promise<void> {
    const themeGid = themeGidOrNumericId.startsWith('gid://')
      ? themeGidOrNumericId
      : `gid://shopify/OnlineStoreTheme/${themeGidOrNumericId}`;

    let raw = await this.getThemeSettingsJson(themeGid);
    if (!raw) {
      const numericId = themeGid.replace(/^gid:\/\/shopify\/OnlineStoreTheme\//, '');
      try {
        const res = await this.restRequest<{ asset: { value: string } }>(
          'GET',
          `/themes/${numericId}/assets.json?asset[key]=${encodeURIComponent('config/settings_data.json')}`
        );
        raw = res.asset?.value ?? null;
      } catch {
        raw = null;
      }
    }
    if (!raw) {
      throw new Error('config/settings_data.json not found on MAIN theme');
    }

    const data = JSON.parse(raw) as {
      current?: Record<string, string | boolean>;
      presets?: Record<string, Record<string, string | boolean>>;
    };
    if (!data.current) data.current = {};
    for (const [k, v] of Object.entries(patch)) {
      data.current[k] = v;
    }
    const next = JSON.stringify(data, null, 2);
    try {
      await this.putThemeSettingsJson(themeGid, next);
    } catch (gqlErr) {
      const numericId = themeGid.replace(/^gid:\/\/shopify\/OnlineStoreTheme\//, '');
      await this.restRequest('PUT', `/themes/${numericId}/assets.json`, {
        asset: { key: 'config/settings_data.json', value: next },
      });
      if (gqlErr instanceof Error) {
        logger.warn(`themeFilesUpsert failed, used REST fallback: ${gqlErr.message}`);
      }
    }
  }

  async createPageRest(input: {
    title: string;
    handle: string;
    body?: string;
    templateSuffix?: string;
    published?: boolean;
  }): Promise<{ id: number; handle: string } | null> {
    try {
      const res = await this.restRequest<{ page: { id: number; handle: string } }>('POST', '/pages.json', {
        page: {
          title: input.title,
          handle: input.handle,
          body_html: input.body ?? '',
          published: input.published ?? true,
          template_suffix: input.templateSuffix,
        },
      });
      return res.page;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/422|already|taken/i.test(msg)) {
        return null;
      }
      throw err;
    }
  }
}
