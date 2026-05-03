/* eslint-disable */
/**
 * Генератор иконок PWA из SVG-шаблона.
 * Без сторонних зависимостей: чистый Node + zlib.
 *
 * Запуск: node scripts/generate-pwa-icons.js
 *
 * Создаёт:
 *  public/icons/icon-192.png         — для ярлыка
 *  public/icons/icon-512.png         — крупный (Splash, store)
 *  public/icons/icon-maskable-192.png — с safe-zone для Android adaptive
 *  public/icons/icon-maskable-512.png
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ===== Цвета бренда =====
const BG = [108, 99, 255, 255];   // #6c63ff
const FG = [255, 255, 255, 255];  // #ffffff
const MASK_BG = [108, 99, 255, 255]; // тот же фон — Android накладывает свою маску

// ===== Шрифт 5×7 =====
const FONT = {
  K: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  C: [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1],
  ],
};

const TEXT = ['K', 'C'];
const FONT_W = 5;
const FONT_H = 7;
const SPACE_COLS = 1; // расстояние между буквами (в "пикселях" шрифта)

// ===== PNG writer (RGBA, без сжатия фильтрами) =====
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crc32(buf) {
  let c;
  if (!crc32.table) {
    crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      crc32.table[n] = c >>> 0;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crc32.table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function buildPng(size, drawPixel) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type = RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // IDAT — построчно: 1 байт фильтра + RGBA-пиксели
  const rowBytes = size * 4;
  const raw = Buffer.alloc(size * (1 + rowBytes));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawPixel(x, y);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
      raw[p++] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ===== Геометрия =====

/**
 * Возвращает функцию (x,y) → [r,g,b,a] для отрисовки иконки.
 * @param size      выходной размер картинки
 * @param textArea  доля ширины/высоты, занимаемая текстом (0..1)
 * @param bg, fg    цвета фона и текста
 */
function makeDrawer(size, textArea, bg, fg) {
  const totalCols = TEXT.length * FONT_W + (TEXT.length - 1) * SPACE_COLS;
  const totalRows = FONT_H;
  const targetW = size * textArea;
  const targetH = size * textArea;
  // Размер "пикселя" шрифта (квадратный, чтобы не искажать)
  const px = Math.floor(Math.min(targetW / totalCols, targetH / totalRows));
  const textW = px * totalCols;
  const textH = px * totalRows;
  const offX = Math.floor((size - textW) / 2);
  const offY = Math.floor((size - textH) / 2);

  return function drawPixel(x, y) {
    if (x < offX || y < offY || x >= offX + textW || y >= offY + textH) return bg;
    const localX = x - offX;
    const localY = y - offY;
    const row = Math.floor(localY / px);
    const col = Math.floor(localX / px);
    // Какая буква?
    let acc = 0;
    for (let i = 0; i < TEXT.length; i++) {
      if (col < acc + FONT_W) {
        const localCol = col - acc;
        const bitmap = FONT[TEXT[i]];
        return bitmap[row][localCol] ? fg : bg;
      }
      acc += FONT_W + SPACE_COLS;
      if (col < acc) return bg; // пробел между буквами
    }
    return bg;
  };
}

// ===== Запись =====

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const variants = [
  { name: 'icon-192.png',           size: 192, area: 0.66, bg: BG },
  { name: 'icon-512.png',           size: 512, area: 0.66, bg: BG },
  { name: 'icon-maskable-192.png',  size: 192, area: 0.46, bg: MASK_BG }, // safe zone ~80% диаметра
  { name: 'icon-maskable-512.png',  size: 512, area: 0.46, bg: MASK_BG },
];

for (const v of variants) {
  const drawer = makeDrawer(v.size, v.area, v.bg, FG);
  const png = buildPng(v.size, drawer);
  const outPath = path.join(outDir, v.name);
  fs.writeFileSync(outPath, png);
  console.log(`  wrote ${v.name} (${png.length} bytes, ${v.size}×${v.size})`);
}

console.log('PWA icons regenerated.');
