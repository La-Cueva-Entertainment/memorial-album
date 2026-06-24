'use client';

const RESOURCES = [
  {
    category: 'Crisis support',
    items: [
      {
        name: '988 Suicide & Crisis Lifeline',
        detail: 'Call or text 988 — free, confidential, 24/7',
        link: 'https://988lifeline.org',
        cta: 'call or text 988',
      },
      {
        name: 'Crisis Text Line',
        detail: 'Text HOME to 741741 — free, confidential, 24/7',
        link: 'https://www.crisistextline.org',
        cta: 'text HOME to 741741',
      },
      {
        name: 'International Association for Suicide Prevention',
        detail: 'Find crisis centres worldwide',
        link: 'https://www.iasp.info/resources/Crisis_Centres/',
        cta: 'find a centre',
      },
    ],
  },
  {
    category: 'Support & community',
    items: [
      {
        name: 'NAMI Helpline',
        detail: 'Call 1-800-950-NAMI (6264) or text "NAMI" to 741741',
        link: 'https://www.nami.org/help',
        cta: 'get support',
      },
      {
        name: 'To Write Love on Her Arms',
        detail: 'Hope for people struggling with depression, addiction, self-injury, and suicide',
        link: 'https://twloha.com',
        cta: 'visit TWLOHA',
      },
      {
        name: 'American Foundation for Suicide Prevention',
        detail: 'Resources for survivors, advocacy, and community events',
        link: 'https://afsp.org',
        cta: 'visit AFSP',
      },
      {
        name: 'Mental Health America',
        detail: 'Screening tools, community support, and local resources',
        link: 'https://mhanational.org',
        cta: 'get started',
      },
    ],
  },
  {
    category: 'Events & walks',
    items: [
      {
        name: 'Out of the Darkness Walks (AFSP)',
        detail: 'Community fundraising walks held nationwide throughout the year',
        link: 'https://afsp.org/find-a-walk',
        cta: 'find a walk near you',
      },
      {
        name: 'NAMIWalks',
        detail: 'Annual mental health awareness walks in communities across the US',
        link: 'https://namiwalks.org',
        cta: 'join a walk',
      },
      {
        name: 'Mental Health 5Ks & local events',
        detail: 'Search "mental health 5k" or "suicide prevention walk" + your city on Eventbrite',
        link: 'https://www.eventbrite.com/d/online/mental-health/',
        cta: 'find events',
      },
    ],
  },
];

export default function MentalHealthView() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '30px 22px 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 'clamp(26px,3.4vw,36px)',
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 2px 10px rgba(60,40,20,.45)',
          }}
        >
          mental health resources
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
          you are not alone — help is always available
        </div>
      </div>

      {/* Crisis banner */}
      <div
        style={{
          background: '#fffdf8',
          border: '2px solid #e8c89a',
          borderRadius: 14,
          padding: '16px 22px',
          margin: '24px 0 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 22,
            color: '#5b4a36',
            marginBottom: 4,
          }}
        >
          if you or someone you know is in crisis
        </div>
        <a
          href="tel:988"
          style={{
            display: 'inline-block',
            fontFamily: "'Caveat', cursive",
            fontSize: 32,
            fontWeight: 700,
            color: '#b5704f',
            textDecoration: 'none',
            letterSpacing: '0.05em',
          }}
        >
          call or text 988
        </a>
        <div style={{ fontSize: 13, color: '#9a8e79', marginTop: 4 }}>
          free · confidential · available 24/7
        </div>
      </div>

      {/* Resource sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {RESOURCES.map(section => (
          <div key={section.category}>
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 26,
                color: '#fff',
                textShadow: '0 1px 6px rgba(60,40,20,.35)',
                marginBottom: 12,
              }}
            >
              {section.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section.items.map(item => (
                <div
                  key={item.name}
                  style={{
                    background: '#fffdf8',
                    borderRadius: 12,
                    boxShadow: '0 4px 14px rgba(50,35,20,.12)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: 20,
                        color: '#3a342d',
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#7a6a5a', fontStyle: 'italic' }}>
                      {item.detail}
                    </div>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: 17,
                      background: '#b5704f',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 18px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {item.cta} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: 36,
          textAlign: 'center',
          fontFamily: "'Spectral', serif",
          fontStyle: 'italic',
          fontSize: 16,
          color: 'rgba(255,255,255,.75)',
          lineHeight: 1.7,
          textShadow: '0 1px 6px rgba(60,40,20,.3)',
        }}
      >
        In memory of Cali — and in hope for everyone still fighting.
        <br />
        Grief is love with nowhere to go. Let it go here.
      </div>
    </div>
  );
}
