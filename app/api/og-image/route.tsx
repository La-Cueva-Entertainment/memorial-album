import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kathryn Cali Lee';

  // Fetch portrait directly from Immich server-to-server (bypasses any proxy auth issues)
  let portraitDataUrl: string | null = null;
  try {
    const portraitConfig = await db.siteConfig.findUnique({ where: { key: 'bio_hero_img_path' } });
    if (portraitConfig?.value?.startsWith('immich:')) {
      const assetId = portraitConfig.value.slice(7);
      const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '');
      const apiKey = process.env.IMMICH_API_KEY;
      if (serverUrl && apiKey) {
        const res = await fetch(
          `${serverUrl}/api/assets/${assetId}/thumbnail?size=preview`,
          { headers: { 'x-api-key': apiKey }, cache: 'no-store' },
        );
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const ct = res.headers.get('Content-Type') ?? 'image/jpeg';
          portraitDataUrl = `data:${ct};base64,${buf.toString('base64')}`;
        }
      }
    }
  } catch {
    // Immich unavailable — fall through to text-only card
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#f7f2e9',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '48px',
          padding: '64px',
        }}
      >
        {/* Portrait */}
        {portraitDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitDataUrl}
            width={420}
            height={420}
            style={{
              borderRadius: '12px',
              objectFit: 'cover',
              boxShadow: '0 20px 60px rgba(50,35,20,0.28)',
              flexShrink: 0,
            }}
          />
        )}

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: portraitDataUrl ? '560px' : '800px' }}>
          <div
            style={{
              fontSize: 18,
              color: '#b5704f',
              letterSpacing: '5px',
              textTransform: 'uppercase',
            }}
          >
            in loving memory
          </div>
          <div
            style={{
              fontSize: portraitDataUrl ? 56 : 72,
              fontWeight: 700,
              color: '#3a342d',
              lineHeight: 1.1,
            }}
          >
            {siteName}
          </div>
          <div style={{ fontSize: 22, color: '#6f665a', marginTop: '4px' }}>
            A shared memorial scrapbook
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  );
}
