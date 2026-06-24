'use client';

import { useEffect, useState } from 'react';
import type { FavoriteThing, Item } from '@/types';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Loved One';

const BIO_SECTIONS = [
  {
    emoji: '🌸',
    title: 'who she was',
    body: `${SITE_NAME} was the kind of person who lit up every room she walked into — with a laugh that carried across the hall and a warmth that made strangers feel like old friends. She had an eye for beauty in the ordinary: a good song, a perfect meal, a golden afternoon with the people she loved.`,
  },
  {
    emoji: '💛',
    title: 'her spirit',
    body: `She was fiercely loyal, endlessly funny, and surprisingly wise. She said the thing no one else dared to say, and somehow made it sound like the most obvious truth in the world. Her words of wisdom are all over this site — because she handed them out freely to everyone lucky enough to know her.`,
  },
  {
    emoji: '🎵',
    title: 'what she loved',
    body: `Good music. Great food. Ocean Spray. Road trips with the windows down. The movies. Family dinners that went way too long. California sunshine. Her people.`,
  },
  {
    emoji: '🌊',
    title: 'her legacy',
    body: `${SITE_NAME} left a mark on everyone she touched. This scrapbook exists so that mark never fades. Add a memory, share a photo, leave a quote — keep her alive in the ways you knew her best.`,
  },
];

interface Props {
  admin: boolean;
  isSuperContributor: boolean;
  accent: string;
}

