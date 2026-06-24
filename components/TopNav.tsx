'use client';

import { useState, useEffect } from 'react';

export type View = 'home' | 'albums' | 'messages' | 'quotes' | 'event' | 'resources';

interface Props {
  view: View;
  onNav: (v: View) => void;
  accent: string;
}

const NAV_DESKTOP: { key: View; label: string }[] = [
  { key: 'home',      label: 'Home' },
  { key: 'albums',    label: 'Albums' },
  { key: 'messages',  label: 'Messages' },
  { key: 'quotes',    label: 'Quotes' },
  { key: 'event',     label: 'Ocean Spray' },
  { key: 'resources', label: 'Resources' },
];

const NAV_MOBILE: { key: View; label: string; emoji: string }[] = [
  { key: 'home',      label: 'Home',                emoji: '🏠' },
  { key: 'albums',    label: 'Photo Albums',         emoji: '📷' },
  { key: 'messages',  label: 'Messages for Cali',    emoji: '✉️' },
  { key: 'quotes',    label: 'Quotes by Cali',       emoji: '💬' },
  { key: 'event',     label: 'Ocean Spray',          emoji: '🌊' },
  { key: 'resources', label: 'Resources',             emoji: '💙' },
];

export default function TopNav({ view, onNav, accent }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 880px)');
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const closeDrawer = () => setMenuOpen(false);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(246,239,227,.94)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2d6bf',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 20px',
          }}
        >
          {/* Wordmark */}
          <button
            onClick={() => { onNav('home'); closeDrawer(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: '#3a342d' }}>
              Kathryn Cali
            </span>
            <span style={{
              fontFamily: "'Spectral', serif",
              fontSize: 11,
              letterSpacing: '.18em',
              color: '#a8997f',
              marginLeft: 8,
              verticalAlign: 'middle',
              textTransform: 'uppercase' as const,
            }}>
              remembered
            </span>
          </button>

          {/* Desktop nav — hidden on mobile via CSS */}
          <nav suppressHydrationWarning style={{ display: isDesktop ? 'flex' : 'none', gap: 4 }}>
              {NAV_DESKTOP.map(n => (
                <button
                  key={n.key}
                  onClick={() => onNav(n.key)}
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 18,
                    whiteSpace: 'nowrap' as const,
                    background: view === n.key ? accent : 'transparent',
                    color: view === n.key ? '#fff' : '#52483c',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: 22,
                    cursor: 'pointer',
                    // No CSS transition on background — prevents paint lag on active pill
                  }}
                >
                  {n.label}
                </button>
              ))}
            </nav>

          {/* Mobile hamburger — hidden on desktop via CSS */}
          <button
              suppressHydrationWarning
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              style={{
                display: isDesktop ? 'none' : 'flex',
                background: accent,
                border: 'none',
                width: 42,
                height: 42,
                borderRadius: 10,
                cursor: 'pointer',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(120,70,40,.3)',
              }}
            >
              <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
            </button>
        </div>

        {/* Mobile drawer — only shown when open and not desktop */}
        {!isDesktop && menuOpen && (
          <div
            style={{
              background: '#f6efe3',
              borderTop: '1px solid #e2d6bf',
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
              padding: '6px 12px 16px',
              animation: 'drawer .22s ease',
            }}
          >
            {NAV_MOBILE.map(n => (
              <button
                key={n.key}
                onClick={() => { onNav(n.key); closeDrawer(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left' as const,
                  fontFamily: "'Caveat', cursive",
                  fontSize: 24,
                  background: view === n.key ? accent : '#efe6d6',
                  color: view === n.key ? '#fff' : '#3a342d',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  marginBottom: 4,
                  minHeight: 50,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{n.emoji}</span>
                {n.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Scrim — only shown on mobile when menu open */}
      {!isDesktop && menuOpen && (
        <div
          onClick={closeDrawer}
          style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,.18)' }}
        />
      )}
    </>
  );
}
