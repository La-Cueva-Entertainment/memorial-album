'use client';

import { useState, useRef } from 'react';
import { pinData, polaroidTransform, polaroidMarginTop } from '@/lib/seed';
import type { Item } from '@/types';

interface Props {
  item: Item;
  admin: boolean;
  accent: string;
  isDragging?: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onTiltLeft: () => void;
  onTiltRight: () => void;
  onMoveBack: () => void;
  onMoveFwd: () => void;
}

export default function PolaroidCard({
  item, admin, accent, isDragging, onOpen, onRemove, onTiltLeft, onTiltRight, onMoveBack, onMoveFwd,
}: Props) {
  const transform = polaroidTransform(item.id, item.angle);
  const mt = polaroidMarginTop(item.id);
  const pin = pinData(item.id);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const armRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (armed) {
      if (armTimer.current) clearTimeout(armTimer.current);
      setArmed(false);
      onRemove();
    } else {
      if (armTimer.current) clearTimeout(armTimer.current);
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 3000);
    }
  };

  return (
    <div
      style={{
        breakInside: 'avoid',
        display: 'inline-block',
        width: '100%',
        marginTop: mt,
        marginBottom: 30,
        position: 'relative',
      }}
    >
      {/* Card */}
      <div
        onClick={onOpen}
        style={{
          background: '#fffdf8',
          padding: '11px 11px 0',
          borderRadius: 5,
          boxShadow: '0 9px 22px rgba(50,35,20,.22)',
          transform,
          transformOrigin: '50% 8%',
          cursor: admin ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          transition: 'transform .18s, box-shadow .18s',
        }}
      >
        {/* Push-pin */}
        <span
          style={{
            position: 'absolute',
            top: -7,
            left: '50%',
            marginLeft: -7,
            width: 14,
            height: 20,
            zIndex: 4,
            transform: `translateX(${pin.offsetX}px) rotate(${pin.tiltDeg}deg)`,
            transformOrigin: '50% 88%',
          }}
        >
          {/* needle */}
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: 8,
              marginLeft: -1,
              width: 2,
              height: 11,
              background: 'linear-gradient(#d6d1c6,#8d8678)',
              borderRadius: '0 0 1.5px 1.5px',
              boxShadow: '0 1px 2px rgba(0,0,0,.3)',
            }}
          />
          {/* head */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.92), rgba(255,255,255,0) 52%), ${pin.color}`,
              boxShadow: '0 2px 4px rgba(60,40,20,.4), inset 0 -2px 3px rgba(0,0,0,.3)',
            }}
          />
        </span>

        {/* Photo window */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            overflow: 'hidden',
            borderRadius: 3,
            background: '#fffdf8',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/uploads/${item.imgPath}`}
            alt={item.caption || 'memory'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Caption */}
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 20,
            lineHeight: 1.25,
            color: '#3a342d',
            padding: '10px 4px 4px',
          }}
        >
          {item.caption}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px 12px',
          }}
        >
          <span style={{ fontSize: 12, color: '#9a8e79', fontStyle: 'italic' }}>— {item.author}</span>
          {item.comments.length > 0 && (
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 15,
                color: accent,
                background: '#f4ede1',
                padding: '1px 10px',
                borderRadius: 12,
              }}
            >
              ♡ {item.comments.length}
            </span>
          )}
        </div>
      </div>

      {/* Admin controls */}
      {admin && (
        <>
          <button
            onClick={armRemove}
            title={armed ? 'click again to confirm delete' : 'remove'}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: armed ? 'auto' : 30,
              height: 30,
              borderRadius: armed ? 15 : '50%',
              background: '#b23b2e',
              color: '#fff',
              border: '2px solid #fff',
              fontSize: armed ? 12 : 15,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(0,0,0,.3)',
              zIndex: 5,
              lineHeight: 1,
              padding: armed ? '0 8px' : 0,
              whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}
          >
            {armed ? 'delete?' : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>}
          </button>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -15,
              transform: 'translateX(-50%)',
              zIndex: 6,
              display: 'flex',
              gap: 2,
              background: '#2b2722',
              padding: '4px 6px',
              borderRadius: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,.35)',
            }}
          >
            {([
              { icon: '↺', title: 'tilt left', fn: onTiltLeft },
              { icon: '↻', title: 'tilt right', fn: onTiltRight },
            ] as const).map(b => (
              <button
                key={b.title}
                onClick={e => { e.stopPropagation(); b.fn(); }}
                title={b.title}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'none', border: 'none', color: '#f3ede2',
                  fontSize: 15, cursor: 'pointer', lineHeight: 1,
                }}
              >
                {b.icon}
              </button>
            ))}
            <span style={{ width: 1, background: 'rgba(255,255,255,.18)', margin: '3px 2px' }} />
            {([
              { icon: '←', title: 'move earlier', fn: onMoveBack },
              { icon: '→', title: 'move later', fn: onMoveFwd },
            ] as const).map(b => (
              <button
                key={b.title}
                onClick={e => { e.stopPropagation(); b.fn(); }}
                title={b.title}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'none', border: 'none', color: '#f3ede2',
                  fontSize: 15, cursor: 'pointer', lineHeight: 1,
                }}
              >
                {b.icon}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
