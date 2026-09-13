# German Reading — Requirements

## Overview
"German Reading" is a single-page web app for practicing German reading comprehension. It shows a short German news article, lets the user translate it into English on demand, and lets the user listen to the German audio on demand.

## Core Features

### 1. Article Display
- On request, the app fetches a one-paragraph summary of a single news event, sourced from German news outlets (Tagesschau, Zeit Online, Spiegel Online, DW/Deutsche Welle).
- The German article text is displayed in its own window/panel on the page.

### 2. Translation
- A second window/panel is reserved for the English translation.
- The translation panel stays empty until the user clicks the **Translate** button.
- Clicking **Translate** translates the currently displayed German article into English and shows it in the second panel.

### 3. Listen (Text-to-Speech)
- A **Listen** button plays the German article aloud.
- Audio is generated via the ElevenLabs API, called through a Supabase Edge
  Function (`speak`) that holds the ElevenLabs key server-side — see "API key
  storage" below.

### 4. Storage
- No login or account is required; the app works immediately for any visitor.
- The **current** article (whatever's on screen) is kept in the browser's
  local storage, so reopening the app shows the last article you had up.
- **Saved** articles — ones you deliberately click "Save" on — go into a real
  Supabase database table instead, so they persist across devices and
  browsers, not just the one that saved them. See "Saved Articles" below.

### 5. Saved Articles
- A **Save** button under each article adds it to a `saved_articles` table in
  Supabase (via Supabase's REST API directly, no Edge Function needed for
  this part).
- A **Saved** panel (toggled from the header) lists everything saved, newest
  first, each with an **Open** button (loads it back into the main view) and
  a **Remove** button (deletes it from the table).
- Because the app has no login, this list is shared with anyone who has the
  site's URL — same openness tradeoff as the rest of the app, now extended to
  whatever gets saved. See "API Key Storage" below for the same idea applied
  to the database's access rules.

## Technical Constraints
- The main app is a **single HTML file** (HTML, CSS, and JavaScript all together).
- One small piece of the system lives outside that file: a lightweight serverless
  function that fetches news on the app's behalf (see "News Source" below). Browsers
  block a webpage's own JavaScript from directly reading another site's raw HTML/RSS
  (a security rule called CORS), so a truly automatic "pick a live article" feature
  needs this small helper. Everything the user interacts with is still the one HTML
  file — the helper function is invisible plumbing behind a single button.
- Beyond that helper function, the app runs client-side, calling out to:
  1. The news-fetching helper function (see below).
  2. An LLM API for translation (and possibly for summarizing, inside the helper).
  3. ElevenLabs text-to-speech (once an API key is supplied).
- Must work without any user authentication.

## News Source (decided)
- A small serverless function — a **Supabase Edge Function** — fetches RSS feeds
  from Tagesschau, Zeit Online, Spiegel Online, and DW (Deutsche Welle, at
  rss.dw.com), picks one item at random, and summarizes it into one German
  paragraph using an LLM API.
- Using Supabase for this (rather than a separate platform like Cloudflare) means
  the news-fetching function and the future article database live in the same
  place, under one account. The function can eventually write each new article
  straight into the Supabase database instead of just returning it to the page.
- The single HTML file calls this function when the user requests a new article
  and displays whatever paragraph comes back.
- **Claude (Anthropic API)** does the summarizing inside this function.

## Translation (decided)
- **Claude (Anthropic API)** also handles the German → English translation,
  called when the user clicks Translate. Same API key as the summarizer above,
  so there's one Anthropic key to manage instead of two separate services.

## API Key Storage (decided)
- Neither the Anthropic key nor the ElevenLabs key is ever stored in the
  browser, or entered by the user at all. Both live as server-side secrets on
  Supabase, used only inside the three Edge Functions (`get-article`,
  `translate`, `speak`). This also means the app needs zero per-device setup —
  it works identically on any computer or phone the moment you open it.
- The Supabase Project URL and "anon public" key **are** written directly into
  `index.html`. This is safe: an anon key is specifically designed to be
  visible in client-side code (Supabase's access rules, not secrecy of this
  key, control what it can do), unlike the Anthropic and ElevenLabs keys,
  which are genuinely private and must never appear in the page source.

## Out of Scope (for now)
- User accounts / login
- Per-user saved lists (everyone currently shares one list, since there's no login)
- Multiple simultaneous articles or categories
