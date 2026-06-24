'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Item, GuestbookNote, Quote } from '@/types';
import TopNav from './TopNav';
import Banner from './Banner';
import BoardView from './BoardView';
import GalleryView from './GalleryView';
import GuestbookView from './GuestbookView';
import QuotesView from './QuotesView';
import BioView from './BioView';
import MentalHealthView from './MentalHealthView';
import OceanSprayView from './OceanSprayView';
import AddMemoryModal from './AddMemoryModal';
import MassUploadModal from './MassUploadModal';
import LightboxModal from './LightboxModal';
import MusicPlayer from './SpotifyPlayer';
import AdminToggle from './AdminToggle';
import ProfilePill from './ProfilePill';

export type View = 'board' | 'gallery' | 'guestbook' | 'quotes' | 'bio' | 'ocean-spray' | 'mental-health';
export type ModalType = null | 'add' | 'mass' | 'view';

const ACCENT = process.env.NEXT_PUBLIC_SITE_ACCENT ?? '#b5704f';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Loved One';
const SITE_DATES = process.env.NEXT_PUBLIC_SITE_DATES ?? '';

export default function MemorialApp() {
  // ── Views & modals ────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('board');
  const [modal, setModal] = useState<ModalType>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<GuestbookNote[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // ── Session user (non-admin registered users) ─────────────────────────────
  const [sessionUser, setSessionUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // ── Admin ─────────────────────────────────────────────────────────────────
  const [admin, setAdmin] = useState(false);

  // ── Fetch initial data ────────────────────────────────────────────────────
  useEffect(() => {
    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
      p.catch(() => fallback);

    Promise.all([
      safe(fetch('/api/items').then(r => r.ok ? r.json() : []), []),
      safe(fetch('/api/notes').then(r => r.ok ? r.json() : []), []),
      safe(fetch('/api/admin/me').then(r => r.ok ? r.json() : {}), {}),
      safe(fetch('/api/users/me').then(r => r.ok ? r.json() : {}), {}),
      safe(fetch('/api/quotes').then(r => r.ok ? r.json() : []), []),
    ]).then(([itemsData, notesData, adminData, userData, quotesData]) => {
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setNotes(Array.isArray(notesData) ? notesData : []);
      setAdmin((adminData as { admin?: boolean }).admin ?? false);
      const u = (userData as { user?: { id: string; name: string; role?: string } }).user;
      if (u) setSessionUser({ id: u.id, name: u.name, role: u.role ?? 'contributor' });
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
    }).catch(console.error);
  }, []);

  // ── All items sorted for slideshow ──────────────────────────────────────
  const allSlides = items.slice().sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  const isSuperContributor = admin || (sessionUser?.role === 'super_contributor');

  // ── Navigation ────────────────────────────────────────────────────────────
  const goTo = useCallback((v: View) => {
    setView(v);
    setModal(null);
    window.scrollTo(0, 0);
  }, []);

  const openAdd = useCallback(() => setModal('add'), []);
  const openMass = useCallback(() => setModal('mass'), []);
  const closeModal = useCallback(() => { setModal(null); setViewingId(null); }, []);

  const openLightbox = useCallback((id: string) => {
    setViewingId(id);
    setModal('view');
  }, []);

  // ── Items mutations ───────────────────────────────────────────────────────
  const addItem = useCallback((item: Item) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const addItems = useCallback((newItems: Item[]) => {
    setItems(prev => [...newItems, ...prev]);
  }, []);

  const removeItem = useCallback(async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
    if (viewingId === id) closeModal();
  }, [viewingId, closeModal]);

  const tiltItem = useCallback(async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    // Use current angle (or compute seeded default) then apply delta
    const { hashFloat } = await import('@/lib/seed');
    const cur = typeof item.angle === 'number'
      ? item.angle
      : hashFloat(id, 'rot') * 16 - 8;
    const newAngle = Math.max(-22, Math.min(22, cur + delta));
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ angle: newAngle }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, angle: newAngle } : i));
  }, [items]);

  const moveItem = useCallback(async (id: string, dir: -1 | 1) => {
    const boardItems = items.filter(i => i.source === 'board');
    const pos = boardItems.findIndex(i => i.id === id);
    const tgtPos = pos + dir;
    if (pos < 0 || tgtPos < 0 || tgtPos >= boardItems.length) return;
    const swapId = boardItems[tgtPos].id;
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapWithId: swapId }),
    });
    // Swap in local state too
    setItems(prev => {
      const next = [...prev];
      const idxA = next.findIndex(i => i.id === id);
      const idxB = next.findIndex(i => i.id === swapId);
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      return next;
    });
  }, [items]);

  const reorderBoard = useCallback(async (ids: string[]) => {
    await fetch('/api/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    // Rebuild sortOrder locally: first id gets highest value
    setItems(prev => {
      const total = ids.length;
      return prev.map(item => {
        const idx = ids.indexOf(item.id);
        return idx === -1 ? item : { ...item, sortOrder: total - idx };
      });
    });
  }, []);

  const pinItem = useCallback(async (id: string) => {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'board' }),
    });
    if (res.ok) {
      const updated: Item = await res.json();
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    }
  }, []);

  const addComment = useCallback((itemId: string, comment: { id: string; itemId: string; text: string; author: string; ts: string }) => {
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, comments: [...i.comments, comment] } : i
    ));
  }, []);

  const updateItem = useCallback((updated: Item) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }, []);

  // ── Notes mutations ───────────────────────────────────────────────────────
  const addNote = useCallback((note: GuestbookNote) => {
    setNotes(prev => [note, ...prev]);
  }, []);

  const removeNote = useCallback(async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // ── Quotes mutations ──────────────────────────────────────────────────────
  const addQuote = useCallback((quote: Quote) => {
    setQuotes(prev => [quote, ...prev]);
  }, []);

  const removeQuote = useCallback((id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  }, []);

  // ── Admin ─────────────────────────────────────────────────────────────────
  const toggleAdmin = useCallback(async () => {
    // Only admins see this button — clicking it exits admin mode
    await fetch('/api/admin/logout', { method: 'POST' });
    setAdmin(false);
  }, []);

  const viewingItem = items.find(i => i.id === viewingId) ?? null;
  const boardItems = items.filter(i => i.source === 'board');
  const galleryItems = items; // photo box shows everything

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: "'Spectral', Georgia, serif",
        color: '#3a342d',
        background: '#cdb38a',
        backgroundImage:
          'radial-gradient(circle at 18% 22%, rgba(60,40,20,.07) 1.5px, transparent 1.6px),' +
          'radial-gradient(circle at 62% 68%, rgba(60,40,20,.06) 1.5px, transparent 1.6px)',
        backgroundSize: '13px 13px, 17px 17px',
        paddingBottom: 168, // 152px Spotify bar + 16px breathing room
      }}
    >
      <TopNav
        name={SITE_NAME}
        dates={SITE_DATES}
        accent={ACCENT}
        view={view}
        onNav={goTo}
      />

      {view === 'board' && (
        <BoardView
          name={SITE_NAME}
          dates={SITE_DATES}
          items={boardItems}
          admin={admin}
          accent={ACCENT}
          onOpenAdd={openAdd}
          onOpenLightbox={openLightbox}
          onRemove={removeItem}
          onTilt={tiltItem}
          onMove={moveItem}
          onReorder={reorderBoard}
        />
      )}
      {view === 'gallery' && (
        <GalleryView
          items={galleryItems}
          slideshowItems={allSlides}
          admin={admin}
          accent={ACCENT}
          sessionUser={sessionUser}
          onOpenMass={openMass}
          onOpenLightbox={openLightbox}
          onRemove={removeItem}
          onPin={pinItem}
        />
      )}
      {view === 'guestbook' && (
        <GuestbookView
          notes={notes}
          admin={admin}
          accent={ACCENT}
          onAddNote={addNote}
          onRemoveNote={removeNote}
        />
      )}
      {view === 'quotes' && (
        <QuotesView
          quotes={quotes}
          admin={admin}
          accent={ACCENT}
          onAddQuote={addQuote}
          onRemoveQuote={removeQuote}
        />
      )}
      {view === 'bio' && <BioView admin={admin} isSuperContributor={isSuperContributor} accent={ACCENT} />}
      {view === 'ocean-spray' && <OceanSprayView admin={admin} accent={ACCENT} />}
      {view === 'mental-health' && <MentalHealthView />}

      {modal === 'add' && (
        <AddMemoryModal
          accent={ACCENT}
          onClose={closeModal}
          onAdded={item => { addItem(item); closeModal(); setView('board'); }}
        />
      )}
      {modal === 'mass' && (
        <MassUploadModal
          accent={ACCENT}
          onClose={closeModal}
          onAdded={addItems}
          sessionUser={sessionUser}
        />
      )}
      {modal === 'view' && viewingItem && (
        <LightboxModal
          item={viewingItem}
          accent={ACCENT}
          admin={admin}
          sessionUser={sessionUser}
          onClose={closeModal}
          onCommentAdded={addComment}
          onItemUpdated={updateItem}
        />
      )}

      <MusicPlayer admin={admin} />

      <AdminToggle admin={admin} onToggle={toggleAdmin} accent={ACCENT} />

      {/* Profile edit pill for logged-in contributors */}
      {sessionUser && !admin && (
        <ProfilePill
          user={sessionUser}
          accent={ACCENT}
          onUpdated={name => setSessionUser(u => u ? { ...u, name } : u)}
        />
      )}
    </div>
  );
}
