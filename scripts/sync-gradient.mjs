#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../mesh-gradient');
const dest = resolve(here, '../public/gradient');
const entries = ['index.html', 'styles.css', 'src'];

if (!existsSync(source)) {
  console.log(`[sync-gradient] ${source} not found, skipping (CI build will use committed files).`);
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
for (const name of entries) {
  cpSync(resolve(source, name), resolve(dest, name), { recursive: true });
}
console.log(`[sync-gradient] copied ${entries.join(', ')} from ${source} -> ${dest}`);
