#!/usr/bin/env node
// Verifica que todos os ícones referenciados no manifest existem e são PNGs válidos.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const PUBLIC_DIR = resolve(process.cwd(), 'public');
const MANIFEST_PATH = join(PUBLIC_DIR, 'manifest.json');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(msg) {
  console.error(`\x1b[31m[verify-manifest-icons] ${msg}\x1b[0m`);
  process.exit(1);
}

async function isValidPng(filePath) {
  const buf = await readFile(filePath);
  if (buf.length < 8) return { ok: false, reason: 'arquivo muito pequeno' };
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { ok: false, reason: `assinatura PNG inválida (got ${buf.subarray(0, 8).toString('hex')})` };
  }
  // IHDR width/height @ bytes 16-23
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return { ok: false, reason: 'dimensões zeradas no IHDR' };
  return { ok: true, width, height };
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) fail(`manifest não encontrado em ${MANIFEST_PATH}`);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch (e) {
    fail(`manifest.json inválido: ${e.message}`);
  }
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  if (icons.length === 0) fail('manifest não declara nenhum ícone.');

  const errors = [];
  for (const icon of icons) {
    const rel = String(icon.src || '').replace(/^\//, '');
    const abs = join(PUBLIC_DIR, rel);
    if (!existsSync(abs)) { errors.push(`✗ ${icon.src} — arquivo ausente em public/`); continue; }
    const res = await isValidPng(abs);
    if (!res.ok) { errors.push(`✗ ${icon.src} — ${res.reason}`); continue; }

    if (icon.sizes && icon.sizes !== 'any') {
      const [w, h] = icon.sizes.split('x').map(Number);
      if (w && h && (w !== res.width || h !== res.height)) {
        errors.push(`✗ ${icon.src} — sizes="${icon.sizes}" mas PNG é ${res.width}x${res.height}`);
        continue;
      }
    }
    console.log(`✓ ${icon.src} (${res.width}x${res.height}, purpose=${icon.purpose || 'any'})`);
  }

  if (errors.length) {
    console.error('');
    errors.forEach((e) => console.error(`\x1b[31m${e}\x1b[0m`));
    fail(`${errors.length} ícone(s) inválido(s) no manifest.json.`);
  }
  console.log(`\n[verify-manifest-icons] OK — ${icons.length} ícones válidos.`);
}

main().catch((e) => fail(e.stack || e.message));
