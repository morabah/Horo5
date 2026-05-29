#!/usr/bin/env node
/**
 * Full HORO launch automation: definitions (optional), content, catalog, theme settings.
 *
 *   npm run seed:launch-all
 *   npm run seed:launch-all -- --dry-run
 *   npm run seed:launch-all -- --skip-content   # catalog + theme only
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');
const skipContent = process.argv.includes('--skip-content');

function runNpm(script: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = ['run', script];
    if (dryRun && script.includes('content')) args.push('--', '--dry-run');
    if (dryRun && script.includes('catalog')) args.push('--', '--dry-run');

    const child = spawn('npm', args, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ...(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? { SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN } : {}),
      },
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  logger.info('\n========== HORO full launch seed ==========\n');

  if (!skipContent) {
    logger.info('Step 1/3: Taxonomy (collections, metaobjects, pages)…\n');
    const code = await runNpm('seed:launch-content');
    if (code !== 0) {
      logger.warn('launch-content exited non-zero — continuing if partial success is OK');
    }
  }

  logger.info('\nStep 2/3: Catalog (products, metafields, collections, theme)…\n');
  const catalogCode = await runNpm('seed:launch-catalog');
  if (catalogCode !== 0) process.exit(catalogCode);

  logger.info('\nStep 3/3: Verify…\n');
  const verifyCode = await runNpm('verify:full');
  if (verifyCode !== 0) {
    logger.warn('verify:full reported gaps — review output above');
  }

  logger.info('\nStep 4/4: Patch local theme settings (gift wrap, trust, delivery)…\n');
  const patchCode = await runNpm('patch:theme-local');
  if (patchCode !== 0) {
    logger.warn('patch:theme-local failed — set HORO settings in Admin → Theme → Customize');
  } else {
    logger.info(
      'Push theme (after theme check + QA): cd ../../shopify-theme && shopify theme check && shopify theme push --theme $SHOPIFY_THEME_ID --only config/settings_data.json\n'
    );
  }

  logger.success('\n========== Done ==========');
  logger.info(
    'Partner app: approve read_content, read_publications, read_themes in Dev Dashboard → re-run with SHOPIFY_FORCE_OAUTH=1 for API pages/publish/theme.'
  );
  logger.info('Manual: 3 hub pages if API 403, product images, checkout audit, mobile QA.\n');
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
