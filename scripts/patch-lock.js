const fs = require('fs');

const medusaLock = JSON.parse(fs.readFileSync('medusa-backend/package-lock.json', 'utf8'));
const zodNodeModules = medusaLock.packages['node_modules/zod'];

function patchLock(path) {
  const lock = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (lock.packages && lock.packages['node_modules/zod']) {
    lock.packages['node_modules/zod'] = zodNodeModules;
  }
  
  // lockfile v3 doesn't typically have a separate 'dependencies' tree at the root for this unless required, 
  // but if it does, let's update it too, though v3 mainly uses packages
  if (lock.dependencies && lock.dependencies['zod']) {
    lock.dependencies['zod'] = {
      version: zodNodeModules.version,
      resolved: zodNodeModules.resolved,
      integrity: zodNodeModules.integrity
    };
  }

  fs.writeFileSync(path, JSON.stringify(lock, null, 2));
  console.log('Patched', path);
}

patchLock('web-next/package-lock.json');
patchLock('shopify-headless/package-lock.json');
