-- Session-level consent and post-task questionnaire data.
-- Run this once in Supabase Dashboard > SQL Editor.

create table if not exists public.experiment_sessions (
  session_id text primary key,
  participant_id text not null,
  language_version text not null,
  run_mode text,
  consent_given boolean not null,
  consented_at timestamptz not null,

  ba_compliance integer not null check (ba_compliance between 1 and 5),
  cue_compliance integer not null check (cue_compliance between 1 and 5),
  self_labeling_frequency integer not null check (self_labeling_frequency between 1 and 5),
  perceived_word_influence integer not null check (perceived_word_influence between 1 and 5),

  memory_strategy text not null check (
    memory_strategy in ('visual_appearance', 'verbal_label', 'word_comparison', 'no_strategy', 'other')
  ),
  memory_strategy_other text,

  color_difficulty boolean not null,
  color_difficulty_text text,

  technical_issue boolean not null,
  technical_issue_text text,

  guessed_study_purpose text,

  completed boolean not null default false,
  survey_submitted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists experiment_sessions_participant_idx
  on public.experiment_sessions (participant_id);

-- Browser clients should not access this table directly.
alter table public.experiment_sessions enable row level security;

revoke all on table public.experiment_sessions from anon, authenticated;
grant select, insert, update, delete on table public.experiment_sessions to service_role;

comment on table public.experiment_sessions is
  'Session-level consent and questionnaire data for the BCS.30020 color-memory experiment.';
