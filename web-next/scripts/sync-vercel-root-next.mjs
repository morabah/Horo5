import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webNextDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webNextDir, "..");
const sourceDir = path.join(webNextDir, ".next");
const targetDir = path.join(repoRoot, ".next");

if (!process.env.VERCEL) {
  process.exit(0);
}

if (!fs.existsSync(sourceDir)) {
  console.warn(`[vercel-sync] Skipping sync because ${sourceDir} does not exist.`);
  process.exit(0);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`[vercel-sync] Mirrored ${sourceDir} -> ${targetDir}`);
