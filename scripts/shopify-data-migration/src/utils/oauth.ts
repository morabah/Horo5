/**
 * OAuth token exchange for Partner apps.
 *
 * Flow:
 * 1. Start a local HTTP server on a random port to capture the callback.
 * 2. Open the authorization URL in the user's browser.
 * 3. User authorizes the app.
 * 4. Shopify redirects to the local server with a `code` parameter.
 * 5. Exchange the code for an access token.
 * 6. Return the token.
 */

import * as http from 'http';
import * as logger from './logger.js';

interface OAuthConfig {
  storeDomain: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
}

interface TokenResult {
  accessToken: string;
  scope: string;
}

/**
 * Run the OAuth flow and return an access token.
 */
export async function getAccessTokenViaOAuth(config: OAuthConfig): Promise<TokenResult> {
  const domain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Start local server to capture callback on a random available port
  const server = http.createServer();

  let port: number;
  try {
    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          port = address.port;
        } else {
          reject(new Error('Failed to get server address'));
        }
        resolve();
      });
      server.on('error', (err: NodeJS.ErrnoException) => {
        reject(err);
      });
    });
  } catch (err) {
    throw err;
  }

  const redirectUri = `http://127.0.0.1:${port!}/callback`;

  // Build authorization URL
  const authUrl = new URL(`https://${domain}/admin/oauth/authorize`);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('scope', config.scopes);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');

  console.log(`\n\x1b[36m[oauth]\x1b[0m Opening browser for authorization...`);
  console.log(`\x1b[36m[oauth]\x1b[0m If the browser doesn't open, visit this URL manually:\n`);
  console.log(`  ${authUrl.toString()}\n`);

  // Try to open browser
  try {
    const { exec } = await import('child_process');
    const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${openCmd} "${authUrl.toString()}"`);
  } catch {
    logger.warn('Could not open browser automatically. Please open the URL manually.');
  }

  // Wait for callback with code
  const code = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth timeout: no callback received within 120 seconds'));
    }, 120_000);

    server.on('request', (req, res) => {
      const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);

      if (url.pathname === '/callback') {
        const codeParam = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');

        if (errorParam) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorization denied</h1><p>${errorParam}</p><p>You can close this tab.</p>`);
          clearTimeout(timeout);
          server.close();
          reject(new Error(`OAuth error: ${errorParam}`));
          return;
        }

        if (codeParam) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorized!</h1><p>You can close this tab and return to the terminal.</p>`);
          clearTimeout(timeout);
          server.close();
          resolve(codeParam);
          return;
        }
      }

      res.writeHead(404);
      res.end('Not found');
    });
  });

  // Exchange code for token
  logger.info('Exchanging authorization code for access token...');

  const tokenResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Token exchange failed (HTTP ${tokenResponse.status}): ${text}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string; scope: string };

  return {
    accessToken: tokenData.access_token,
    scope: tokenData.scope,
  };
}
