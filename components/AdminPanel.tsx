'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Invitation, User } from '@/types';

const ACCENT = '#b5704f';

interface DownloadFile {
  id: string;
  imgPath: string;
  caption: string;
  author: string;
  ts: string;
  source: string;
  sizeBytes: number;
}

type Tab = 'files' | 'invitations' | 'users';

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('invitations');
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [invitations, setInvitations] = useState<(Invitation & { users: User[]; useCount?: number; multiUse?: boolean })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // â”€â”€ Invite form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [invNote, setInvNote] = useState('');
  const [invRole, setInvRole] = useState<'contributor' | 'super_contributor' | 'admin'>('contributor');
  const [invMultiUse, setInvMultiUse] = useState(true);
  const [invExpiry, setInvExpiry] = useState('30');
  const [creating, setCreating] = useState(false);
  const [newInvite, setNewInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/admin/downloads').then(r => r.json());
    setFiles(data);
    setLoading(false);
  }, []);

  const loadInvitations = useCallback(async () => {
    const data = await fetch('/api/admin/invitations').then(r => r.json());
    setInvitations(data);
    const allUsers: User[] = data.flatMap((inv: Invitation & { users: User[] }) => inv.users ?? []);
    setUsers(allUsers);
  }, []);

  useEffect(() => {
    if (tab === 'files') loadFiles();
    else loadInvitations();
  }, [tab, loadFiles, loadInvitations]);

  const createInvite = async () => {
    setCreating(true);
    setNewInvite(null);
    setCopied(false);
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: invRole,
        note: invNote,
        multiUse: invMultiUse,
        expiresInDays: parseInt(invExpiry) || 30,
      }),
    });
    if (res.ok) {
      const inv: Invitation = await res.json();
      setNewInvite(inv);
      loadInvitations();
    }
    setCreating(false);
  };

  const revokeInvite = async (id: string) => {
    await fetch(`/api/admin/invitations?id=${id}`, { method: 'DELETE' });
    setInvitations(prev => prev.filter(i => i.id !== id));
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promoteUser = async (id: string, role: 'admin' | 'contributor' | 'super_contributor') => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const fmt = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const fmtDate = (ts: string) => new Date(ts).toLocaleDateString();

  const pill = (active: boolean, label: string, t: Tab) => (
    <button onClick={() => setTab(t)} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: active ? ACCENT : 'rgba(255,255,255,.08)', color: active ? '#fff' : '#cfc6b6', border: 'none', padding: '6px 18px', borderRadius: 20, cursor: 'pointer' }}>
      {label}
    </button>
  );

  const newLink = newInvite ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${newInvite.token}` : '';

  return (
    <div style={{ minHeight: '100vh', background: '#1a1612', color: '#f3ede2', fontFamily: "'Spectral', Georgia, serif", paddingBottom: 60 }}>
      <div style={{ background: 'rgba(33,29,24,.97)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: 26, fontWeight: 700 }}>admin panel</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {pill(tab === 'invitations', 'invitations', 'invitations')}
          {pill(tab === 'users', 'users', 'users')}
          {pill(tab === 'files', 'files', 'files')}
          <a href="/" style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#9a8e79', marginLeft: 8, textDecoration: 'none' }}>â† site</a>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>

        {/* â”€â”€ Invitations tab â”€â”€ */}
        {tab === 'invitations' && (
          <>
            {/* Create invite */}
            <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '20px 22px', marginBottom: 26 }}>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#f3ede2', marginBottom: 14 }}>invite link</div>
              <p style={{ fontSize: 13.5, color: '#9a8e79', margin: '0 0 16px', lineHeight: 1.55 }}>
                Share this link with anyone you want to invite. Use the role selector to control their permissions.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: '#9a8e79', marginBottom: 4 }}>note (optional)</div>
                  <input value={invNote} onChange={e => setInvNote(e.target.value)} placeholder="e.g. family reunion 2025"
                    style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 17, background: '#2b2722', color: '#f3ede2', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 12px', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9a8e79', marginBottom: 4 }}>role</div>
                  <select
                    value={invRole}
                    onChange={e => setInvRole(e.target.value as typeof invRole)}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 17, background: '#2b2722', color: '#f3ede2', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 10px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="contributor">contributor</option>
                    <option value="super_contributor">super contributor</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9a8e79', marginBottom: 4 }}>expires (days)</div>
                  <input type="number" value={invExpiry} onChange={e => setInvExpiry(e.target.value)} min={1}
                    style={{ width: 80, fontFamily: "'Caveat', cursive", fontSize: 17, background: '#2b2722', color: '#f3ede2', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 12px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
                  <input type="checkbox" id="multiuse" checked={invMultiUse} onChange={e => setInvMultiUse(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="multiuse" style={{ fontSize: 13.5, color: '#cfc6b6', cursor: 'pointer' }}>reusable link</label>
                </div>
                <button onClick={createInvite} disabled={creating}
                  style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: ACCENT, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 22, cursor: 'pointer' }}>
                  {creating ? 'creatingâ€¦' : 'create'}
                </button>
              </div>

              {newInvite && (
                <div style={{ marginTop: 16, background: 'rgba(181,112,79,.15)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#f3ede2', marginBottom: 8 }}>link ready â€” share it!</div>
                  <code style={{ fontSize: 13, color: '#cfc6b6', wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>{newLink}</code>
                  <button onClick={() => copyLink(newInvite.token)}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 16, background: copied ? '#4a8a4a' : 'rgba(255,255,255,.12)', color: '#f3ede2', border: 'none', padding: '5px 16px', borderRadius: 14, cursor: 'pointer' }}>
                    {copied ? 'copied!' : 'copy link'}
                  </button>
                </div>
              )}
            </div>

            {/* Existing invitations */}
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#9a8e79', marginBottom: 12 }}>active invite links</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {invitations.filter(i => !i.usedAt || i.multiUse).map(inv => (
                <div key={inv.id} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#f3ede2', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {inv.note || <em style={{ color: '#7d7464' }}>no note</em>}
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,.1)', color: '#cfc6b6' }}>
                        {inv.multiUse ? 'reusable' : 'single-use'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#7d7464', marginTop: 3 }}>
                      {inv.useCount ?? 0} use{(inv.useCount ?? 0) !== 1 ? 's' : ''}
                      {inv.expiresAt && ` Â· expires ${fmtDate(inv.expiresAt)}`}
                    </div>
                  </div>
                  <button onClick={() => copyLink(inv.token)}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: 'rgba(255,255,255,.1)', color: '#f3ede2', border: 'none', padding: '4px 12px', borderRadius: 14, cursor: 'pointer' }}>
                    copy link
                  </button>
                  <button onClick={() => revokeInvite(inv.id)}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: '#b23b2e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 14, cursor: 'pointer' }}>
                    revoke
                  </button>
                </div>
              ))}
              {invitations.filter(i => !i.usedAt || i.multiUse).length === 0 && (
                <div style={{ color: '#7d7464', fontFamily: "'Caveat', cursive", fontSize: 18 }}>no active links â€” create one above</div>
              )}
            </div>
          </>
        )}

        {/* â”€â”€ Users tab â”€â”€ */}
        {tab === 'users' && (
          <>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#cfc6b6', marginBottom: 18 }}>
              {users.length} registered user{users.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#f3ede2' }}>{u.name}</span>
                    <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 10, background: u.role === 'admin' ? '#b23b2e' : u.role === 'super_contributor' ? '#7a5230' : 'rgba(255,255,255,.1)', color: '#fff' }}>{u.role.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#7d7464' }}>joined {fmtDate(u.createdAt)}</div>
                  <select
                    value={u.role}
                    onChange={e => promoteUser(u.id, e.target.value as 'admin' | 'contributor' | 'super_contributor')}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: '#2b2722', color: '#f3ede2', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '4px 10px', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="contributor">contributor</option>
                    <option value="super_contributor">super contributor</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              ))}
              {users.length === 0 && <div style={{ color: '#7d7464', fontFamily: "'Caveat', cursive", fontSize: 18 }}>no users yet â€” share an invite link</div>}
            </div>
          </>
        )}

        {/* â”€â”€ Files tab â”€â”€ */}
        {tab === 'files' && (
          <>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#cfc6b6', marginBottom: 18 }}>
              {files.length} uploaded file{files.length !== 1 ? 's' : ''}
            </div>
            {loading && <div style={{ color: '#9a8e79' }}>loadingâ€¦</div>}
            <div style={{ display: 'grid', gap: 8 }}>
              {files.map(f => (
                <div key={f.id} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/uploads/${f.imgPath}`} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#f3ede2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.caption || <em style={{ color: '#7d7464' }}>no caption</em>}
                    </div>
                    <div style={{ fontSize: 12, color: '#7d7464', marginTop: 2 }}>
                      {f.source} Â· {f.author} Â· {fmtDate(f.ts)} Â· {fmt(f.sizeBytes)}
                    </div>
                  </div>
                  <a href={`/api/uploads/${f.imgPath}`} download={f.imgPath}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 16, background: 'rgba(255,255,255,.1)', color: '#f3ede2', textDecoration: 'none', padding: '5px 14px', borderRadius: 16, flexShrink: 0 }}>
                    download
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

