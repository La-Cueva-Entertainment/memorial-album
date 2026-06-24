'use client';

import Link from 'next/link';

interface Props {
  admin: boolean;
  accent: string;
  onToggle: () => void;
}

// SVG icons to avoid emoji encoding issues
const IcoFolder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
  </svg>
);
const IcoUnlock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
  </svg>
);

export default function AdminToggle({ admin, accent, onToggle }: Props) {
  if (!admin) return null;

  return (
    <>
      {/* Hint pill */}
      <div style={{
        position: 'fixed', left: 60, bottom: 24, zIndex: 55,
        background: '#b23b2e', color: '#fff',
        fontFamily: "'Caveat', cursive", fontSize: 16,
        padding: '5px 14px', borderRadius: 18,
        boxShadow: '0 4px 10px rgba(0,0,0,.3)',
      }}>
        admin mode
      </div>

      {/* Admin panel link */}
      <Link href="/admin" title="admin panel" style={{
        position: 'fixed', left: 14, bottom: 112, zIndex: 55,
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(33,29,24,.8)', color: '#9a8e79',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', boxShadow: '0 4px 10px rgba(0,0,0,.25)',
      }}>
        <IcoFolder />
      </Link>

      {/* Exit admin mode */}
      <button onClick={onToggle} title="exit admin mode" style={{
        position: 'fixed', left: 14, bottom: 66, zIndex: 55,
        width: 38, height: 38, borderRadius: '50%',
        background: accent, color: '#fff',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,.25)',
      }}>
        <IcoUnlock />
      </button>
    </>
  );
}