'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface Track { id: string; title: string; filename: string; }
interface Props { admin: boolean; }

const IcoPrev = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const IcoNext = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>;
const IcoPlay = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const IcoPause = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const IcoNote = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>;
const IcoX = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;

export default function MusicPlayer({ admin }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/tracks')
      .then(r => r.json())
      .then((data: unknown) => { if (Array.isArray(data)) setTracks(data as Track[]); })
      .catch(() => {});
  }, []);

  const current = tracks[idx] ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.src.endsWith(current.filename)) return;
    const wasPlaying = playing;
    audio.src = `/api/uploads/tracks/${current.filename}`;
    audio.load();
    if (wasPlaying) audio.play().catch(() => setPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing, current]);

  const playAt = useCallback((i: number) => {
    const audio = audioRef.current;
    if (!audio || !tracks[i]) return;
    setIdx(i);
    audio.src = `/api/uploads/tracks/${tracks[i].filename}`;
    audio.load();
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [tracks]);

  const skip = useCallback((dir: 1 | -1) => {
    if (!tracks.length) return;
    playAt((idx + dir + tracks.length) % tracks.length);
  }, [idx, tracks.length, playAt]);

  const onEnded = useCallback(() => {
    // Always repeat: advance to next (wraps around to start on last track)
    playAt((idx + 1) % Math.max(tracks.length, 1));
  }, [idx, tracks.length, playAt]);

  const uploadTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/tracks', { method: 'POST', body: fd });
    if (res.ok) {
      const track: Track = await res.json();
      setTracks(prev => [...prev, track]);
    }
    setUploading(false);
    e.target.value = '';
  };

  const deleteTrack = async (id: string, i: number) => {
    await fetch(`/api/tracks/${id}`, { method: 'DELETE' });
    setTracks(prev => prev.filter(t => t.id !== id));
    setIdx(prev => prev > i ? prev - 1 : prev === i ? Math.max(0, i - 1) : prev);
  };

  const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#c8bca8', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
      {children}
    </button>
  );

  // Non-admins: hide pill entirely if no tracks
  if (!admin && tracks.length === 0) return null;

  return (
    <>
      <audio ref={audioRef} onEnded={onEnded} loop={tracks.length === 1} />
      {/* Only admins get the file input */}
      {admin && <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={uploadTrack} />}

      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>

        {/* Track list — only shown when open */}
        {open && (
          <div style={{ pointerEvents: 'all', background: 'rgba(28,22,14,.95)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', width: 280, boxShadow: '0 8px 32px rgba(0,0,0,.5)', overflow: 'hidden' }}>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {tracks.length === 0 && (
                <div style={{ padding: '12px 14px', fontFamily: "'Caveat', cursive", fontSize: 15, color: '#6a5e4e' }}>
                  no tracks yet — add one below
                </div>
              )}
              {tracks.map((t, i) => (
                <div key={t.id} onClick={() => playAt(i)}
                  style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 8, background: i === idx ? 'rgba(255,255,255,.06)' : 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.09)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = i === idx ? 'rgba(255,255,255,.06)' : 'transparent'; }}
                >
                  <span style={{ width: 16, textAlign: 'center', flexShrink: 0, color: '#6a5e4e', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === idx && playing ? <IcoNote /> : i + 1}
                  </span>
                  <span style={{ flex: 1, fontFamily: "'Caveat', cursive", fontSize: 16, color: i === idx ? '#f0e8d8' : '#b0a48e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </span>
                  {admin && (
                    <button onClick={ev => { ev.stopPropagation(); deleteTrack(t.id, i); }}
                      style={{ background: 'none', border: 'none', color: '#5a4e40', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <IcoX />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Admin-only: add track */}
            {admin && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '8px 14px' }}>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ background: 'none', border: 'none', color: uploading ? '#5a7a5a' : '#7aad7a', fontFamily: "'Caveat', cursive", fontSize: 16, cursor: uploading ? 'default' : 'pointer', padding: 0 }}>
                  {uploading ? 'reading metadata...' : '+ add track'}
                </button>
              </div>
            )}

            {/* Playback controls */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '6px 14px', display: 'flex', justifyContent: 'center', gap: 4 }}>
              <Btn onClick={() => skip(-1)}><IcoPrev /></Btn>
              <Btn onClick={togglePlay}>{playing ? <IcoPause s={20} /> : <IcoPlay s={20} />}</Btn>
              <Btn onClick={() => skip(1)}><IcoNext /></Btn>
            </div>
          </div>
        )}

        {/* Pill */}
        <div style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(28,22,14,.88)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 999, padding: '5px 10px', boxShadow: '0 4px 18px rgba(0,0,0,.4)' }}>
          <Btn onClick={togglePlay}>{playing ? <IcoPause /> : <IcoPlay />}</Btn>
          <button onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: current ? '#d0c4b0' : '#6a5e4e', fontFamily: "'Caveat', cursive", fontSize: 15, cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', gap: 4, maxWidth: 220 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current ? current.title : admin ? 'add music' : 'music'}
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#6a5e4e" style={{ flexShrink: 0 }}>
              {open ? <path d="M7 14l5-5 5 5z"/> : <path d="M7 10l5 5 5-5z"/>}
            </svg>
          </button>
        </div>

      </div>
    </>
  );
}