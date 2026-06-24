'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Album } from '@/types';

interface Props {
  admin: boolean;
  accent: string;
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#c9916a 0%,#e8b48a 100%)',
  'linear-gradient(135deg,#b07a9e 0%,#d4a0c0 100%)',
  'linear-gradient(135deg,#7a9eb0 0%,#a0c4d4 100%)',
  'linear-gradient(135deg,#9eb07a 0%,#c4d4a0 100%)',
  'linear-gradient(135deg,#b09a7a 0%,#d4bea0 100%)',
];

export default function AlbumsView({ admin, accent }: Props) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [defaultAlbumLink, setDefaultAlbumLink] = useState<string | null>(null);
  const [defaultAlbumName, setDefaultAlbumName] = useState('Cali\'s photos');
  const [defaultAlbumCoverAssetId, setDefaultAlbumCoverAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  const fetchAlbums = useCallback(() => {
    setLoading(true);
    fetch('/api/albums')
      .then(r => r.ok ? r.json() : { albums: [], defaultAlbumLink: null, defaultAlbumCoverAssetId: null })
      .then((data: { albums: Album[]; defaultAlbumLink: string | null; defaultAlbumCoverAssetId: string | null; defaultAlbumName?: string }) => {
        setAlbums(data.albums ?? []);
        setDefaultAlbumLink(data.defaultAlbumLink);
        setDefaultAlbumCoverAssetId(data.defaultAlbumCoverAssetId ?? null);
        if (data.defaultAlbumName) setDefaultAlbumName(data.defaultAlbumName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const handleAddPhotos = () => {
    if (defaultAlbumLink) {
      window.open(defaultAlbumLink, '_blank', 'noopener,noreferrer');
    } else {
      alert('The shared photo album link is not yet configured.');
    }
  };

  const removeAlbum = async (id: string) => {
    await fetch(`/api/albums/${id}`, { method: 'DELETE' });
    setAlbums(prev => prev.filter(a => a.id !== id));
  };

  const saveDefaultLink = async () => {
    setSavingLink(true);
    await fetch('/api/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_album_link: linkDraft.trim() }),
    });
    setDefaultAlbumLink(linkDraft.trim() || null);
    setSavingLink(false);
    setEditingLink(false);
  };

  const albumLimitReached = albums.length >= 50;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 70px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(28px,4vw,40px)', color: '#3a342d', margin: '0 0 10px' }}>
          photo albums
        </h1>
        <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#6f665a', margin: 0, maxWidth: 540, marginInline: 'auto' }}>
          tap an album to open it and add your own photos. don&apos;t have one? just hit &ldquo;add your photos.&rdquo;
        </p>
      </div>

      {/* Admin: edit default album link */}
      {admin && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {editingLink ? (
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                value={linkDraft}
                onChange={e => setLinkDraft(e.target.value)}
                placeholder="https://photos.example.com/share/..."
                style={{ fontFamily: "'Spectral', serif", fontSize: 13, border: '1px solid #d8cdb9', borderRadius: 8, padding: '6px 10px', width: 320, outline: 'none' }}
              />
              <button onClick={saveDefaultLink} disabled={savingLink} style={{ fontFamily: "'Spectral', serif", fontSize: 13, background: accent, color: '#fff', border: 'none', borderRadius: 18, padding: '6px 16px', cursor: 'pointer' }}>
                {savingLink ? 'saving…' : 'save'}
              </button>
              <button onClick={() => setEditingLink(false)} style={{ fontFamily: "'Spectral', serif", fontSize: 13, background: 'transparent', color: '#9a8e79', border: '1px solid #d8cdb9', borderRadius: 18, padding: '6px 12px', cursor: 'pointer' }}>cancel</button>
            </div>
          ) : (
            <button onClick={() => { setLinkDraft(defaultAlbumLink ?? ''); setEditingLink(true); }} style={{ fontFamily: "'Spectral', serif", fontSize: 13, background: 'transparent', color: '#9a8e79', border: '1px solid #d8cdb9', borderRadius: 18, padding: '5px 14px', cursor: 'pointer' }}>
              ✎ {defaultAlbumLink ? 'edit main upload album link' : 'set main upload album link'}
            </button>
          )}
        </div>
      )}

      {/* Primary actions — always visible (mobile + desktop) */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          onClick={handleAddPhotos}
          style={{
            fontFamily: "'Caveat', cursive", fontSize: 20,
            background: accent, color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 26, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(194,114,79,.35)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>&#8593;</span> add your photos
        </button>

        {/* Create album — open to all visitors */}
        <button
          onClick={albumLimitReached ? undefined : () => setModalOpen(true)}
          disabled={albumLimitReached}
          title={albumLimitReached ? 'Album limit reached (50)' : undefined}
          style={{
            fontFamily: "'Caveat', cursive", fontSize: 20,
            background: 'transparent', color: '#52483c',
            border: '1.5px solid #c2b09a',
            padding: '11px 28px', borderRadius: 26,
            cursor: albumLimitReached ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: albumLimitReached ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> create a new album
        </button>
      </div>

      {albumLimitReached && (
        <p style={{ textAlign: 'center', fontFamily: "'Spectral', serif", fontSize: 13, color: '#b23b2e', fontStyle: 'italic', marginBottom: 8 }}>
          Album limit of 50 reached. Remove an existing album to create a new one.
        </p>
      )}

      <p style={{
        textAlign: 'center', fontFamily: "'Spectral', serif", fontSize: 14, color: '#9a8e79',
        fontStyle: 'italic', marginBottom: 36, maxWidth: 520, marginInline: 'auto',
      }}>
        &ldquo;Add your photos&rdquo; opens our shared album — no account needed.
      </p>

      {/* Album grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18, marginBottom: 36 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: 14, aspectRatio: '4/3', background: 'linear-gradient(90deg,#ece5d8 25%,#e0d8cc 50%,#ece5d8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18, marginBottom: 36 }}>
          {/* Pinned: default shared album */}
          {defaultAlbumLink && (
            <DefaultAlbumCard link={defaultAlbumLink} coverAssetId={defaultAlbumCoverAssetId} name={defaultAlbumName} admin={admin} onNameChange={setDefaultAlbumName} onCoverChange={setDefaultAlbumCoverAssetId} />
          )}
          {albums.map((album, idx) => (
            <AlbumCard
              key={album.id}
              album={album}
              gradient={COVER_GRADIENTS[idx % COVER_GRADIENTS.length]}
              admin={admin}
              onRemove={() => removeAlbum(album.id)}
            />
          ))}
          {!defaultAlbumLink && albums.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#9a8e79', fontFamily: "'Spectral', serif", fontStyle: 'italic' }}>
              no albums yet — create one to get started
            </div>
          )}
        </div>
      )}

      <p style={{
        textAlign: 'center', fontFamily: "'Spectral', serif", fontSize: 13, color: '#a8997f',
        fontStyle: 'italic', maxWidth: 540, marginInline: 'auto',
      }}>
        everything lives in our shared photo library &middot; every memory stays safe
      </p>

      {modalOpen && (
        <CreateAlbumModal
          accent={accent}
          defaultAlbumLink={defaultAlbumLink}
          onClose={() => setModalOpen(false)}
          onCreated={album => { setAlbums(prev => [album, ...prev]); setModalOpen(false); }}
        />
      )}
    </div>
  );
}

// ── Default (shared) album card — always pinned first ─────────────────────────

function DefaultAlbumCard({ link, coverAssetId, name, admin, onNameChange, onCoverChange }: { link: string; coverAssetId: string | null; name: string; admin: boolean; onNameChange: (n: string) => void; onCoverChange: (assetId: string) => void }) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPhotos, setPickerPhotos] = useState<{ id: string }[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const coverSrc = coverAssetId ? `/api/immich/thumbnail?assetId=${coverAssetId}` : null;

  const openPicker = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const r = await fetch('/api/immich/browse');
      const data = await r.json() as { assets?: { id: string; type?: string }[] };
      setPickerPhotos((data.assets ?? []).filter(a => !a.type || a.type.toUpperCase() === 'IMAGE'));
    } catch { /* ignore */ } finally {
      setPickerLoading(false);
    }
  };

  const pickCover = async (assetId: string) => {
    await fetch('/api/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_album_cover_asset_id: assetId }),
    });
    onCoverChange(assetId);
    setCoverLoaded(false);
    setPickerOpen(false);
  };

  const saveName = async () => {
    const trimmed = draft.trim();
    if (!trimmed) { setDraft(name); setEditing(false); return; }
    await fetch('/api/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_album_name: trimmed }),
    });
    onNameChange(trimmed);
    setEditing(false);
  };

  return (
    <>
    <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {/* "featured" badge */}
      <div style={{
        position: 'absolute', top: -10, left: 12, zIndex: 3,
        background: '#b5704f', color: '#fff',
        fontFamily: "'Caveat', cursive", fontSize: 13,
        padding: '2px 10px', borderRadius: 20,
        boxShadow: '0 2px 6px rgba(181,112,79,.4)',
      }}>
        ★ main album
      </div>
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3',
        background: coverSrc ? '#1a1614' : 'linear-gradient(135deg,#c9916a 0%,#b5704f 100%)',
        boxShadow: '0 5px 20px rgba(181,112,79,.32)',
        border: '2px solid rgba(181,112,79,.35)',
      }}>
        {coverSrc && !coverLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#2a2220 25%,#3a302e 50%,#2a2220 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        )}
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt="Cali's photo album"
            onLoad={() => setCoverLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: coverLoaded ? 1 : 0, transition: 'opacity .3s' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 60%, transparent 100%)' }} />
        {/* Admin: change cover overlay */}
        {admin && hovered && !editing && (
          <div onClick={e => e.preventDefault()} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', zIndex: 2 }}>
            <button onClick={openPicker} style={{ fontFamily: "'Spectral', serif", fontSize: 13, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 18, padding: '7px 16px', cursor: 'pointer' }}>change cover</button>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 14px 14px' }}>
          {admin && editing ? (
            <div onClick={e => e.preventDefault()} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setDraft(name); setEditing(false); } }}
                style={{ fontFamily: "'Caveat', cursive", fontSize: 20, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 8, padding: '2px 8px', outline: 'none', width: 0, flex: 1 }}
              />
              <button onClick={saveName} style={{ background: 'rgba(255,255,255,.25)', border: 'none', color: '#fff', borderRadius: 12, padding: '3px 10px', cursor: 'pointer', fontSize: 13, fontFamily: "'Spectral', serif" }}>save</button>
            </div>
          ) : (
            <div
              style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#fff', lineHeight: 1.1, cursor: admin ? 'text' : undefined, display: 'inline-block' }}
              onClick={admin ? e => { e.preventDefault(); setDraft(name); setEditing(true); } : undefined}
              title={admin ? 'Click to rename' : undefined}
            >{name}</div>
          )}
          <div style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 4, fontStyle: 'italic' }}>browse &amp; add your own &#8599;</div>
        </div>
      </div>
    </a>

    {/* Cover picker modal */}
    {pickerOpen && (
      <div onClick={() => setPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(15,10,5,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#f7f2e9', borderRadius: 18, maxWidth: 680, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,.45)' }}>
          <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #e2d6bf', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#3a342d' }}>pick a cover photo</span>
            <button onClick={() => setPickerOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9a8e79' }}>✕</button>
          </div>
          <div style={{ overflowY: 'auto', padding: 16 }}>
            {pickerLoading ? (
              <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Spectral', serif", color: '#9a8e79' }}>loading photos…</div>
            ) : pickerPhotos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Spectral', serif", color: '#9a8e79', fontStyle: 'italic' }}>no photos found</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {pickerPhotos.map(p => (
                  <button key={p.id} onClick={() => pickCover(p.id)} style={{ padding: 0, border: '2px solid transparent', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', background: '#ece5d8' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#b5704f')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/immich/thumbnail?assetId=${p.id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Album card ────────────────────────────────────────────────────────────────

function AlbumCard({ album, gradient, admin, onRemove }: { album: Album; gradient: string; admin: boolean; onRemove: () => void }) {
  const [armedRemove, setArmedRemove] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (armedRemove) { if (armTimer.current) clearTimeout(armTimer.current); setArmedRemove(false); onRemove(); }
    else { setArmedRemove(true); armTimer.current = setTimeout(() => setArmedRemove(false), 3000); }
  };

  const coverSrc = album.coverImmichAssetId ? `/api/immich/thumbnail?assetId=${album.coverImmichAssetId}` : null;

  const cardContent = (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3',
      background: coverSrc ? '#1a1614' : gradient,
      boxShadow: '0 5px 16px rgba(60,40,20,.13)',
      cursor: album.shareLink ? 'pointer' : 'default',
    }}>
      {/* Cover skeleton → actual image */}
      {coverSrc && !coverLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#2a2220 25%,#3a302e 50%,#2a2220 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      )}
      {coverSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          alt={album.name}
          onLoad={() => setCoverLoaded(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: coverLoaded ? 1 : 0, transition: 'opacity .3s' }}
        />
      )}

      {admin && (
        <button onClick={handleRemove} style={{
          position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: '50%',
          background: armedRemove ? '#b23b2e' : 'rgba(0,0,0,.45)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}>
          &#10005;
        </button>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, transparent 100%)', padding: '36px 14px 14px' }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#fff', lineHeight: 1.1 }}>{album.name}</div>
        <div style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 4, fontStyle: 'italic' }}>tap to add your photos &#8599;</div>
      </div>
    </div>
  );

  if (album.shareLink) {
    return <a href={album.shareLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{cardContent}</a>;
  }
  return <div>{cardContent}</div>;
}

// ── Create-album modal ────────────────────────────────────────────────────────

function CreateAlbumModal({ accent, defaultAlbumLink, onClose, onCreated }: {
  accent: string; defaultAlbumLink: string | null;
  onClose: () => void; onCreated: (album: Album) => void;
}) {
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [albumName, setAlbumName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdAlbum, setCreatedAlbum] = useState<Album | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!albumName.trim() || creating) return;
    setCreating(true); setError('');
    const fd = new FormData();
    fd.append('name', albumName.trim());
    if (coverFile) fd.append('coverFile', coverFile);
    const res = await fetch('/api/albums', { method: 'POST', body: fd });
    if (res.ok) {
      const album: Album = await res.json();
      setCreatedAlbum(album); onCreated(album); setStep('done');
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? 'Something went wrong.');
    }
    setCreating(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(25,18,10,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadein .22s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#f7f2e9', borderRadius: 18, maxWidth: 440, width: '100%', padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,.4)', animation: 'modalin .22s ease' }}>
        {step === 'form' ? (
          <>
            <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: '#3a342d', margin: '0 0 8px' }}>create a new album</h2>
            <p style={{ fontFamily: "'Spectral', serif", fontSize: 14, color: '#6f665a', fontStyle: 'italic', margin: '0 0 22px', lineHeight: 1.5 }}>
              after creating, open the album to upload photos in bulk — no account needed.
            </p>

            <label style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#6f665a', display: 'block', marginBottom: 6 }}>album name</label>
            <input
              value={albumName}
              onChange={e => setAlbumName(e.target.value)}
              placeholder="e.g. Beach Days, Mahjong Night"
              style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 20, border: 'none', borderBottom: '1.5px solid #d8cdb9', background: 'transparent', padding: '6px 4px', color: '#3a342d', outline: 'none', marginBottom: 22, boxSizing: 'border-box' }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />

            <label style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#6f665a', display: 'block', marginBottom: 8 }}>cover image <span style={{ color: '#a8997f' }}>(optional)</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '1.5px dashed #d8cdb9', borderRadius: 12, padding: 16, textAlign: 'center',
                cursor: 'pointer', marginBottom: 22, minHeight: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                background: coverPreview ? '#000' : '#fdf9f3',
              }}
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="cover" style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }} />
              ) : (
                <span style={{ fontFamily: "'Spectral', serif", fontSize: 14, color: '#a8997f', fontStyle: 'italic' }}>tap to choose a cover photo</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />

            {error && <div style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#b23b2e', fontStyle: 'italic', marginBottom: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: 'transparent', color: '#9a8e79', border: '1px solid #d8cdb9', borderRadius: 20, padding: '8px 20px', cursor: 'pointer' }}>cancel</button>
              <button onClick={handleCreate} disabled={!albumName.trim() || creating} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: !albumName.trim() || creating ? '#d8cdb9' : accent, color: '#fff', border: 'none', borderRadius: 20, padding: '8px 28px', cursor: !albumName.trim() || creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'creating\u2026' : 'create album'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>&#127774;</div>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: '#3a342d', margin: '0 0 10px' }}>album created!</h2>
              <p style={{ fontFamily: "'Spectral', serif", fontSize: 14, color: '#6f665a', fontStyle: 'italic', margin: 0 }}>
                open the album to start uploading photos.
              </p>
            </div>
            {createdAlbum?.shareLink && (
              <a href={createdAlbum.shareLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', fontFamily: "'Caveat', cursive", fontSize: 22, color: accent, marginBottom: 20 }}>
                open album to add photos &#8599;
              </a>
            )}
            {!createdAlbum?.shareLink && defaultAlbumLink && (
              <a href={defaultAlbumLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', fontFamily: "'Caveat', cursive", fontSize: 22, color: accent, marginBottom: 20 }}>
                open shared album &#8599;
              </a>
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={onClose} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: accent, color: '#fff', border: 'none', borderRadius: 20, padding: '10px 28px', cursor: 'pointer' }}>done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
