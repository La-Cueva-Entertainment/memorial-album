# lovecali — Memorial Scrapbook

A warm, shared memorial website where family and friends collect photos and memories.
Family members pin polaroid-style photos to a cork-board, browse a bulk photo gallery,
watch an auto-playing slideshow, and sign a guestbook. Fully self-hosted via Docker.

## Quick start (local dev)

```bash
cp .env.example .env.local   # fill in your values
npm install
npm run db:push              # create the SQLite database
npm run dev                  # http://localhost:3000
```

## Docker deployment (Unraid / any Docker host)

```bash
docker compose up -d
```

User uploads and the database live in `./data/` on the host (mounted as a volume).
On first startup the container runs `prisma db push` automatically.

### Pull from GHCR

```bash
docker pull ghcr.io/la-cueva-entertainment/lovecali:latest
```

## Environment variables

Copy `.env.example` to `.env.local` (dev) or set in your `docker-compose.yml` / Unraid template.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | `file:./data/dev.db` for SQLite |
| `SESSION_SECRET` | ✓ | Random 32+ char string — used to sign cookies |
| `ADMIN_PASSWORD` | ✓ | Password for the admin 🔒 toggle |
| `NEXT_PUBLIC_SITE_NAME` | | Name displayed in the banner (default: *My Loved One*) |
| `NEXT_PUBLIC_SITE_DATES` | | Birth–death dates shown under the name |
| `NEXT_PUBLIC_SITE_ACCENT` | | Hex accent colour (default: `#b5704f`) |
| `REQUIRE_INVITE` | | Set to `true` to require an invite link to post |

## File storage

All user-uploaded photos are stored as JPEG files in `data/uploads/` on the host filesystem
(inside the Docker volume). The SQLite database is `data/dev.db`.

For production with many users, swap `lib/storage.ts` to use S3/Cloudflare R2/Backblaze B2
by replacing `saveUpload()` and the `/api/uploads/[...path]` route with signed URLs.

## Admin features

Click the 🔒 button (bottom-left) and enter `ADMIN_PASSWORD` to enter admin mode:
- **Remove / tilt / reorder** polaroids on the board
- **Remove** gallery photos and guestbook notes
- **Full admin panel** at `/admin`:
  - Download any uploaded file
  - Create invite links (contributor or admin role)
  - View registered users

## Invitations

With `REQUIRE_INVITE=false` (default) anyone can post. Set `REQUIRE_INVITE=true` to gate posting
behind invite links. In the admin panel → Invitations tab, create a link and share it.
Recipients open the link, enter their name, and receive a session that lets them post.

An invite with `role: admin` grants full admin access — use this to bring in co-administrators
without sharing the main admin password.

## Enabling the approval queue

The `status` field (`pending | approved`) exists on every photo item. To enable moderation:
1. Set `REQUIRE_APPROVAL=true` in your environment (not yet wired to the UI — see below)
2. In `app/api/items/route.ts`, change the `create` call to `status: 'pending'`
3. In `app/api/items/route.ts` GET handler, filter `where: { status: 'approved' }`
4. Add an "Approve" action to the admin panel's file list

## Import from Immich

In the Photo Box modal, choose the **Immich** tab. Enter your self-hosted Immich server URL
and an API key (created in Immich → Account settings → API keys). Select photos and click
**Import selected** — they are fetched server-side and added to the photo box.

## Google Photos / Apple iCloud

**Apple iCloud:** the native file picker on iOS/macOS already shows your iCloud Photo Library
— no extra setup needed.

**Google Photos:** requires Google OAuth credentials. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in your env, then follow the OAuth setup described in the Photo Box
modal's Google Photos tab.

## Tech stack

- **Next.js 15** (App Router, React 18)
- **Prisma** + SQLite (swap to PostgreSQL by changing `DATABASE_URL` and schema `provider`)
- **iron-session** for cookie-based auth
- **sharp** for server-side image processing

## Overview
A warm, scrapbook-style memorial website where family and friends collect photos and
memories of a loved one. The experience is built around a **cork-board of polaroid photos**
that anyone can pin instantly, a separate **bulk photo gallery**, an **auto-playing
slideshow** with music, and a **guestbook**. It is intentionally informal and "cutesie" —
handwritten type, tilted polaroids, push-pins, and little personal motifs (a boba cup, a
cat, and a green 發 mahjong "prosperity" tile that meant something to her).

