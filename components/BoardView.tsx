'use client';

import type { Item } from '@/types';
import { useState, useRef, useEffect } from 'react';
import Banner from './Banner';
import PolaroidCard from './PolaroidCard';

interface Props {
  name: string;
  dates: string;
  items: Item[];
  admin: boolean;
  accent: string;
  onOpenAdd: () => void;
  onOpenLightbox: (id: string) => void;
  onRemove: (id: string) => void;
  onTilt: (id: string, delta: number) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReorder: (ids: string[]) => void;
}

export default function BoardView({
  name, dates, items, admin, accent,
  onOpenAdd, onOpenLightbox, onRemove, onTilt, onMove, onReorder,
}: Props) {
  // ── Local drag order ─────────────────────────────────────────────────────
  const sorted = [...items].sort((a, b) =>
    (b.sortOrder ?? 0) - (a.sortOrder ?? 0) || new Date(b.ts).getTime() - new Date(a.ts).getTime()
  );

  const [localOrder, setLocalOrder] = useState<string[]>(sorted.map(i => i.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const lastDragTarget = useRef<string | null>(null);
  const orderRef = useRef<string[]>(localOrder);

  // Keep localOrder in sync when items prop changes (new photo added, delete, etc.)
  useEffect(() => {
    const incoming = [...items].sort((a, b) =>
      (b.sortOrder ?? 0) - (a.sortOrder ?? 0) || new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
    const incomingIds = incoming.map(i => i.id);
    setLocalOrder(prev => {
      // keep relative drag-order, add new ids at front, remove deleted ids
      const existing = prev.filter(id => incomingIds.includes(id));
      const added = incomingIds.filter(id => !prev.includes(id));
      return [...added, ...existing];
    });
  }, [items]);

  // Keep ref in sync so dragEnd can read it without stale closure
  useEffect(() => { orderRef.current = localOrder; }, [localOrder]);

  const orderedItems = localOrder
    .map(id => items.find(i => i.id === id))
    .filter(Boolean) as Item[];

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: Item) => {
    setDragId(item.id);
    lastDragTarget.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);

    // Custom drag image: clone the card, give it a "lifted" look
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true) as HTMLElement;
    const curRotate = item.angle ?? 0;
    // Lift effect: scale up slightly, extra rotation toward grab direction
    const liftAngle = curRotate + (e.clientX > rect.left + rect.width / 2 ? 6 : -6);
    clone.style.cssText = [
      `position:fixed`,
      `left:${rect.left}px`,
      `top:${rect.top}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
      `transform:rotate(${liftAngle}deg) scale(1.06)`,
      `transform-origin:center center`,
      `box-shadow:0 24px 60px rgba(0,0,0,.55)`,
      `pointer-events:none`,
      `z-index:-9999`,
      `opacity:1`,
    ].join(';');
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);
    setTimeout(() => document.body.removeChild(clone), 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragId || dragId === targetId) return;
    if (lastDragTarget.current === targetId) return;
    lastDragTarget.current = targetId;

    setLocalOrder(prev => {
      const without = prev.filter(id => id !== dragId);
      const idx = without.indexOf(targetId);
      if (idx === -1) return prev;
      without.splice(idx, 0, dragId);
      return without;
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDragId(null);
    lastDragTarget.current = null;
    onReorder(orderRef.current);
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px' }}>
      <Banner name={name} dates={dates} />

      <div style={{ textAlign: 'center', margin: '0 0 26px' }}>
        <div
          style={{
            fontFamily: "'Spectral', serif",
            fontStyle: 'italic',
            fontSize: 16,
            color: '#5b4a36',
            background: 'rgba(247,242,233,.82)',
            display: 'inline-block',
            padding: '5px 18px',
            borderRadius: 20,
          }}
        >
          the stories, the laughs, and every little moment — all in one place
        </div>
      </div>

      {/* Pin a photo button */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <button
          onClick={onOpenAdd}
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 18,
            background: 'rgba(247,242,233,.9)',
            color: '#5b4a36',
            border: `1.5px dashed ${accent}`,
            padding: '9px 28px',
            borderRadius: 22,
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(60,40,20,.15)',
            transition: 'transform .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
        >
          📌 pin a photo to the board
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 20px 70px' }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: 'rgba(255,255,255,.6)' }}>
            the board is waiting for its first memory
          </div>
        </div>
      )}

      {/* Polaroid wall — CSS multi-column masonry */}
      <div style={{ columnWidth: 248, columnGap: 26, padding: '6px 0 40px' }}>
        {orderedItems.map(item => (
          <div
            key={item.id}
            draggable={admin}
            onDragStart={admin ? e => handleDragStart(e, item) : undefined}
            onDragOver={admin ? e => handleDragOver(e, item.id) : undefined}
            onDrop={admin ? handleDrop : undefined}
            onDragEnd={admin ? handleDragEnd : undefined}
            style={{
              opacity: dragId === item.id ? 0.25 : 1,
              filter: dragId === item.id ? 'grayscale(80%)' : 'none',
              transition: dragId ? 'opacity .15s, filter .15s' : 'opacity .15s, filter .15s, transform .2s',
              outline: dragId && dragId !== item.id && lastDragTarget.current === item.id
                ? `2px dashed ${accent}`
                : 'none',
              borderRadius: 4,
            }}
          >
            <PolaroidCard
              item={item}
              admin={admin}
              accent={accent}
              isDragging={!!dragId}
              onOpen={() => onOpenLightbox(item.id)}
              onRemove={() => onRemove(item.id)}
              onTiltLeft={() => onTilt(item.id, -4)}
              onTiltRight={() => onTilt(item.id, 4)}
              onMoveBack={() => onMove(item.id, -1)}
              onMoveFwd={() => onMove(item.id, 1)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
