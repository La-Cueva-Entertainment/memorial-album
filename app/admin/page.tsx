'use client';

import { useEffect, useState } from 'react';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => { setAdmin(d.admin); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAdmin(true);
    else setError('Wrong password.');
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1612', color: '#f3ede2', fontFamily: "'Caveat', cursive", fontSize: 22 }}>
        loading…
      </div>
    );
  }

  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1612' }}>
        <form onSubmit={handleLogin} style={{ background: '#f7f2e9', borderRadius: 18, padding: '32px 36px', maxWidth: 360, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#3a342d', marginBottom: 18 }}>
            admin login
          </div>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 20, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '10px 12px', outline: 'none', background: '#fbf7ef', color: '#3a342d', marginBottom: 12 }}
          />
          {error && <div style={{ color: '#b23b2e', fontFamily: "'Caveat', cursive", fontSize: 16, marginBottom: 10 }}>{error}</div>}
          <button
            type="submit"
            style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 20, background: '#b5704f', color: '#fff', border: 'none', padding: '10px', borderRadius: 22, cursor: 'pointer' }}
          >
            sign in
          </button>
          <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontFamily: "'Caveat', cursive", fontSize: 16, color: '#9a8e79', textDecoration: 'none' }}>
            ← back to site
          </a>
        </form>
      </div>
    );
  }

  return <AdminPanel />;
}
