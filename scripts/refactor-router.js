const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      callback(p);
    }
  }
}

walk('web-next/src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('react-router-dom') && !content.match(/<Link[^>]+to=/)) {
    return;
  }

  let hasNextLink = false;
  let nextNavImports = new Set();
  let hasAppSearchParams = false;
  
  // parse the react-router-dom import
  const rrdImportRegex = /import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?/;
  const rrdImportMatch = content.match(rrdImportRegex);
  
  if (rrdImportMatch) {
    const imported = rrdImportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    if (imported.includes('Link') || imported.includes('NavLink')) hasNextLink = true;
    if (imported.includes('useNavigate')) nextNavImports.add('useRouter');
    if (imported.includes('useLocation')) nextNavImports.add('usePathname');
    if (imported.includes('useParams')) nextNavImports.add('useParams');
    if (imported.includes('useSearchParams')) hasAppSearchParams = true;

    // Remove the old import
    content = content.replace(rrdImportRegex, '');

    // Inject new imports at the top
    let newImports = '';
    if (hasNextLink) {
      newImports += `import Link from 'next/link';\n`;
    }
    if (nextNavImports.size > 0) {
      newImports += `import { ${Array.from(nextNavImports).join(', ')} } from 'next/navigation';\n`;
    }
    if (hasAppSearchParams) {
      // Find a relative path to hooks
      const depth = filePath.split(path.sep).length - 'web-next/src/storefront/hooks'.split('/').length;
      newImports += `import { useAppSearchParams } from '@/storefront/hooks/useAppSearchParams';\n`;
    }
    
    content = newImports + content;
  }

  // 2. replace Link to= with Link href=
  content = content.replace(/<Link([^>]*?)\bto=/g, '<Link$1href=');
  
  // 3. NavLink to Link
  content = content.replace(/<NavLink([^>]*?)\bto=/g, '<Link$1href=');
  content = content.replace(/<\/NavLink>/g, '</Link>');

  // 4. useNavigate -> useRouter
  content = content.replace(/const navigate = useNavigate\(\)/g, 'const router = useRouter()');
  content = content.replace(/navigate\(\s*-1\s*\)/g, 'router.back()');
  content = content.replace(/navigate\(/g, 'router.push(');

  // 5. useLocation -> usePathname
  content = content.replace(/const location = useLocation\(\)/g, 'const pathname = usePathname()');
  content = content.replace(/const { pathname } = useLocation\(\)/g, 'const pathname = usePathname()');
  content = content.replace(/location\.pathname/g, 'pathname');
  // if location.search is used, we'll replace it with window.location.search or we can just leave it to fail type check and fix manually.
  content = content.replace(/location\.search/g, '(typeof window !== "undefined" ? window.location.search : "")');

  // 6. useSearchParams -> useAppSearchParams
  content = content.replace(/useSearchParams\(/g, 'useAppSearchParams(');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', filePath);
});
