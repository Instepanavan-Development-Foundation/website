'use strict';

// No-op sharp stub for servers that lack SSE4.2/AVX (old Contabo VPS).
// Strapi uploads and serves original images without resizing or thumbnail generation.
// Returning format: undefined makes all isFit* checks false — Strapi skips processing.

function Sharp(input) {
  const self = {
    metadata: () => Promise.resolve({ format: undefined, width: 0, height: 0, size: 0 }),
    stats: () => Promise.resolve({ channels: [], isOpaque: true, entropy: 0, sharpness: 0, dominant: { r: 0, g: 0, b: 0 } }),
    resize: () => self,
    toFormat: () => self,
    jpeg: () => self,
    png: () => self,
    webp: () => self,
    tiff: () => self,
    gif: () => self,
    avif: () => self,
    withMetadata: () => self,
    flatten: () => self,
    rotate: () => self,
    toBuffer: () => Promise.resolve(Buffer.alloc(0)),
    toFile: (dest) => new Promise((resolve, reject) => {
      if (typeof input === 'string') {
        const fs = require('fs');
        const rd = fs.createReadStream(input);
        const wr = fs.createWriteStream(dest);
        rd.on('error', reject);
        wr.on('error', reject);
        wr.on('finish', () => resolve({ width: 0, height: 0, channels: 3, size: 0 }));
        rd.pipe(wr);
      } else {
        resolve({ width: 0, height: 0, channels: 3, size: 0 });
      }
    }),
    on: () => self,
    pipe: (dest) => dest,
  };
  return self;
}

Sharp.cache = () => ({});
Sharp.simd = () => false;
Sharp.concurrency = () => 0;
Sharp.counters = () => ({ queue: 0, process: 0 });
Sharp.versions = { vips: '8.15.0' };
Sharp.format = {};

module.exports = Sharp;
