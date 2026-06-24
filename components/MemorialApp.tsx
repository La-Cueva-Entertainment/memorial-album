'use client';

import { useCallback, useEffect, useState } from 'react';
import TopNav, { type View } from './TopNav';
import HomeView from './HomeView';
import AlbumsView from './AlbumsView';
import MessagesView from './MessagesView';
import QuotesView from './QuotesView';
import OceanSprayView from './OceanSprayView';
import ResourcesView from './ResourcesView';
import AdminToggle from './AdminToggle';

const ACCENT = process.env.NEXT_PUBLIC_SITE_ACCENT ?? '#c2724f';

const VALID_VIEWS: View[] = ['home', 'albums', 'messages', 'quotes', 'event', 'resources'];

function viewFromHash(): View {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '') as View;
  return VALID_VIEWS.includes(hash) ? hash : 'home';
}

export default function MemorialApp() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>('home');
  const [admin, setAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState('');

  // All client-side init runs after first paint — server and client initial HTML always match
  useEffect(() => {
    setMounted(true);
    setView(viewFromHash());

    fetch('/api/admin/me')
      .then(r => r.ok ? r.json() : {})
      .then((data: { admin?: boolean }) => setAdmin(data.admin ?? false))
      .catch(() => {});

    // Handle Google OAuth result redirected back with ?auth=
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    if (authResult === 'ok') {
      setAdmin(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authResult === 'error' || authResult === 'denied') {
      setLoginError(authResult === 'denied' ? 'That Google account is not authorised.' : 'Google sign-in failed. Try again.');
      setLoginOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const goTo = useCallback((v: View) => {
    setView(v);
    window.location.hash = v === 'home' ? '' : v;
    window.scrollTo(0, 0);
  }, []);

  const handleToggle = useCallback(() => {
    if (admin) {
      fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {});
      setAdmin(false);
    } else {
      setLoginOpen(true);
      setLoginError('');
    }
  }, [admin]);

  const isEvent = view === 'event';

  // Before mount: render a static shell that matches server output exactly
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3ead9' }}>
        <TopNav view="home" onNav={() => {}} accent={ACCENT} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isEvent ? '#e8a050' : '#f3ead9',
      backgroundImage: isEvent ? 'none' :
        'radial-gradient(circle at 22% 32%,rgba(120,90,50,.04) 1.5px,transparent 1.6px),' +
        'radial-gradient(circle at 68% 70%,rgba(120,90,50,.03) 1.5px,transparent 1.6px)',
      backgroundSize: isEvent ? 'auto' : '15px 15px,19px 19px',
    }}>
      <TopNav view={view} onNav={goTo} accent={ACCENT} />

      <main>
        {view === 'home'      && <HomeView      admin={admin} accent={ACCENT} onNav={goTo} />}
        {view === 'albums'    && <AlbumsView    admin={admin} accent={ACCENT} />}
        {view === 'messages'  && <MessagesView  admin={admin} accent={ACCENT} />}
        {view === 'quotes'    && <QuotesView    admin={admin} accent={ACCENT} />}
        {view === 'event'     && <OceanSprayView admin={admin} accent={ACCENT} />}
        {view === 'resources' && <ResourcesView />}
      </main>

      <AdminToggle admin={admin} accent={ACCENT} onToggle={handleToggle} />

      {/* Login modal â€” Google only */}
      {loginOpen && (
        <div
          onClick={() => setLoginOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(20,14,8,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#f7f2e9', borderRadius: 18, padding: '28px 26px', maxWidth: 340, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}
          >
            <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: '#3a342d', margin: '0 0 6px' }}>admin sign in</h2>
            <p style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#9a8e79', fontStyle: 'italic', margin: '0 0 24px' }}>
              site management only
            </p>

            <a
              href="/api/admin/google"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#fff', border: '1.5px solid #d8cdb9', borderRadius: 12,
                padding: '12px 18px', textDecoration: 'none', color: '#3a342d',
                fontFamily: "'Spectral', serif", fontSize: 15, fontWeight: 500,
                boxShadow: '0 2px 6px rgba(0,0,0,.07)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              continue with Google
            </a>

            {loginError && (
              <p style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#b23b2e', margin: '16px 0 0', fontStyle: 'italic', textAlign: 'center' }}>{loginError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
