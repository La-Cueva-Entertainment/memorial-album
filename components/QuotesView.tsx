'use client';

import { useRef, useState } from 'react';
import type { Quote, QuoteReply } from '@/types';

interface Props {
  quotes: Quote[];
  admin: boolean;
  accent: string;
  onAddQuote: (q: Quote) => void;
  onRemoveQuote: (id: string) => void;
}

// Warm pastel tones for bubbles
const BUBBLE_COLORS = [
  '#fff8ef', '#fff0f5', '#f0f8ff', '#f5fff0', '#fff5f0', '#f8f0ff',
];

// Slight rotations for a "pinned to wall" feel
const ROTATIONS = [-1.8, 0.9, -0.6, 1.4, -1.1, 0.4, 1.9, -0.3];

type AssetType = 'image' | 'video' | 'unknown';

interface MediaPreviewProps {
  assetId: string;
}

function ImmichMedia({ assetId }: MediaPreviewProps) {
  const [type, setType] = useState<AssetType>('unknown');

  if (type === 'video') {
    return (
      <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', background: '#211d18' }}>
        <video
          src={`/api/immich/video?assetId=${assetId}`}
          controls
          style={{ width: '100%', maxHeight: 280, display: 'block', borderRadius: 10 }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/immich/thumbnail?assetId=${assetId}`}
        alt="attachment"
        onLoad={() => setType('image')}
        onError={() => setType('video')}
        style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: type === 'unknown' ? 'none' : 'block', borderRadius: 10 }}
      />
      {type === 'unknown' && (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,242,233,.5)', borderRadius: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #d8cdb9', borderTopColor: '#b5704f', animation: 'spin .8s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

function ReplyPanel({ quoteId, initialReplies, accent }: { quoteId: string; initialReplies: QuoteReply[]; accent: string }) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<QuoteReply[]>(initialReplies);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setUploadErr('');
    let immichAssetId: string | null = null;

    if (attachFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', attachFile);
      const upRes = await fetch('/api/uploads/media', { method: 'POST', body: fd });
      if (upRes.ok) {
        const data = await upRes.json() as { assetId: string };
        immichAssetId = data.assetId;
      } else {
        const err = await upRes.json().catch(() => ({ error: 'Upload failed' })) as { error: string };
        setUploadErr(err.error ?? 'Upload failed');
        setUploading(false);
        setSubmitting(false);
        return;
      }
      setUploading(false);
    }

    const res = await fetch(`/api/quotes/${quoteId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), author: author.trim() || 'anonymous', immichAssetId }),
    });
    if (res.ok) {
      const r: QuoteReply = await res.json();
      setReplies(prev => [...prev, r]);
      setText(''); setAuthor(''); setAttachFile(null);
      if (replyFileRef.current) replyFileRef.current.value = '';
    }
    setSubmitting(false);
  };

  return (
    <div style={{ marginTop: 10, borderTop: '1px dashed #e2dac9', paddingTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Caveat', cursive", fontSize: 14, color: '#9a8e79', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
      >
        💬 {replies.length > 0 ? `${replies.length} response${replies.length !== 1 ? 's' : ''}` : 'add a response'} {open ? '▲' : '▼'}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          {/* Existing replies */}
          {replies.map(r => (
            <div key={r.id} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: `3px solid ${accent}44` }}>
              {r.immichAssetId && <ImmichMedia assetId={r.immichAssetId} />}
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#3a342d', marginTop: r.immichAssetId ? 6 : 0 }}>{r.text}</div>
              <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 12, color: '#b0a48e', marginTop: 2 }}>— {r.author}</div>
            </div>
          ))}

          {/* Add reply form */}
          <div style={{ background: 'rgba(247,242,233,.7)', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="share a memory or response…"
              rows={2}
              style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 16, border: '1px solid #e2dac9', borderRadius: 8, padding: '6px 8px', outline: 'none', background: '#fbf7ef', color: '#3a342d', resize: 'none', boxSizing: 'border-box' }}
            />
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="your name (optional)"
              style={{ display: 'block', width: '100%', fontFamily: "'Caveat', cursive", fontSize: 14, border: 'none', borderBottom: '1px solid #e2dac9', padding: '4px 2px', outline: 'none', background: 'none', color: '#9a8e79', marginTop: 4, boxSizing: 'border-box' }}
            />
            <input ref={replyFileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setAttachFile(e.target.files?.[0] ?? null)} />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => replyFileRef.current?.click()}
                style={{ fontFamily: "'Caveat', cursive", fontSize: 13, background: 'none', border: 'none', color: attachFile ? accent : '#b0a48e', cursor: 'pointer', padding: 0 }}
              >
                📎 {attachFile ? attachFile.name.slice(0, 24) : 'attach a photo or video'}
              </button>
              {attachFile && <button type="button" onClick={() => { setAttachFile(null); if (replyFileRef.current) replyFileRef.current.value = ''; }} style={{ background: 'none', border: 'none', color: '#b0a48e', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>}
            </div>
            {uploadErr && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: '#b23b2e', marginTop: 4 }}>{uploadErr}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={submit}
                disabled={submitting || uploading || !text.trim()}
                style={{ fontFamily: "'Caveat', cursive", fontSize: 15, background: accent, color: '#fff', border: 'none', padding: '5px 16px', borderRadius: 14, cursor: 'pointer', opacity: submitting || uploading || !text.trim() ? 0.5 : 1 }}
              >
                {uploading ? 'uploading…' : submitting ? 'posting…' : 'post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotesView({ quotes, admin, accent, onAddQuote, onRemoveQuote }: Props) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const attachFileRef = useRef<HTMLInputElement>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async () => {
    const text = textRef.current?.value.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setUploadErr('');
    const author = authorRef.current?.value.trim() || 'Cali';
    let immichAssetId: string | null = null;

    if (attachFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', attachFile);
      const upRes = await fetch('/api/uploads/media', { method: 'POST', body: fd });
      if (upRes.ok) {
        const data = await upRes.json() as { assetId: string };
        immichAssetId = data.assetId;
      } else {
        const err = await upRes.json().catch(() => ({ error: 'Upload failed' })) as { error: string };
        setUploadErr(err.error ?? 'Upload failed');
        setUploading(false);
        setSubmitting(false);
        return;
      }
      setUploading(false);
    }

    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author, immichAssetId }),
    });
    if (res.ok) {
      const q: Quote = await res.json();
      onAddQuote(q);
      if (textRef.current) textRef.current.value = '';
      if (authorRef.current) authorRef.current.value = '';
      setAttachFile(null);
      if (attachFileRef.current) attachFileRef.current.value = '';
      setFormOpen(false);
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    onRemoveQuote(id);
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 22px 0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(26px,3.4vw,36px)', fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(60,40,20,.45)' }}>
            words of wisdom
          </div>
          <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#5b4a36', background: 'rgba(247,242,233,.8)', display: 'inline-block', padding: '4px 16px', borderRadius: 18, marginTop: 8 }}>
            things Cali said that stuck with us
          </div>
        </div>

        {/* Add quote — collapsed by default */}
        <div style={{ maxWidth: 600, margin: '0 auto 48px' }}>
          {!formOpen ? (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setFormOpen(true)}
                style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: 'rgba(247,242,233,.9)', color: '#5b4a36', border: `1.5px dashed ${accent}`, padding: '9px 28px', borderRadius: 22, cursor: 'pointer', boxShadow: '0 3px 10px rgba(60,40,20,.15)' }}
              >
                📌 pin a quote to the wall
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(247,242,233,.95)', borderRadius: 16, boxShadow: '0 8px 24px rgba(50,35,20,.18)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: '#5b4a36' }}>📌 pin a quote to the wall</div>
                <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a8e79', fontSize: 20, lineHeight: 1 }}>✕</button>
              </div>
          <textarea
            ref={textRef}
            placeholder="something she said that you'll never forget…"
            rows={3}
            style={{ width: '100%', fontFamily: "'Caveat', cursive", fontSize: 20, border: '1.5px solid #e2dac9', borderRadius: 10, padding: '10px 12px', outline: 'none', background: '#fbf7ef', color: '#3a342d', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <input
            ref={authorRef}
            placeholder="attributed to… (default: Cali)"
            style={{ display: 'block', width: '100%', fontFamily: "'Caveat', cursive", fontSize: 16, border: 'none', borderBottom: '1.5px solid #e2dac9', padding: '6px 4px', outline: 'none', background: 'none', color: '#9a8e79', marginTop: 8, boxSizing: 'border-box' }}
          />

          {/* File attachment */}
          <input ref={attachFileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setAttachFile(e.target.files?.[0] ?? null)} />
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => attachFileRef.current?.click()}
              style={{ fontFamily: "'Caveat', cursive", fontSize: 16, background: 'none', border: 'none', color: attachFile ? accent : '#9a8e79', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              📎 {attachFile ? attachFile.name.slice(0, 30) : 'attach a photo or video'}
            </button>
            {attachFile && <button type="button" onClick={() => { setAttachFile(null); if (attachFileRef.current) attachFileRef.current.value = ''; }} style={{ background: 'none', border: 'none', color: '#9a8e79', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>}
          </div>
          {uploadErr && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: '#b23b2e', marginTop: 6 }}>{uploadErr}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              style={{ fontFamily: "'Caveat', cursive", fontSize: 20, background: accent, color: '#fff', border: 'none', padding: '9px 28px', borderRadius: 22, cursor: 'pointer', opacity: submitting || uploading ? 0.6 : 1, boxShadow: '0 4px 12px rgba(120,70,40,.28)' }}
            >
              {uploading ? 'uploading…' : submitting ? 'pinning…' : 'pin it 📌'}
            </button>
          </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {quotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'Caveat', cursive", fontSize: 26, color: 'rgba(255,255,255,.6)' }}>
            no quotes yet — pin the first one above
          </div>
        )}

        {/* Quote wall — masonry-like grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 36, paddingBottom: 60, alignItems: 'start' }}>
          {quotes.map((q, i) => {
            const bg = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
            const rot = ROTATIONS[i % ROTATIONS.length];

            return (
              <div
                key={q.id}
                style={{ position: 'relative', transform: `rotate(${rot}deg)`, transformOrigin: 'center top', transition: 'transform .18s, box-shadow .18s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'rotate(0deg) scale(1.025)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot}deg)`; }}
              >
                {/* Push-pin */}
                <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 15, height: 15, borderRadius: '50%', background: accent, boxShadow: '0 2px 8px rgba(0,0,0,.4)', border: '2px solid rgba(255,255,255,.7)' }} />
                  <div style={{ width: 3, height: 11, background: '#8a7060', borderRadius: '0 0 2px 2px', marginTop: -2 }} />
                </div>

                {/* Bubble body */}
                <div style={{ background: bg, borderRadius: 16, boxShadow: '0 8px 28px rgba(50,35,20,.18), 0 2px 6px rgba(50,35,20,.08)', padding: '26px 20px 22px', position: 'relative' }}>
                  {/* Big decorative quote mark */}
                  <div style={{ position: 'absolute', top: 6, left: 10, fontFamily: "'Georgia', serif", fontSize: 80, lineHeight: 1, color: accent, opacity: 0.12, userSelect: 'none', pointerEvents: 'none' }}>
                    &ldquo;
                  </div>

                  {/* Quote text */}
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, lineHeight: 1.5, color: '#3a342d', paddingTop: 18, position: 'relative', zIndex: 1 }}>
                    {q.text}
                  </div>

                  {/* Attached Immich media */}
                  {q.immichAssetId && <ImmichMedia assetId={q.immichAssetId} />}

                  {/* Author */}
                  <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 13.5, color: '#9a8e79', marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e2dac9' }}>
                    — {q.author}
                  </div>

                  {/* Replies */}
                  <ReplyPanel quoteId={q.id} initialReplies={q.replies ?? []} accent={accent} />

                  {/* Bubble tail */}
                  <div style={{ position: 'absolute', bottom: -13, left: 30, width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '7px solid transparent', borderTop: `14px solid ${bg}`, filter: 'drop-shadow(0 3px 3px rgba(50,35,20,.08))' }} />

                  {/* Admin remove */}
                  {admin && (
                    <button
                      onClick={() => handleRemove(q.id)}
                      title="remove"
                      style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: '#b23b2e', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
