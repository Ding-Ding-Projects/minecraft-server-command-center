import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "assets", "app-mark.ico");
const MASTER_SIZE = 64;
// Keep the 256px entry first: icon converters that inspect the first entry see
// a Squirrel-compatible source, while Windows can still select smaller sizes.
const ICON_SIZES = [256, 128, 64, 48, 32, 24, 16];

function createMasterMark() {
  const rgba = new Uint8Array(MASTER_SIZE * MASTER_SIZE * 4);

  function pixel(x, y, red, green, blue, alpha = 255) {
    if (x < 0 || y < 0 || x >= MASTER_SIZE || y >= MASTER_SIZE) return;
    const index = (y * MASTER_SIZE + x) * 4;
    rgba[index] = red;
    rgba[index + 1] = green;
    rgba[index + 2] = blue;
    rgba[index + 3] = alpha;
  }

  const radius = 15;
  for (let y = 0; y < MASTER_SIZE; y += 1) {
    for (let x = 0; x < MASTER_SIZE; x += 1) {
      const cx = x < radius ? radius - x : x > MASTER_SIZE - radius - 1 ? x - (MASTER_SIZE - radius - 1) : 0;
      const cy = y < radius ? radius - y : y > MASTER_SIZE - radius - 1 ? y - (MASTER_SIZE - radius - 1) : 0;
      if (cx * cx + cy * cy <= radius * radius) {
        const shade = 26 + Math.round((x + y) / 8);
        pixel(x, y, 12, shade + 18, shade + 12);
      }
    }
  }

  for (let offset = 0; offset < 6; offset += 1) {
    for (let step = 0; step < 20; step += 1) {
      pixel(16 + step, 18 + step + offset, 75, 238, 170);
      pixel(16 + step, 46 - step + offset, 75, 238, 170);
    }
    for (let line = 0; line < 19; line += 1) {
      pixel(36 + line, 45 + offset, 238, 255, 244);
    }
  }

  return rgba;
}

function scaleNearest(source, sourceSize, size) {
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    const sourceY = Math.min(sourceSize - 1, Math.floor((y * sourceSize) / size));
    for (let x = 0; x < size; x += 1) {
      const sourceX = Math.min(sourceSize - 1, Math.floor((x * sourceSize) / size));
      const sourceOffset = (sourceY * sourceSize + sourceX) * 4;
      const targetOffset = (y * size + x) * 4;
      rgba[targetOffset] = source[sourceOffset];
      rgba[targetOffset + 1] = source[sourceOffset + 1];
      rgba[targetOffset + 2] = source[sourceOffset + 2];
      rgba[targetOffset + 3] = source[sourceOffset + 3];
    }
  }
  return rgba;
}

function buildBitmapImage(size, rgba) {
  const xorBytes = size * size * 4;
  const andStride = Math.ceil(size / 32) * 4;
  const andBytes = andStride * size;
  const bitmapHeaderSize = 40;
  const image = Buffer.alloc(bitmapHeaderSize + xorBytes + andBytes);

  image.writeUInt32LE(bitmapHeaderSize, 0);
  image.writeInt32LE(size, 4);
  image.writeInt32LE(size * 2, 8);
  image.writeUInt16LE(1, 12);
  image.writeUInt16LE(32, 14);
  image.writeUInt32LE(0, 16);
  image.writeUInt32LE(xorBytes, 20);

  let target = bitmapHeaderSize;
  for (let y = size - 1; y >= 0; y -= 1) {
    for (let x = 0; x < size; x += 1) {
      const source = (y * size + x) * 4;
      image[target] = rgba[source + 2];
      image[target + 1] = rgba[source + 1];
      image[target + 2] = rgba[source];
      image[target + 3] = rgba[source + 3];
      target += 4;
    }
  }

  return image;
}

function buildIco() {
  const master = createMasterMark();
  const images = ICON_SIZES.map((size) => ({
    size,
    bytes: buildBitmapImage(size, scaleNearest(master, MASTER_SIZE, size)),
  }));
  const directorySize = 6 + images.length * 16;
  const buffer = Buffer.alloc(directorySize + images.reduce((total, image) => total + image.bytes.length, 0));

  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(images.length, 4);

  let imageOffset = directorySize;
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const directoryOffset = 6 + index * 16;
    const dimension = image.size === 256 ? 0 : image.size;
    buffer.writeUInt8(dimension, directoryOffset);
    buffer.writeUInt8(dimension, directoryOffset + 1);
    buffer.writeUInt8(0, directoryOffset + 2);
    buffer.writeUInt8(0, directoryOffset + 3);
    buffer.writeUInt16LE(1, directoryOffset + 4);
    buffer.writeUInt16LE(32, directoryOffset + 6);
    buffer.writeUInt32LE(image.bytes.length, directoryOffset + 8);
    buffer.writeUInt32LE(imageOffset, directoryOffset + 12);
    image.bytes.copy(buffer, imageOffset);
    imageOffset += image.bytes.length;
  }

  return buffer;
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, buildIco());
console.log(`Generated ${output} (${ICON_SIZES.join(", ")}px)`);
