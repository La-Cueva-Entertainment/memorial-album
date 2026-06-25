'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type NavView = 'home' | 'albums' | 'messages' | 'quotes' | 'event' | 'resources';

interface Props {
  admin: boolean;
  accent: string;
  onNav: (v: NavView) => void;
}

interface ImmichAsset { id: string; type?: string }

const ALBUM_SHARE_LINK = process.env.NEXT_PUBLIC_DEFAULT_ALBUM_LINK ?? '';

// Build the Immich shared-album URL for a given asset (opens lightbox directly)
function immichAssetUrl(assetId: string, link: string): string {
  if (!link) return '#';
  return `${link}/photos/${assetId}?assetId=${assetId}`;
}

// Shuffle array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROTS = [-13, 9, -7, 11, -15, 6, -10, 8, -12, 5];

export default function HomeView({ admin, accent, onNav }: Props) {
  const [portrait, setPortrait] = useState<string | null>(null);
  const [albumShareLink, setAlbumShareLink] = useState(ALBUM_SHARE_LINK);
  const [albumPhotos, setAlbumPhotos] = useState<ImmichAsset[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<ImmichAsset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rotateTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const DEFAULT_ABOUT_TITLE = 'About Cali';
  const DEFAULT_ABOUT_BODY = `Cali was the daughter who made her parents proud of everything she did, the sister who somehow got along with everyone and kept the peace, the best friend who made it clear you were her person, and the soulmate who taught you what it means to love deeply.

She was also the funny one. She had a laugh that was distinctly her and you'd do anything to constantly hear it. She could turn a boba run into an adventure and a dinner table into a comedy show. She loved fiercely and was endlessly loyal. Her presence alone could turn your whole day around.

She had a nickname for everyone, a soft spot for good food and better company, and a gift for making whoever she was with feel like the most important person in the room. Cali was intentional about the people she kept close, and if you're here, you are one of them. That's not a small thing.

She gave so much more than she ever asked for. This little place is for all of us, to keep her close, to share the photos, the stories, and the laughs, and to look after each other the way she always looked after us.`;

  const [aboutTitle, setAboutTitle] = useState(DEFAULT_ABOUT_TITLE);
  const [aboutBody, setAboutBody] = useState(DEFAULT_ABOUT_BODY);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutTitleDraft, setAboutTitleDraft] = useState('');
  const [aboutBodyDraft, setAboutBodyDraft] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 880px)');
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => r.ok ? r.json() : {})
      .then((cfg: Record<string, string>) => {
        if (cfg.bio_hero_img_path) setPortrait(cfg.bio_hero_img_path);
        if (cfg.default_album_link) setAlbumShareLink(cfg.default_album_link);
        if (cfg.home_about_title) setAboutTitle(cfg.home_about_title);
        if (cfg.home_about_body) setAboutBody(cfg.home_about_body);
      })
      .catch(() => {});

    // Fallback: also read from /api/albums which checks DB then env var
    fetch('/api/albums')
      .then(r => r.ok ? r.json() : {})
      .then((data: { defaultAlbumLink?: string | null }) => {
        if (data.defaultAlbumLink) setAlbumShareLink(data.defaultAlbumLink);
      })
      .catch(() => {});

    fetch('/api/immich/browse')
      .then(r => r.ok ? r.json() : { assets: [] })
      .then((data: { assets?: ImmichAsset[] }) => {
        const imgs = (data.assets ?? []).filter(a => !a.type || a.type.toUpperCase() === 'IMAGE');
        setAlbumPhotos(imgs);
      })
      .catch(() => {});
  }, []);

  // Re-compute displayed side photos whenever album photos or portrait changes
  // This fixes the race condition where portrait loads after album photos
  useEffect(() => {
    if (albumPhotos.length === 0) return;
    const portraitId = portrait?.startsWith('immich:') ? portrait.slice(7) : null;
    const pool = portraitId ? albumPhotos.filter(a => a.id !== portraitId) : albumPhotos;
    setDisplayedPhotos(shuffle(pool).slice(0, 4));
  }, [albumPhotos, portrait]);

  // Rotate every 10 seconds with a random new set
  useEffect(() => {
    if (albumPhotos.length <= 4) return;
    if (rotateTimer.current) clearInterval(rotateTimer.current);
    rotateTimer.current = setInterval(() => {
      const portraitId = portrait?.startsWith('immich:') ? portrait.slice(7) : null;
      const pool = portraitId ? albumPhotos.filter(a => a.id !== portraitId) : albumPhotos;
      setDisplayedPhotos(shuffle(pool).slice(0, 4));
    }, 10_000);
    return () => { if (rotateTimer.current) clearInterval(rotateTimer.current); };
  }, [albumPhotos, portrait]);

  const portraitSrc = portrait
    ? (portrait.startsWith('immich:') ? `/api/immich/thumbnail?assetId=${portrait.slice(7)}` : `/api/uploads/${portrait}`)
    : null;

  const uploadPortrait = useCallback(async (file: File) => {
    if (!admin) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/immich/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json() as { assetId?: string };
        if (data.assetId) {
          const saveRes = await fetch('/api/site-config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio_hero_img_path: `immich:${data.assetId}` }),
          });
          if (saveRes.ok) {
            setPortrait(`immich:${data.assetId}`);
          } else {
            alert('Photo uploaded but could not save as portrait. Please try again.');
          }
        }
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(err.error ?? 'Upload failed. Please try again.');
      }
    } catch { alert('Upload failed. Please check your connection.'); } finally {
      setUploading(false);
    }
  }, [admin]);

  const setPortraitFromImmich = useCallback(async (assetId: string) => {
    const saveRes = await fetch('/api/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio_hero_img_path: `immich:${assetId}` }),
    });
    if (saveRes.ok) {
      setPortrait(`immich:${assetId}`);
    } else {
      alert('Could not save portrait. Please try again.');
    }
    setPickerOpen(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadPortrait(file);
  }, [uploadPortrait]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPortrait(file);
  }, [uploadPortrait]);

  const leftPhotos = displayedPhotos.slice(0, 2);
  const rightPhotos = displayedPhotos.slice(2, 4);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '22px 20px 36px' }}>
      {/* ── Hero ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 24, marginBottom: 20 }}>

        {/* Left polaroids — desktop only via CSS */}
        <div suppressHydrationWarning style={{ display: isDesktop && leftPhotos.length > 0 ? 'flex' : 'none', flexDirection: 'column', gap: 14, paddingTop: 36, flexShrink: 0 }}>
            {leftPhotos.map((asset, i) => (
              <MiniPolaroid key={asset.id} assetId={asset.id} rot={ROTS[i * 2] ?? -8} immichUrl={immichAssetUrl(asset.id, albumShareLink)} />
            ))}
        </div>

        {/* Center portrait polaroid */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div style={{
            background: '#fffdf8', padding: '10px 10px 0', borderRadius: 5,
            boxShadow: '0 12px 32px rgba(50,35,20,.22)', transform: 'rotate(-1.5deg)',
            display: 'inline-block', position: 'relative',
          }}>
            {/* Push pin */}
            <div style={{
              position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: '#d485a0', boxShadow: '0 2px 5px rgba(0,0,0,.28)', zIndex: 2,
            }} />

            {/* Photo slot */}
            <div
              onDragOver={admin ? (e) => { e.preventDefault(); setIsDragging(true); } : undefined}
              onDragLeave={admin ? () => setIsDragging(false) : undefined}
              onDrop={admin ? onDrop : undefined}
              style={{
                width: 'clamp(180px,28vw,230px)', height: 'clamp(180px,28vw,230px)',
                overflow: 'hidden', borderRadius: 3,
                background: isDragging ? '#e8e0d4' : '#f0ebe0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                outline: isDragging ? `2px dashed ${accent}` : 'none',
                transition: 'background .15s',
              }}
            >
              {uploading ? (
                <div style={{ color: '#c2b09a', fontFamily: "'Spectral', serif", fontSize: 13, textAlign: 'center' }}>uploading&hellip;</div>
              ) : portraitSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portraitSrc} alt="Cali" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {admin && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'rgba(0,0,0,0)', opacity: 0, transition: 'opacity .15s', cursor: 'pointer',
                    }}
                      onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = 'rgba(0,0,0,.45)'; d.style.opacity = '1'; }}
                      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = 'rgba(0,0,0,0)'; d.style.opacity = '0'; }}
                    >
                      <button onClick={() => fileRef.current?.click()} style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 18, padding: '5px 14px', fontFamily: "'Spectral', serif", fontSize: 13, cursor: 'pointer' }}>upload new</button>
                      {albumPhotos.length > 0 && (
                        <button onClick={() => setPickerOpen(true)} style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 18, padding: '5px 14px', fontFamily: "'Spectral', serif", fontSize: 13, cursor: 'pointer' }}>pick from album</button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#c2b09a', padding: 16 }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.5, display: 'block', margin: '0 auto 8px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {admin ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => fileRef.current?.click()} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 18, padding: '6px 14px', fontFamily: "'Spectral', serif", fontSize: 12, cursor: 'pointer' }}>upload photo</button>
                      {albumPhotos.length > 0 && (
                        <button onClick={() => setPickerOpen(true)} style={{ background: 'transparent', color: '#c2b09a', border: '1px solid #c2b09a', borderRadius: 18, padding: '5px 14px', fontFamily: "'Spectral', serif", fontSize: 12, cursor: 'pointer' }}>pick from album</button>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: '#c2b09a' }}>her photo<br/>coming soon</div>
                  )}
                </div>
              )}
            </div>

            {/* Caption */}
            <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: '#5b4a36' }}>our Cali</span>
            </div>
          </div>

          {admin && <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 8 }}>
            <span style={{ width: 30, height: 1, background: '#cba877', display: 'block' }} />
            <span style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 14, color: '#a8997f' }}>&#9825;</span>
            <span style={{ width: 30, height: 1, background: '#cba877', display: 'block' }} />
          </div>
        </div>

        {/* Right polaroids — desktop only via CSS */}
        <div suppressHydrationWarning style={{ display: isDesktop && rightPhotos.length > 0 ? 'flex' : 'none', flexDirection: 'column', gap: 14, paddingTop: 52, flexShrink: 0 }}>
            {rightPhotos.map((asset, i) => (
              <MiniPolaroid key={asset.id} assetId={asset.id} rot={ROTS[i * 2 + 1] ?? 6} immichUrl={immichAssetUrl(asset.id, albumShareLink)} />
            ))}
        </div>
      </div>

      {/* Tagline */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(18px,3.2vw,26px)', color: '#52483c', lineHeight: 1.3 }}>
          the funny one &middot; the selfless one<br />forever ours
        </div>
      </div>

      {/* Motifs — bigger and more visible */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mahjong.png" alt="mahjong" width={48} height={48} style={{ objectFit: 'contain' }} />
        <span style={{ fontSize: 42, lineHeight: 1 }}>&#129483;</span>
        <span style={{ fontSize: 42, lineHeight: 1 }}>&#128008;</span>
      </div>

      {/* ── About Cali ── */}
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 28px', position: 'relative' }}>
        {editingAbout ? (
          <div style={{ textAlign: 'left' }}>
            <input
              value={aboutTitleDraft}
              onChange={e => setAboutTitleDraft(e.target.value)}
              style={{ display: 'block', width: '100%', fontFamily: "'Caveat', cursive", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#3a342d', border: 'none', borderBottom: '2px solid ' + accent, background: 'transparent', outline: 'none', marginBottom: 12, boxSizing: 'border-box', textAlign: 'center' }}
            />
            <textarea
              value={aboutBodyDraft}
              onChange={e => setAboutBodyDraft(e.target.value)}
              rows={10}
              style={{ display: 'block', width: '100%', fontFamily: "'Spectral', serif", fontSize: 'clamp(14px,1.6vw,16px)', lineHeight: 1.65, color: '#52483c', border: '1px solid #e2d6bf', borderRadius: 10, background: '#fdf9f3', padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  setSavingAbout(true);
                  await fetch('/api/site-config', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ home_about_title: aboutTitleDraft, home_about_body: aboutBodyDraft }),
                  });
                  setAboutTitle(aboutTitleDraft);
                  setAboutBody(aboutBodyDraft);
                  setSavingAbout(false);
                  setEditingAbout(false);
                }}
                disabled={savingAbout}
                style={{ fontFamily: "'Spectral', serif", fontSize: 14, background: accent, color: '#fff', border: 'none', borderRadius: 18, padding: '7px 20px', cursor: 'pointer' }}
              >
                {savingAbout ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditingAbout(false)}
                style={{ fontFamily: "'Spectral', serif", fontSize: 14, background: 'transparent', color: '#9a8e79', border: '1px solid #d8cdb9', borderRadius: 18, padding: '7px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#3a342d', margin: '0 0 6px' }}>{aboutTitle}</h2>
            <div style={{ width: 48, height: 2, background: accent, borderRadius: 2, margin: '0 auto 16px' }} />
            {aboutBody.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontFamily: "'Spectral', serif", fontSize: 'clamp(14px,1.6vw,16px)', lineHeight: 1.65, color: '#52483c', margin: i < aboutBody.split('\n\n').filter(Boolean).length - 1 ? '0 0 12px' : 0 }}>
                {para}
              </p>
            ))}
            {admin && (
              <button
                onClick={() => { setAboutTitleDraft(aboutTitle); setAboutBodyDraft(aboutBody); setEditingAbout(true); }}
                title="Edit about section"
                style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: '1px solid #d8cdb9', color: '#9a8e79', borderRadius: 16, padding: '3px 10px', fontSize: 13, cursor: 'pointer', fontFamily: "'Spectral', serif" }}
              >
                ✎ Edit
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, maxWidth: 760, margin: '0 auto' }}>
        {QUICK_LINKS.map(q => (
          <QuickLinkCard key={q.view} {...q} accent={accent} onClick={() => onNav(q.view as NavView)} />
        ))}
      </div>

      {/* ── Admin: pick from Immich album ── */}
      {pickerOpen && (
        <ImmichPicker
          photos={albumPhotos}
          onSelect={setPortraitFromImmich}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

// ── Quick link cards ──────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { view: 'albums',   label: 'Photo Albums',    sub: 'look through her photos',  emoji: '&#128247;' },
  { view: 'messages', label: 'Leave a Message', sub: 'a note for Cali',          emoji: '&#9993;' },
  { view: 'event',    label: 'Ocean Spray',     sub: 'the celebration',          emoji: '&#127754;' },
  { view: 'quotes',   label: 'Her Quotes',      sub: 'things she said',          emoji: '&#128172;' },
];

function QuickLinkCard({ label, sub, emoji, accent, onClick }: { label: string; sub: string; emoji: string; accent: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fffdf8', border: '1px solid #ece1cb', borderRadius: 14,
        padding: '16px 14px', cursor: 'pointer', textAlign: 'left',
        boxShadow: hover ? '0 8px 22px rgba(60,40,20,.12)' : '0 3px 10px rgba(60,40,20,.07)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow .15s, transform .15s',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: emoji }} />
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: 19, color: '#3a342d', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: '#9a8e79', fontStyle: 'italic' }}>{sub}</div>
    </button>
  );
}

