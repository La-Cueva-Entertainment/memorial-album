'use client';

interface Props {
  name: string;
  dates: string;
}

export default function Banner({ name, dates }: Props) {
  return (
    <div style={{ margin: 'clamp(14px,2vw,26px) 0 18px' }}>
      <div
        style={{
          position: 'relative',
          height: 'clamp(140px,17vw,220px)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(50,35,20,.26)',
          background: 'radial-gradient(135% 150% at 50% -25%, #fdf6ea 0%, #f3e6cf 52%, #e7d3b0 100%)',
        }}
      >
        {/* dot texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 22% 32%, rgba(120,90,50,.05) 1.5px, transparent 1.6px),' +
              'radial-gradient(circle at 68% 70%, rgba(120,90,50,.04) 1.5px, transparent 1.6px)',
            backgroundSize: '15px 15px, 19px 19px',
          }}
        />
        {/* inner vignette */}
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(120,85,45,.18)' }} />
        {/* tape corners */}
        <span style={{ position: 'absolute', top: 22, left: -30, width: 130, height: 28, background: 'rgba(217,166,121,.55)', transform: 'rotate(-36deg)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }} />
        <span style={{ position: 'absolute', top: 22, right: -30, width: 130, height: 28, background: 'rgba(159,176,138,.5)', transform: 'rotate(36deg)', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }} />
        <span style={{ position: 'absolute', bottom: 18, left: -28, width: 120, height: 24, background: 'rgba(217,154,154,.42)', transform: 'rotate(34deg)' }} />
        <span style={{ position: 'absolute', bottom: 18, right: -28, width: 120, height: 24, background: 'rgba(169,188,201,.42)', transform: 'rotate(-34deg)' }} />

        {/* content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              fontFamily: "'Spectral', serif",
              fontSize: 'clamp(10px,1.1vw,12px)',
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              color: '#a07e54',
            }}
          >
            in loving memory of
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 'clamp(42px,6.2vw,74px)',
              fontWeight: 700,
              lineHeight: 0.9,
              color: '#5b4226',
              marginTop: 2,
              textShadow: '0 1px 0 rgba(255,255,255,.5)',
            }}
          >
            {name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, color: '#b08a5c' }}>
            <span style={{ width: 46, height: 1, background: '#cba877' }} />
            <span style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: 15, color: '#8a6b46' }}>
              {dates}
            </span>
            <span style={{ fontSize: 11, color: '#cba877' }}>✦</span>
            <span style={{ width: 46, height: 1, background: '#cba877' }} />
          </div>
          <div
            style={{
              marginTop: 'clamp(8px,1.4vw,14px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 11,
              opacity: 0.72,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/mahjong-tile.png"
              alt="mahjong prosperity tile"
              style={{ height: 'clamp(22px,2.5vw,28px)', width: 'auto', display: 'block' }}
            />
            <span style={{ fontSize: 'clamp(16px,1.9vw,21px)' }}>🧋</span>
            <span style={{ fontSize: 'clamp(16px,1.9vw,21px)' }}>🐈</span>
          </div>
        </div>
      </div>
    </div>
  );
}
