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
- Audio is generated via the ElevenLabs API.
- The ElevenLabs API key is not included at build time — the app should have a place to enter/store the key later, and the Listen button should call the API once a key is provided.

### 4. Storage
- No login or account is required; the app works immediately for any visitor.
- The one-paragraph article (and likely its translation) is saved to the browser's local storage.
- Local storage is a temporary/interim solution. The data model should be simple enough to later swap for an online database (e.g., Supabase) without much rework.

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

## Open Questions (to resolve during design/build)
- **API key storage**: the ElevenLabs key and the Anthropic (Claude) key — should
  they be saved in local storage for convenience, understanding they'd then be
  visible to anyone with access to that browser? (The Anthropic key is also used
  server-side inside the Supabase Edge Function, where it's safe from the browser
  entirely — only the ElevenLabs key, used client-side for audio, faces this
  tradeoff directly.)
- **Article history**: does the app only ever hold one article at a time, or should past articles be kept in local storage as a small archive?

## Out of Scope (for now)
- User accounts / login
- Persistent server-side database (planned for later via Supabase)
- Multiple simultaneous articles or categories
