'use client';

import { useEffect, useRef, useState } from 'react';
import type { OceanSprayPost } from '@/types';

interface Props {
  admin: boolean;
  accent: string;
}

export default function OceanSprayView({ admin, accent }: Props) {
  const [posts, setPosts] = useState<OceanSprayPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/edit form
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<OceanSprayPost | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/ocean-spray')
      .then(r => r.json())
      .then((data: OceanSprayPost[]) => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditingPost(null);
    setFormTitle(''); setFormBody(''); setFormPinned(false);
    setShowForm(true);
    setTimeout(() => bodyRef.current?.focus(), 50);
  };

  const openEdit = (p: OceanSprayPost) => {
    setEditingPost(p);
    setFormTitle(p.title); setFormBody(p.body); setFormPinned(p.pinned);
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!formTitle.trim() || formSaving) return;
    setFormSaving(true);

    if (editingPost) {
      const res = await fetch(`/api/ocean-spray/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, body: formBody, pinned: formPinned }),
      });
      if (res.ok) {
        const updated: OceanSprayPost = await res.json();
        setPosts(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(a.ts).getTime() - new Date(b.ts).getTime()));
      }
    } else {
      const res = await fetch('/api/ocean-spray', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, body: formBody, pinned: formPinned }),
      });
      if (res.ok) {
        const post: OceanSprayPost = await res.json();
        setPosts(prev => [post, ...prev].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(a.ts).getTime() - new Date(b.ts).getTime()));
      }
    }
    setFormSaving(false);
    setShowForm(false);
  };

  const deletePost = async (id: string) => {
    await fetch(`/api/ocean-spray/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const pinnedPost = posts.find(p => p.pinned);
  const otherPosts = posts.filter(p => !p.pinned);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '30px 22px 40px' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(26px,3.6vw,40px)', fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(60,40,20,.45)', lineHeight: 1.1 }}>
          Ocean Spray
        </div>
        <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#5b4a36', background: 'rgba(247,242,233,.8)', display: 'inline-block', padding: '4px 18px', borderRadius: 18, marginTop: 10 }}>
          under<del>ground</del>water event details to come
        </div>
        {admin && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={openAdd}
              style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: accent, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 22, cursor: 'pointer', boxShadow: '0 3px 8px rgba(120,70,40,.28)' }}
            >
              + add post
            </button>
          </div>
        )}
      </div>

      {/* ── Admin form ── */}
      {admin && showForm && (
        <div style={{ background: '#fffdf8', borderRadius: 14, boxShadow: '0 8px 20px rgba(50,35,20,.16)', padding: '20px 22px', marginBottom: 30 }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: '#5b4a36', marginBottom: 14 }}>
            {editingPost ? 'edit post' : 'new post'}
          </div>
          <input
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="title"
            style={{ display: 'block', width: '100%', fontFamily: "'Caveat', cursive", fontSize: 22, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '8px 12px', outline: 'none', background: '#fbf7ef', color: '#3a342d', marginBottom: 10, boxSizing: 'border-box' }}
          />
          <textarea
            ref={bodyRef}
            value={formBody}
            onChange={e => setFormBody(e.target.value)}
            placeholder="details, story, logistics, photos to come…"
            rows={6}
            style={{ display: 'block', width: '100%', fontFamily: "'Spectral', serif", fontSize: 16, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '10px 12px', outline: 'none', background: '#fbf7ef', color: '#3a342d', resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'Caveat', cursive", fontSize: 18, color: '#5b4a36' }}>
              <input type="checkbox" checked={formPinned} onChange={e => setFormPinned(e.target.checked)} />
              📌 pin as event description
            </label>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button onClick={saveForm} disabled={formSaving || !formTitle.trim()} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: accent, color: '#fff', border: 'none', padding: '8px 22px', borderRadius: 18, cursor: 'pointer' }}>
                {formSaving ? 'saving…' : 'save'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '8px 18px', borderRadius: 18, cursor: 'pointer' }}>
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', fontFamily: "'Caveat', cursive", fontSize: 22, color: 'rgba(255,255,255,.5)', padding: '40px 0' }}>loading…</div>
      )}

      {/* ── Pinned: Event description ── */}
      {pinnedPost ? (
        <div style={{ background: 'rgba(247,242,233,.92)', borderRadius: 18, boxShadow: '0 10px 28px rgba(50,35,20,.2)', padding: '26px 28px', marginBottom: 28, borderLeft: `5px solid ${accent}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 13, color: '#9a8e79', fontFamily: "'Caveat', cursive", marginRight: 8 }}>📌 pinned</span>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 26, fontWeight: 700, color: '#3a342d' }}>{pinnedPost.title}</div>
            </div>
            {admin && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(pinnedPost)} style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: 'rgba(181,112,79,.15)', color: '#5b4a36', border: 'none', padding: '4px 12px', borderRadius: 10, cursor: 'pointer' }}>edit</button>
                <button onClick={() => deletePost(pinnedPost.id)} style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: '#b23b2e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 10, cursor: 'pointer' }}>delete</button>
              </div>
            )}
          </div>
          {pinnedPost.body && (
            <div style={{ fontFamily: "'Spectral', serif", fontSize: 16, lineHeight: 1.8, color: '#3a342d', whiteSpace: 'pre-wrap' }}>
              {pinnedPost.body}
            </div>
          )}
        </div>
      ) : (
        !loading && posts.length === 0 && (
          <div style={{ background: 'rgba(247,242,233,.85)', borderRadius: 16, padding: '32px 28px', textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌊</div>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#5b4a36', marginBottom: 10 }}>
              Ocean spray is coming
            </div>
          </div>
        )
      )}

      {/* ── Other posts (timeline) ── */}
      {otherPosts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {otherPosts.map(post => (
            <div key={post.id} style={{ background: '#fffdf8', borderRadius: 14, boxShadow: '0 6px 16px rgba(50,35,20,.13)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, fontWeight: 700, color: '#3a342d' }}>{post.title}</div>
                  <div style={{ fontSize: 12, color: '#9a8e79', marginTop: 2 }}>{fmt(post.ts)}</div>
                </div>
                {admin && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(post)} style={{ fontFamily: "'Caveat', cursive", fontSize: 14, background: 'rgba(181,112,79,.12)', color: '#5b4a36', border: 'none', padding: '3px 10px', borderRadius: 8, cursor: 'pointer' }}>edit</button>
                    <button onClick={() => deletePost(post.id)} style={{ fontFamily: "'Caveat', cursive", fontSize: 14, background: '#b23b2e', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: 8, cursor: 'pointer' }}>delete</button>
                  </div>
                )}
              </div>
              {post.body && (
                <div style={{ fontFamily: "'Spectral', serif", fontSize: 16, lineHeight: 1.75, color: '#3a342d', whiteSpace: 'pre-wrap' }}>
                  {post.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
