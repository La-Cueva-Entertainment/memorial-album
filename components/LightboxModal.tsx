'use client';

import { useRef, useState } from 'react';
import type { Item, Comment } from '@/types';

interface Props {
  item: Item;
  accent: string;
  admin: boolean;
  sessionUser: { id: string; name: string } | null;
  onClose: () => void;
  onCommentAdded: (itemId: string, comment: Comment) => void;
  onItemUpdated: (item: Item) => void;
}

export default function LightboxModal({ item, accent, admin, sessionUser, onClose, onCommentAdded, onItemUpdated }: Props) {
  const cmtAuthorRef = useRef<HTMLInputElement>(null);
  const cmtTextRef = useRef<HTMLInputElement>(null);

  // Inline edit state
  const canEdit = admin || (!!sessionUser && item.author === sessionUser.name);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(item.caption);
  const [editAuthor, setEditAuthor] = useState(item.author);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveEdit = async () => {
    setSaving(true);
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: editCaption, author: editAuthor }),
    });
    if (res.ok) {
      const updated: Item = await res.json();
      onItemUpdated(updated);
    }
    setSaving(false);
    setEditing(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    const title = item.caption || 'A memory';
    const text = item.caption ? `"${item.caption}" — ${item.author}` : `Shared from the memorial`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePostComment = async () => {
    const text = cmtTextRef.current?.value.trim();
    if (!text) return;
    const author = cmtAuthorRef.current?.value.trim() || 'anonymous';

    const res = await fetch(`/api/items/${item.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    if (!res.ok) return;
    const comment: Comment = await res.json();
    onCommentAdded(item.id, comment);
    if (cmtTextRef.current) cmtTextRef.current.value = '';
  };

  const commentTitle = item.comments.length === 0 ? 'be the first to comment' : 'comments';


  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(25,18,10,.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f7f2e9',
          borderRadius: 16,
          maxWidth: 1060,
          width: '100%',
          maxHeight: '95vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,.5)',
          animation: 'pop .25s ease',
        }}
      >
        {/* Photo */}
        <div
          style={{
            background: '#211d18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            borderRadius: '16px 16px 0 0',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/uploads/${item.imgPath}`}
            alt={item.caption || 'photo'}
            style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 4, display: 'block' }}
          />
        </div>

        {/* Download + Share buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 18px 0', background: '#211d18', borderRadius: '0' }}>
          <button
            onClick={handleShare}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Caveat', cursive", fontSize: 16, color: '#d4c9b8', background: 'rgba(255,255,255,.10)', border: 'none', padding: '5px 14px', borderRadius: 14, cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.10)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
            {copied ? 'link copied!' : 'share'}
          </button>
          <a
            href={`/api/uploads/${item.imgPath}?download=1`}
            download
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Caveat', cursive", fontSize: 16, color: '#d4c9b8', textDecoration: 'none', padding: '5px 14px', borderRadius: 14, background: 'rgba(255,255,255,.10)', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.10)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/></svg>
            download original
          </a>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Caption + author — editable by owner or admin */}
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <input
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                placeholder="caption"
                autoFocus
                style={{ fontFamily: "'Caveat', cursive", fontSize: 22, border: 'none', borderBottom: '1.5px solid #e2dac9', padding: '4px 2px', outline: 'none', background: 'none', color: '#3a342d' }}
              />
              <input
                value={editAuthor}
                onChange={e => setEditAuthor(e.target.value)}
                placeholder="your name"
                style={{ fontFamily: "'Caveat', cursive", fontSize: 16, border: 'none', borderBottom: '1.5px solid #e2dac9', padding: '4px 2px', outline: 'none', background: 'none', color: '#9a8e79' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdit} disabled={saving} style={{ fontFamily: "'Caveat', cursive", fontSize: 16, background: accent, color: '#fff', border: 'none', padding: '5px 16px', borderRadius: 14, cursor: 'pointer' }}>
                  {saving ? 'saving…' : 'save'}
                </button>
                <button onClick={() => { setEditing(false); setEditCaption(item.caption); setEditAuthor(item.author); }} style={{ fontFamily: "'Caveat', cursive", fontSize: 16, background: '#ece6d9', color: '#6b6358', border: 'none', padding: '5px 16px', borderRadius: 14, cursor: 'pointer' }}>
                  cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                {item.caption && (
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, lineHeight: 1.3, color: '#3a342d' }}>
                    {item.caption}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#9a8e79', fontStyle: 'italic', marginTop: 6 }}>— {item.author}</div>
              </div>
              {canEdit && (
                <button onClick={() => setEditing(true)} title="edit" style={{ background: 'none', border: 'none', color: '#c8bca8', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              )}
            </div>
          )}

          <div style={{ borderTop: '1px dashed #ddd3bf', margin: '18px 0 12px' }} />
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: '#5b4a36', marginBottom: 10 }}>
            {commentTitle}
          </div>

          {/* Comments list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.comments.map(c => (
              <div
                key={c.id}
                style={{
                  background: '#fffdf8',
                  borderRadius: 10,
                  padding: '10px 14px',
                  boxShadow: '0 2px 6px rgba(50,35,20,.1)',
                }}
              >
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#3a342d', lineHeight: 1.3 }}>
                  {c.text}
                </div>
                <div style={{ fontSize: 11.5, color: '#9a8e79', fontStyle: 'italic', marginTop: 4 }}>— {c.author}</div>
              </div>
            ))}
          </div>

          {/* Add comment */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                ref={cmtAuthorRef}
                placeholder="your name"
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 16,
                  border: 'none',
                  borderBottom: '1.5px solid #e2dac9',
                  padding: '5px 4px',
                  outline: 'none',
                  background: 'none',
                  color: '#3a342d',
                }}
              />
              <input
                ref={cmtTextRef}
                placeholder="add a comment…"
                onKeyDown={e => { if (e.key === 'Enter') handlePostComment(); }}
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 18,
                  border: '1.5px solid #e2dac9',
                  borderRadius: 10,
                  padding: '8px 10px',
                  outline: 'none',
                  background: '#fbf7ef',
                  color: '#3a342d',
                }}
              />
            </div>
            <button
              onClick={handlePostComment}
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 17,
                background: accent,
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
