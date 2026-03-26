import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TEST_ENV = {
  DEV: false,
  VITE_SITE_URL: 'https://example.com',
  VITE_GA_MEASUREMENT_ID: '',
  VITE_META_PIXEL_ID: '',
  VITE_HORO_INSTAGRAM_URL: '',
  VITE_HORO_WHATSAPP_SUPPORT_URL: '',
  VITE_HORO_WHATSAPP_TRACKING_URL: '',
  VITE_HORO_SUPPORT_EFFECTIVE_DATE: '',
};

export async function loadTestModule(entryFileName) {
  const outfile = path.join(
    os.tmpdir(),
    `horo-test-${path.basename(entryFileName, path.extname(entryFileName))}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.mjs`,
  );

  await build({
    entryPoints: [path.join(projectRoot, 'scripts', entryFileName)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    define: {
      'import.meta.env': JSON.stringify(TEST_ENV),
    },
  });

  try {
    return await import(pathToFileURL(outfile).href);
  } finally {
    await fs.unlink(outfile).catch(() => {});
  }
}
