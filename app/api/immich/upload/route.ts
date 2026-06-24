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

    const data = await res.json() as { id?: string };
    if (!data.id) return NextResponse.json({ error: 'No asset ID returned from Immich' }, { status: 502 });

    return NextResponse.json({ assetId: data.id });
  } catch {
    return NextResponse.json({ error: 'Could not reach Immich server' }, { status: 502 });
  }
}
