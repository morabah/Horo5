import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');

const sitemapPath = path.join(distRoot, 'sitemap.xml');
const robotsPath = path.join(distRoot, 'robots.txt');

for (const filePath of [sitemapPath, robotsPath]) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing SEO build asset: ${path.relative(projectRoot, filePath)}`);
    process.exit(1);
  }
}

const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const robots = fs.readFileSync(robotsPath, 'utf8');

if (!sitemap.includes('<urlset') || !sitemap.includes('/search</loc>')) {
  console.error('sitemap.xml is missing expected public routes.');
  process.exit(1);
}

if (!robots.includes('Sitemap: ') || !robots.includes('/sitemap.xml')) {
  console.error('robots.txt is missing the sitemap declaration.');
  process.exit(1);
}

console.log('HORO SEO assets verification passed.');
