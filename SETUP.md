# German Reading — Setup Guide

The app itself is [index.html](index.html). It's already connected to the
Supabase project and needs no per-device setup — open it in any browser, on
any computer or phone, and it works. This guide is for deploying/updating the
backend functions, not for everyday use.

## What you'll need

- A [Supabase](https://supabase.com) account (already set up).
- An [Anthropic Console](https://console.anthropic.com) API key (already set up).
- An [ElevenLabs](https://elevenlabs.io) account and API key, once you're
  ready to make the Listen button work.

## One-time backend setup

All done through the Supabase dashboard — no command line needed.

1. **Secrets.** In your Supabase project, go to **Edge Functions → Secrets**
   and make sure these exist (names must match exactly, all uppercase):
   - `ANTHROPIC_API_KEY` — your Anthropic key (starts with `sk-ant-`)
   - `ELEVENLABS_API_KEY` — your ElevenLabs key, once you have one

2. **Functions.** Create three functions under **Edge Functions**, each
   named exactly as shown, pasting in the matching file's contents:
   - `get-article` → [supabase/functions/get-article/index.ts](supabase/functions/get-article/index.ts)
   - `translate` → [supabase/functions/translate/index.ts](supabase/functions/translate/index.ts)
   - `speak` → [supabase/functions/speak/index.ts](supabase/functions/speak/index.ts)

   `speak` will return errors until `ELEVENLABS_API_KEY` is set — that's
   expected until you've signed up for ElevenLabs.

That's it. The app's Project URL and anon key are already written into
`index.html` directly (see "Why these are safe to bake in" below), so there's
nothing to paste into the app itself, on any device.

## Why these are safe to bake in

Supabase's "anon public" key is designed to be visible in client-side code —
that's what "public" means here. It doesn't grant access to anything by
itself; Supabase's own permission rules (not secrecy of this key) control
what it can do, and this app doesn't use the database at all yet. The
Anthropic and ElevenLabs keys are different — genuinely private — which is
why those stay as server-side secrets inside the Edge Functions, never sent
to any browser.

## Updating a function's code later

Open it in the Edge Functions section of the dashboard, paste in the new
version, and deploy again. If you ever change your Supabase project (new
project, new anon key), update the two constants near the top of the
`<script>` block in `index.html` to match.

## Notes

- DW's exact RSS feed path occasionally changes. If articles stop coming from
  DW specifically, check [rss.dw.com](https://rss.dw.com) for the current feed
  URL and update it in `supabase/functions/get-article/index.ts`, then
  redeploy that function.
- If a secret's name has a typo (wrong case, extra characters), the affected
  function will return a clear error naming the missing secret — the app
  shows this error message directly rather than a generic failure.
