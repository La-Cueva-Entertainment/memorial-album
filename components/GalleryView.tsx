'use client';

import { useState, useEffect, useRef } from 'react';
import type { Item } from '@/types';
import SlideshowView from './SlideshowView';

const PAGE_SIZE = 48;

interface Props {
  items: Item[];
  slideshowItems: Item[];
  admin: boolean;
  accent: string;
  sessionUser?: { id: string; name: string; role: string } | null;
  onOpenMass: () => void;
  onOpenLightbox: (id: string) => void;
  onRemove: (id: string) => void;
  onPin: (id: string) => void;
}

export default function GalleryView({ items, slideshowItems, admin, accent, sessionUser, onOpenMass, onOpenLightbox, onRemove, onPin }: Props) {
  const [page, setPage] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  // armed = item id that had its remove button clicked once; second click confirms
  const [armed, setArmed] = useState<string | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const armRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (armed === id) {
      if (armTimer.current) clearTimeout(armTimer.current);
      setArmed(null);
      onRemove(id);
    } else {
      if (armTimer.current) clearTimeout(armTimer.current);
      setArmed(id);
      armTimer.current = setTimeout(() => setArmed(null), 3000);
    }
  };

  // ── Slideshow state ───────────────────────────────────────────────────────
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slidePlaying, setSlidePlaying] = useState(true);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (slideshowOpen && slidePlaying && slideshowItems.length > 1) {
      slideTimer.current = setInterval(() => {
        setSlideIdx(i => (i + 1) % slideshowItems.length);
      }, 4800);
    }
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [slideshowOpen, slidePlaying, slideshowItems.length]);

  // Close slideshow on Escape
  useEffect(() => {
    if (!slideshowOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSlideshowOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [slideshowOpen]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      {/* ── Slideshow overlay ── */}
      {slideshowOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: '#1a1612', overflow: 'auto' }}>
          <button
            onClick={() => setSlideshowOpen(false)}
            style={{
              position: 'fixed',
              top: 14,
              right: 14,
              zIndex: 60,
              background: 'rgba(255,255,255,.12)',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              width: 46,
              height: 46,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <SlideshowView
            slides={slideshowItems}
            slideIdx={Math.min(slideIdx, Math.max(0, slideshowItems.length - 1))}
            playing={slidePlaying}
            onPrev={() => { if (slideshowItems.length) setSlideIdx(i => (i - 1 + slideshowItems.length) % slideshowItems.length); }}
            onNext={() => { if (slideshowItems.length) setSlideIdx(i => (i + 1) % slideshowItems.length); }}
            onTogglePlay={() => setSlidePlaying(p => !p)}
          />
        </div>
      )}

    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 22px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 6,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 'clamp(26px,3.4vw,34px)',
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 2px 10px rgba(60,40,20,.45)',
            }}
          >
            the photo box
          </div>
          <div
            style={{
              fontFamily: "'Spectral', serif",
              fontStyle: 'italic',
              fontSize: 15,
              color: '#5b4a36',
              background: 'rgba(247,242,233,.8)',
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: 18,
              marginTop: 8,
            }}
          >
            every photo, all in one place — drop a whole batch at once
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => { setSlideIdx(0); setSlidePlaying(true); setSlideshowOpen(true); }}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 19,
              background: 'rgba(247,242,233,.85)',
              color: '#5b4a36',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 24,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(50,35,20,.12)',
            }}
          >
            ▶ slideshow
          </button>
          <button
            onClick={() => { setSelectMode(s => { if (s) setSelected(new Set()); return !s; }); }}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 19,
              background: selectMode ? '#5b4a36' : 'rgba(247,242,233,.85)',
              color: selectMode ? '#fff' : '#5b4a36',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 24,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(50,35,20,.12)',
            }}
          >
            {selectMode ? `✕ cancel (${selected.size})` : '↓ select to download'}
          </button>
          {selectMode && selected.size > 0 && (
            <button
              onClick={async () => {
                setDownloading(true);
                const toDownload = pageItems.filter(i => selected.has(i.id));
                for (let i = 0; i < toDownload.length; i++) {
                  const item = toDownload[i];
                  const a = document.createElement('a');
                  a.href = `/api/uploads/${item.imgPath}?download=1`;
                  a.download = item.caption || `photo-${item.id}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  if (i < toDownload.length - 1) await new Promise(r => setTimeout(r, 400));
                }
                setDownloading(false);
              }}
              disabled={downloading}
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 19,
                background: accent,
                color: '#fff',
                border: 'none',
                padding: '9px 22px',
                borderRadius: 24,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(120,70,40,.28)',
                opacity: downloading ? 0.6 : 1,
              }}
            >
              {downloading ? 'downloading…' : `↓ download ${selected.size}`}
            </button>
          )}
          <button
            onClick={onOpenMass}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 21,
              background: accent,
              color: '#fff',
              border: 'none',
              padding: '9px 22px',
              borderRadius: 24,
              cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(120,70,40,.28)',
            }}
          >
            + upload photos
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            fontFamily: "'Caveat', cursive",
            fontSize: 28,
            color: '#5b4a36',
          }}
        >
          no photos in the box yet
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
          padding: '20px 0 24px',
        }}
      >
        {pageItems.map(item => {
          const isSelected = selected.has(item.id);
          return (
          <div
            key={item.id}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 4,
              overflow: 'hidden',
              background: '#2a2015',
              boxShadow: isSelected ? `0 0 0 3px ${accent}` : 'none',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (selectMode) {
                setSelected(prev => {
                  const next = new Set(prev);
                  if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                  return next;
                });
              } else {
                onOpenLightbox(item.id);
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${item.imgPath}`}
              alt={item.caption || 'photo'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Select mode checkbox */}
            {selectMode && (
              <div style={{
                position: 'absolute', top: 6, left: 6,
                width: 22, height: 22, borderRadius: 6,
                background: isSelected ? accent : 'rgba(255,255,255,.85)',
                border: `2px solid ${isSelected ? accent : '#ccc'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
              </div>
            )}
            {!selectMode && admin && (
              <button
                onClick={e => armRemove(e, item.id)}
                title={armed === item.id ? 'click again to confirm delete' : 'remove'}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: armed === item.id ? 'auto' : 28,
                  height: 28,
                  borderRadius: armed === item.id ? 14 : '50%',
                  background: armed === item.id ? '#b23b2e' : 'rgba(178,59,46,.75)',
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: armed === item.id ? 12 : 14,
                  cursor: 'pointer',
                  lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: armed === item.id ? '0 8px' : 0,
                  whiteSpace: 'nowrap',
                  transition: 'all .15s',
                }}
              >
                {armed === item.id ? 'delete?' : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>}
              </button>
            )}
            {!selectMode && (admin || (sessionUser && item.author === sessionUser.name)) && (
              <button
                onClick={e => { e.stopPropagation(); onPin(item.id); }}
                title={item.source === 'board' ? 'on board' : 'pin to board'}
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: item.source === 'board' ? '#6b5a46' : accent,
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: 14,
                  cursor: item.source === 'board' ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
              </button>
            )}
          </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            paddingBottom: 40,
          }}
        >
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 0}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 20,
              background: page === 0 ? '#d8cdb9' : accent,
              color: '#fff',
              border: 'none',
              padding: '8px 22px',
              borderRadius: 22,
              cursor: page === 0 ? 'default' : 'pointer',
            }}
          >
            ← prev
          </button>
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 20,
              color: '#fffdf8',
              textShadow: '0 1px 4px rgba(60,40,20,.3)',
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }}
            disabled={page === totalPages - 1}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 20,
              background: page === totalPages - 1 ? '#d8cdb9' : accent,
              color: '#fff',
              border: 'none',
              padding: '8px 22px',
              borderRadius: 22,
              cursor: page === totalPages - 1 ? 'default' : 'pointer',
            }}
          >
            next →
          </button>
        </div>
      )}
    </div>
    </>
  );
}
