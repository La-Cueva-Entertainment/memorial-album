'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface InviteStatus {
  valid: boolean;
  reason?: string;
  role?: string;
  note?: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<InviteStatus | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(p => {
      setToken(p.token);
      fetch(`/api/invite/${p.token}`)
        .then(r => r.json())
        .then(setStatus)
        .catch(() => setStatus({ valid: false, reason: 'error' }));
    });
  }, [params]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/invite/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(data.admin ? '/admin' : '/');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong.');
      setSubmitting(false);
    }
  };

  const REASON: Record<string, string> = {
    not_found: "This invite link doesn't exist.",
    already_used: 'This invite has already been used.',
    expired: 'This invite has expired.',
    error: 'Something went wrong loading the invite.',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#cdb38a', backgroundImage: 'radial-gradient(circle at 18% 22%, rgba(60,40,20,.07) 1.5px, transparent 1.6px)', backgroundSize: '13px 13px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Spectral', Georgia, serif" }}>
      <div style={{ background: '#f7f2e9', borderRadius: 18, maxWidth: 420, width: '100%', padding: 32, boxShadow: '0 24px 60px rgba(0,0,0,.3)', animation: 'pop .25s ease' }}>

        {!status && (
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#9a8e79', textAlign: 'center' }}>loading invite…</div>
        )}

        {status && !status.valid && (
          <>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, color: '#b23b2e', marginBottom: 12 }}>invite unavailable</div>
            <div style={{ fontSize: 15, color: '#6b6358' }}>{REASON[status.reason ?? ''] ?? 'This invite link is not valid.'}</div>
            <a href="/" style={{ display: 'inline-block', marginTop: 20, fontFamily: "'Caveat', cursive", fontSize: 18, color: '#b5704f', textDecoration: 'none' }}>← back to site</a>
          </>
        )}

        {status?.valid && (
          <form onSubmit={handleRedeem}>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: '#3a342d', marginBottom: 6 }}>you've been invited</div>
            {status.note && (
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#8a6b46', marginBottom: 4 }}>"{status.note}"</div>
            )}
            <div style={{ fontSize: 13.5, color: '#6b6358', lineHeight: 1.5, margin: '8px 0 20px' }}>
              {status.role === 'admin'
                ? 'This link gives you admin access to the memorial site.'
                : 'Enter your name to join and start adding memories.'}
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="your name"
              autoFocus
              style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 21, border: 'none', borderBottom: '1.5px solid #e2dac9', padding: '8px 4px', outline: 'none', background: 'none', color: '#3a342d', marginBottom: 16 }}
            />
            {error && <div style={{ color: '#b23b2e', fontFamily: "'Caveat', cursive", fontSize: 16, marginBottom: 10 }}>{error}</div>}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 21, background: submitting ? '#c9a88e' : '#b5704f', color: '#fff', border: 'none', padding: '10px', borderRadius: 24, cursor: submitting ? 'default' : 'pointer' }}
            >
              {submitting ? 'joining…' : 'accept invite'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
