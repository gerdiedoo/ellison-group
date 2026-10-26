// Schema-aligned types. Regenerate with `supabase gen types typescript --local` after migrations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Profile = {
  id: string;
  full_name: string;
  role: "visitor" | "agent" | "admin";
  active: boolean;
  created_at: string;
};
export type Property = {
  id: string;
  slug: string;
  address: string;
  location: string;
  neighborhood: string;
  property_type: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  features: string[];
  images: string[];
  illustration: string;
  listing_status: "For Sale" | "Pending" | "Sold";
  published: boolean;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};
export type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  assigned_to: string | null;
  consent_at: string;
  consent_text: string;
  created_at: string;
  updated_at: string;
};
export type Inquiry = {
  id: string;
  lead_id: string;
  property_id: string | null;
  kind: string;
  message: string;
  context: Json;
  preferred_date: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  request_id: string;
};
export type Conversation = {
  id: string;
  visitor_hash: string;
  lead_id: string | null;
  property_id: string | null;
  assigned_to: string | null;
  status: "bot" | "human" | "resolved";
  revision: number;
  processing_until: string | null;
  created_at: string;
  updated_at: string;
};
export type Message = {
  id: string;
  conversation_id: string;
  sender: "visitor" | "assistant" | "agent" | "system";
  body: string;
  author_id: string | null;
  created_at: string;
};
export type Note = {
  id: string;
  lead_id: string | null;
  conversation_id: string | null;
  body: string;
  author_id: string;
  created_at: string;
};
export type Task = {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  done: boolean;
  assigned_to: string | null;
  created_at: string;
};
export type Setting = { key: string; value: Json; updated_at: string };
export type Activity = {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Json;
  created_at: string;
};
type Table<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      properties: Table<Property>;
      leads: Table<Lead>;
      inquiries: Table<Inquiry>;
      conversations: Table<Conversation>;
      messages: Table<Message>;
      notes: Table<Note>;
      tasks: Table<Task>;
      settings: Table<Setting>;
      activity_logs: Table<Activity>;
      favorites: Table<{
        user_id: string;
        property_id: string;
        created_at: string;
      }>;
      lead_properties: Table<{ lead_id: string; property_id: string }>;
      rate_limits: Table<{ key: string; window_start: string; hits: number }>;
    };
    Views: Record<string, never>;
    Functions: {
      search_conversations: {
        Args: { p_query?: string };
        Returns: Conversation[];
      };
      agent_reply: { Args: { p_id: string; p_body: string }; Returns: string };
      crm_analytics: { Args: Record<string, never>; Returns: Json };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      consume_rate: {
        Args: { p_key: string; p_limit: number; p_seconds: number };
        Returns: boolean;
      };
      capture_inquiry: {
        Args: { p_data: Json; p_visitor_hash?: string | null };
        Returns: string;
      };
      begin_chat: {
        Args: {
          p_id: string;
          p_hash: string;
          p_body: string;
          p_handoff: boolean;
        };
        Returns: Json;
      };
      finish_chat: {
        Args: {
          p_id: string;
          p_hash: string;
          p_revision: number;
          p_body: string;
        };
        Returns: boolean;
      };
    };
    Enums: { team_role: Profile["role"] };
    CompositeTypes: Record<string, never>;
  };
};
