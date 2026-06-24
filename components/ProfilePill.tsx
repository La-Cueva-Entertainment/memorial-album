'use client';

import { useState } from 'react';

interface Props {
  user: { id: string; name: string; role?: string };
  accent: string;
  onUpdated: (name: string) => void;
}

export default function ProfilePill({ user, accent, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) { setOpen(false); return; }
    setSaving(true);
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) onUpdated(trimmed);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div style={{ position: 'fixed', left: 14, bottom: 20, zIndex: 54 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 46, left: 0,
          background: 'rgba(28,22,14,.97)', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 12, padding: '12px 14px', width: 220,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: '#9a8e79', marginBottom: 6 }}>your display name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
            autoFocus
            style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 18, background: '#2b2722', color: '#f3ede2', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, padding: '5px 10px', outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={save} disabled={saving} style={{ marginTop: 8, fontFamily: "'Caveat', cursive", fontSize: 16, background: accent, color: '#fff', border: 'none', padding: '4px 16px', borderRadius: 14, cursor: 'pointer' }}>
            {saving ? 'saving…' : 'save'}
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="edit your profile"
        style={{
          fontFamily: "'Caveat', cursive", fontSize: 14,
          background: 'rgba(28,22,14,.8)', border: '1px solid rgba(255,255,255,.12)',
          color: '#9a8e79', borderRadius: 999, padding: '5px 12px',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
          whiteSpace: 'nowrap',
        }}
      >
        {user.name} &nbsp;
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
      </button>
    </div>
  );
}
