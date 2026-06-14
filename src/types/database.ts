export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          hours_available: number;
          onboarding_completed_at: string | null;
          city: string | null;
          region: string | null;
          state: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          location_updated_at: string | null;
          username: string | null;
          avatar_url: string | null;
          profile_setup_completed_at: string | null;
          mfa_enabled: boolean;
          show_public_profile: boolean;
          show_rating: boolean;
          show_history: boolean;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          hours_available?: number;
          onboarding_completed_at?: string | null;
          city?: string | null;
          region?: string | null;
          state?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_updated_at?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          profile_setup_completed_at?: string | null;
          mfa_enabled?: boolean;
          show_public_profile?: boolean;
          show_rating?: boolean;
          show_history?: boolean;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          hours_available?: number;
          onboarding_completed_at?: string | null;
          city?: string | null;
          region?: string | null;
          state?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_updated_at?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          profile_setup_completed_at?: string | null;
          mfa_enabled?: boolean;
          show_public_profile?: boolean;
          show_rating?: boolean;
          show_history?: boolean;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          post_type: "needs" | "offers";
          hours_cost: number;
          status: "active" | "closed" | "archived";
          city: string | null;
          region: string | null;
          state: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          exchange_format: "in_person" | "remote" | "flexible";
          meeting_preference: "public_venue" | "remote_only" | "flexible";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          post_type: "needs" | "offers";
          hours_cost?: number;
          status?: "active" | "closed" | "archived";
          city?: string | null;
          region?: string | null;
          state?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          exchange_format?: "in_person" | "remote" | "flexible";
          meeting_preference?: "public_venue" | "remote_only" | "flexible";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          post_type?: "needs" | "offers";
          hours_cost?: number;
          status?: "active" | "closed" | "archived";
          city?: string | null;
          region?: string | null;
          state?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          exchange_format?: "in_person" | "remote" | "flexible";
          meeting_preference?: "public_venue" | "remote_only" | "flexible";
          created_at?: string;
          updated_at?: string;
        };
      };
      exchanges: {
        Row: {
          id: string;
          post_id: string;
          poster_id: string;
          acceptor_id: string;
          title: string;
          category: string;
          post_type: "needs" | "offers";
          hours: number;
          status: "pending" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          exchange_format: "in_person" | "remote" | null;
          poster_confirmed_at: string | null;
          acceptor_confirmed_at: string | null;
          hours_settled: boolean;
        };
        Insert: {
          id?: string;
          post_id: string;
          poster_id: string;
          acceptor_id: string;
          title: string;
          category: string;
          post_type: "needs" | "offers";
          hours: number;
          status?: "pending" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          exchange_format?: "in_person" | "remote" | null;
          poster_confirmed_at?: string | null;
          acceptor_confirmed_at?: string | null;
          hours_settled?: boolean;
        };
        Update: {
          id?: string;
          post_id?: string;
          poster_id?: string;
          acceptor_id?: string;
          title?: string;
          category?: string;
          post_type?: "needs" | "offers";
          hours?: number;
          status?: "pending" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          exchange_format?: "in_person" | "remote" | null;
          poster_confirmed_at?: string | null;
          acceptor_confirmed_at?: string | null;
          hours_settled?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_verify_key: {
        Args: { p_key: string };
        Returns: boolean;
      };
      admin_list_profiles: {
        Args: { p_key: string };
        Returns: AdminProfile[];
      };
      admin_list_posts: {
        Args: { p_key: string };
        Returns: AdminPost[];
      };
      admin_update_post_status: {
        Args: { p_key: string; p_post_id: string; p_status: string };
        Returns: void;
      };
      admin_update_profile: {
        Args: {
          p_key: string;
          p_user_id: string;
          p_full_name?: string | null;
          p_email?: string | null;
          p_hours_available?: number | null;
        };
        Returns: void;
      };
      admin_delete_user: {
        Args: { p_key: string; p_user_id: string };
        Returns: void;
      };
      admin_update_post: {
        Args: {
          p_key: string;
          p_post_id: string;
          p_title?: string | null;
          p_description?: string | null;
          p_category?: string | null;
          p_post_type?: string | null;
          p_hours_cost?: number | null;
          p_status?: string | null;
        };
        Returns: void;
      };
      admin_delete_post: {
        Args: { p_key: string; p_post_id: string };
        Returns: void;
      };
      admin_seed_demo_listings: {
        Args: { p_key: string };
        Returns: void;
      };
      submit_language_request: {
        Args: { p_language_name: string; p_reason?: string | null };
        Returns: string;
      };
      admin_list_language_requests: {
        Args: { p_key: string };
        Returns: LanguageRequest[];
      };
      admin_update_language_request: {
        Args: {
          p_key: string;
          p_request_id: string;
          p_status?: string | null;
          p_admin_read?: boolean | null;
        };
        Returns: void;
      };
      accept_post: {
        Args: { p_post_id: string; p_exchange_format?: string | null };
        Returns: string;
      };
      confirm_exchange: {
        Args: { p_exchange_id: string };
        Returns: void;
      };
      complete_exchange: {
        Args: { p_exchange_id: string };
        Returns: void;
      };
      cancel_exchange: {
        Args: { p_exchange_id: string };
        Returns: void;
      };
      submit_exchange_report: {
        Args: {
          p_reported_user_id: string;
          p_category: string;
          p_exchange_id?: string | null;
          p_details?: string | null;
          p_also_block?: boolean | null;
        };
        Returns: string;
      };
      submit_exchange_review: {
        Args: {
          p_exchange_id: string;
          p_showed_up?: boolean | null;
          p_work_completed?: boolean | null;
          p_would_exchange_again?: boolean | null;
          p_felt_safe?: boolean | null;
          p_details?: string | null;
        };
        Returns: string;
      };
      block_user: {
        Args: { p_blocked_id: string };
        Returns: void;
      };
      unblock_user: {
        Args: { p_blocked_id: string };
        Returns: void;
      };
      list_blocked_user_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      get_member_trust_stats: {
        Args: { p_user_id: string };
        Returns: {
          completed_exchanges: number;
          review_count: number;
          positive_rating_pct: number | null;
          show_rating: boolean;
        }[];
      };
      has_exchange_review: {
        Args: { p_exchange_id: string };
        Returns: boolean;
      };
      get_member_contact_email: {
        Args: {
          p_member_id: string;
          p_post_id?: string | null;
          p_exchange_id?: string | null;
        };
        Returns: string | null;
      };
      admin_list_exchange_reports: {
        Args: { p_key: string };
        Returns: ExchangeReport[];
      };
      admin_update_exchange_report: {
        Args: {
          p_key: string;
          p_report_id: string;
          p_status?: string | null;
          p_admin_read?: boolean | null;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];

export interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  hours_available: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPost {
  id: string;
  user_id: string;
  author_name: string;
  author_email: string | null;
  title: string;
  description: string | null;
  category: string;
  post_type: "needs" | "offers";
  hours_cost: number;
  status: "active" | "closed" | "archived";
  created_at: string;
  updated_at: string;
}

export interface LanguageRequest {
  id: string;
  user_id: string | null;
  language_name: string;
  reason: string | null;
  requester_name: string | null;
  requester_email: string | null;
  status: "pending" | "reviewed" | "added" | "dismissed";
  admin_read: boolean;
  created_at: string;
}

export interface ExchangeReport {
  id: string;
  reporter_id: string | null;
  reported_user_id: string;
  exchange_id: string | null;
  category: "no_show" | "incomplete_work" | "harassment" | "unsafe" | "scam" | "other";
  details: string | null;
  also_block: boolean;
  status: "pending" | "reviewed" | "action_taken" | "dismissed";
  admin_read: boolean;
  created_at: string;
}

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, "full_name"> | null;
};

export type Exchange = Database["public"]["Tables"]["exchanges"]["Row"];

export type ExchangeWithProfiles = Exchange & {
  poster: Pick<Profile, "full_name" | "username"> | null;
  acceptor: Pick<Profile, "full_name" | "username"> | null;
};
