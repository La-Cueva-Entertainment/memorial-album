'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Item } from '@/types';

interface Props {
  accent: string;
  onClose: () => void;
  onAdded: (items: Item[]) => void;
  sessionUser?: { id: string; name: string } | null;
}

type UploadTab = 'device' | 'immich';

interface ImmichAsset {
  id: string;
  originalFileName?: string;
  type?: string;
}

interface ImmichAlbum {
  id: string;
  name: string;
  count: number;
}

export default function MassUploadModal({ accent, onClose, onAdded, sessionUser }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const immichAuthorRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<UploadTab>('device');
  const [status, setStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Immich state
  const [immichUrl, setImmichUrl] = useState('');
  const [immichKey, setImmichKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [immichAssets, setImmichAssets] = useState<ImmichAsset[]>([]);
  const [immichAlbums, setImmichAlbums] = useState<ImmichAlbum[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterAlbumId, setFilterAlbumId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [immichError, setImmichError] = useState('');
  const [hoverAsset, setHoverAsset] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const [pinToBoard, setPinToBoard] = useState(false);
  const [immichConfigured, setImmichConfigured] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadAssets = useCallback((albumId?: string) => {
    setConnecting(true);
    setImmichError('');
    const url = albumId ? `/api/immich/browse?albumId=${albumId}` : '/api/immich/browse';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setImmichConfigured(!!data.configured);
        if (!initialLoaded && data.albums?.length) setImmichAlbums(data.albums);
        setImmichAssets(data.assets ?? []);
        setSelectedIds(new Set());
        if (data.error && !data.assets?.length) setImmichError(data.error);
        setInitialLoaded(true);
      })
      .catch(() => {})
      .finally(() => setConnecting(false));
  }, [initialLoaded]);

  // Auto-fetch when Immich tab opens
  useEffect(() => {
    if (tab !== 'immich' || initialLoaded) return;
    loadAssets();
  }, [tab, initialLoaded, loadAssets]);

  const handleAlbumChange = (albumId: string) => {
    setFilterAlbumId(albumId);
    loadAssets(albumId || undefined);
  };

  // Device upload
  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const author = authorRef.current?.value.trim() || 'anonymous';
    const fd = new FormData();
    fd.append('author', author);
    files.forEach(f => fd.append('files', f));
    setStatus(`adding 0 / ${files.length}...`);
    const res = await fetch('/api/gallery', { method: 'POST', body: fd });
    if (!res.ok) { setStatus('Something went wrong.'); return; }
    const created: Item[] = await res.json();
    setStatus(`added ${created.length} photo${created.length === 1 ? '' : 's'}`);
    onAdded(created);
  }, [onAdded]);

  // Manual connect (fallback when env vars not set)
  const connectImmich = async () => {
    if (!immichUrl.trim() || !immichKey.trim()) return;
    setConnecting(true); setImmichError('');
    try {
      const res = await fetch('/api/immich/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: immichUrl.trim(), apiKey: immichKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setImmichError(data.error ?? 'Connection failed'); return; }
      const imgs: ImmichAsset[] = (data.assets as ImmichAsset[]).filter(a => !a.type || a.type.toUpperCase() === 'IMAGE');
      setImmichAssets(imgs); setSelectedIds(new Set()); setInitialLoaded(true);
    } catch { setImmichError('Could not reach the Immich server.'); }
    finally { setConnecting(false); }
  };

  const disconnect = async () => {
    await fetch('/api/immich/connect', { method: 'DELETE' }).catch(() => {});
    setImmichAssets([]);
    setImmichAlbums([]);
    setSelectedIds(new Set());
    setFilterAlbumId('');
    setImmichError('');
    setImmichConfigured(false);
    setInitialLoaded(false);
    setHoverAsset(null);
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const selectAll = () => setSelectedIds(new Set(immichAssets.map(a => a.id)));
  const clearAll = () => setSelectedIds(new Set());

  const importSelected = async () => {
    if (!selectedIds.size) return;
    setImporting(true);
    const author = immichAuthorRef.current?.value.trim() || 'anonymous';
    const res = await fetch('/api/immich/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetIds: Array.from(selectedIds),
        author,
        targetAlbumId: filterAlbumId || undefined,
        source: pinToBoard ? 'board' : 'gallery',
      }),
    });
    setImporting(false);
    if (!res.ok) { setImmichError('Import failed. Please try again.'); return; }
    const created: Item[] = await res.json();
    onAdded(created);
    setSelectedIds(new Set());
    setStatus(`imported ${created.length} photo${created.length !== 1 ? 's' : ''} from Immich`);
    setTab('device');
  };

  const tabBtn = (t: UploadTab, label: string) => (
    <button key={t} onClick={() => setTab(t)} style={{ fontFamily: "'Caveat', cursive", fontSize: 17, background: tab === t ? accent : '#ece6d9', color: tab === t ? '#fff' : '#6b6358', border: 'none', padding: '6px 16px', borderRadius: 18, cursor: 'pointer' }}>
      {label}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(35,25,15,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#f7f2e9', borderRadius: 18, maxWidth: 520, width: '100%', padding: 26, boxShadow: '0 24px 60px rgba(0,0,0,.4)', maxHeight: '92vh', overflowY: 'auto', animation: 'pop .25s ease' }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: '#3a342d' }}>upload a batch of photos</div>
        <div style={{ fontSize: 13.5, color: '#6b6358', lineHeight: 1.5, margin: '6px 0 16px' }}>
          These go into the <strong>Photo box</strong> gallery. <em>Want one on the board with a memory? Use <strong>+ add</strong> instead.</em>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          {tabBtn('device', 'from device')}
          {tabBtn('immich', 'from Immich')}
        </div>

        {/* Device */}
        {tab === 'device' && (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
              style={{ cursor: 'pointer', border: `2px dashed ${isDragOver ? accent : '#c9bca4'}`, borderRadius: 12, minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDragOver ? 'rgba(181,112,79,.06)' : '#fbf7ef', textAlign: 'center', gap: 8, padding: 24, transition: 'border-color .15s' }}
            >
              <span style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#9a8e79' }}>drop photos here, or tap to choose</span>
              <span style={{ fontSize: 12, color: '#b3a890' }}>JPEG &middot; PNG &middot; WebP &middot; GIF &middot; iCloud Photos show up automatically on Apple</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
            <input ref={authorRef} placeholder="your name (added to all)" style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 19, border: 'none', borderBottom: '1.5px solid #e2dac9', padding: '8px 4px', outline: 'none', background: 'none', marginTop: 16, color: '#3a342d' }} />
            {status && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: accent, marginTop: 12 }}>{status}</div>}
          </>
        )}

        {/* Immich */}
        {tab === 'immich' && (
          <>
            {connecting && !initialLoaded && (
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 19, color: '#9a8e79', padding: '30px 0', textAlign: 'center' }}>connecting to Immich...</div>
            )}

            {!connecting && !initialLoaded && !immichConfigured && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13.5, color: '#6b6358', lineHeight: 1.5 }}>Enter your self-hosted Immich server URL and an API key (Immich &rarr; Account settings &rarr; API keys).</div>
                <input value={immichUrl} onChange={e => setImmichUrl(e.target.value)} placeholder="https://photos.yourdomain.com" style={{ fontFamily: "'Caveat', cursive", fontSize: 18, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '9px 12px', outline: 'none', background: '#fbf7ef', color: '#3a342d' }} />
                <input value={immichKey} onChange={e => setImmichKey(e.target.value)} placeholder="API key" type="password" style={{ fontFamily: "'Caveat', cursive", fontSize: 18, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '9px 12px', outline: 'none', background: '#fbf7ef', color: '#3a342d' }} />
                {immichError && <div style={{ color: '#b23b2e', fontFamily: "'Caveat', cursive", fontSize: 15 }}>{immichError}</div>}
                <button onClick={connectImmich} disabled={connecting} style={{ alignSelf: 'flex-start', fontFamily: "'Caveat', cursive", fontSize: 19, background: connecting ? '#c9a88e' : accent, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 22, cursor: 'pointer' }}>{connecting ? 'connecting...' : 'connect'}</button>
              </div>
            )}

            {initialLoaded && (
              <>
                {/* Header row: album filter + disconnect */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {immichAlbums.length > 0 ? (
                    <select
                      value={filterAlbumId}
                      onChange={e => handleAlbumChange(e.target.value)}
                      disabled={connecting}
                      style={{ flex: 1, fontFamily: "'Caveat', cursive", fontSize: 17, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '7px 10px', outline: 'none', background: '#fbf7ef', color: '#3a342d', cursor: 'pointer' }}
                    >
                      <option value="">all photos</option>
                      {immichAlbums.map(a => (
                        <option key={a.id} value={a.id}>{a.name}{a.count ? ` (${a.count})` : ''}</option>
                      ))}
                    </select>
                  ) : <div style={{ flex: 1 }} />}
                  <button
                    onClick={disconnect}
                    title="Disconnect from Immich"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '6px 14px', borderRadius: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >disconnect</button>
                </div>
                {connecting && (
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#9a8e79', padding: '10px 0', textAlign: 'center' }}>loading...</div>
                )}

                {!connecting && immichAssets.length === 0 && (
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#9a8e79', padding: '20px 0', textAlign: 'center' }}>
                    {immichError || 'No photos found.'}
                  </div>
                )}

                {!connecting && immichAssets.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#5b4a36' }}>{immichAssets.length} photos &middot; {selectedIds.size} selected</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['select all', 'clear'] as const).map(lbl => (
                          <button key={lbl} onClick={lbl === 'select all' ? selectAll : clearAll} style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '4px 12px', borderRadius: 14, cursor: 'pointer' }}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
                        {immichAssets.map(a => (
                          <div
                            key={a.id}
                            onClick={() => toggleSelect(a.id)}
                            onMouseEnter={e => {
                              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setHoverAsset({ id: a.id, name: a.originalFileName ?? '', x: r.left + r.width / 2, y: r.top });
                            }}
                            onMouseLeave={() => setHoverAsset(null)}
                            style={{ aspectRatio: '1', borderRadius: 7, overflow: 'hidden', cursor: 'pointer', outline: selectedIds.has(a.id) ? `3px solid ${accent}` : '3px solid transparent', background: '#ece6d9', transition: 'outline .1s, transform .15s', userSelect: 'none', transform: hoverAsset?.id === a.id ? 'scale(1.08)' : 'scale(1)', zIndex: hoverAsset?.id === a.id ? 2 : 1, position: 'relative' }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/immich/thumbnail?assetId=${a.id}`}
                              alt={a.originalFileName ?? ''}
                              loading="lazy"
                              draggable={false}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                            />
                          </div>
                        ))}
                      </div>
                      {/* Floating hover preview */}
                      {hoverAsset && (
                        <div style={{ position: 'fixed', left: Math.min(hoverAsset.x - 110, window.innerWidth - 236), top: hoverAsset.y > 300 ? hoverAsset.y - 250 : hoverAsset.y + 84, width: 220, zIndex: 9999, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.35)', overflow: 'hidden', pointerEvents: 'none' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/immich/thumbnail?assetId=${hoverAsset.id}`}
                            alt={hoverAsset.name}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                          />
                          {hoverAsset.name && (
                            <div style={{ padding: '6px 10px', fontFamily: "'Caveat', cursive", fontSize: 14, color: '#5b4a36', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoverAsset.name}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <input ref={immichAuthorRef} placeholder="your name (added to all)" style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 19, border: 'none', borderBottom: '1.5px solid #e2dac9', padding: '8px 4px', outline: 'none', background: 'none', marginTop: 12, color: '#3a342d' }} />
                {sessionUser && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={pinToBoard}
                      onChange={e => setPinToBoard(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: accent, cursor: 'pointer' }}
                    />
                    <span style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#5b4a36' }}>
                      pin to board (only you can do this)
                    </span>
                  </label>
                )}
                {immichError && <div style={{ color: '#b23b2e', fontFamily: "'Caveat', cursive", fontSize: 15, marginTop: 8 }}>{immichError}</div>}
                <button
                  onClick={importSelected}
                  disabled={importing || !selectedIds.size}
                  style={{ marginTop: 12, fontFamily: "'Caveat', cursive", fontSize: 19, background: importing || !selectedIds.size ? '#c9a88e' : accent, color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 22, cursor: selectedIds.size ? 'pointer' : 'default' }}
                >
                  {importing ? 'importing...' : selectedIds.size ? `import ${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''}` : 'select photos above'}
                </button>
              </>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ fontFamily: "'Caveat', cursive", fontSize: 19, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '8px 24px', borderRadius: 22, cursor: 'pointer' }}>done</button>
        </div>
      </div>
    </div>
  );
}