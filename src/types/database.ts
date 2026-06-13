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
          status: "in_progress" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          exchange_format: "in_person" | "remote" | null;
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
          status?: "in_progress" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          exchange_format?: "in_person" | "remote" | null;
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
          status?: "in_progress" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          exchange_format?: "in_person" | "remote" | null;
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
      accept_post: {
        Args: { p_post_id: string; p_exchange_format?: string | null };
        Returns: string;
      };
      complete_exchange: {
        Args: { p_exchange_id: string };
        Returns: void;
      };
      cancel_exchange: {
        Args: { p_exchange_id: string };
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

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, "full_name"> | null;
};

export type Exchange = Database["public"]["Tables"]["exchanges"]["Row"];

export type ExchangeWithProfiles = Exchange & {
  poster: Pick<Profile, "full_name"> | null;
  acceptor: Pick<Profile, "full_name"> | null;
};
