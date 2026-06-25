'use client';

import { useEffect, useState } from 'react';

const RESOURCES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Free, confidential support 24/7. Call or text 988.',
    cta: 'call 988',
    href: 'tel:988',
    icon: '&#128222;',
    iconBg: 'rgba(210,90,90,.14)',
  },
  {
    name: 'Crisis Text Line',
    detail: 'Text with a trained crisis counselor anytime.',
    cta: 'text HOME \u2192 741741',
    href: 'sms:741741',
    icon: '&#128172;',
    iconBg: 'rgba(130,90,170,.12)',
  },
  {
    name: 'SAMHSA National Helpline',
    detail: 'Treatment referrals & information, 24/7.',
    cta: '1-800-662-4357',
    href: 'tel:18006624357',
    icon: '&#129309;',
    iconBg: 'rgba(210,160,60,.12)',
  },
  {
    name: 'NAMI HelpLine',
    detail: 'Mental health information, referrals & support.',
    cta: '1-800-950-6264',
    href: 'tel:18009506264',
    icon: '&#128153;',
    iconBg: 'rgba(60,120,210,.1)',
  },
];

// Email is resolved server-side — address never appears in initial HTML
export default function ResourcesView() {
  const [contactHref, setContactHref] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/contact')
      .then(r => r.ok ? r.json() : {})
      .then((data: { href?: string | null }) => { if (data.href) setContactHref(data.href); })
      .catch(() => {});
  }, []);
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 70px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(28px,4vw,40px)', color: '#3a342d', margin: '0 0 16px' }}>
          You&apos;re Not Alone
        </h1>
        <p style={{ fontFamily: "'Spectral', serif", fontSize: 'clamp(14px,2vw,16px)', color: '#52483c', lineHeight: 1.65, margin: 0, maxWidth: 520, marginInline: 'auto' }}>
          Grief is heavy, and it&apos;s okay to ask for help carrying it. If you or someone you love is struggling, please reach out. These lines are free, confidential, and open around the clock. 
        </p>
        <p style={{ fontFamily: "'Spectral', serif", fontSize: 'clamp(14px,2vw,16px)', color: '#52483c', lineHeight: 1.65, margin: '12px 0 0', maxWidth: 520, marginInline: 'auto' }}>The world is a better place with you around.</p>
      </div>

      {/* Resource rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {RESOURCES.map(r => (
          <a
            key={r.href}
            href={r.href}
            className="resource-link"
            style={{
              background: '#fffdf8', border: '1px solid #ece1cb', borderRadius: 14,
              padding: '18px 20px', boxShadow: '0 3px 10px rgba(60,40,20,.07)',
              display: 'flex', alignItems: 'center', gap: 16,
              textDecoration: 'none', color: 'inherit',
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: r.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: r.icon }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Spectral', serif", fontWeight: 600, fontSize: 16, color: '#3a342d', marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#6f665a' }}>{r.detail}</div>
            </div>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: '#c2724f', whiteSpace: 'nowrap' as const, flexShrink: 0, fontStyle: 'italic' }}>{r.cta}</div>
          </a>
        ))}
      </div>

      {/* Emergency disclaimer — above the site-help section */}
      <p style={{ textAlign: 'center', fontFamily: "'Spectral', serif", fontSize: 13, color: '#a8997f', fontStyle: 'italic', marginTop: 28, marginBottom: 28, lineHeight: 1.6 }}>
        If you are in immediate danger, please call your local emergency number (911 in the US).<br />
        These resources are based in the United States.
      </p>

      {/* Site support */}
      <div style={{ marginTop: 0, background: '#fffdf8', border: '1px solid #ece1cb', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Spectral', serif", fontWeight: 600, fontSize: 16, color: '#3a342d', marginBottom: 6 }}>Need Help with the Site?</div>
        <p style={{ fontFamily: "'Spectral', serif", fontSize: 14, color: '#6f665a', margin: '0 0 14px', lineHeight: 1.6 }}>
          If you&apos;d like to add more albums, share a memory, or need anything at all, just send us a note.
        </p>
        <button
          onClick={() => { if (contactHref) window.location.href = contactHref; }}
          disabled={!contactHref}
          style={{
            display: 'inline-block',
            fontFamily: "'Caveat', cursive", fontSize: 19,
            background: '#c2724f', color: '#fff', border: 'none',
            padding: '10px 26px', borderRadius: 22, cursor: contactHref ? 'pointer' : 'default',
            boxShadow: '0 3px 10px rgba(194,114,79,.3)',
            opacity: contactHref ? 1 : 0.6,
          }}
        >
          Send a Message &#9825;
        </button>
      </div>
    </div>
  );
}
