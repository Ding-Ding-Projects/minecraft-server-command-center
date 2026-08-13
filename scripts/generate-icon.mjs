import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "assets", "app-mark.ico");
const size = 64;
const rgba = new Uint8Array(size * size * 4);

function pixel(x, y, red, green, blue, alpha = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  rgba[index] = red;
  rgba[index + 1] = green;
  rgba[index + 2] = blue;
  rgba[index + 3] = alpha;
}

function roundedSquare() {
  const radius = 15;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cx = x < radius ? radius - x : x > size - radius - 1 ? x - (size - radius - 1) : 0;
      const cy = y < radius ? radius - y : y > size - radius - 1 ? y - (size - radius - 1) : 0;
      if (cx * cx + cy * cy <= radius * radius) {
        const shade = 26 + Math.round((x + y) / 8);
        pixel(x, y, 12, shade + 18, shade + 12);
      }
    }
  }
}

function drawMark() {
  for (let offset = 0; offset < 6; offset += 1) {
    for (let step = 0; step < 20; step += 1) {
      pixel(16 + step, 18 + step + offset, 75, 238, 170);
      pixel(16 + step, 46 - step + offset, 75, 238, 170);
    }
    for (let line = 0; line < 19; line += 1) {
      pixel(36 + line, 45 + offset, 238, 255, 244);
    }
  }
}

function buildIco() {
  roundedSquare();
  drawMark();

  const xorBytes = size * size * 4;
  const andStride = Math.ceil(size / 32) * 4;
  const andBytes = andStride * size;
  const headerSize = 6 + 16;
  const bitmapHeaderSize = 40;
  const imageBytes = bitmapHeaderSize + xorBytes + andBytes;
  const buffer = Buffer.alloc(headerSize + imageBytes);
  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(1, 4);
  buffer.writeUInt8(size, 6);
  buffer.writeUInt8(size, 7);
  buffer.writeUInt8(0, 8);
  buffer.writeUInt8(0, 9);
  buffer.writeUInt16LE(1, 10);
  buffer.writeUInt16LE(32, 12);
  buffer.writeUInt32LE(imageBytes, 14);
  buffer.writeUInt32LE(headerSize, 18);

  const imageOffset = headerSize;
  buffer.writeUInt32LE(bitmapHeaderSize, imageOffset);
  buffer.writeInt32LE(size, imageOffset + 4);
  buffer.writeInt32LE(size * 2, imageOffset + 8);
  buffer.writeUInt16LE(1, imageOffset + 12);
  buffer.writeUInt16LE(32, imageOffset + 14);
  buffer.writeUInt32LE(0, imageOffset + 16);
  buffer.writeUInt32LE(xorBytes, imageOffset + 20);

  let target = imageOffset + bitmapHeaderSize;
  for (let y = size - 1; y >= 0; y -= 1) {
    for (let x = 0; x < size; x += 1) {
      const source = (y * size + x) * 4;
      buffer[target] = rgba[source + 2];
      buffer[target + 1] = rgba[source + 1];
      buffer[target + 2] = rgba[source];
      buffer[target + 3] = rgba[source + 3];
      target += 4;
    }
  }
  return buffer;
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, buildIco());
console.log("Generated " + output);

