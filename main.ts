import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';

const MAX_BYTES = 1024 * 1024;
const MAX_DIM = 1024;
const PNG_SIG = Buffer.from('89504e470d0a1a0a', 'hex');

type Fail = { code: number; rule: string };
const fail = (code: number, rule: string): Fail => ({ code, rule });

function dims(b: Buffer): { w: number; h: number } | Fail {
  if (b.length >= 24 && b.subarray(0, 8).equals(PNG_SIG)) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    // JPEG: walk markers to a Start-Of-Frame segment.
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return fail(1, 'format: not PNG or JPEG');
      const m = b[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return fail(1, 'format: not PNG or JPEG');
  }
  return fail(1, 'format: not PNG or JPEG');
}

// A truncated PNG keeps its signature and IHDR, so only a chunk walk proves it is whole.
function intact(b: Buffer): Fail | null {
  if (b.subarray(0, 8).equals(PNG_SIG)) {
    let i = 8;
    while (i + 12 <= b.length) {
      const len = b.readUInt32BE(i);
      const end = i + 12 + len;
      if (end > b.length) return fail(4, 'intact: file truncated mid-chunk');
      const type = b.toString('latin1', i + 4, i + 8);
      if (crc32(b.subarray(i + 4, i + 8 + len)) !== b.readUInt32BE(i + 8 + len))
        return fail(4, `intact: CRC mismatch in ${type} chunk`);
      i = end;
      if (type === 'IEND') return i === b.length ? null : fail(4, 'intact: trailing data after IEND');
    }
    return fail(4, 'intact: no IEND chunk (truncated)');
  }
  // JPEG: EOI marker closes the stream.
  return b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9
    ? null
    : fail(4, 'intact: missing JPEG EOI marker (truncated)');
}

function validate(b: Buffer): Fail | null {
  const d = dims(b);
  if ('code' in d) return d;
  if (b.length > MAX_BYTES) return fail(2, `size: ${b.length} bytes exceeds 1 MiB (${MAX_BYTES})`);
  if (d.w > MAX_DIM || d.h > MAX_DIM)
    return fail(3, `dimensions: ${d.w}x${d.h} exceeds ${MAX_DIM}x${MAX_DIM}`);
  return intact(b);
}

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const src = args.find((a) => a !== '--check') || join(import.meta.dirname, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const dst = join(outDir, 'entry.png');

const buf = readFileSync(src);
const bad = validate(buf);
if (bad) {
  console.error(`FAIL ${bad.rule}`);
  process.exit(bad.code);
}

if (checkOnly) {
  console.log(`OK valid: ${buf.length} bytes, would copy to ${dst}`);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

// ponytail: write temp + rename so a failed write never leaves a partial entry.png.
const tmp = `${dst}.tmp-${process.pid}`;
writeFileSync(tmp, buf);
renameSync(tmp, dst);

const written = readFileSync(dst);
if (!written.equals(buf)) {
  console.error('FAIL copy: written file differs from source');
  process.exit(5);
}
console.log(`OK copied ${buf.length} bytes to ${dst}`);
