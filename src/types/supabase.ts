export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          country_code: string | null
          streaming_services: Json
          spoiler_free_mode: boolean
          profile_public: boolean
          favorite_genres: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          country_code?: string | null
          streaming_services?: Json
          spoiler_free_mode?: boolean
          profile_public?: boolean
          favorite_genres?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          country_code?: string | null
          streaming_services?: Json
          spoiler_free_mode?: boolean
          profile_public?: boolean
          favorite_genres?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      titles: {
        Row: {
          id: string
          tmdb_id: number
          media_type: string
          title: string
          original_title: string | null
          overview: string | null
          poster_path: string | null
          backdrop_path: string | null
          release_date: string | null
          runtime: number | null
          status: string | null
          genres: Json
          cast_crew: Json
          watch_providers: Json
          tmdb_rating: number | null
          tmdb_vote_count: number | null
          tmdb_synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tmdb_id: number
          media_type: string
          title: string
          original_title?: string | null
          overview?: string | null
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          runtime?: number | null
          status?: string | null
          genres?: Json
          cast_crew?: Json
          watch_providers?: Json
          tmdb_rating?: number | null
          tmdb_vote_count?: number | null
          tmdb_synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          tmdb_id?: number
          media_type?: string
          title?: string
          original_title?: string | null
          overview?: string | null
          poster_path?: string | null
          backdrop_path?: string | null
          release_date?: string | null
          runtime?: number | null
          status?: string | null
          genres?: Json
          cast_crew?: Json
          watch_providers?: Json
          tmdb_rating?: number | null
          tmdb_vote_count?: number | null
          tmdb_synced_at?: string
          created_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          id: string
          title_id: string
          tmdb_season_id: number | null
          season_number: number
          name: string | null
          overview: string | null
          poster_path: string | null
          air_date: string | null
          episode_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title_id: string
          tmdb_season_id?: number | null
          season_number: number
          name?: string | null
          overview?: string | null
          poster_path?: string | null
          air_date?: string | null
          episode_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title_id?: string
          tmdb_season_id?: number | null
          season_number?: number
          name?: string | null
          overview?: string | null
          poster_path?: string | null
          air_date?: string | null
          episode_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          id: string
          season_id: string
          tmdb_episode_id: number | null
          episode_number: number
          name: string | null
          overview: string | null
          still_path: string | null
          air_date: string | null
          runtime: number | null
          created_at: string
        }
        Insert: {
          id?: string
          season_id: string
          tmdb_episode_id?: number | null
          episode_number: number
          name?: string | null
          overview?: string | null
          still_path?: string | null
          air_date?: string | null
          runtime?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          tmdb_episode_id?: number | null
          episode_number?: number
          name?: string | null
          overview?: string | null
          still_path?: string | null
          air_date?: string | null
          runtime?: number | null
          created_at?: string
        }
        Relationships: []
      }
      user_logs: {
        Row: {
          id: string
          user_id: string
          title_id: string
          season_id: string | null
          episode_id: string | null
          log_type: string
          status: string
          rating: number | null
          review: string | null
          contains_spoilers: boolean
          watched_at: string | null
          rewatch: boolean
          rewatch_count: number
          liked: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title_id: string
          season_id?: string | null
          episode_id?: string | null
          log_type: string
          status: string
          rating?: number | null
          review?: string | null
          contains_spoilers?: boolean
          watched_at?: string | null
          rewatch?: boolean
          rewatch_count?: number
          liked?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title_id?: string
          season_id?: string | null
          episode_id?: string | null
          log_type?: string
          status?: string
          rating?: number | null
          review?: string | null
          contains_spoilers?: boolean
          watched_at?: string | null
          rewatch?: boolean
          rewatch_count?: number
          liked?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      lists: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          is_public: boolean
          is_ranked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          is_public?: boolean
          is_ranked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          is_public?: boolean
          is_ranked?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          title_id: string
          position: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title_id: string
          position?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title_id?: string
          position?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      group_watchlists: {
        Row: {
          id: string
          name: string
          created_by: string
          invite_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          invite_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: []
      }
      group_items: {
        Row: {
          id: string
          group_id: string
          title_id: string
          added_by: string | null
          vote_count: number
          watched: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title_id: string
          added_by?: string | null
          vote_count?: number
          watched?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title_id?: string
          added_by?: string | null
          vote_count?: number
          watched?: boolean
          created_at?: string
        }
        Relationships: []
      }
      group_votes: {
        Row: {
          id: string
          group_item_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_item_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_item_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: {
          total_movies: number
          total_tv_shows: number
          total_episodes: number
          total_hours: number
          movies_this_year: number
          episodes_this_year: number
          favourite_genres: string[]
          favourite_directors: string[]
        }[]
      }
      increment_vote: {
        Args: { item_id: string; delta: number }
        Returns: number
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
