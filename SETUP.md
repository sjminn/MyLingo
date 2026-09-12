# German Reading — Setup Guide

The app itself is [index.html](index.html) — you can open that file directly in
a browser right now. It'll show placeholders until the two small backend
functions below are deployed, because fetching real news and calling Claude
has to happen on a server, not in the browser (see requirements.md for why).

This is a one-time setup. After it's done, you'll paste two things into the
app's Settings panel and it works from then on.

## What you'll need

- A free [Supabase](https://supabase.com) account.
- A free [Anthropic Console](https://console.anthropic.com) account, with an
  API key (this is separate from your Claude.ai login).
- The [Supabase CLI](https://supabase.com/docs/guides/cli) installed on your
  computer. On Windows, the easiest way is usually:
  ```bash
  npx supabase --version
  ```
  (running any `supabase` command through `npx` downloads it on first use —
  no separate install needed).

## Steps

1. **Create a Supabase project.** In the Supabase dashboard, click "New
   project" and give it any name (e.g. "german-reading").

2. **Link this folder to that project.** From inside the `german-reading`
   folder, run:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   ```
   Your project ref is in the Supabase dashboard URL
   (`supabase.com/dashboard/project/YOUR-PROJECT-REF`).

3. **Store your Anthropic key as a secret** (this keeps it off the browser
   entirely — it only lives on Supabase's servers):
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

4. **Deploy both functions:**
   ```bash
   npx supabase functions deploy get-article --no-verify-jwt
   npx supabase functions deploy translate --no-verify-jwt
   ```
   (`--no-verify-jwt` means the app doesn't need to send a Supabase login
   token to call these — fine for a personal project like this.)

5. **Find your Edge Functions URL.** It follows this pattern:
   ```
   https://YOUR-PROJECT-REF.functions.supabase.co
   ```

6. **Open the app, click Settings, and paste in:**
   - **Supabase Edge Functions URL** — from step 5.
   - **ElevenLabs API key** — from your ElevenLabs account, for the Listen
     button. (Leave the anon key field blank; it's not needed with
     `--no-verify-jwt`.)

7. Click **New Article**. If something goes wrong, the app will show a short
   error message — the most common cause is a typo in the Functions URL, or
   the `ANTHROPIC_API_KEY` secret not being set yet.

## Notes

- DW's exact RSS feed path occasionally changes. If articles stop coming from
  DW specifically, check [rss.dw.com](https://rss.dw.com) for the current feed
  URL and update it in `supabase/functions/get-article/index.ts`.
- Re-deploying after any code edit just means re-running the `deploy` command
  from step 4 for whichever function you changed.
