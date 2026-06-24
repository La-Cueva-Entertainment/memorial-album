'use client';

import { useRef, useState, useEffect } from 'react';
import type { Item } from '@/types';

interface Props {
  slides: Item[];
  slideIdx: number;
  playing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

const IcoPrev = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>;
const IcoNext = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>;
const IcoPlay = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const IcoPause = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const IcoFullscreen = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const IcoExitFullscreen = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>;

export default function SlideshowView({ slides, slideIdx, playing, onPrev, onNext, onTogglePlay }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      stageRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const cur = slides[slideIdx];

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 22px' }}>
      <div
        ref={stageRef}
        style={{
          background: '#211d18',
          borderRadius: isFullscreen ? 0 : 18,
          boxShadow: isFullscreen ? 'none' : '0 16px 40px rgba(30,20,10,.4)',
          padding: isFullscreen ? 0 : '30px 26px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isFullscreen ? 0 : 18,
          minHeight: isFullscreen ? '100vh' : 420,
          position: 'relative',
        }}
      >
        {slides.length === 0 ? (
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: '#cfc6b6', padding: '80px 0' }}>
            add some photos and they&apos;ll play here
          </div>
        ) : (
          <>
            {/* Image â€” fills screen in fullscreen */}
            <div style={{
              width: '100%',
              height: isFullscreen ? '100vh' : '60vh',
              maxHeight: isFullscreen ? '100vh' : 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {cur && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={cur.id + '-' + slideIdx}
                  src={`/api/uploads/${cur.imgPath}`}
                  alt={cur.caption || 'slide'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: isFullscreen ? 0 : 4,
                    boxShadow: isFullscreen ? 'none' : '0 10px 30px rgba(0,0,0,.5)',
                    animation: 'slidefade 1s ease',
                  }}
                />
              )}
            </div>

            {/* Caption + counter + controls â€” overlaid in fullscreen */}
            <div style={{
              position: isFullscreen ? 'absolute' : 'static',
              bottom: isFullscreen ? 0 : undefined,
              left: 0, right: 0,
              background: isFullscreen ? 'linear-gradient(transparent, rgba(10,8,5,.85))' : 'none',
              padding: isFullscreen ? '40px 32px 24px' : '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}>
              {cur?.caption && (
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: isFullscreen ? 28 : 22, color: '#f3ede2', textAlign: 'center' }}>
                  {cur.caption}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <button onClick={onPrev} aria-label="previous" style={{ background: 'none', border: 'none', color: '#cfc6b6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <IcoPrev />
                </button>
                <button onClick={onTogglePlay} aria-label={playing ? 'pause' : 'play'} style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', cursor: 'pointer', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {playing ? <IcoPause /> : <IcoPlay />}
                </button>
                <button onClick={onNext} aria-label="next" style={{ background: 'none', border: 'none', color: '#cfc6b6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <IcoNext />
                </button>
                <button onClick={toggleFullscreen} title={isFullscreen ? 'exit fullscreen' : 'fullscreen'} style={{ background: 'none', border: 'none', color: '#9a8e79', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Caveat', cursive", fontSize: 15, marginLeft: 8 }}>
                  {isFullscreen ? <IcoExitFullscreen /> : <IcoFullscreen />}
                  {isFullscreen ? 'exit fullscreen' : 'full screen'}
                </button>
              </div>

              <div style={{ fontSize: 12, color: '#7d7464' }}>
                {slideIdx + 1} / {slides.length}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
