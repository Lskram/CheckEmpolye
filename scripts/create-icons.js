const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-Node PNG generator
function createPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: for each row, 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for radial gradient
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / (width / 2);
      const dy = (y - cy) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dark futuristic corporate background with blue/indigo radial glow
      if (dist < 0.75) {
        // Inner glowing badge
        rawData[pxOffset] = Math.floor(49 + (1.0 - dist) * 80);     // R
        rawData[pxOffset + 1] = Math.floor(46 + (1.0 - dist) * 120); // G
        rawData[pxOffset + 2] = Math.floor(129 + (1.0 - dist) * 126);// B
        rawData[pxOffset + 3] = 255;
      } else {
        // Dark background
        rawData[pxOffset] = 15;
        rawData[pxOffset + 1] = 23;
        rawData[pxOffset + 2] = 42;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(4 + 4 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc >>> 0, 8 + length);
  return buffer;
}

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPng(32, 32, 79, 70, 229));
console.log('✅ Generated icon-192.png, icon-512.png, apple-touch-icon.png, favicon.png successfully!');
