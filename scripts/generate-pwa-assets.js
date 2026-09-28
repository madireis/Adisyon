import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = zlib.crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function makePng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', idatCompressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Icon renderer
function renderWotsIcon(x, y, w, h, isMaskable) {
  const cx = w / 2;
  const cy = h / 2;
  const u = (x - cx) / (w / 2);
  const v = (y - cy) / (h / 2);
  const rDist = Math.sqrt(u * u + v * v);

  // Squircle for standard icons, full bleed for maskable
  let bgAlpha = 255;
  if (!isMaskable) {
    const p = 4.2;
    const squircle = Math.pow(Math.abs(u), p) + Math.pow(Math.abs(v), p);
    if (squircle > 1.02) return [0, 0, 0, 0];
    if (squircle > 0.96) bgAlpha = Math.round((1 - (squircle - 0.96) / 0.06) * 255);
  }

  // Warm restaurant orange gradient: #f97316 (top) -> #ea580c -> #c2410c (bottom)
  const grad = (u * 0.3 + v + 1.2) / 2.5;
  const bgR = Math.round(249 - grad * 50);
  const bgG = Math.round(115 - grad * 55);
  const bgB = Math.round(22 - grad * 12);

  // Safe-zone scaling for Android adaptive icons vs standard
  const scale = isMaskable ? 0.62 : 0.76;
  const su = u / scale;
  const sv = v / scale;

  // Outer plate rim (subtle golden-white ring)
  const ringDist = Math.sqrt(su * su + sv * sv);
  if (ringDist > 0.88 && ringDist < 0.95) {
    const ringAlpha = Math.round(bgAlpha * 0.45);
    return [255, 247, 237, ringAlpha];
  }

  // Modern stylized W monogram
  const d1 = distToSegment(su, sv, -0.52, -0.38, -0.28, 0.40);
  const d2 = distToSegment(su, sv, -0.28, 0.40, 0.0, -0.10);
  const d3 = distToSegment(su, sv, 0.0, -0.10, 0.28, 0.40);
  const d4 = distToSegment(su, sv, 0.28, 0.40, 0.52, -0.38);

  const minD = Math.min(d1, d2, d3, d4);
  const stroke = 0.10;

  if (minD < stroke) {
    // Crisp white foreground with subtle anti-aliasing
    if (minD > stroke - 0.02) {
      const blend = (stroke - minD) / 0.02;
      return [
        Math.round(255 * blend + bgR * (1 - blend)),
        Math.round(255 * blend + bgG * (1 - blend)),
        Math.round(255 * blend + bgB * (1 - blend)),
        bgAlpha
      ];
    }
    return [255, 255, 255, bgAlpha];
  }

  // Chef crown / warm golden star accent above the W center
  const crownDist = Math.hypot(su, sv - (-0.46));
  if (crownDist < 0.09) {
    return [254, 215, 170, bgAlpha]; // Amber-200 accent
  }

  // Subtle radial ambient light in center
  const ambient = Math.max(0, 1 - rDist * 1.1) * 0.15;
  const r = Math.min(255, Math.round(bgR + 255 * ambient));
  const g = Math.min(255, Math.round(bgG + 180 * ambient));
  const b = Math.min(255, Math.round(bgB + 100 * ambient));

  return [r, g, b, bgAlpha];
}

// Generate files into public/icons
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

console.log('Generating PWA Icons in:', iconsDir);

// 1. icon-192.png
const p192 = makePng(192, 192, (x, y, w, h) => renderWotsIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), p192);
console.log('✓ icon-192.png');

// 2. icon-512.png
const p512 = makePng(512, 512, (x, y, w, h) => renderWotsIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), p512);
console.log('✓ icon-512.png');

// 3. icon-maskable-192.png
const pm192 = makePng(192, 192, (x, y, w, h) => renderWotsIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.png'), pm192);
console.log('✓ icon-maskable-192.png');

// 4. icon-maskable-512.png
const pm512 = makePng(512, 512, (x, y, w, h) => renderWotsIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), pm512);
console.log('✓ icon-maskable-512.png');

// 5. apple-touch-icon.png (180x180)
const pApple = makePng(180, 180, (x, y, w, h) => renderWotsIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pApple);
console.log('✓ apple-touch-icon.png');

// 6. Vector SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="60%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.25" stroke-dasharray="8 6"/>
  <g filter="url(#shadow)">
    <!-- Crown dot -->
    <circle cx="256" cy="145" r="16" fill="#fed7aa"/>
    <!-- Stylized W -->
    <path d="M 148 165 L 205 350 L 256 228 L 307 350 L 364 165" 
          fill="none" 
          stroke="#ffffff" 
          stroke-width="38" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
  </g>
  <text x="256" y="425" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" letter-spacing="6" fill="#ffffff" fill-opacity="0.95">WOT'S POS</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✓ icon.svg');

// Also update public/favicon.svg
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svgContent, 'utf-8');
console.log('✓ Updated public/favicon.svg');

console.log('All PWA assets successfully created!');
