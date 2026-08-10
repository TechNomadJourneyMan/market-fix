-- Market Fix Admin Platform schema (P0)
-- RBAC, audit, unified reviews analysis, rating snapshots, moderation cases

-- ---------------------------------------------------------------------------
-- RBAC
-- ---------------------------------------------------------------------------
create table if not exists public.permissions (
  code text primary key,
  description text not null,
  group_name text not null
);

create table if not exists public.roles (
  id text primary key,
  name text not null,
  description text not null
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles (id) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  primary key (role_id, permission_code)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id text not null references public.roles (id) on delete cascade,
  organization_id text,
  assigned_by uuid references auth.users (id),
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_roles_user_idx on public.user_roles (user_id);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  object_type text not null,
  object_id text not null,
  object_label text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  source text not null check (source in ('manual', 'ai', 'system')),
  ip text,
  user_agent text,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audit_logs_timestamp_idx on public.audit_logs (timestamp desc);
create index if not exists audit_logs_object_idx on public.audit_logs (object_type, object_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

-- ---------------------------------------------------------------------------
-- Review analysis + moderation
-- ---------------------------------------------------------------------------
create table if not exists public.review_analyses (
  id uuid primary key default gen_random_uuid(),
  review_id text not null,
  authenticity numeric not null,
  spam numeric not null,
  bot_probability numeric not null,
  relevance numeric not null,
  helpfulness numeric not null,
  objectivity numeric not null,
  toxicity numeric not null,
  manipulation numeric not null,
  duplicate_score numeric not null,
  ai_generated_probability numeric not null,
  sentiment text not null,
  topics jsonb not null default '[]'::jsonb,
  risk_score numeric not null,
  moderation_level text not null,
  ai_reasoning_summary text not null,
  moderation_version text not null,
  confidence numeric not null,
  language text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_analyses_review_idx on public.review_analyses (review_id);

create table if not exists public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  review_id text not null,
  venue_id text not null,
  status text not null check (status in ('open', 'resolved', 'escalated')),
  ai_level text not null,
  final_level text not null,
  decision_source text not null check (decision_source in ('ai', 'human')),
  assigned_to text,
  resolved_by text,
  resolved_at timestamptz,
  override_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_cases_status_idx on public.moderation_cases (status);
create index if not exists moderation_cases_venue_idx on public.moderation_cases (venue_id);

create table if not exists public.fraud_signals (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('review', 'user', 'venue')),
  subject_id text not null,
  score numeric not null,
  signals jsonb not null default '[]'::jsonb,
  status text not null check (status in ('open', 'dismissed', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rating engine snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.rating_snapshots (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null,
  raw_score numeric not null,
  ai_interpretation numeric not null,
  scoring numeric not null,
  editorial_override numeric not null default 0,
  final_score numeric not null,
  factors jsonb not null default '[]'::jsonb,
  confidence text not null,
  explanation text not null,
  review_count_used integer not null default 0,
  version text not null,
  computed_at timestamptz not null default now(),
  override_reason text,
  overridden_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rating_snapshots_venue_idx on public.rating_snapshots (venue_id, computed_at desc);

create table if not exists public.editorial_rating_overrides (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null,
  delta numeric not null,
  reason text not null,
  expires_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Knowledge base (P1-ready skeleton)
-- ---------------------------------------------------------------------------
create table if not exists public.knowledge_base_entries (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  category text not null,
  value jsonb not null,
  active_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_base_versions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.knowledge_base_entries (id) on delete cascade,
  version integer not null,
  old_value jsonb,
  new_value jsonb not null,
  changed_by text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (entry_id, version)
);

-- ---------------------------------------------------------------------------
-- Analytics events
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);

-- ---------------------------------------------------------------------------
-- Extend profiles trust score
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists trust_score numeric default 50,
  add column if not exists is_blocked boolean default false,
  add column if not exists block_reason text;
