
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress',
  current_step int not null default 0,
  awaiting text not null default 'core', -- 'core' | 'followup'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null, -- 'assistant' | 'user'
  kind text not null, -- 'core' | 'followup' | 'answer'
  step int not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.interview_messages (interview_id, created_at);

create table public.blueprints (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_slug text not null unique default replace(gen_random_uuid()::text,'-',''),
  title text not null default 'your signature story',
  sections jsonb not null, -- [{key,title,body}]
  created_at timestamptz not null default now()
);
create index on public.blueprints (user_id, created_at desc);

alter table public.interviews enable row level security;
alter table public.interview_messages enable row level security;
alter table public.blueprints enable row level security;

-- interviews
create policy "owner read interviews" on public.interviews for select using (auth.uid() = user_id);
create policy "owner insert interviews" on public.interviews for insert with check (auth.uid() = user_id);
create policy "owner update interviews" on public.interviews for update using (auth.uid() = user_id);
create policy "owner delete interviews" on public.interviews for delete using (auth.uid() = user_id);

-- messages
create policy "owner read messages" on public.interview_messages for select using (auth.uid() = user_id);
create policy "owner insert messages" on public.interview_messages for insert with check (auth.uid() = user_id);
create policy "owner delete messages" on public.interview_messages for delete using (auth.uid() = user_id);

-- blueprints: owner full control + public read by share link
create policy "owner read blueprints" on public.blueprints for select using (auth.uid() = user_id);
create policy "public read blueprints by link" on public.blueprints for select using (true);
create policy "owner insert blueprints" on public.blueprints for insert with check (auth.uid() = user_id);
create policy "owner update blueprints" on public.blueprints for update using (auth.uid() = user_id);
create policy "owner delete blueprints" on public.blueprints for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_interviews_updated before update on public.interviews
for each row execute function public.set_updated_at();
