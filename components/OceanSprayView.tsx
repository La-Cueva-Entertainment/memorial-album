'use client';

import { useEffect, useState } from 'react';

interface Props {
  admin: boolean;
  accent: string;
}

// Deterministic star positions (upper half only)
const STARS = Array.from({ length: 38 }, (_, i) => ({
  x: ((i * 37 + 13) % 97) + 1,
  y: ((i * 23 + 7) % 40) + 1,
  opacity: 0.2 + ((i * 17) % 55) / 120,
  size: i % 7 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
}));

type EventConfig = {
  event_date: string;
  event_time: string;
  event_where: string;
  event_venue: string;
  event_dress: string;
  event_dress_note: string;
  event_bring: string;
  event_notes: string;
};

const DEFAULTS: EventConfig = {
  event_date: 'Saturday, [date]',
  event_time: 'golden hour, from 5:00pm',
  event_where: 'Los Angeles',
  event_venue: '[venue / rooftop]',
  event_dress: 'dressed to dance',
  event_dress_note: 'gold, midnight blue, a little sparkle',
  event_bring: 'a memory & a song',
  event_notes: 'Dress to dance \u2014 golds, midnight blue, a little sparkle. She\u2019d want the room to shine.\nBring a photo or a memory to share; we\u2019ll be collecting them all night.\nStay for the music \u2014 there will be boba, and probably dancing. \ud83e\uddcb',
};

