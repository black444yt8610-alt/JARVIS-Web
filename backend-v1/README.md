# JARVIS AI Backend V1

Serverless backend using Supabase Edge Functions + Supabase Postgres + Gemini API.

## Flow

Browser -> Supabase Edge Function -> Gemini
                         |
                         -> jarvis_memory table

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_jarvis_memory.sql` in the Supabase SQL Editor.
3. Create an Edge Function named `jarvis` and deploy `supabase/functions/jarvis/index.ts`.
4. In Edge Function secrets, set:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.5-flash`
5. Your frontend endpoint becomes:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`

Do not put the Gemini key in GitHub Pages or `app.js`.

Authentication is intentionally optional in V1. The browser creates a random session ID and the backend uses it to partition memory. Add Supabase Auth + JWT/RLS ownership checks before treating this as a production multi-user memory system.
