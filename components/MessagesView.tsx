'use client';

import { useEffect, useRef, useState } from 'react';
import type { GuestbookNote } from '@/types';

interface Props {
  admin: boolean;
  accent: string;
}

export default function MessagesView({ admin, accent }: Props) {
  const [notes, setNotes] = useState<GuestbookNote[]>([]);
  const [loading, setLoading] = useState(true);
  const nameRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.ok ? r.json() : [])
      .then((data: GuestbookNote[]) => { setNotes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    const text = textRef.current?.value.trim();
    if (!text || submitting) return;
    const author = nameRef.current?.value.trim() || 'anonymous';
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    if (res.ok) {
      const note: GuestbookNote = await res.json();
      setNotes(prev => [note, ...prev]);
      if (nameRef.current) nameRef.current.value = '';
      if (textRef.current) textRef.current.value = '';
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? 'Could not post message. Please try again.');
    }
    setSubmitting(false);
  };

  const removeNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 70px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(28px,4vw,40px)', color: '#3a342d', margin: '0 0 10px' }}>
          messages for Cali
        </h1>
        <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#6f665a', margin: 0 }}>
          leave a note, a memory, a goodbye. she&apos;d love to hear from you.
        </p>
      </div>

      {/* Compose card */}
      <div style={{
        background: '#fffdf8',
        borderRadius: 16,
        boxShadow: '0 5px 18px rgba(60,40,20,.09)',
        border: '1px solid #ece1cb',
        padding: '22px 20px',
        marginBottom: 30,
      }}>
        <input
          ref={nameRef}
          placeholder="your name"
          style={{
            display: 'block',
            width: '100%',
            fontFamily: "'Spectral', serif",
            fontSize: 15,
            color: '#3a342d',
            border: 'none',
            borderBottom: '1px solid #e2d6bf',
            background: 'transparent',
            padding: '6px 4px',
            outline: 'none',
            marginBottom: 14,
            boxSizing: 'border-box',
          }}
        />
        <textarea
          ref={textRef}
          placeholder="write your message…"
          rows={4}
          style={{
            display: 'block',
            width: '100%',
            fontFamily: "'Caveat', cursive",
            fontSize: 19,
            color: '#3a342d',
            border: '1px solid #e2d6bf',
            borderRadius: 10,
            background: '#fdf9f3',
            padding: '10px 12px',
            outline: 'none',
            resize: 'vertical',
            marginBottom: 14,
            boxSizing: 'border-box',
            lineHeight: 1.5,
          }}
        />
        {error && (
          <div style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#b23b2e', fontStyle: 'italic', marginBottom: 10 }}>
            {error}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            background: submitting ? '#d8cdb9' : accent,
            color: '#fff',
            border: 'none',
            padding: '10px 28px',
            borderRadius: 24,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: submitting ? 'none' : '0 3px 10px rgba(194,114,79,.3)',
          }}
        >
          {submitting ? 'posting…' : 'leave your message'}
        </button>
      </div>

      {/* Notes list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#9a8e79', fontFamily: "'Spectral', serif" }}>loading…</div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#9a8e79', fontFamily: "'Spectral', serif", fontStyle: 'italic' }}>
          no messages yet — be the first to leave one
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notes.map(note => (
            <div
              key={note.id}
              style={{
                background: '#fffdf8',
                border: '1px solid #ece1cb',
                borderRadius: 12,
                padding: '18px 18px 14px',
                boxShadow: '0 3px 10px rgba(60,40,20,.07)',
                position: 'relative',
              }}
            >
              {admin && (
                <button
                  onClick={() => removeNote(note.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'transparent',
                    border: 'none',
                    color: '#b23b2e',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '2px 6px',
                  }}
                >
                  ✕
                </button>
              )}
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: '#3a342d', lineHeight: 1.45, marginBottom: 10 }}>
                {note.text}
              </div>
              <div style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#9a8e79', fontStyle: 'italic' }}>
                — {note.author}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