The single-screen app switches between four main views via a top nav: **The Board**,
**Photo Box** (gallery), **Slideshow**, and **Guestbook**. A persistent music player sits at
the bottom, an **admin mode** toggle (bottom-left) reveals moderation controls, and a
floating **boba-cup "pin a photo"** button (bottom-right) is the primary call to action.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype that
demonstrates the intended look, layout, copy, and interactions. They are **not production code
to ship directly.** The task is to **recreate this design in the target codebase's environment**
(React, Vue, Svelte, native, etc.) using its established components, patterns, and libraries.
If no codebase exists yet, choose an appropriate stack (a React + a small backend would suit
this well) and implement the design there.

The prototype is authored as a "Design Component" (`.dc.html`) that depends on a bundled
runtime (`support.js`). You do **not** need to reuse that runtime — read the file as a spec:
the `<x-dc>` markup is the layout, the `class Component extends DCLogic` block is the logic,
`renderVals()` returns the data/handlers the template binds to, and `state` is the app state.

> **Start here:** read `PROMPT.md` for a ready-to-paste kickoff brief, then this README in full.

## Screenshots (in `screenshots/`)
- `01-board.jpg` — The Board (polaroid wall, push-pins, banner, floating boba add button)
- `02-photo-box.jpg` — Photo Box / bulk gallery (empty state shown)
- `03-slideshow.jpg` — Slideshow stage with caption + controls
- `04-guestbook.jpg` — Guestbook (compose card + notes)
- `05-lightbox-comments.jpg` — Photo lightbox with comments
- `06-add-memory-modal.jpg` — Add-a-Memory modal (photo picker + form)

## Fidelity
**High-fidelity (hifi) + functional prototype.** Colors, typography, spacing, copy, and
interactions are all final and intentional. Uploads, comments, guestbook notes, tilts, and
ordering really work and persist (in `localStorage`). Recreate the UI faithfully, and
reimplement the behaviors against a real backend (see **Production Notes**).

---

## Screens / Views

### 1. The Board (home) — `view: 'board'`
The heart of the site: a corkboard of polaroids that fills in like a real, hand-pinned wall.

- **Layout:** Centered column, `max-width: 1180px`, horizontal padding `22px`.
  - **Banner** (see Components) at top.
  - A centered **subtitle pill**: *"the stories, the laughs, and every little moment — all in one place"* — Spectral italic 16px, color `#5b4a36`, on `rgba(247,242,233,.82)`, `border-radius:20px`, padding `5px 18px`.
  - **Empty state** (when no board photos): centered, Caveat 30px `#5b4a36` *"the board is waiting for its first memory"* + a primary button *"pin the first one"*.
  - **Polaroid wall:** CSS multi-column masonry — `column-width:248px; column-gap:26px`. Each polaroid: `break-inside:avoid; display:inline-block; width:100%`.
- **Polaroid card:** bg `#fffdf8`, padding `11px 11px 0`, `border-radius:5px`, shadow `0 9px 22px rgba(50,35,20,.22)`. Each card has a **randomized but stable** transform (seeded by item id): `translateX(±18px) rotate(angle) scale(0.96–1.04)`, `transform-origin:50% 8%`, plus a randomized top margin `0–50px` so columns stagger. Cursor pointer; clicking opens the lightbox.
  - **Photo window:** `aspect-ratio:1; overflow:hidden; border-radius:3px; background:#fffdf8`. Image uses **`object-fit:contain`** (shows the *whole* photo on the white matte — this matches the lightbox and is deliberate; do NOT use cover/crop here).
  - **Push-pin** (top center, see Design Tokens → Push-pin).
  - **Caption:** Caveat 20px, line-height 1.25, `#3a342d`, padding `10px 4px 4px`.
  - **Footer row** (flex space-between, padding `0 4px 12px`): author *"— {name}"* (12px italic `#9a8e79`) and, **only if comments exist**, a heart bubble *"♡ {n}"* (Caveat 15px, color = accent, bg `#f4ede1`, padding `1px 10px`, `border-radius:12px`).
  - **Admin controls** (only in admin mode): red **✕ remove** button top-right (`-10px/-10px`, 30px circle, `#b23b2e`, 2px white border); and a dark pill toolbar at bottom-center (`#2b2722`, `border-radius:20px`) with **↺ / ↻** (tilt ∓4°), a divider, and **← / →** (reorder earlier/later). Each toolbar button is a 26px transparent circle, `#f3ede2` glyph.

### 2. Photo Box (gallery) — `view: 'gallery'`
Bulk dump of every photo; no captions required.

