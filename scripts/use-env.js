const fs = require('fs');
const path = require('path');

const profile = process.argv[2];
if (!profile) {
  console.error('Usage: node scripts/use-env.js <env-profile-file>');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const src = path.resolve(repoRoot, profile);
const dest = path.resolve(repoRoot, '.env');

if (!fs.existsSync(src)) {
  console.error(`[env] Profile not found: ${src}`);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(`[env] Copied ${profile} -> .env`);
