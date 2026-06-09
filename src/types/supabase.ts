/**
 * Placeholder Supabase Database type.
 *
 * This is a shell that lets the typed Supabase clients compile before any
 * migrations exist. Once the schema is in place, regenerate this file with:
 *
 *   npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
 *
 * Until then, tables are intentionally empty and queries are loosely typed.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
