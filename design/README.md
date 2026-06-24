# Handoff: "Remembering Cali" — Memorial Website (v2, simplified)

## Overview
A warm, mobile-first memorial website for **Cali**. It replaces the earlier scrapbook concept
with a simpler, six-section site that's easy for a wide range of people — especially older or
distant loved ones who just want to *view* — while still making it effortless to contribute.

The tone stays gentle and personal (handwritten type, warm cream palette, small personal motifs
— boba 🧋, a cat 🐈, and a green 發 mahjong "prosperity" tile she loved). It is **not** the
scrapbook/polaroid-board app from the previous handoff; that board is gone as a destination.
Instead the *feeling* of a polaroid board lives on the Home page as gently rotating photos.

### The six sections (single-page app, view-switched)
1. **Home** — Cali's portrait + "about her", with rotating polaroid-style photos pulled from the gallery.
2. **Photo Albums** — albums hosted in our shared **Immich** library; open one to add photos in bulk. Plus a Create-Album flow.
3. **Messages for Cali** — a guestbook of notes.
4. **Quotes by Cali** — memorable things she said, each with an optional photo/video attachment.
5. **Ocean Spray** — the memorial event (its own ocean-toned page).
6. **Mental Health Resources** — real US crisis lines, tap-to-call.

Nav is an inline pill bar on desktop and a **hamburger drawer** (large tap targets) on phones.
A persistent **admin** toggle (lock button, bottom-left) reveals remove controls. Section names
are placeholders the family is still finalizing — keep them easy to rename.

## About the Design Files
The HTML here is a **design prototype** (a "Design Component," `Name.dc.html`, that uses a small
runtime, `support.js`). It is a faithful **visual + interaction reference**, NOT production code
to ship. Recreate it in the target stack. Read `Remembering Cali.dc.html` as a spec:
- `<x-dc>…</x-dc>` markup = layout & copy.
- `class Component extends DCLogic { … }` = logic; `renderVals()` returns the data/handlers the
  template binds to; `state` is the app state. You don't need to reuse `support.js`.

> **Start with `PROMPT.md`** (a ready-to-paste kickoff brief), then read this README in full.
> A real backend already exists for this project (Next.js + Prisma, with Immich import) — this
> redesign should be wired into it, not built from scratch.

## Fidelity
**High-fidelity, mobile-first, functional prototype.** Colors, type, spacing, copy, and
interactions are intentional. Uploads/messages/quotes/albums persist in `localStorage` in the
prototype; reimplement against the real backend + Immich (see **Immich integration** and
**Production notes**).

## Screenshots (`screenshots/`)
- `01-home.png` — Home: portrait polaroid, tagline, motifs, "about Cali", quick links (desktop shows flanking rotating polaroids).
- `02-photo-albums.png` — Albums: "add your photos" + "create a new album", album grid, "tap to add your photos ↗".
- `03-messages.png` — Messages compose + notes.
- `04-quotes.png` — Quotes compose (with attach control) + cards.
- `05-ocean-spray.png` — Event page (ocean gradient hero, fact cards, notes, RSVP).
- `06-resources.png` — Mental health resources (tap-to-call rows).
(Modal states — Create-Album and the quote media lightbox — are described in detail below; they're fixed overlays that don't screenshot cleanly.)

---

## Screens & Components

### Global shell
- **Header** (sticky, `rgba(246,239,227,.94)`, blur, 1px `#e2d6bf` bottom): left wordmark — `{name}` in Caveat 30px + "REMEMBERED" eyebrow (11px, `#a8997f`, letter-spacing .18em), clicking it goes Home. Right: desktop inline nav (≥880px) OR hamburger button (<880px, a 42px accent square with three white bars).
- **Desktop nav:** six pills (`Home · Albums · Messages · Quotes · Ocean Spray · Resources`). Active pill = accent bg / white text; others transparent / `#52483c`. *(Implementation note: do NOT put a CSS `transition` on the pill `background` — in the prototype a transition on a frequently-re-rendering button left the computed paint lagging the active state. Toggle the active style with no transition, or drive it via a class.)*
- **Mobile drawer:** tap hamburger → full-width sheet drops from top (`#f6efe3`, rounded bottom, `drawer` keyframe). Big Caveat 24px rows with an emoji + the **long** label (`Home`, `Photo Albums`, `Messages for Cali`, `Quotes by Cali`, `Ocean Spray`, `Mental Health`). Active row = accent bg/white, others `#efe6d6`/`#3a342d`. Close ✕ top-right; tap scrim to dismiss. Tap targets ~50px tall for accessibility.

