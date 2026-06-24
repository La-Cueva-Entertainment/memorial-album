import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { randomUUID } from 'crypto';

/** GET /api/albums — list albums + default album info */
export async function GET() {
  const albums = await db.album.findMany({ orderBy: { createdAt: 'desc' } });
  // Prefer DB-stored link (editable from admin panel) over env var
  const dbConfig = await db.siteConfig.findMany({ where: { key: { in: ['default_album_link', 'default_album_name'] } } });
  const dbMap = Object.fromEntries(dbConfig.map(r => [r.key, r.value]));\n  const defaultAlbumLink = dbMap.default_album_link || process.env.DEFAULT_ALBUM_LINK || null;\n  const defaultAlbumName = dbMap.default_album_name || null;

  // Fetch the default Immich album's cover asset ID — prefer admin-picked override from DB
  let defaultAlbumCoverAssetId: string | null = dbMap.default_album_cover_asset_id || null;
  const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '');
  const apiKey = process.env.IMMICH_API_KEY;
  const albumId = process.env.IMMICH_ALBUM_ID;
  if (!defaultAlbumCoverAssetId && serverUrl && apiKey && albumId) {
    try {
      const r = await fetch(`${serverUrl}/api/albums/${albumId}`, {
        headers: { 'x-api-key': apiKey },
        next: { revalidate: 300 },
      } as RequestInit);
      if (r.ok) {
        const data = await r.json() as { albumThumbnailAssetId?: string | null };
        defaultAlbumCoverAssetId = data.albumThumbnailAssetId ?? null;
      }
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ albums, defaultAlbumLink, defaultAlbumCoverAssetId, defaultAlbumName });
}

/**
 * POST /api/albums — create an Immich album + upload-enabled share link, save to DB.
 * Accepts multipart/form-data: { name: string, coverFile?: File }
 * Open to all visitors (rate-limited, album count capped).
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Album count limit
  const albumCount = await db.album.count();
  const maxAlbums = Number(process.env.MAX_ALBUMS ?? 50);
  if (albumCount >= maxAlbums) {
    return NextResponse.json({ error: `Album limit of ${maxAlbums} reached.` }, { status: 507 });
  }

  const formData = await req.formData();
  const name = (formData.get('name') as string | null)?.trim();
  if (!name) return NextResponse.json({ error: 'Album name is required' }, { status: 400 });

  const coverFile = formData.get('coverFile') as File | null;

  const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '');
  const apiKey = process.env.IMMICH_API_KEY;

  // If Immich is not configured, create a local-only album record
  if (!serverUrl || !apiKey) {
    const album = await db.album.create({
      data: { name, shareLink: process.env.DEFAULT_ALBUM_LINK ?? null },
    });
    return NextResponse.json(album, { status: 201 });
  }

  try {
    // 1. Create Immich album
    const albumRes = await fetch(`${serverUrl}/api/albums`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumName: name }),
    });
    if (!albumRes.ok) {
      return NextResponse.json({ error: 'Failed to create album in Immich' }, { status: 502 });
    }
    const albumData = await albumRes.json() as { id: string };
    const immichAlbumId = albumData.id;

    // 2. Upload cover image if provided
    let coverImmichAssetId: string | null = null;
    if (coverFile && coverFile.size > 0) {
      const now = new Date().toISOString();
      const deviceAssetId = `memorial-cover-${randomUUID()}`;
      const uploadForm = new FormData();
      uploadForm.append('assetData', coverFile, coverFile.name || 'cover');
      uploadForm.append('deviceAssetId', deviceAssetId);
      uploadForm.append('deviceId', 'memorial-scrapbook-app');
      uploadForm.append('fileCreatedAt', now);
      uploadForm.append('fileModifiedAt', now);
      uploadForm.append('isFavorite', 'false');

      const uploadRes = await fetch(`${serverUrl}/api/assets`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: uploadForm,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json() as { id?: string };
        if (uploadData.id) {
          coverImmichAssetId = uploadData.id;
          // Add cover asset to album
          await fetch(`${serverUrl}/api/albums/${immichAlbumId}/assets`, {
            method: 'PUT',
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [coverImmichAssetId] }),
          }).catch(() => {});
          // Set as album thumbnail
          await fetch(`${serverUrl}/api/albums/${immichAlbumId}`, {
            method: 'PATCH',
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ albumThumbnailAssetId: coverImmichAssetId }),
          }).catch(() => {});
        }
      }
    }

    // 3. Create upload-enabled share link
    let shareLink: string | null = null;
    const shareRes = await fetch(`${serverUrl}/api/shared-links`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albumId: immichAlbumId,
        type: 'ALBUM',
        allowUpload: true,
        allowDownload: false,
        showMetadata: true,
      }),
    });
    if (shareRes.ok) {
      const shareData = await shareRes.json() as { key?: string };
      if (shareData.key) {
        shareLink = `${serverUrl}/share/${shareData.key}`;
      }
    }

    // 4. Save to our DB
    const album = await db.album.create({
      data: { name, immichAlbumId, shareLink, coverImmichAssetId },
    });

    return NextResponse.json(album, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not reach Immich server' }, { status: 502 });
  }
}
