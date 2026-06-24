'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Item } from '@/types';

interface Props {
  accent: string;
  onClose: () => void;
  onAdded: (item: Item) => void;
}

type DraftAngle = 'left' | 'straight' | 'right' | 'auto';

const ANGLE_CHIPS: { key: DraftAngle; label: string }[] = [
  { key: 'left', label: '↺ tilt left' },
  { key: 'straight', label: '▢ straight' },
  { key: 'right', label: '↻ tilt right' },
  { key: 'auto', label: '✦ let it fall' },
];

const ANGLE_MAP: Record<DraftAngle, number | null> = {
  left: -7,
  straight: 0,
  right: 7,
  auto: null,
};

export default function AddMemoryModal({ accent, onClose, onAdded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);

  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [draftAngle, setDraftAngle] = useState<DraftAngle>('auto');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropFx, setCropFx] = useState(0.5);
  const [cropFy, setCropFy] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);

  // Original image dimensions
  const dimRef = useRef<{ iw: number; ih: number } | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const frameWidthRef = useRef(340);

  // Keep frame width up to date
  useEffect(() => {
    if (!cropFrameRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) frameWidthRef.current = w;
    });
    obs.observe(cropFrameRef.current);
    return () => obs.disconnect();
  }, [draftPhoto]);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const cropGeom = useCallback(() => {
    const F = frameWidthRef.current;
    const { iw, ih } = dimRef.current ?? { iw: 1, ih: 1 };
    const minDim = Math.min(iw, ih) || 1;
    const z = cropZoom;
    const dispW = F * (iw / minDim) * z;
    const dispH = F * (ih / minDim) * z;
    return { F, iw, ih, minDim, dispW, dispH, rangeX: dispW - F, rangeY: dispH - F };
  }, [cropZoom]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draftPhoto) return;
    dragRef.current = { x: e.clientX, y: e.clientY, fx: cropFx, fy: cropFy };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const g = cropGeom();
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const nfx = g.rangeX > 0 ? clamp(dragRef.current.fx - dx / g.rangeX, 0, 1) : 0.5;
    const nfy = g.rangeY > 0 ? clamp(dragRef.current.fy - dy / g.rangeY, 0, 1) : 0.5;
    setCropFx(nfx);
    setCropFy(nfy);
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        imgElRef.current = img;
        dimRef.current = { iw: img.naturalWidth, ih: img.naturalHeight };
        setDraftPhoto(dataUrl);
        setCropZoom(1);
        setCropFx(0.5);
        setCropFy(0.5);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const cropToSquare = useCallback((): Blob | null => {
    const img = imgElRef.current;
    if (!img || !dimRef.current) return null;
    const { iw, ih } = dimRef.current;
    const minDim = Math.min(iw, ih);
    const z = cropZoom;
    const O = 1000;
    const dW = O * (iw / minDim) * z;
    const dH = O * (ih / minDim) * z;
    const rangeX = dW - O;
    const rangeY = dH - O;
    const ox = rangeX > 0 ? -cropFx * rangeX : (O - dW) / 2;
    const oy = rangeY > 0 ? -cropFy * rangeY : (O - dH) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = O;
    canvas.height = O;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, ox, oy, dW, dH);
    // canvas.toBlob is async; wrap in a promise resolved synchronously via toDataURL
    return null; // we'll use a different approach below
  }, [cropZoom, cropFx, cropFy]);

  const cropToBlob = useCallback((): Promise<Blob> => {
    const img = imgElRef.current!;
    const { iw, ih } = dimRef.current!;
    const minDim = Math.min(iw, ih);
    const z = cropZoom;
    const O = 1000;
    const dW = O * (iw / minDim) * z;
    const dH = O * (ih / minDim) * z;
    const rangeX = dW - O;
    const rangeY = dH - O;
    const ox = rangeX > 0 ? -cropFx * rangeX : (O - dW) / 2;
    const oy = rangeY > 0 ? -cropFy * rangeY : (O - dH) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = O;
    canvas.height = O;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, ox, oy, dW, dH);
    return new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.88));
  }, [cropZoom, cropFx, cropFy]);

  const handleSubmit = async () => {
    if (!draftPhoto || !imgElRef.current) {
      alert('Please choose a photo first.');
      return;
    }
    setSubmitting(true);
    try {
      const blob = await cropToBlob();
      const fd = new FormData();
      fd.append('file', blob, 'photo.jpg');
      fd.append('author', authorRef.current?.value.trim() || 'anonymous');
      fd.append('caption', captionRef.current?.value.trim() || '');
      const angleVal = ANGLE_MAP[draftAngle];
      if (angleVal !== null) fd.append('angle', String(angleVal));

      // Send the original full-resolution file so Immich gets the original, not the crop
      const originalFile = fileInputRef.current?.files?.[0];
      if (originalFile) fd.append('originalFile', originalFile);

      const res = await fetch('/api/items', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const item: Item = await res.json();
      onAdded(item);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
    void cropToSquare; // suppress unused warning
  };

  // Crop image inline style
  let cropImgStyle: React.CSSProperties | null = null;
  if (draftPhoto && dimRef.current) {
    const g = cropGeom();
    const ox = g.rangeX > 0 ? -cropFx * g.rangeX : (g.F - g.dispW) / 2;
    const oy = g.rangeY > 0 ? -cropFy * g.rangeY : (g.F - g.dispH) / 2;
    cropImgStyle = {
      position: 'absolute',
      width: g.dispW,
      height: g.dispH,
      left: ox,
      top: oy,
      maxWidth: 'none',
      userSelect: 'none',
      pointerEvents: 'none',
      display: 'block',
    };
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(35,25,15,.55)',
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
          borderRadius: 18,
          maxWidth: 460,
          width: '100%',
          padding: 26,
          boxShadow: '0 24px 60px rgba(0,0,0,.4)',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'pop .25s ease',
        }}
      >
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 30, fontWeight: 700, color: '#3a342d' }}>
          pin a memory to the board
        </div>
        <div style={{ fontSize: 13.5, color: '#6b6358', lineHeight: 1.5, margin: '6px 0 16px' }}>
          This puts a polaroid up on the scrapbook <strong>right away</strong>. For these we ask for
          one photo and a few words. <em>Have lots of photos? Use the <strong>Photo box</strong> for bulk uploads instead.</em>
        </div>

        {!draftPhoto ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              cursor: 'pointer',
              border: '2px dashed #c9bca4',
              borderRadius: 12,
              minHeight: 150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fbf7ef',
              textAlign: 'center',
            }}
          >
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: '#9a8e79', padding: 30 }}>
              📷 tap to choose a photo
            </span>
          </div>
        ) : (
          <>
            {/* Crop frame */}
            <div
              ref={cropFrameRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="crop-frame"
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                overflow: 'hidden',
                borderRadius: 12,
                background: '#fffdf8',
                cursor: 'grab',
                touchAction: 'none',
              }}
            >
              {cropImgStyle && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draftPhoto} alt="" draggable={false} style={cropImgStyle} />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Zoom + change */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: 13, color: '#9a8e79' }}>zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={cropZoom}
                onChange={e => setCropZoom(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: accent }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 16,
                  background: '#ece6d9',
                  color: '#6b6358',
                  border: 'none',
                  padding: '5px 14px',
                  borderRadius: 18,
                  cursor: 'pointer',
                }}
              >
                change
              </button>
            </div>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 15, color: '#9a8e79', textAlign: 'center', marginTop: 6 }}>
              shows the whole photo — zoom & drag if you&apos;d rather crop in
            </div>

            {/* Angle chips */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#6b6358', marginBottom: 7 }}>
                how should it sit on the board?
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {ANGLE_CHIPS.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setDraftAngle(chip.key)}
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: 16,
                      background: draftAngle === chip.key ? accent : '#ece6d9',
                      color: draftAngle === chip.key ? '#fff' : '#6b6358',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 18,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

        <input
          ref={authorRef}
          placeholder="your name"
          style={{
            width: '100%',
            fontFamily: "'Caveat', cursive",
            fontSize: 19,
            border: 'none',
            borderBottom: '1.5px solid #e2dac9',
            padding: '8px 4px',
            outline: 'none',
            background: 'none',
            marginTop: 14,
            color: '#3a342d',
          }}
        />
        <textarea
          ref={captionRef}
          placeholder="a memory, a caption, an inside joke…"
          rows={3}
          style={{
            width: '100%',
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            border: '1.5px solid #e2dac9',
            borderRadius: 10,
            padding: 10,
            outline: 'none',
            resize: 'vertical',
            background: '#fbf7ef',
            marginTop: 12,
            color: '#3a342d',
          }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 19,
              background: '#ece6d9',
              color: '#6b6358',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 22,
              cursor: 'pointer',
            }}
          >
            cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 19,
              background: submitting ? '#c9a88e' : accent,
              color: '#fff',
              border: 'none',
              padding: '8px 24px',
              borderRadius: 22,
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'pinning…' : 'pin it up'}
          </button>
        </div>
      </div>
    </div>
  );
}
