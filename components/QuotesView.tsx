'use client';

import { useEffect, useRef, useState } from 'react';
import type { Quote } from '@/types';

interface Props {
  admin: boolean;
  accent: string;
}

const ALBUM_LINK = process.env.NEXT_PUBLIC_DEFAULT_ALBUM_LINK ?? '';
const BUBBLE_COLORS = ['#fff8ef', '#fff0f5', '#f0f8ff', '#f5fff0', '#fff5f0', '#f8f0ff'];
const ROTATIONS = [-1.8, 0.9, -0.6, 1.4, -1.1, 0.4, 1.9, -0.3];

// ── Media lightbox ────────────────────────────────────────────────────────────
function MediaLightbox({ assetId, assetType, albumLink, onClose }: { assetId: string; assetType: string; albumLink: string; onClose: () => void }) {
  // If type known from DB use it, otherwise probe via video onCanPlay/onError
  const [resolvedType, setResolvedType] = useState<'video' | 'image' | 'probing'>(
    assetType === 'video' ? 'video' : assetType === 'image' ? 'image' : 'probing'
  );
  const imgSrc = `/api/immich/thumbnail?assetId=${assetId}`;
  const vidSrc = `/api/immich/video?assetId=${assetId}`;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,10,5,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadein .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          {albumLink && (
            <a href={albumLink} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: 'rgba(255,255,255,.65)', fontStyle: 'italic' }}>
              view in album &#8599;
            </a>
          )}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 18, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', marginLeft: 'auto' }}>close</button>
        </div>
        {/* Video: known type OR probing — try playing; if it errors, show image instead */}
        {(resolvedType === 'video' || resolvedType === 'probing') && (
          <video
            src={vidSrc}
            controls
            autoPlay
            onCanPlay={() => setResolvedType('video')}
            onError={() => setResolvedType('image')}
            style={{ width: '100%', borderRadius: 12, display: resolvedType === 'video' ? 'block' : 'none', maxHeight: '80vh' }}
          />
        )}
        {/* Image: known type OR fallback after video probe failed */}
        {resolvedType === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt="attachment" style={{ width: '100%', borderRadius: 12, display: 'block', maxHeight: '80vh', objectFit: 'contain' }} />
        )}
        {resolvedType === 'probing' && (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuotesView({ admin, accent }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<{ assetId: string; assetType: string } | null>(null);

  const quoteRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);

  useEffect(() => {
    fetch('/api/quotes')
      .then(r => r.ok ? r.json() : [])
      .then((data: Quote[]) => { setQuotes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    const text = quoteRef.current?.value.trim();
    if (!text || submitting) return;
    setSubmitting(true); setError('');

    let immichAssetId: string | null = null;
    if (attachFile) {
      setUploading(true);
      const fd = new FormData(); fd.append('file', attachFile);
      const upRes = await fetch('/api/immich/upload', { method: 'POST', body: fd });
      setUploading(false);
      if (upRes.ok) {
        const upData = await upRes.json() as { assetId?: string };
        immichAssetId = upData.assetId ?? null;
      } else {
        const upErr = await upRes.json().catch(() => ({})) as { error?: string };
        setError(upErr.error ?? 'Attachment upload failed.');
        setSubmitting(false); return;
      }
    }

    const context = contextRef.current?.value.trim() ?? '';
    const immichAssetType = attachFile ? (attachFile.type.startsWith('video/') ? 'video' : 'image') : '';
    const res = await fetch('/api/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context, immichAssetId, immichAssetType }),
    });
    if (res.ok) {
      const quote: Quote = await res.json();
      setQuotes(prev => [quote, ...prev]);
      if (quoteRef.current) quoteRef.current.value = '';
      if (contextRef.current) contextRef.current.value = '';
      setAttachFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? 'Could not add quote.');
    }
    setSubmitting(false);
  };

  const removeQuote = async (id: string) => {
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 70px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(28px,4vw,40px)', color: '#3a342d', margin: '0 0 10px' }}>quotes by Cali</h1>
        <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#6f665a', margin: 0 }}>
          the things she said that we&apos;ll never forget. add one you remember.
        </p>
      </div>

      {/* Compose */}
      <div style={{ background: '#fffdf8', borderRadius: 16, boxShadow: '0 5px 18px rgba(60,40,20,.09)', border: '1px solid #ece1cb', padding: '22px 20px', marginBottom: 36, maxWidth: 680, marginInline: 'auto' }}>
        <textarea ref={quoteRef} placeholder='"something she always said..."' rows={3}
          style={{ display: 'block', width: '100%', fontFamily: "'Caveat', cursive", fontSize: 20, color: '#3a342d', border: '1px solid #e2d6bf', borderRadius: 10, background: '#fdf9f3', padding: '10px 12px', outline: 'none', resize: 'vertical', marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.5 }}
        />
        <input ref={contextRef} placeholder="when / who remembers it (optional)"
          style={{ display: 'block', width: '100%', fontFamily: "'Spectral', serif", fontSize: 14, color: '#52483c', border: 'none', borderBottom: '1px solid #e2d6bf', background: 'transparent', padding: '6px 4px', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
        />

        {/* Attach */}
        <button onClick={() => fileRef.current?.click()} style={{ fontFamily: "'Spectral', serif", fontSize: 14, background: '#f0ebe0', color: '#52483c', border: '1px solid #d8cdb9', borderRadius: 20, padding: '8px 16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          &#128206;
          {attachFile ? (
            <>
              {attachFile.name.slice(0, 26)}{attachFile.name.length > 26 ? '...' : ''}
              <span onClick={e => { e.stopPropagation(); setAttachFile(null); if (fileRef.current) fileRef.current.value = ''; }} style={{ color: '#b23b2e', marginLeft: 4 }}>&#10005;</span>
            </>
          ) : 'attach a photo or video'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setAttachFile(e.target.files?.[0] ?? null)} />

        <div style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: '#a8997f', fontStyle: 'italic', marginBottom: 16 }}>
          attachments are saved to her photos album. tap the chip on a quote to view it.
        </div>

        {error && <div style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#b23b2e', fontStyle: 'italic', marginBottom: 12 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={submitting || uploading}
          style={{ fontFamily: "'Caveat', cursive", fontSize: 20, background: submitting || uploading ? '#d8cdb9' : accent, color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 24, cursor: submitting || uploading ? 'not-allowed' : 'pointer', boxShadow: submitting || uploading ? 'none' : '0 3px 10px rgba(194,114,79,.3)' }}>
          {uploading ? 'uploading...' : submitting ? 'adding...' : 'add this quote'}
        </button>
      </div>

      {/* Quotes grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9a8e79', fontFamily: "'Spectral', serif" }}>loading...</div>
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9a8e79', fontFamily: "'Spectral', serif", fontStyle: 'italic' }}>no quotes yet — add one you remember</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {quotes.map((quote, i) => (
            <QuoteCard key={quote.id} quote={quote} bg={BUBBLE_COLORS[i % BUBBLE_COLORS.length]} rot={ROTATIONS[i % ROTATIONS.length]} admin={admin} onRemove={() => removeQuote(quote.id)} albumLink={ALBUM_LINK} onOpenMedia={(id, type) => setLightbox({ assetId: id, assetType: type })} />
          ))}
        </div>
      )}

      {lightbox && <MediaLightbox assetId={lightbox.assetId} assetType={lightbox.assetType} albumLink={ALBUM_LINK} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ── Quote card ────────────────────────────────────────────────────────────────
function QuoteCard({ quote, bg, rot, admin, onRemove, albumLink, onOpenMedia }: {
  quote: Quote; bg: string; rot: number; admin: boolean; onRemove: () => void; albumLink: string; onOpenMedia: (id: string, type: string) => void;
}) {
  const isVideo = quote.immichAssetType === 'video';

  return (
    <div style={{ background: bg, border: '1px solid #ece1cb', borderRadius: 14, padding: '20px 18px 16px', boxShadow: '0 4px 14px rgba(60,40,20,.08)', position: 'relative' }}>
      {admin && (
        <button onClick={onRemove} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: '#b23b2e', cursor: 'pointer', fontSize: 15, padding: '2px 6px' }}>&#10005;</button>
      )}
      <div style={{ fontFamily: "'Spectral', serif", fontSize: 52, color: '#d8cdb9', lineHeight: 0.6, marginBottom: 10, userSelect: 'none' }}>&ldquo;</div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#3a342d', lineHeight: 1.4, marginBottom: 10 }}>{quote.text}</div>
      {quote.context && <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 13, color: '#9a8e79', marginBottom: 10 }}>{quote.context}</div>}

      {quote.immichAssetId && (
        <button onClick={() => onOpenMedia(quote.immichAssetId!, quote.immichAssetType)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0ebe0', border: '1px solid #d8cdb9', borderRadius: 20, padding: '5px 12px 5px 5px', cursor: 'pointer', marginTop: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', background: '#ddd5c8', position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/immich/thumbnail?assetId=${quote.immichAssetId}`} alt="attachment"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {isVideo && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 12 }}>&#9654;</div>}
          </div>
          <span style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#52483c', fontStyle: 'italic' }}>
            {isVideo ? 'watch the moment' : 'view memory'}
          </span>
        </button>
      )}
    </div>
  );
}
