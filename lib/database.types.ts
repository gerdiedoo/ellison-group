// Schema-aligned types. Regenerate with `npm run db:types` after applying migrations.
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
// PostgreSQL defaults make only non-defaulted, non-null columns mandatory on insert.
// FK metadata is provided for typed PostgREST relationships in the public schema.
type Relation<
  Name extends string,
  Column extends string,
  Target extends string,
  TargetColumn extends string = "id",
> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: false;
  referencedRelation: Target;
  referencedColumns: [TargetColumn];
};
type Table<
  Row,
  Required extends keyof Row,
  Relationships extends object[] = [],
> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};
export type Favorite = {
  user_id: string;
  property_id: string;
  created_at: string;
};
export type LeadProperty = { lead_id: string; property_id: string };
export type RateLimit = { key: string; window_start: string; hits: number };
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id">;
      properties: Table<
        Property,
        "slug" | "address" | "location" | "neighborhood" | "price",
        [Relation<"properties_assigned_to_fkey", "assigned_to", "profiles">]
      >;
      leads: Table<
        Lead,
        "full_name" | "email" | "consent_at" | "consent_text",
        [Relation<"leads_assigned_to_fkey", "assigned_to", "profiles">]
      >;
      inquiries: Table<
        Inquiry,
        "lead_id" | "kind" | "request_id",
        [
          Relation<"inquiries_lead_id_fkey", "lead_id", "leads">,
          Relation<"inquiries_property_id_fkey", "property_id", "properties">,
          Relation<"inquiries_assigned_to_fkey", "assigned_to", "profiles">,
        ]
      >;
      conversations: Table<
        Conversation,
        "visitor_hash",
        [
          Relation<"conversations_lead_id_fkey", "lead_id", "leads">,
          Relation<
            "conversations_property_id_fkey",
            "property_id",
            "properties"
          >,
          Relation<"conversations_assigned_to_fkey", "assigned_to", "profiles">,
        ]
      >;
      messages: Table<
        Message,
        "conversation_id" | "sender" | "body",
        [
          Relation<
            "messages_conversation_id_fkey",
            "conversation_id",
            "conversations"
          >,
          Relation<"messages_author_id_fkey", "author_id", "profiles">,
        ]
      >;
      notes: Table<
        Note,
        "body",
        [
          Relation<"notes_lead_id_fkey", "lead_id", "leads">,
          Relation<
            "notes_conversation_id_fkey",
            "conversation_id",
            "conversations"
          >,
          Relation<"notes_author_id_fkey", "author_id", "profiles">,
        ]
      >;
      tasks: Table<
        Task,
        "lead_id" | "title" | "due_at",
        [
          Relation<"tasks_lead_id_fkey", "lead_id", "leads">,
          Relation<"tasks_assigned_to_fkey", "assigned_to", "profiles">,
        ]
      >;
      settings: Table<Setting, "key" | "value">;
      activity_logs: {
        Row: Activity;
        Insert: Omit<
          Table<Activity, "action" | "entity_type" | "entity_id">["Insert"],
          "id"
        > & { id?: never };
        Update: Omit<Partial<Activity>, "id"> & { id?: never };
        Relationships: [
          Relation<"activity_logs_actor_id_fkey", "actor_id", "profiles">,
        ];
      };
      favorites: Table<
        Favorite,
        "user_id" | "property_id",
        [Relation<"favorites_property_id_fkey", "property_id", "properties">]
      >;
      lead_properties: Table<
        LeadProperty,
        "lead_id" | "property_id",
        [
          Relation<"lead_properties_lead_id_fkey", "lead_id", "leads">,
          Relation<
            "lead_properties_property_id_fkey",
            "property_id",
            "properties"
          >,
        ]
      >;
      rate_limits: Table<RateLimit, "key">;
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

export type Tables<Name extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Name]["Row"];
export type TablesInsert<Name extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Name]["Insert"];
export type TablesUpdate<Name extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Name]["Update"];
export type Enums<Name extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][Name];
