// ponytail: assert-based self-check, no framework. node selfcheck.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = import.meta.dirname;
const png = readFileSync(join(here, 'entry.png'));
const dir = mkdtempSync(join(tmpdir(), 'selfcheck-'));
const run = (args: string[], out: string) => {
  try {
    const stdout = execFileSync('node', [join(here, 'main.ts'), ...args], {
      env: { ...process.env, MAKEFUN_OUTPUT_DIR: out },
      stdio: 'pipe',
    });
    return { code: 0, msg: String(stdout) };
  } catch (e: any) {
    return { code: e.status, msg: String(e.stderr) };
  }
};

const good = run([], join(dir, 'good'));
assert(good.code === 0, 'good exits 0');
assert(readFileSync(join(dir, 'good', 'entry.png')).equals(png), 'copy byte-identical');

const cases: [string, Buffer, number, string][] = [
  ['magic', Buffer.concat([Buffer.from('GIF89a'), png.subarray(6)]), 1, 'format'],
  ['size', Buffer.concat([png, Buffer.alloc(1024 * 1024)]), 2, 'size'],
  ['dims', (() => { const b = Buffer.from(png); b.writeUInt32BE(4096, 16); b.writeUInt32BE(4096, 20); return b; })(), 3, 'dimensions'],
  ['trunc', png.subarray(0, png.length - 500), 4, 'intact'],
  ['crc', (() => { const b = Buffer.from(png); b[200] ^= 0xff; return b; })(), 4, 'intact'],
];
for (const [name, bytes, code, word] of cases) {
  const p = join(dir, `${name}.png`);
  writeFileSync(p, bytes);
  const r = run([p], join(dir, `out-${name}`));
  assert(r.code === code, `${name}: exit ${code}, got ${r.code}`);
  assert(r.msg.includes(word), `${name}: message names "${word}"`);
  assert(!existsSync(join(dir, `out-${name}`)), `${name}: nothing published`);
}

const check = run(['--check'], join(dir, 'never'));
assert(check.code === 0 && !existsSync(join(dir, 'never')), '--check writes nothing');
console.log(`OK ${cases.length + 3} checks passed`);
