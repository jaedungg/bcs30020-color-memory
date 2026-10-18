-- BCS.30020 Color Memory & Verbal Labeling
-- Run this once in Supabase Dashboard > SQL Editor.

create table if not exists public.experiment_trials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  row_key text not null unique,
  session_id text not null,
  participant_id text not null,
  language_version text not null,
  run_mode text,
  demo_version text,
  session_date date,

  block integer,
  trial_number integer not null,
  is_practice boolean not null default false,

  condition text,
  condition_label text,

  target_id text,
  target_category text,
  target_hue_deg double precision,
  jitter_deg double precision,

  cue_word text,
  label_category text,
  label_prototype_deg double precision,
  label_direction text,

  wheel_rotation_deg double precision,
  response_hue_deg double precision,
  signed_error_deg double precision,
  abs_error_deg double precision,
  error_toward_label_deg double precision,
  rt_ms double precision,
  timed_out boolean,
  articulation_ok boolean,

  client_saved_at timestamptz
);

create index if not exists experiment_trials_participant_idx
  on public.experiment_trials (participant_id);

create index if not exists experiment_trials_session_idx
  on public.experiment_trials (session_id);

create index if not exists experiment_trials_condition_idx
  on public.experiment_trials (condition);

-- Browser clients should not access this table directly.
alter table public.experiment_trials enable row level security;

revoke all on table public.experiment_trials from anon, authenticated;
grant select, insert, update, delete on table public.experiment_trials to service_role;

comment on table public.experiment_trials is
  'Trial-level results for the BCS.30020 color-memory verbal-labeling experiment.';
