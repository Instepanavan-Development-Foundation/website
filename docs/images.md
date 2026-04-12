# Image Strategy

## TODO

- [ ] Implement image resizing in Strapi using `jimp` (pure JavaScript, no native deps). On upload, generate `thumbnail`, `small`, `medium`, `large` variants and store them in Strapi's `formats` field. Sharp cannot be used — the production VPS CPU (AMD Phenom II) does not support SSE4.1/AVX2. See the "How It Works" section below for the planned design.

## Overview

Image optimization is **not yet implemented**. Images are served as originals. Next.js image optimization (`/_next/image`, powered by `sharp`) is intentionally not used.

## Why Not sharp

The production VPS (Contabo, AMD Phenom II X4 965) only supports SSE4a. Modern `sharp` prebuilt binaries require SSE4.1/SSE4.2, which this CPU does not have. Loading `sharp` causes a `SIGILL` (Illegal Instruction) crash that takes down the entire Node.js process.

`jimp` is pure JavaScript — no native binaries, no CPU instruction requirements.

## How It Works

When an image is uploaded to Strapi, a lifecycle hook in [`server/src/lib/imageProcessing.ts`](../server/src/lib/imageProcessing.ts) fires after the file record is created. It uses `jimp` to generate responsive variants and saves them alongside the original in the uploads directory.

| Format      | Max width | Use case               |
|-------------|-----------|------------------------|
| `thumbnail` | 156px     | Avatars, tiny previews |
| `small`     | 500px     | Card thumbnails        |
| `medium`    | 750px     | Content images         |
| `large`     | 1000px    | Hero banners           |

Variants are only generated if the original image is larger than the breakpoint. The formats metadata is stored in Strapi's `plugin::upload.file` record, identical to how sharp would have stored it.

## Usage in Frontend

All image URLs go through [`client/src/helpers/getMediaUrl.ts`](../client/src/helpers/getMediaUrl.ts).

**Basic usage** (returns full original):
```tsx
import getMediaSrc from "@/src/helpers/getMediaUrl";

<img src={getMediaSrc(project.image)} />
```

**With a format** (returns pre-resized variant, falls back to original if not available):
```tsx
// Good choices by context:
getMediaSrc(image, "thumbnail")  // avatars
getMediaSrc(image, "small")      // project cards
getMediaSrc(image, "medium")     // blog content
getMediaSrc(image, "large")      // hero banners
```

## Rules

- **Never use `next/image`** — it loads `sharp` and will crash the container with SIGILL.
- **Always use HeroUI `<Image>`** or a plain `<img>` for rendering.
- **Use the `format` parameter** to serve appropriately sized variants.
- Variants are only generated for **new uploads** after this change was deployed. Existing images will serve the original until re-uploaded.
- `image/gif` and `image/svg+xml` are skipped (not resized).
