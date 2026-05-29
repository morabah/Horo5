/**
 * Resolve Admin API access token (static env or OAuth with local cache).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertEnv, getOAuthConfig, type Env } from './assert-env.js';
import { getAccessTokenViaOAuth } from './oauth.js';
import * as logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_CACHE = path.join(__dirname, '../../.shopify-oauth-token.json');

interface CachedToken {
  accessToken: string;
  scope: string;
  storeDomain: string;
  savedAt: string;
}

function loadCachedToken(storeDomain: string): string | null {
  if (process.env.SHOPIFY_FORCE_OAUTH === '1') return null;
  try {
    const raw = fs.readFileSync(TOKEN_CACHE, 'utf8');
    const cached = JSON.parse(raw) as CachedToken;
    const normalizedStore = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (cached.storeDomain !== normalizedStore) {
      return null;
    }
    logger.info(`Using cached OAuth token (saved ${cached.savedAt})`);
    logger.info(`Granted scopes: ${cached.scope.replace(/,/g, ', ')}`);
    return cached.accessToken;
  } catch {
    return null;
  }
}

function saveCachedToken(storeDomain: string, accessToken: string, scope: string): void {
  const payload: CachedToken = {
    accessToken,
    scope,
    storeDomain: storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(TOKEN_CACHE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  logger.info(`OAuth token cached at ${path.basename(TOKEN_CACHE)} (gitignored)`);
}

/** Load env and ensure accessToken is set (static or OAuth). */
export async function ensureAccessToken(): Promise<Env> {
  const env = assertEnv();
  if (env.accessToken) return env;

  const oauth = getOAuthConfig();
  const cached = loadCachedToken(oauth.storeDomain);
  if (cached) {
    env.accessToken = cached;
    return env;
  }

  const token = await getAccessTokenViaOAuth({
    storeDomain: oauth.storeDomain,
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
    scopes: oauth.scopes,
  });
  env.accessToken = token.accessToken;
  saveCachedToken(oauth.storeDomain, token.accessToken, token.scope);
  return env;
}
