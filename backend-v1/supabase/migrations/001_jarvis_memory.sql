create table if not exists public.jarvis_memory (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists jarvis_memory_session_created_idx
  on public.jarvis_memory (session_id, created_at desc);

-- The Edge Function uses the server-side secret key.
-- Keep this table protected from public Data API access.
alter table public.jarvis_memory enable row level security;
