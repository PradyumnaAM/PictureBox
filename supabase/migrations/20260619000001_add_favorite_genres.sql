-- Add favorite_genres column to profiles (missing from initial schema)
alter table public.profiles
  add column if not exists favorite_genres jsonb not null default '[]'::jsonb;
