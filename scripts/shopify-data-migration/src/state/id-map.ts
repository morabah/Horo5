import * as fs from 'fs';
import * as path from 'path';

export interface IdMap {
  metaobjects: Record<string, string>; // type -> GraphQL ID
  products: Record<string, string>; // handle -> Shopify product ID
  collections: Record<string, string>; // handle -> Shopify collection ID
  files: Record<string, string>; // source URL/path -> Shopify file ID
}

export function createIdMap(): IdMap {
  return { metaobjects: {}, products: {}, collections: {}, files: {} };
}

export function saveIdMap(map: IdMap, outDir: string): void {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const filePath = path.join(outDir, 'id-map.json');
  fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf-8');
}

export function loadIdMap(outDir: string): IdMap | null {
  const filePath = path.join(outDir, 'id-map.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as IdMap;
}
