import fs from 'fs';
import path from 'path';

/**
 * Generates a local JSON snapshot of the Medusa catalog.
 * This replaces hardcoded dev-fixtures, allowing frontend developers
 * to work against a recent copy of the production catalog without
 * needing to run the full Medusa backend locally.
 */
async function generateSnapshot() {
  const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
  const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  console.log(`[Snapshot] Fetching storefront catalog from ${MEDUSA_URL}...`);

  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (PUBLISHABLE_KEY) {
    headers['x-publishable-api-key'] = PUBLISHABLE_KEY;
  }

  try {
    const res = await fetch(`${MEDUSA_URL}/storefront/catalog`, { headers });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch catalog: ${res.status} ${res.statusText}`);
    }

    const catalogData = await res.json();
    
    // Validate we got the expected structure
    if (!catalogData || !catalogData.products) {
      throw new Error('Received malformed catalog payload');
    }

    const outPath = path.resolve(process.cwd(), 'src/storefront/data/dev-catalog-snapshot.json');
    fs.writeFileSync(outPath, JSON.stringify(catalogData, null, 2), 'utf-8');
    
    console.log(`[Snapshot] Successfully wrote snapshot to: src/storefront/data/dev-catalog-snapshot.json`);
    console.log(`[Snapshot] Snapshot contains:`);
    console.log(`  - Products: ${catalogData.products?.length || 0}`);
    console.log(`  - Feelings: ${catalogData.feelings?.length || 0}`);
    console.log(`  - Occasions: ${catalogData.occasions?.length || 0}`);
    console.log(`  - Artists: ${catalogData.artists?.length || 0}`);
  } catch (error) {
    console.error(`[Snapshot] Error generating catalog snapshot:`, error);
    process.exit(1);
  }
}

generateSnapshot();
