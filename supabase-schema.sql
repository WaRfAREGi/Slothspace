-- Run this in the Supabase SQL editor before enabling SlothSpace sync.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  task_index integer not null default 0,
  task_done boolean not null default false,
  volume integer not null default 32,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read their own SlothSpace preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own SlothSpace preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own SlothSpace preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
