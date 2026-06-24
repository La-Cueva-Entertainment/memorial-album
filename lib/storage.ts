import path from 'path';
import fs from 'fs';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const TRACKS_DIR = path.join(UPLOADS_DIR, 'tracks');

export function ensureDataDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(TRACKS_DIR, { recursive: true });
}

const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB ?? '20', 10);
export const MAX_BYTES = MAX_MB * 1024 * 1024;

// ── Magic-bytes validation ────────────────────────────────────────────────────

const IMAGE_SIGNATURES: Array<{ bytes: number[]; offset?: number }> = [
  { bytes: [0xff, 0xd8, 0xff] },                                  // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
  { bytes: [0x47, 0x49, 0x46, 0x38] },                            // GIF
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },                 // WebP (RIFF header)
];

/** Returns true only if the buffer starts with a known image signature. */
export function isValidImageBuffer(buf: Buffer): boolean {
  return IMAGE_SIGNATURES.some(sig => {
    const offset = sig.offset ?? 0;
    return sig.bytes.every((b, i) => buf[offset + i] === b);
  });
}

// ── Audio magic-bytes ─────────────────────────────────────────────────────────

const AUDIO_SIGNATURES: Array<{ bytes: number[]; offset?: number }> = [
  { bytes: [0x49, 0x44, 0x33] },                           // MP3 (ID3 tag)
  { bytes: [0xff, 0xfb] },                                  // MP3 (sync)
  { bytes: [0xff, 0xf3] },                                  // MP3 (sync)
  { bytes: [0xff, 0xf2] },                                  // MP3 (sync)
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },          // M4A/AAC (ftyp)
  { bytes: [0x4f, 0x67, 0x67, 0x53] },                     // OGG
  { bytes: [0x66, 0x4c, 0x61, 0x43] },                     // FLAC
  { bytes: [0x52, 0x49, 0x46, 0x46] },                     // WAV (RIFF)
];

/** Returns true only if the buffer matches a known audio signature. */
export function isValidAudioBuffer(buf: Buffer): boolean {
  return AUDIO_SIGNATURES.some(sig => {
    const offset = sig.offset ?? 0;
    return sig.bytes.every((b, i) => buf[offset + i] === b);
  });
}

// ── Image processing ──────────────────────────────────────────────────────────

/**
 * Resize an image buffer to fit within maxDim × maxDim, JPEG at given quality.
 * Returns the processed buffer.
 */
export async function processImage(
  inputBuffer: Buffer,
  maxDim: number,
  quality: number
): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp(inputBuffer)
    .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: Math.round(quality * 100) })
    .toBuffer();
}

export async function saveUpload(buffer: Buffer, ext = 'jpg', originalBuffer?: Buffer, originalMime?: string): Promise<string> {
  const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '');
  const apiKey = process.env.IMMICH_API_KEY;
  const albumId = process.env.IMMICH_ALBUM_ID;

  if (serverUrl && apiKey) {
    try {
      const uploadBuf = originalBuffer ?? buffer;
      // Use the actual MIME type of the original — sending PNG bytes as image/jpeg confuses Immich
      const uploadMime = originalMime ?? mimeForExt(ext);
      const uploadExt = uploadMime.split('/')[1]?.replace('jpeg', 'jpg') ?? ext;
      const now = new Date().toISOString();
      const form = new FormData();
      form.append('deviceAssetId', `memorial-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      form.append('deviceId', 'memorial-scrapbook');
      form.append('fileCreatedAt', now);
      form.append('fileModifiedAt', now);
      form.append('assetData', new Blob([new Uint8Array(uploadBuf)], { type: uploadMime }), `upload.${uploadExt}`);

      const uploadRes = await fetch(`${serverUrl}/api/assets`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: form,
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.text().catch(() => '');
        throw new Error(`Immich upload failed: ${uploadRes.status} ${body}`);
      }

      const data = await uploadRes.json() as { id: string; status?: string };
      // 'duplicate' status still returns the existing asset id
      if (!data.id) throw new Error('Immich response missing id');

      if (albumId && /^[a-zA-Z0-9_-]+$/.test(albumId)) {
        const albumRes = await fetch(`${serverUrl}/api/albums/${albumId}/assets`, {
          method: 'PUT',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [data.id] }),
        }).catch(e => { console.error('[saveUpload] album add network error:', e); return null; });
        if (albumRes && !albumRes.ok) {
          console.error('[saveUpload] album add failed:', albumRes.status, albumId);
        }
      }

      return `immich:${data.id}`;
    } catch (err) {
      console.error('[saveUpload] Immich error, falling back to local:', err);
    }
  }

  ensureDataDirs();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, name), buffer);
  return name;
}

/** Resolve MIME type from file extension */
export function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    wav: 'audio/wav',
  };
  return map[ext.toLowerCase()] ?? 'application/octet-stream';
}