export default function OceanSprayView({ admin }: Props) {
  const [config, setConfig] = useState<EventConfig>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EventConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [rsvped, setRsvped] = useState(false);

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => r.ok ? r.json() : {})
      .then((cfg: Partial<EventConfig>) => {
        const merged = { ...DEFAULTS };
        for (const key of Object.keys(DEFAULTS) as (keyof EventConfig)[]) {
          if (cfg[key]) merged[key] = cfg[key]!;
        }
        setConfig(merged);
        setDraft(merged);
      })
      .catch(() => {});
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    await fetch('/api/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setConfig(draft);
    setSaving(false);
    setEditing(false);
  };

  const notes = config.event_notes.split('\n').filter(Boolean);

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'linear-gradient(175deg, #1a0e3d 0%, #2d1260 18%, #5a1d72 34%, #8e2f6e 48%, #bf5060 62%, #d4784a 78%, #e8a050 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Stars */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          borderRadius: '50%',
          background: `rgba(255,255,255,${s.opacity})`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Moon */}
      <div style={{
        position: 'absolute',
        top: 24,
        right: 'clamp(20px,5vw,72px)',
        width: 'clamp(44px,5.5vw,66px)',
        height: 'clamp(44px,5.5vw,66px)',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fff5c0, #e8c050)',
        boxShadow: '0 0 36px rgba(232,192,80,.5)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: 'clamp(36px,6vw,72px) 20px clamp(48px,7vw,90px)' }}>

        {/* Eyebrow */}
        <div style={{
          textAlign: 'center',
          fontFamily: "'Spectral', serif",
          fontSize: 'clamp(10px,1.3vw,12px)',
          letterSpacing: '.32em',
          textTransform: 'uppercase' as const,
          color: '#c9a83a',
          marginBottom: 14,
        }}>
          A CELEBRATION OF HER LIFE
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontFamily: "'Caveat', cursive",
          fontSize: 'clamp(44px,7vw,80px)',
          fontWeight: 700,
          color: '#e8c050',
          lineHeight: 1.05,
          marginBottom: 16,
          textShadow: '0 2px 28px rgba(232,192,80,.25)',
        }}>
          ✦ Ocean Spray ✦
        </div>

        {/* Subtitle */}
        <div style={{
          textAlign: 'center',
          fontFamily: "'Spectral', serif",
          fontSize: 'clamp(14px,1.9vw,17px)',
          color: 'rgba(255,255,255,.72)',
          fontStyle: 'italic',
          lineHeight: 1.65,
          marginBottom: 'clamp(28px,4vw,48px)',
        }}>
          a night under the city of stars &mdash;<br />for our girl who always dreamed &#127916;
        </div>

        {/* ── Fact cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}>
          <FactCard icon="&#127769;" label="WHEN"  main={config.event_date}  sub={config.event_time} />
          <FactCard icon="&#128205;" label="WHERE" main={config.event_where} sub={config.event_venue} />
          <FactCard icon="&#10024;"  label="DRESS" main={config.event_dress} sub={config.event_dress_note} />
        </div>
        <div style={{ marginBottom: 14, maxWidth: 280 }}>
          <FactCard icon="&#127926;" label="BRING" main={config.event_bring} sub="a photo or story to share" />
        </div>

        {/* ── Notes card ── */}
        <div style={{
          background: 'rgba(255,255,255,.08)',
          border: '1px solid rgba(255,255,255,.15)',
          borderRadius: 16,
          padding: '18px 22px',
          marginBottom: 'clamp(28px,4vw,44px)',
        }}>
          <div style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 22,
            color: '#e8c050',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>&#10022;</span> a few notes
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
            {notes.map((line, i) => (
              <li key={i} style={{
                fontFamily: "'Spectral', serif",
                fontSize: 15,
                color: 'rgba(255,255,255,.78)',
                lineHeight: 1.65,
                marginBottom: i < notes.length - 1 ? 6 : 0,
              }}>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Admin edit */}
        {admin && !editing && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <button
              onClick={() => { setDraft(config); setEditing(true); }}
              style={{
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
                color: 'rgba(255,255,255,.65)', borderRadius: 16, padding: '5px 14px',
                fontFamily: "'Spectral', serif", fontSize: 13, cursor: 'pointer',
              }}
            >
              edit event details
            </button>
          </div>
        )}

        {/* Admin edit form */}
        {editing && (
          <div style={{
            background: 'rgba(26,14,61,.7)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 16,
            padding: '24px 20px',
            marginBottom: 28,
            backdropFilter: 'blur(8px)',
          }}>
            <h3 style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#e8c050', margin: '0 0 20px' }}>edit event details</h3>
            {([
              ['Date', 'event_date'], ['Time', 'event_time'], ['City', 'event_where'],
              ['Venue', 'event_venue'], ['Dress code', 'event_dress'], ['Dress note', 'event_dress_note'],
              ['What to bring', 'event_bring'],
            ] as [string, keyof EventConfig][]).map(([lbl, k]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: 'rgba(255,255,255,.5)', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>{lbl}</label>
                <input
                  value={draft[k]}
                  onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, color: '#fff', fontFamily: "'Caveat', cursive", fontSize: 18, padding: '8px 12px', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Spectral', serif", fontSize: 12, color: 'rgba(255,255,255,.5)', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>Notes (one per line)</label>
              <textarea
                value={draft.event_notes}
                onChange={e => setDraft(d => ({ ...d, event_notes: e.target.value }))}
                rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, color: '#fff', fontFamily: "'Spectral', serif", fontSize: 14, padding: '8px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: 'transparent', color: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '8px 20px', cursor: 'pointer' }}>
                cancel
              </button>
              <button onClick={saveConfig} disabled={saving} style={{ fontFamily: "'Caveat', cursive", fontSize: 18, background: '#e8c050', color: '#1a0e3d', border: 'none', borderRadius: 20, padding: '8px 24px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'saving\u2026' : 'save'}
              </button>
            </div>
          </div>
        )}

        {/* RSVP */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setRsvped(r => !r)}
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 22,
              background: rsvped ? 'rgba(232,192,80,.15)' : 'rgba(232,192,80,.18)',
              color: '#e8c050',
              border: '1.5px solid #e8c050',
              padding: '12px 38px',
              borderRadius: 32,
              cursor: 'pointer',
              letterSpacing: '.02em',
              marginBottom: 14,
            }}
          >
            {rsvped ? '\u2665 we\u2019ll see you there' : 'let us know you\u2019re coming'}
          </button>
          <div style={{
            fontFamily: "'Spectral', serif",
            fontStyle: 'italic',
            fontSize: 14,
            color: 'rgba(255,255,255,.45)',
            letterSpacing: '.04em',
          }}>
            here&apos;s to her &mdash; our brightest dreamer &#10022;
          </div>
        </div>
      </div>
    </div>
  );
}

function FactCard({ icon, label, main, sub }: { icon: string; label: string; main: string; sub: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.08)',
      border: '1px solid rgba(255,255,255,.13)',
      borderRadius: 14,
      padding: '16px 16px 14px',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: icon }} />
      <div style={{ fontFamily: "'Spectral', serif", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase' as const, color: '#c9a83a', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: '#fff', lineHeight: 1.2, marginBottom: sub ? 4 : 0 }}>
        {main}
      </div>
      {sub && (
        <div style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: 'rgba(255,255,255,.52)', fontStyle: 'italic' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
