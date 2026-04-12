import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webNextDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webNextDir, "..");
const sharedPublicDir = path.join(repoRoot, "web", "public");
const appPublicDir = path.join(webNextDir, "public");

if (!fs.existsSync(sharedPublicDir)) {
  console.warn(`[public-sync] Shared public directory not found: ${sharedPublicDir}`);
  process.exit(0);
}

fs.mkdirSync(appPublicDir, { recursive: true });

for (const entry of fs.readdirSync(sharedPublicDir)) {
  const source = path.join(sharedPublicDir, entry);
  const target = path.join(appPublicDir, entry);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}

console.log(`[public-sync] Mirrored ${sharedPublicDir} -> ${appPublicDir}`);
