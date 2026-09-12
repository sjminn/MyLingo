# German Reading — Setup Guide

The app itself is [index.html](index.html) — you can open that file directly in
a browser right now. It'll show placeholders until the two small backend
functions below are deployed, because fetching real news and calling Claude
has to happen on a server, not in the browser (see requirements.md for why).

This is a one-time setup, done entirely through the Supabase website — no
command line or software installs needed. After it's done, you'll paste two
things into the app's Settings panel and it works from then on.

## What you'll need

- A free [Supabase](https://supabase.com) account.
- A free [Anthropic Console](https://console.anthropic.com) account, with an
  API key (this is separate from your Claude.ai login).

## Steps

1. **Create a Supabase project.** In the Supabase dashboard, click "New
   project" and give it any name (e.g. "german-reading").

2. **Copy your Project URL and anon key.** In the project, go to
   **Project Settings → API**. You'll need two values from this page:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

3. **Store your Anthropic key as a secret.** Go to **Edge Functions** in the
   left sidebar, then find the **Secrets** tab. Add a new secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (starts with `sk-ant-`)

   This keeps the key on Supabase's servers — it never touches the browser.

4. **Create the first function.** Still in **Edge Functions**, click
   **Deploy a new function** (or **Create a function**). Name it exactly:
   ```
   get-article
   ```
   Open [supabase/functions/get-article/index.ts](supabase/functions/get-article/index.ts)
   in this project, copy its entire contents, and paste them into the code
   editor Supabase gives you. Deploy it.

5. **Create the second function** the same way, named exactly:
   ```
   translate
   ```
   using the contents of [supabase/functions/translate/index.ts](supabase/functions/translate/index.ts).

6. **Open the app, click Settings, and paste in:**
   - **Supabase Edge Functions URL** — your Project URL from step 2, with
     `/functions/v1` added to the end, e.g.
     `https://abcdefgh.supabase.co/functions/v1`
   - **Supabase anon key** — the anon public key from step 2. (Supabase
     functions expect this by default, so fill this in rather than leaving
     it blank.)
   - **ElevenLabs API key** — from your ElevenLabs account, for the Listen
     button.

7. Click **New Article**. If something goes wrong, the app will show a short
   error message — the most common causes are a typo in the Functions URL, a
   missing anon key, or the `ANTHROPIC_API_KEY` secret not being set yet.

## Notes

- DW's exact RSS feed path occasionally changes. If articles stop coming from
  DW specifically, check [rss.dw.com](https://rss.dw.com) for the current feed
  URL, update it in `supabase/functions/get-article/index.ts`, then paste the
  updated code into that function in the dashboard and re-deploy.
- To update a function's code later, open it in the Edge Functions section of
  the dashboard, paste in the new version, and deploy again.
