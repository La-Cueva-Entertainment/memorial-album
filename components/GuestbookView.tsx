'use client';

import { useRef } from 'react';
import { rotFor } from '@/lib/seed';
import type { GuestbookNote } from '@/types';

interface Props {
  notes: GuestbookNote[];
  admin: boolean;
  accent: string;
  onAddNote: (note: GuestbookNote) => void;
  onRemoveNote: (id: string) => void;
}

export default function GuestbookView({ notes, admin, accent, onAddNote, onRemoveNote }: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const text = textRef.current?.value.trim();
    if (!text) return;
    const author = nameRef.current?.value.trim() || 'anonymous';

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    if (!res.ok) return;
    const note: GuestbookNote = await res.json();
    onAddNote(note);
    if (nameRef.current) nameRef.current.value = '';
    if (textRef.current) textRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '30px 22px 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 'clamp(26px,3.4vw,34px)',
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 2px 10px rgba(60,40,20,.45)',
          }}
        >
          the guestbook
        </div>
        <div
          style={{
            fontFamily: "'Spectral', serif",
            fontStyle: 'italic',
            fontSize: 15,
            color: '#5b4a36',
            background: 'rgba(247,242,233,.8)',
            display: 'inline-block',
            padding: '4px 16px',
            borderRadius: 18,
            marginTop: 8,
          }}
        >
          leave a note, a story, a goodbye
        </div>
      </div>

      {/* Compose */}
      <div
        style={{
          background: '#fffdf8',
          borderRadius: 14,
          boxShadow: '0 8px 20px rgba(50,35,20,.16)',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 26,
        }}
      >
        <input
          ref={nameRef}
          placeholder="your name"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 19,
            border: 'none',
            borderBottom: '1.5px solid #e2dac9',
            padding: '6px 4px',
            outline: 'none',
            background: 'none',
            color: '#3a342d',
          }}
        />
        <textarea
          ref={textRef}
          placeholder="share a memory…"
          rows={3}
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            border: '1.5px solid #e2dac9',
            borderRadius: 10,
            padding: 10,
            outline: 'none',
            resize: 'vertical',
            background: '#fbf7ef',
            color: '#3a342d',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            alignSelf: 'flex-start',
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            background: accent,
            color: '#fff',
            border: 'none',
            padding: '7px 24px',
            borderRadius: 24,
            cursor: 'pointer',
          }}
        >
          sign the book
        </button>
      </div>

      {notes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            fontFamily: "'Caveat', cursive",
            fontSize: 24,
            color: '#5b4a36',
            padding: 10,
          }}
        >
          be the first to sign
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
        {notes.map(note => (
          <div
            key={note.id}
            style={{
              background: '#fffdf8',
              borderRadius: 12,
              boxShadow: '0 5px 14px rgba(50,35,20,.14)',
              padding: '16px 18px',
              transform: `rotate(${(rotFor(note.id) * 0.6).toFixed(2)}deg)`,
              position: 'relative',
            }}
          >
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, lineHeight: 1.35, color: '#3a342d' }}>
              {note.text}
            </div>
            <div style={{ fontSize: 12.5, color: '#9a8e79', fontStyle: 'italic', marginTop: 8 }}>
              — {note.author}
            </div>
            {admin && (
              <button
                onClick={() => onRemoveNote(note.id)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#b23b2e',
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: 13,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