### 1. Home
- **Hero** (centered flex, gap 34px): on desktop, a column of two gently-rotating polaroids on each side; a center **portrait polaroid** (white frame, `border-radius:5px`, rotated −1.5°, a little pink push-pin on top); below it "our Cali" (Caveat 26px) and a dates line (`{dates}`, default ♡) between two short rules. Under the polaroid: tagline "the funny one · the selfless one / forever ours" (Caveat 30px) and the motif row — the 發 tile image + 🧋 + 🐈.
  - The portrait is an **image slot** (drag/drop) in the prototype — in production this is Cali's chosen portrait (one image).
  - **Rotating polaroids:** decorative cards that cross-fade through a set of photos every ~3.6s (intended to pull recent images from the Immich gallery). On phones they collapse to a single centered pair below the portrait. Captions shown are placeholders ("Santa Monica", "boba run", "mahjong night", "the girls", "by the water", "her cats").
- **About Cali:** centered, max-width 660px, "about Cali" (Caveat 34px) + rule, then three Spectral paragraphs (17.5px, line-height 1.72, `#52483c`). Copy is final but editable.
- **Quick links:** responsive grid of four cards (Photo Albums, Leave a Message, Ocean Spray, Her Quotes) → jump to those sections.

### 2. Photo Albums  ← most important behavior change
Albums are **contribution spaces in Immich**, not view-only galleries. Two primary actions:
- **"add your photos"** (filled accent, primary): opens the shared **default album** so anyone can bulk-upload **without creating an album or an Immich account**. Wire to `defaultAlbumLink` (see Immich integration). In the prototype it opens that URL in a new tab (or alerts if unset).
- **"create a new album"** (outline, secondary): opens the Create-Album modal.
- Helper line under the buttons explains both, and an intro line at top: *"tap an album to open it and add your own photos. don't have one for yours? just hit 'add your photos.'"*
- **Album grid** (`repeat(auto-fill,minmax(220px,1fr))`, gap 18px): each card is an `<a target="_blank">` to the album's Immich link. 4:3 cover (Immich cover image, or a warm gradient placeholder), bottom gradient scrim, a top-right badge (`{count} photos` or `new album` when count 0), the album **name** (Caveat 24px, white), and **"tap to add your photos ↗"** beneath it. In admin mode a red ✕ (top-left) removes the card.
- **Footer note:** "everything lives in our shared photo library · open an album to add photos in bulk — you can add, never delete — so every memory stays safe."
- Behavioral intent for production: opening an album (default or created) lands the user in Immich on a link that grants **upload (add) permission but NOT delete**.