// ── Mini polaroid (floating) ──────────────────────────────────────────────────

function MiniPolaroid({ assetId, rot, immichUrl }: { assetId: string; rot: number; immichUrl: string }) {
  const [loaded, setLoaded] = useState(false);
  const card = (
    <div style={{
      background: '#fffdf8', padding: '6px 6px 28px', borderRadius: 4,
      boxShadow: '0 7px 18px rgba(50,35,20,.18)',
      transform: `rotate(${rot}deg)`, width: 112, flexShrink: 0,
      cursor: immichUrl !== '#' ? 'pointer' : 'default',
      transition: 'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e => { if (immichUrl !== '#') { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot}deg) scale(1.06)`; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(50,35,20,.28)'; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot}deg)`; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 7px 18px rgba(50,35,20,.18)'; }}
    >
      <div style={{ width: 100, height: 100, overflow: 'hidden', borderRadius: 2, background: '#ece5d8', position: 'relative' }}>
        {/* Skeleton */}
        {!loaded && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#ece5d8 25%,#e0d8cc 50%,#ece5d8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/immich/thumbnail?assetId=${assetId}`}
          alt="memory"
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
        />
      </div>
    </div>
  );

  if (immichUrl !== '#') {
    return (
      <a href={immichUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        {card}
      </a>
    );
  }
  return card;
}

// ── Immich album photo picker ─────────────────────────────────────────────────

function ImmichPicker({ photos, onSelect, onClose }: {
  photos: ImmichAsset[];
  onSelect: (assetId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(20,14,8,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#f7f2e9', borderRadius: 18, maxWidth: 680, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,.45)' }}
      >
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #e2d6bf', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: '#3a342d' }}>pick from album</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a8997f', fontSize: 20, cursor: 'pointer' }}>&#10005;</button>
        </div>
        <div style={{ overflowY: 'auto', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
          {photos.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{ padding: 0, border: '2px solid transparent', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', background: '#ece5d8', transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#c2724f'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/immich/thumbnail?assetId=${p.id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
