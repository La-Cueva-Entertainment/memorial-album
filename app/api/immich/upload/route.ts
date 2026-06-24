import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import { randomUUID } from 'crypto';

export const maxDuration = 60;

/**
 * POST /api/immich/upload
 * Accepts: FormData { file: File }
 * Returns: { assetId: string }
 *
 * Server-side proxy — the Immich API key never reaches the client.
 */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '') ?? session.immich?.serverUrl;
  const apiKey = process.env.IMMICH_API_KEY ?? session.immich?.apiKey;

  if (!serverUrl || !apiKey) {
    return NextResponse.json({ error: 'Immich not configured' }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const maxBytes = (Number(process.env.MAX_UPLOAD_MB ?? 50)) * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File too large. Max ${process.env.MAX_UPLOAD_MB ?? 50} MB.` }, { status: 413 });
  }

  // Optional album quota check
  const albumId = process.env.IMMICH_ALBUM_ID;
  const quotaMb = Number(process.env.ALBUM_QUOTA_MB ?? 0);
  const globalQuotaGb = Number(process.env.GLOBAL_QUOTA_GB ?? 250);
  if (albumId && /^[a-zA-Z0-9_-]+$/.test(albumId)) {
    try {
      const albumRes = await fetch(`${serverUrl}/api/albums/${albumId}?withoutAssets=false`, {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      });
      if (albumRes.ok) {
        const albumData = await albumRes.json() as { assets?: Array<{ exifInfo?: { fileSizeInByte?: number } }> };
        const usedBytes = (albumData.assets ?? []).reduce(
          (sum, a) => sum + (a.exifInfo?.fileSizeInByte ?? 0), 0
        );
        const usedMb = usedBytes / (1024 * 1024);
        const usedGb = usedBytes / (1024 * 1024 * 1024);
        if (quotaMb > 0 && usedMb >= quotaMb) {
          return NextResponse.json({
            error: `Storage quota reached (${Math.round(usedMb)} MB / ${quotaMb} MB). Please contact the administrator to request more space.`,
            quotaExceeded: true, usedMb: Math.round(usedMb), quotaMb,
          }, { status: 507 });
        }
        if (usedGb >= globalQuotaGb) {
          return NextResponse.json({
            error: `Global storage limit of ${globalQuotaGb} GB reached. Please contact the administrator.`,
            quotaExceeded: true,
          }, { status: 507 });
        }
      }
    } catch { /* non-fatal */ }
  }

  const now = new Date().toISOString();
  const deviceAssetId = `memorial-${randomUUID()}`;

  const uploadForm = new FormData();
  uploadForm.append('assetData', file, file.name || 'upload');
  uploadForm.append('deviceAssetId', deviceAssetId);
  uploadForm.append('deviceId', 'memorial-scrapbook-app');
  uploadForm.append('fileCreatedAt', now);
  uploadForm.append('fileModifiedAt', now);
  uploadForm.append('isFavorite', 'false');

  try {
    const res = await fetch(`${serverUrl}/api/assets`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: uploadForm,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return NextResponse.json({ error: `Immich returned ${res.status}: ${errText}` }, { status: 502 });
    }

    const data = await res.json() as { id?: string; status?: string };
    if (!data.id) return NextResponse.json({ error: 'No asset ID returned from Immich' }, { status: 502 });

    // 'duplicate' means Immich already has this file — data.id is the existing asset, still valid to use

    // Add to memorial album if configured
    if (albumId && /^[a-zA-Z0-9_-]+$/.test(albumId)) {
      try {
        await fetch(`${serverUrl}/api/albums/${albumId}/assets`, {
          method: 'PUT',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [data.id] }),
        });
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ assetId: data.id });
  } catch {
    return NextResponse.json({ error: 'Could not reach Immich server' }, { status: 502 });
  }
}