export default function BioView({ admin, isSuperContributor, accent }: Props) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<FavoriteThing[]>([]);

  // Hero edit state
  const [editingHero, setEditingHero] = useState(false);
  const [heroLocation, setHeroLocation] = useState('');
  const [heroSaving, setHeroSaving] = useState(false);
  const [pickerItems, setPickerItems] = useState<Item[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedImgPath, setSelectedImgPath] = useState<string | null>(null);

  // Favorite add state
  const [showAddFav, setShowAddFav] = useState(false);
  const [favName, setFavName] = useState('');
  const [favEmoji, setFavEmoji] = useState('⭐');
  const [favCategory, setFavCategory] = useState('');
  const [favSaving, setFavSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/site-config').then(r => r.ok ? r.json() : {}),
      fetch('/api/favorite-things').then(r => r.ok ? r.json() : []),
    ]).then(([cfg, favs]: [Record<string, string>, FavoriteThing[]]) => {
      setConfig(cfg);
      setHeroLocation(cfg.bio_location ?? '');
      setFavorites(favs);
    }).catch(console.error);
  }, []);

  const lookupImmichLocation = async (imgPath: string) => {
    const assetId = imgPath.startsWith('immich:') ? imgPath.slice(7) : null;
    if (!assetId) return;
    const res = await fetch(`/api/immich/asset?assetId=${encodeURIComponent(assetId)}`);
    if (res.ok) {
      const data = await res.json() as { exifInfo?: { city?: string; state?: string; country?: string } };
      const parts = [data.exifInfo?.city, data.exifInfo?.state, data.exifInfo?.country].filter(Boolean);
      if (parts.length) setHeroLocation(parts.join(', '));
    }
  };

  const openPhotoPicker = () => {
    setEditingHero(true);
    setSelectedImgPath(config.bio_hero_img_path ?? config.bio_hero_immich_id ? `immich:${config.bio_hero_immich_id}` : null);
    if (pickerItems.length === 0) {
      setPickerLoading(true);
      fetch('/api/items').then(r => r.ok ? r.json() : []).then((items: Item[]) => {
        setPickerItems(items);
        setPickerLoading(false);
      }).catch(() => setPickerLoading(false));
    }
  };

  const saveHeroConfig = async () => {
    if (!selectedImgPath) return;
    setHeroSaving(true);
    await fetch('/api/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio_hero_img_path: selectedImgPath, bio_location: heroLocation }),
    });
    setConfig(c => ({ ...c, bio_hero_img_path: selectedImgPath, bio_location: heroLocation }));
    setHeroSaving(false);
    setEditingHero(false);
  };

  const addFavorite = async () => {
    if (!favName.trim() || favSaving) return;
    setFavSaving(true);
    const res = await fetch('/api/favorite-things', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: favName.trim(), emoji: favEmoji, category: favCategory }),
    });
    if (res.ok) {
      const fav: FavoriteThing = await res.json();
      setFavorites(prev => [...prev, fav]);
      setFavName(''); setFavEmoji('⭐'); setFavCategory(''); setShowAddFav(false);
    }
    setFavSaving(false);
  };

  const removeFavorite = async (id: string) => {
    await fetch(`/api/favorite-things/${id}`, { method: 'DELETE' });
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const heroImgPath = config.bio_hero_img_path
    ?? (config.bio_hero_immich_id ? `immich:${config.bio_hero_immich_id}` : null);
  const heroSrc = heroImgPath ? `/api/uploads/${heroImgPath}` : null;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '30px 22px 40px' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        {/* Portrait circle */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            width: 160,
            height: 160,
            overflow: 'hidden',
            border: '4px solid rgba(255,255,255,.45)',
            boxShadow: '0 8px 28px rgba(50,35,20,.35)',
            marginBottom: 18,
            background: 'rgba(247,242,233,.3)',
            fontSize: 72,
          }}
        >
          {heroSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroSrc} alt={SITE_NAME} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            '🌸'
          )}
        </div>

        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(28px,3.8vw,44px)', fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(60,40,20,.45)', lineHeight: 1.1 }}>
          {SITE_NAME}
        </div>

        {config.bio_location && (
          <div style={{ fontFamily: "'Spectral', serif", fontSize: 14, color: 'rgba(255,255,255,.78)', marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            📍 {config.bio_location}
          </div>
        )}

        <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#5b4a36', background: 'rgba(247,242,233,.8)', display: 'inline-block', padding: '4px 16px', borderRadius: 18, marginTop: 10 }}>
          in loving memory
        </div>

        {/* Admin: edit hero */}
        {admin && (
          <div style={{ marginTop: 14 }}>
            {!editingHero ? (
              <button
                onClick={openPhotoPicker}
                style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: 'rgba(255,255,255,.22)', border: 'none', color: '#fff', padding: '5px 16px', borderRadius: 14, cursor: 'pointer' }}
              >
                ✏️ edit photo &amp; location
              </button>
            ) : (
              <div style={{ background: 'rgba(247,242,233,.95)', borderRadius: 14, padding: '16px 18px', maxWidth: 560, margin: '10px auto 0', textAlign: 'left' }}>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#5b4a36', marginBottom: 10 }}>choose a photo from the box</div>

                {pickerLoading && <div style={{ fontFamily: "'Caveat', cursive", color: '#9a8e79', fontSize: 16, padding: '10px 0' }}>loading…</div>}

                {/* Photo grid */}
                {!pickerLoading && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6, maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                    {pickerItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedImgPath(item.imgPath);
                          lookupImmichLocation(item.imgPath);
                        }}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 6,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: selectedImgPath === item.imgPath ? `3px solid ${accent}` : '3px solid transparent',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/uploads/${item.imgPath}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Location input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <input
                    value={heroLocation}
                    onChange={e => setHeroLocation(e.target.value)}
                    placeholder="location label (e.g. Los Angeles, CA)"
                    style={{ flex: 1, fontFamily: "'Caveat', cursive", fontSize: 16, border: '1.5px solid #e2dac9', borderRadius: 8, padding: '6px 10px', outline: 'none', background: '#fbf7ef', color: '#3a342d' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={saveHeroConfig}
                    disabled={heroSaving || !selectedImgPath}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 17, background: accent, color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 14, cursor: 'pointer', opacity: !selectedImgPath ? 0.5 : 1 }}
                  >
                    {heroSaving ? 'saving…' : 'save'}
                  </button>
                  <button onClick={() => setEditingHero(false)} style={{ fontFamily: "'Caveat', cursive", fontSize: 17, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '7px 18px', borderRadius: 14, cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bio sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 36 }}>
        {BIO_SECTIONS.map(section => (
          <div key={section.title} style={{ background: '#fffdf8', borderRadius: 16, boxShadow: '0 6px 18px rgba(50,35,20,.13)', padding: '24px 28px' }}>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, fontWeight: 700, color: '#5b4a36', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{section.emoji}</span>
              <span>{section.title}</span>
            </div>
            <p style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: '#3a342d', margin: 0 }}>
              {section.body}
            </p>
          </div>
        ))}
      </div>

      {/* ── Favorite Things ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 30, color: '#fff', textShadow: '0 1px 8px rgba(60,40,20,.35)' }}>
            💛 cali&apos;s favorite things
          </div>
          {(admin || isSuperContributor) && !showAddFav && (
            <button
              onClick={() => setShowAddFav(true)}
              style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: accent, color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 18, cursor: 'pointer', boxShadow: '0 3px 8px rgba(120,70,40,.28)' }}
            >
              + add favorite
            </button>
          )}
        </div>

        {/* Add form */}
        {(admin || isSuperContributor) && showAddFav && (
          <div style={{ background: '#fffdf8', borderRadius: 14, padding: '16px 18px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={favEmoji}
                onChange={e => setFavEmoji(e.target.value)}
                placeholder="emoji"
                maxLength={4}
                style={{ width: 62, fontFamily: "'Caveat', cursive", fontSize: 26, textAlign: 'center', border: '1.5px solid #e2dac9', borderRadius: 8, padding: '6px 4px', outline: 'none', background: '#fbf7ef', color: '#3a342d' }}
              />
              <input
                value={favName}
                onChange={e => setFavName(e.target.value)}
                placeholder="name of the thing"
                onKeyDown={e => { if (e.key === 'Enter') addFavorite(); }}
                style={{ flex: 1, fontFamily: "'Caveat', cursive", fontSize: 19, border: '1.5px solid #e2dac9', borderRadius: 8, padding: '6px 10px', outline: 'none', background: '#fbf7ef', color: '#3a342d' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={favCategory}
                onChange={e => setFavCategory(e.target.value)}
                placeholder="category — food, music, place… (optional)"
                style={{ flex: 1, fontFamily: "'Caveat', cursive", fontSize: 16, border: '1.5px solid #e2dac9', borderRadius: 8, padding: '6px 10px', outline: 'none', background: '#fbf7ef', color: '#9a8e79' }}
              />
              <button onClick={addFavorite} disabled={favSaving || !favName.trim()} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: accent, color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 14, cursor: 'pointer' }}>
                {favSaving ? '…' : 'add'}
              </button>
              <button onClick={() => setShowAddFav(false)} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '7px 18px', borderRadius: 14, cursor: 'pointer' }}>
                cancel
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', fontFamily: "'Caveat', cursive", fontSize: 22, color: 'rgba(255,255,255,.5)' }}>
            {(admin || isSuperContributor) ? "add cali's favorites above" : 'coming soon…'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {favorites.map(f => (
              <div
                key={f.id}
                style={{ background: '#fffdf8', borderRadius: 12, boxShadow: '0 4px 12px rgba(50,35,20,.12)', padding: '14px 14px 12px', textAlign: 'center', position: 'relative' }}
              >
                <div style={{ fontSize: 34, marginBottom: 6 }}>{f.emoji}</div>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#3a342d', lineHeight: 1.3 }}>{f.name}</div>
                {f.category && <div style={{ fontSize: 11, color: '#9a8e79', marginTop: 4 }}>{f.category}</div>}
                {(admin || isSuperContributor) && (
                  <button
                    onClick={() => removeFavorite(f.id)}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: '#c8bca8', cursor: 'pointer', fontSize: 14, padding: 2, lineHeight: 1 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontFamily: "'Caveat', cursive", fontSize: 22, color: 'rgba(255,255,255,.75)', textShadow: '0 1px 6px rgba(60,40,20,.3)' }}>
        forever loved. never forgotten.
      </div>
    </div>
  );
}
