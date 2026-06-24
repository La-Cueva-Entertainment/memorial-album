'use client';

import { useState } from 'react';

interface Props {
  admin: boolean;
  accent: string;
  onToggle: () => void;
}

export default function AdminToggle({ admin, accent, onToggle }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Inconspicuous dot — bottom-right corner, barely visible */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={admin ? 'Exit admin mode' : 'Admin login'}
        style={{
          position: 'fixed', right: 14, bottom: 18, zIndex: 55,
          width: 10, height: 10, borderRadius: '50%',
          background: admin ? accent : hovered ? 'rgba(90,70,50,.35)' : 'rgba(90,70,50,.12)',
          border: 'none', cursor: 'pointer', padding: 0,
          transition: 'background .2s, transform .2s',
          transform: hovered ? 'scale(1.6)' : 'scale(1)',
        }}
      />

      {/* Subtle "admin" pill when active */}
      {admin && (
        <div style={{
          position: 'fixed', right: 28, bottom: 14, zIndex: 55,
          background: 'rgba(178,59,46,.85)', color: '#fff',
          fontFamily: "'Caveat', cursive", fontSize: 13,
          padding: '3px 10px', borderRadius: 14,
          pointerEvents: 'none',
        }}>
          admin
        </div>
      )}
    </>
  );
}
