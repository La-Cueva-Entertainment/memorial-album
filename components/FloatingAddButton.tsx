'use client';

interface Props {
  accent: string;
  onAdd: () => void;
}

export default function FloatingAddButton({ accent, onAdd }: Props) {
  return (
    <button
      onClick={onAdd}
      title="pin a photo to the board"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 74, // above the Spotify pill
        zIndex: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 0,
        transition: 'transform .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
    >
      <span
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 18,
          fontWeight: 600,
          color: '#5b4a36',
          background: 'rgba(247,242,233,.94)',
          padding: '6px 13px',
          borderRadius: 16,
          boxShadow: '0 3px 9px rgba(60,40,20,.2)',
          whiteSpace: 'nowrap',
        }}
      >
        pin a photo
      </span>
      <span style={{ position: 'relative', width: 58, height: 58, display: 'block', flexShrink: 0 }}>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 32% 26%, #fff8ee, #e7c59c 78%)',
            boxShadow: '0 6px 14px rgba(60,40,20,.38), inset 0 -3px 6px rgba(120,80,40,.22)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            lineHeight: 1,
          }}
        >
          🧋
        </span>
        <span
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 23,
            height: 23,
            borderRadius: '50%',
            background: accent,
            color: '#fff',
            fontSize: 16,
            fontFamily: "'Spectral', serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
            boxShadow: '0 2px 5px rgba(0,0,0,.3)',
          }}
        >
          +
        </span>
      </span>
    </button>
  );
}