#### Create-Album modal (two steps)
- **Step 1 — Form:** title "create a new album"; explainer that after creating, they open the album to upload in bulk in the photo library (no account needed). Fields: **album name**; **one optional cover image** (single file; note: "if you skip it, we'll pick one for now. You can change it anytime" → random gradient/cover until set). Buttons: cancel / **create album**.
- **Step 2 — Success:** 📸 + "'{name}' is ready" + "Now open the album and upload your photos in bulk on the photo library — add as many as you like, all at once." Primary link **"open album to add photos ↗"** (opens the album's upload link in a new tab) and a quiet "I'll do it later" (closes). This deliberately both *instructs* and *offers the redirect*, since the family was undecided between redirect vs. instruction — it does both.
- Production: **create album** calls the Immich API to create the album + an upload-enabled share link, set the chosen cover (or leave for random/auto), then add the card to the site with its real link. The prototype fakes this (adds a local card using `defaultAlbumLink`).

### 3. Messages for Cali
- Compose card (name input + message textarea + "leave your message"). Posts instantly.
- Notes list: cards with a slight seeded rotation; text Caveat 21px, author italic. Admin ✕ removes.

### 4. Quotes by Cali
- Compose card: quote textarea + optional "when / who remembers it" + **"📎 attach a photo or video"** (optional) → shows a chip with the file name and an ✕ to clear. Helper: "attachments are saved to her quotes album · tap one later to see it." Then "add this quote."
- **Attachment behavior:** an image or video can be attached to a quote. In production the file uploads to a **default "quotes" album** in Immich; the quote stores a reference + a thumbnail.
- Quote cards (`repeat(auto-fill,minmax(260px,1fr))`): big “ mark, the quote (Caveat 24px), optional context (italic), and — if attached — a **clickable media chip** (36px thumbnail + "see the photo" / "watch the moment", a ▶ overlay for video). Clicking opens the **media lightbox** (dark scrim; image or `<video controls autoplay>`; "close" button). Admin ✕ removes the quote.

### 5. Ocean Spray (the event)
- Distinct **ocean palette** section. Hero: gradient `#dfeceb → #bcd6d2 → #9bc1bd`, eyebrow "A CELEBRATION OF HER LIFE", "Ocean Spray" (Caveat clamp 46–68px, `#27524d`), subtitle "come as you are · wear something blue 🌊".
- **Fact cards** (responsive grid): When / Where / Dress / Bring — each an icon, uppercase label, Caveat value, and a note. **Values are placeholders** (`Saturday, [date]`, `Santa Monica`, `[venue / beach spot]`, etc.) for the family to fill.
- "a few notes" card (wear ocean colors, bring a memory, "there will be boba 🧋").
- **RSVP** button (teal `#3f8079`) toggles to a confirmation ("♡ we'll see you there"). In production, wire to a real RSVP/email capture if desired.

### 6. Mental Health Resources
- Calm, supportive intro. A list of resource rows, each an `<a href>` that's **tap-to-call/text** on mobile:
  - **988 Suicide & Crisis Lifeline** — `tel:988` ("call 988")
  - **Crisis Text Line** — `sms:741741` ("text HOME → 741741")
  - **SAMHSA National Helpline** — `tel:18006624357` (1-800-662-4357)
  - **NAMI HelpLine** — `tel:18009506264` (1-800-950-6264)
- Footer: "If you are in immediate danger, please call your local emergency number. These resources are based in the United States." Keep these numbers accurate; localize if the audience isn't US-based.

---

## State & Data
Single component, `state`:
`view` ('home'|'gallery'|'messages'|'quotes'|'event'|'resources'), `menuOpen`, `admin`,
`modal` (null|'album'), `modalStep` ('form'|'done'), `createdName`, `createdLink`,
`tick` (drives rotation), `messages[]`, `quotes[]`, `albums[]`, `coverDraft` (data URL),
`quoteAttach` ({type,name,src,thumb}), `viewMedia`, `rsvped`.

**Shapes**
```
album   = { id, name, count, cover /* CSS gradient placeholder */, img /* cover dataURL|null */, link /* Immich URL */ }
message = { id, text, author, ts }
quote   = { id, text, ctx, media: { type:'image'|'video', name, src, thumb }|null, ts }
```
**Prototype persistence:** `localStorage` key `cali_memorial_v1` = `{ messages, quotes, albums }`.
Images stored as compressed JPEG data URLs; video attachments use a session object URL (don't
persist) + a poster thumbnail. **Replace all of this with backend + Immich in production.**

## Design Tokens
**Fonts:** `Caveat` (handwriting; headings, labels, captions) + `Spectral` (serif; body). Google Fonts. Fallback Georgia/serif.
**Color**
| Role | Value |
|---|---|
| Page bg | `#f3ead9` + faint radial-dot texture |
| Accent (default) | `#c2724f` — options `#c2724f`, `#b5704f`, `#3f8079`, `#a87090`, `#9a8e79` |
| Accent soft | `#f0e2d2` |
| Cards | `#fffdf8`; card border `#ece1cb`; modal `#f7f2e9` |
| Text | primary `#3a342d`, body `#52483c`, muted `#6f665a`, faint `#9a8e79`/`#a8997f` |
| Header | `rgba(246,239,227,.94)` + blur; border `#e2d6bf` |
| Ocean (event) | hero `#dfeceb→#bcd6d2→#9bc1bd`; ink `#27524d`/`#3f6f6a`; RSVP `#3f8079` |
| Admin / remove | `#b23b2e` |
**Radii:** cards 14–16px · pills/buttons 20–26px · modals 18px · album cover 14px.
**Shadows:** card `0 5–7px 14–18px rgba(60,40,20,.08–.13)`; modal `0 24px 60px rgba(0,0,0,.4)`.
**Motion:** `fadein` (.22s) modals/lightbox; `xfade` (.9s) rotating polaroids; `drawer` (.22s) mobile menu; quick-link hover lift.
**Responsive:** mobile-first; the only media query (≥880px) swaps hamburger↔inline-nav and shows the hero's flanking polaroids. Everything else uses fluid/`clamp` sizing.
**Tweakable props:** `name` (default "Cali"), `dates` (default ♡), `accent` (5 options), `defaultAlbumLink` (the shared "add your photos" Immich album URL).

## Immich integration (the core of v2)
Goal: let people contribute photos via Immich **without giving them Immich accounts**, using the
Immich API + share/upload links. Map the prototype's stubs to real calls:
- **`defaultAlbumLink`** → a standing shared album with **upload enabled**; the "add your photos" button and (for now) new albums point here. In production each created album gets its own upload link.
- **Create album** → Immich API: create album → create an upload-enabled share link → set cover (chosen image, else random/auto) → return the link; render the card.
- **Album cards / "add your photos"** → open the Immich upload link (decide: new tab — current default — vs. in-app embed). Permissions: **add only, never delete.**
- **Home rotating polaroids** → pull a handful of recent assets from the gallery for the cross-fade.
- **Quote attachments** → upload to a default **"quotes" album**; store the asset reference + thumbnail on the quote; the media lightbox plays/show it.
The repo already has Immich import wired, so credentials/host config should exist to build on.

## Assets
- `uploads/pasted-1781680678465-0.png` — green 發 mahjong tile, transparent bg, 512×512 (Home motif row). Personal to Cali.
- Emoji used inline: 🧋 🐈 🌊 + nav/section icons. Swap for an icon set if your system prefers.
- Cali's portrait and all album/photo imagery come from users/Immich at runtime — no static photo assets.

## Files
- `PROMPT.md` — paste-in kickoff brief.
- `Remembering Cali.dc.html` — full design + logic (read as spec).
- `support.js` — prototype runtime (reference only; not for production).
- `image-slot.js` — the drag-drop placeholder used for the Home portrait (reference only).
- `uploads/pasted-1781680678465-0.png` — mahjong tile asset.
- `screenshots/` — the six section reference images.

## Production notes
- **Backend:** persist messages, quotes, albums, RSVPs in the existing DB; replace `localStorage`. Photos/cover images live in Immich/object storage, not as base64.
- **Admin/auth:** the 🔒 toggle is a stub — gate remove/create behind real admin auth.
- **Moderation:** posting is currently instant. If the family wants review, add `status: pending|approved` and hide pending from public views (structure supports adding this).
- **Video attachments:** session-only in the prototype; in production they upload to the quotes album and stream from there.
- **Accessibility:** keep large tap targets, add alt text/labels, focus states, and keyboard nav for the drawer, modals, and lightbox. Ensure tap-to-call links work on mobile.
- **Naming:** section labels are placeholders — make them configurable.
