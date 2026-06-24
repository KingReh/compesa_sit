#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const DIST_DIR = resolve(process.cwd(), 'dist');
const SW_PATH = join(DIST_DIR, 'sw.js');

async function main() {
  if (!existsSync(SW_PATH)) {
    console.error(`[inject-sw-version] Erro: sw.js não encontrado em ${SW_PATH}`);
    process.exit(1);
  }

  const version = Date.now().toString();
  let content = await readFile(SW_PATH, 'utf8');

  // Substitui o placeholder no sw.js
  if (content.includes('__SW_VERSION__')) {
    content = content.replace(/__SW_VERSION__/g, version);
    await writeFile(SW_PATH, content, 'utf8');
    console.log(`[inject-sw-version] Sucesso: Versão ${version} injetada no sw.js.`);
  } else {
    console.warn('[inject-sw-version] Aviso: Placeholder __SW_VERSION__ não encontrado no sw.js.');
  }
}

main().catch((err) => {
  console.error('[inject-sw-version] Falha ao rodar script:', err);
  process.exit(1);
});
