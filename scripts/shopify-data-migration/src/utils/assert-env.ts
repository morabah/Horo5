import 'dotenv/config';

export interface Env {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
  medusaBackendUrl?: string;
  medusaAdminApiToken?: string;
  medusaDatabaseUrl?: string;
  migrationInputDir: string;
  allowMissingReferences: boolean;
  allowMissingImages: boolean;
}

export function assertEnv(): Env {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION;

  if (!storeDomain) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN in environment');
  }
  if (!accessToken) {
    throw new Error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN in environment');
  }
  if (!apiVersion) {
    throw new Error('Missing SHOPIFY_API_VERSION in environment');
  }
  if (!accessToken.startsWith('shpat_')) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN must start with shpat_');
  }

  return {
    storeDomain,
    accessToken,
    apiVersion,
    medusaBackendUrl: process.env.MEDUSA_BACKEND_URL,
    medusaAdminApiToken: process.env.MEDUSA_ADMIN_API_TOKEN,
    medusaDatabaseUrl: process.env.MEDUSA_DATABASE_URL,
    migrationInputDir: process.env.MIGRATION_INPUT_DIR ?? './input',
    allowMissingReferences: process.env.ALLOW_MISSING_REFERENCES === 'true',
    allowMissingImages: process.env.ALLOW_MISSING_IMAGES === 'true',
  };
}
