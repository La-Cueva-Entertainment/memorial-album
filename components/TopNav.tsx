'use client';

import { useState, useEffect } from 'react';
import type { View } from './MemorialApp';

interface Props {
  name: string;
  dates: string;
  accent: string;
  view: View;
  onNav: (v: View) => void;
}

const NAV: { key: View; label: string }[] = [
  { key: 'board', label: 'the board' },
  { key: 'gallery', label: 'photo box' },
  { key: 'guestbook', label: 'guestbook' },
  { key: 'quotes', label: 'words of wisdom' },
  { key: 'bio', label: 'about cali' },
  { key: 'ocean-spray', label: 'ocean spray' },
  { key: 'mental-health', label: 'resources' },
];

export default function TopNav({ name, dates, accent, view, onNav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 740px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const activeLabel = NAV.find(n => n.key === view)?.label ?? view;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(247,242,233,.97)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid #d8cdb9',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 20px',
          gap: 12,
        }}
      >
        {/* Site name + dates */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: '#3a342d' }}>
            {name}
          </span>
          {dates && (
            <span style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9a8e79', marginTop: 3 }}>
              {dates}
            </span>
          )}
        </div>

        {/* ── Desktop nav ── */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {NAV.map(n => (
              <button
                key={n.key}
                onClick={() => onNav(n.key)}
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 'clamp(15px,1.6vw,20px)',
                  whiteSpace: 'nowrap',
                  background: view === n.key ? accent : 'transparent',
                  color: view === n.key ? '#fff' : '#5b4a36',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 22,
                  cursor: 'pointer',
                  transition: 'background .15s',
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Mobile controls ── */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#5b4a36', whiteSpace: 'nowrap' }}>
              {activeLabel}
            </span>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'close menu' : 'open menu'}
              style={{
                background: menuOpen ? '#3a342d' : accent,
                color: '#fff',
                border: 'none',
                width: 44,
                height: 44,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(120,70,40,.35)',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile dropdown ── */}
      {isMobile && menuOpen && (
        <div
          style={{
            background: 'rgba(247,242,233,.99)',
            borderTop: '1px solid #d8cdb9',
            padding: '6px 16px 14px',
          }}
        >
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => { onNav(n.key); setMenuOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                fontFamily: "'Caveat', cursive",
                fontSize: 23,
                background: view === n.key ? accent : 'transparent',
                color: view === n.key ? '#fff' : '#5b4a36',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 2,
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
