# PictureBox — AI Build Instructions

## What this app is
PictureBox is a film + TV unified social tracker. Think Letterboxd but with proper TV show tracking (season/episode level), free stats for all users, spoiler-free mode, streaming availability filters, and group watchlists. Built for cinephiles who are frustrated that Letterboxd doesn't do TV properly.

## Tech stack
- Framework: Next.js 15 (App Router, TypeScript)
- Styling: Tailwind CSS + shadcn/ui components
- Database + Auth: Supabase (PostgreSQL, Row Level Security)
- Film/TV data: TMDB API (The Movie Database)
- Email: Resend
- Hosting: Vercel
- AI recommendations: Anthropic Codex API (Codex-sonnet-4-20250514)

## Key rules when writing code
1. ALWAYS use TypeScript — no plain JS files
2. ALWAYS use Row Level Security (RLS) on every Supabase table
3. NEVER store API keys in code — use environment variables
4. ALWAYS handle loading and error states in every component
5. ALWAYS make components mobile-first (responsive)
6. ALWAYS cache TMDB API responses in Supabase to avoid rate limits
7. Use server components by default, client components only when needed (interactivity)
8. Every page must have proper meta tags (title, description, og:image) for SEO

## Environment variables needed
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TMDB_API_KEY=
TMDB_READ_ACCESS_TOKEN=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=

## Database naming conventions
- Tables: snake_case plural (users, film_logs, tv_logs)
- Always include created_at and updated_at timestamps
- Always include soft deletes (deleted_at nullable) on user content tables
- Foreign keys: [table_singular]_id (user_id, title_id)

## File structure
src/
  app/          — Next.js App Router pages
  components/   — Reusable UI components
  lib/          — Utilities, API clients, helpers
  types/        — TypeScript type definitions
  hooks/        — Custom React hooks

## When I say "build X", always:
1. Create the Supabase migration SQL first
2. Create TypeScript types
3. Build the server-side data fetching
4. Build the UI component
5. Add error handling and loading states
6. Make it mobile responsive
