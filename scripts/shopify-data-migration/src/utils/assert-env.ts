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
  // OAuth fields
  clientId?: string;
  clientSecret?: string;
}

function detectAuthMode(): { mode: 'token' | 'oauth'; token?: string; clientId?: string; clientSecret?: string } {
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (token && token.startsWith('shpat_')) {
    return { mode: 'token', token };
  }
  if (clientId && clientSecret) {
    return { mode: 'oauth', clientId, clientSecret };
  }
  return { mode: 'token' };
}

export function assertEnv(): Env {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const apiVersion = process.env.SHOPIFY_API_VERSION;

  if (!storeDomain) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN in environment');
  }
  if (!apiVersion) {
    throw new Error('Missing SHOPIFY_API_VERSION in environment');
  }

  const auth = detectAuthMode();
  if (auth.mode === 'token' && !auth.token) {
    throw new Error(
      'Missing SHOPIFY_ADMIN_ACCESS_TOKEN in environment. ' +
      'Either set SHOPIFY_ADMIN_ACCESS_TOKEN (Custom app) or ' +
      'set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (Partner app OAuth).'
    );
  }

  return {
    storeDomain,
    accessToken: auth.token ?? '',
    apiVersion,
    medusaBackendUrl: process.env.MEDUSA_BACKEND_URL,
    medusaAdminApiToken: process.env.MEDUSA_ADMIN_API_TOKEN,
    medusaDatabaseUrl: process.env.MEDUSA_DATABASE_URL,
    migrationInputDir: process.env.MIGRATION_INPUT_DIR ?? './input',
    allowMissingReferences: process.env.ALLOW_MISSING_REFERENCES === 'true',
    allowMissingImages: process.env.ALLOW_MISSING_IMAGES === 'true',
    clientId: auth.clientId,
    clientSecret: auth.clientSecret,
  };
}