- **Header row** (flex, align-end, space-between): title *"the photo box"* (Caveat clamp(26–34px) `#fff`, text-shadow) + subtitle pill *"every photo, all in one place — drop a whole batch at once"*; and a primary **"+ upload photos"** button (right).
- **Empty state:** Caveat 28px `#5b4a36` *"no photos in the box yet"*.
- **Grid:** `display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px`. Each cell: `aspect-ratio:1; border-radius:8px; overflow:hidden; background:#fffdf8; box-shadow:0 5px 14px rgba(50,35,20,.16)`. Image **`object-fit:cover`** (thumbnails crop-to-fill here — that's fine for a contact sheet). Click opens lightbox. Admin ✕ remove at top-right (28px).

### 3. Slideshow — `view: 'slideshow'`
Auto-plays through **all** photos (board + gallery), oldest→newest, with gentle fades.

- **Stage:** `#211d18`, `border-radius:18px`, padding `30px 26px 22px`, shadow `0 16px 40px rgba(30,20,10,.4)`, min-height 420px, centered column.
- **Image:** in a `54vh / max 540px / min 300px` box, `object-fit:contain`, `border-radius:4px`, shadow `0 10px 30px rgba(0,0,0,.5)`. Each transition runs `@keyframes slidefade` (opacity 0→1, scale 1.015→1) over `1s ease`. Auto-advance every **4800ms** when playing.
- **Caption:** Caveat 22px `#f3ede2`, centered.
- **Controls:** ◀ / play-pause (48px circle `rgba(255,255,255,.12)`) / ▶, plus **"⛶ full screen"** (uses `requestFullscreen()` on the stage). A small counter *"{i} / {n}"* (12px `#7d7464`).
- **Empty state:** *"add some photos and they'll play here"*.

### 4. Guestbook — `view: 'guestbook'`
A wall of short notes (separate from per-photo comments).

- **Layout:** `max-width:840px`. Centered title *"the guestbook"* + subtitle pill *"leave a note, a story, a goodbye"*.
- **Compose card:** `#fffdf8`, `border-radius:14px`, shadow. A name input (Caveat 19px, bottom-border only) + a textarea (Caveat 20px, `#fbf7ef`, `border-radius:10px`) + **"sign the book"** button (accent).
- **Notes:** column, gap 16px. Each note card `#fffdf8`, `border-radius:12px`, padding `16px 18px`, with a small seeded rotation (≈ ±2.5°). Text Caveat 21px `#3a342d`; author 12.5px italic `#9a8e79`. Admin ✕ remove (26px) top-right.

### Modal — Add a Memory (`modal: 'add'`)
Posts a polaroid to the board **immediately**.

- Scrim `rgba(35,25,15,.55)`, centered card `#f7f2e9`, `border-radius:18px`, `max-width:460px`, padding 26px, `@keyframes pop` entrance.
- Title *"pin a memory to the board"*; explainer that it posts right away and to use the Photo Box for bulk.
- **Photo picker / cropper:**
  - Empty: dashed dropzone (`2px dashed #c9bca4`), *"📷 tap to choose a photo"*.
  - After choosing: a **square crop frame** (`aspect-ratio:1`, bg `#fffdf8`, `border-radius:12px`, inset 1px border). The image **defaults to fully visible (contain)** on the matte; user can **drag to reposition** and use a **zoom slider (1–3)** to crop in. (Pointer-drag pans; offsets clamped.)
  - **Tilt chips:** *"how should it sit on the board?"* → `↺ tilt left` (−7°), `▢ straight` (0°), `↻ tilt right` (+7°), `✦ let it fall` (random −8..8°). Active chip = accent bg / white text; inactive = `#ece6d9` / `#6b6358`.
  - Name input + memory textarea (Caveat).
  - Buttons: *cancel* (`#ece6d9`) / *pin it up* (accent).
- **On submit:** the visible crop is rendered to a **1000×1000 JPEG** (quality 0.88) drawn on a `#fffdf8` matte, stored as a `board` item; modal closes; board shows it.

### Modal — Mass Upload (`modal: 'mass'`)
- Similar shell. Title *"upload a batch of photos"*; explainer that these go to the Photo Box.
- Drag-and-drop zone (also click to choose), `<input type="file" multiple>`.
- One name input applied to all.
- Live status line (accent): *"adding 3 / 12…"* then *"added 12 photos ✓"*. Each file is downscaled (max 1100px, JPEG 0.8) and added as a `gallery` item.

### Modal — Lightbox + Comments (`modal: 'view'`)
- Darker scrim `rgba(25,18,10,.78)`. Card `#f7f2e9`, `border-radius:16px`, `max-width:840px`.
- Top: image on `#211d18`, `object-fit:contain`, `max-height:54vh`.
- Body: caption (Caveat 24px, if present), author. Dashed divider. Comment heading (*"comments"* or *"be the first to comment"*).
- Comments list: each in `#fffdf8` rounded card — text Caveat 18px, author 11.5px italic.
- Add-comment row: name input + comment input + **"post"** button (accent).

---

## Interactions & Behavior
- **Nav:** four pill buttons + **"+ add"** (opens Add modal). Active pill = accent bg/white; others transparent/`#5b4a36`. `window.scrollTo(0,0)` on view change.
- **Floating "pin a photo" button** (fixed, bottom-right, `z-index:56`, above music bar at `bottom:86px`): a **boba-cup** circle (58px, radial cream gradient `#fff8ee→#e7c59c`, contains 🧋) with an accent **"+" badge** (23px, white border) and a Caveat *"pin a photo"* label pill. Hover scales to 1.07 (`transition:transform .15s`). Opens the Add modal.
- **Posting is instant** (no approval) by current design — see Production Notes for the optional approval queue.
- **Admin mode:** 🔒 button bottom-left (`z-index:55`); toggles 🔒/🔓 and a red hint pill *"admin mode — ✕ remove · ↺↻ tilt · ←→ move"*. Reveals per-item remove/tilt/reorder controls on board, gallery (remove), and guestbook (remove).
- **Tilt (admin):** ±4° per tap, clamped to ±22°, persisted to the item's `angle`.
- **Reorder (admin):** swaps the item with the previous/next **board** item in the array (masonry reflows). This is sequence reordering, not free x/y placement.
- **Slideshow:** auto-advance 4800ms; manual prev/next; play/pause; fullscreen; fade per slide.
- **Music:** ◀◀ / play-pause / ▶▶ and **"♫ add songs"** (multi-select audio). Plays via an `<audio>` element; auto-advances on track end. Title + "n / total · her playlist" subtitle.
- **Modals:** click scrim to close; clicks inside `stopPropagation`. Entrance via `pop` keyframe.

## State Management
All state lives in one component (`state`):
- `view`: `'board' | 'gallery' | 'slideshow' | 'guestbook'`
- `items`: array of photo objects (board + gallery)
- `notes`: array of guestbook notes
- `admin`: boolean
- `modal`: `null | 'add' | 'mass' | 'view'`
- `viewingId`: id of item open in lightbox
- `draftPhoto` (data URL of photo being added), `cropZoom` (1–3), `cropFx`/`cropFy` (0–1 pan fractions), `draftAngle` (`'left'|'straight'|'right'|'auto'`)
- `massStatus`: progress string
- `slideIdx`, `slidePlaying`
- `tracks` (array of `{name,url}`), `trackIdx`, `musicPlaying`

**Data shapes**
```
item  = { id, img /* dataURL */, caption, author, ts, source: 'board'|'gallery',
          comments: [ { author, text } ], angle?: number|null /* explicit tilt, else random */ }
note  = { id, text, author, ts }
track = { name, url }   // url is an object URL; session-only, not persisted
```

**Persistence (prototype):** `localStorage` key **`memorial_scrapbook_v1`** = `{ items, notes }`.
Photos are stored as compressed JPEG **data URLs** (board crop = 1000², gallery = max 1100px).
Music is **not** persisted. In production, replace localStorage with API calls (see below).

## Design Tokens

**Fonts** (Google Fonts): `Caveat` (handwriting, 500/600/700) and `Spectral` (serif, incl. italic, 400/500/600). Fallbacks: Georgia/serif. Body font = Spectral; headings/labels/handwriting accents = Caveat.

**Colors**
| Role | Value |
|---|---|
| Board background | `#cdb38a` + two radial-dot textures `rgba(60,40,20,.07)`/`.06`, sizes `13px`/`17px` |
| Accent (default) | `#b5704f` — options: `#b5704f`, `#8a9a6b`, `#7a8aa3`, `#a87090`, `#9a8e79` |
| Nav bar | `rgba(247,242,233,.93)`, blur 8px, border-bottom `#d8cdb9` |
| Polaroid / cards | `#fffdf8` |
| Modal card | `#f7f2e9` |
| Primary text | `#3a342d`; muted `#6b6358`; faint `#9a8e79` |
| Banner name | `#5b4226`; eyebrow `#a07e54`; dates `#8a6b46`; divider `#cba877` |
| Banner bg | radial `#fdf6ea → #f3e6cf (52%) → #e7d3b0` |
| Banner tape corners | `rgba(217,166,121,.55)`, `rgba(159,176,138,.5)`, `rgba(217,154,154,.42)`, `rgba(169,188,201,.42)` |
| Comment bubble bg | `#f4ede1` |
| Slideshow / lightbox image bg | `#211d18` |
| Music bar | `rgba(33,29,24,.96)`, blur 10px |
| Admin remove | `#b23b2e`; admin toolbar `#2b2722` |
| Tilt chip (inactive) | `#ece6d9` bg / `#6b6358` text |

**Push-pin** (per polaroid, seeded random): wrapper `translateX(±18px) rotate(±15°)`, `transform-origin:50% 88%`. Head = 14px circle, `radial-gradient(circle at 35% 30%, rgba(255,255,255,.92), transparent 52%), {pinColor}`, shadow `0 2px 4px rgba(60,40,20,.4), inset 0 -2px 3px rgba(0,0,0,.3)`. Needle = `2px × 11px`, `linear-gradient(#d6d1c6,#8d8678)`, below head. Pin colors: `#e8896b`, `#7fa37a`, `#7d9bc0`, `#d98aa6`, `#e0b15e`, `#a98ec9`.

**Radii:** polaroid card 5px · photo window 3px · gallery cell 8px · cards/pills 12–14px · modals 16–18px · chips/buttons 18–24px (pill).

**Shadows:** card `0 9px 22px rgba(50,35,20,.22)` · banner `0 12px 30px rgba(50,35,20,.26)` · modal `0 24px 60px rgba(0,0,0,.4–.5)`.

**Fluid sizing:** banner height `clamp(140px,17vw,220px)`, banner name `clamp(42px,6.2vw,74px)`, nav buttons `clamp(16px,1.7vw,21px)`, section titles `clamp(26px,3.4vw,34px)`. (Added so the layout stays readable on small laptops.)

**Animations:** `slidefade` (1s) for slideshow; `pop` (.25s) for modals; hover scale 1.07 on the floating button.

**Tweakable props** (exposed by the prototype): `name` (string, default "Katherine"), `dates` (string), `accent` (color, from the 5 options above).

## Assets
- **`uploads/pasted-1781680678465-0.png`** — illustrated green 發 ("prosperity"/get-rich) mahjong tile, transparent background, 512×512. Used in the banner motif row next to the 🧋 (boba) and 🐈 (cat) emoji. Personal to the subject (she loved mahjong). Ship as an `<img>`; size to match adjacent emoji (~`height: clamp(22px,2.5vw,28px)`).
- **Emoji:** 🧋 (boba) and 🐈 (cat) appear in the banner; 🧋 is also the floating add button glyph. Use system emoji (or swap for brand-consistent icons in your codebase if preferred).
- **User photos:** all other imagery is uploaded by users at runtime — no static photo assets.
- No SVG icon set is required; controls use unicode glyphs (✕ ↺ ↻ ← → ◀ ▶ ⛶ ♡ ♫). Swap for your icon library as desired.

## Files
- `PROMPT.md` — ready-to-paste kickoff brief for the coding agent.
- `Memorial Scrapbook.dc.html` — the full design + logic (read as spec; see "About the Design Files").
- `support.js` — the prototype runtime (reference only; not needed in production).
- `uploads/pasted-1781680678465-0.png` — the mahjong tile asset.
- `screenshots/` — reference images of all six states (listed above).

---

## Production Notes (important)
This prototype stores everything in the browser (`localStorage`), so it is single-user and not
shared. To make it a real, shared memorial site you'll need a **backend**:
- **Storage + DB:** object storage for photos (S3/GCS/etc.) and a database for items, comments,
  notes, ordering, and tilt angles. Replace the `localStorage` read/write with API calls.
- **Auth / admin:** the 🔒 admin toggle is a stub. Gate remove/tilt/reorder behind real admin auth.
- **Approval queue (optional, was discussed):** posting is currently instant. If the family wants
  moderation, add a `status: 'pending' | 'approved'` field, hide pending items from the public
  board, and give admins an approval queue. (A "review queue" was the recommended balance.)
- **Bulk-upload integrations (discussed):** the native file picker already pulls from a phone's
  Google/Apple photo library, which covers most needs. Direct API integration, if pursued:
  - **Google Photos:** since 2025 only the **Picker API** allows selecting from a user's library
    (the old full-library Library API scopes were removed); requires OAuth + a backend.
  - **Immich:** clean REST API (`/api`, `x-api-key`, `asset.upload`) — easiest to integrate if
    self-hosted and reachable.
  - **Apple iCloud:** no public third-party API for a user's photo library; rely on the native picker.
- **Music:** host audio files server-side and stream them; persist the playlist.
- **Accessibility:** add alt text/labels, focus states, and keyboard nav for modals/slideshow.
