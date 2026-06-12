// ============================================================
// Fluence AI — Supabase Database TypeScript Definitions
// Auto-maintained — matches supabase/schema.sql exactly.
// ============================================================

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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: 'free' | 'starter' | 'growth' | 'enterprise';
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: 'free' | 'starter' | 'growth' | 'enterprise';
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: 'free' | 'starter' | 'growth' | 'enterprise';
          settings?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          name: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          name: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          name?: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      bots: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          config: Json;
          is_active: boolean;
          embed_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          config?: Json;
          is_active?: boolean;
          embed_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          config?: Json;
          is_active?: boolean;
          embed_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bots_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      conversations: {
        Row: {
          id: string;
          bot_id: string;
          session_id: string;
          customer_email: string | null;
          customer_name: string | null;
          metadata: Json;
          started_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          session_id: string;
          customer_email?: string | null;
          customer_name?: string | null;
          metadata?: Json;
          started_at?: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          session_id?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          metadata?: Json;
          started_at?: string;
          last_message_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_bot_id_fkey';
            columns: ['bot_id'];
            isOneToOne: false;
            referencedRelation: 'bots';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          language: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          language?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          language?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          }
        ];
      };
      memory: {
        Row: {
          id: string;
          bot_id: string;
          session_id: string;
          customer_email: string | null;
          type: 'fact' | 'preference' | 'objection' | 'interest' | 'context' | 'summary';
          key: string;
          value: string;
          embedding: string | null; // stored as vector(1536) in Postgres
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          session_id: string;
          customer_email?: string | null;
          type: 'fact' | 'preference' | 'objection' | 'interest' | 'context' | 'summary';
          key: string;
          value: string;
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          session_id?: string;
          customer_email?: string | null;
          type?: 'fact' | 'preference' | 'objection' | 'interest' | 'context' | 'summary';
          key?: string;
          value?: string;
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memory_bot_id_fkey';
            columns: ['bot_id'];
            isOneToOne: false;
            referencedRelation: 'bots';
            referencedColumns: ['id'];
          }
        ];
      };
      customer_state: {
        Row: {
          id: string;
          bot_id: string;
          session_id: string;
          customer_email: string | null;
          intent: string | null;
          sentiment: 'positive' | 'neutral' | 'negative' | null;
          buying_stage:
            | 'awareness'
            | 'interest'
            | 'consideration'
            | 'intent'
            | 'evaluation'
            | 'purchase'
            | null;
          conversion_probability: number;
          last_language: string | null;
          objections: Json;
          interests: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          session_id: string;
          customer_email?: string | null;
          intent?: string | null;
          sentiment?: 'positive' | 'neutral' | 'negative' | null;
          buying_stage?:
            | 'awareness'
            | 'interest'
            | 'consideration'
            | 'intent'
            | 'evaluation'
            | 'purchase'
            | null;
          conversion_probability?: number;
          last_language?: string | null;
          objections?: Json;
          interests?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          session_id?: string;
          customer_email?: string | null;
          intent?: string | null;
          sentiment?: 'positive' | 'neutral' | 'negative' | null;
          buying_stage?:
            | 'awareness'
            | 'interest'
            | 'consideration'
            | 'intent'
            | 'evaluation'
            | 'purchase'
            | null;
          conversion_probability?: number;
          last_language?: string | null;
          objections?: Json;
          interests?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_state_bot_id_fkey';
            columns: ['bot_id'];
            isOneToOne: false;
            referencedRelation: 'bots';
            referencedColumns: ['id'];
          }
        ];
      };
      knowledge_base: {
        Row: {
          id: string;
          bot_id: string;
          title: string;
          content: string;
          source_type: 'manual' | 'file' | 'url' | 'faq' | 'pdf' | 'product';
          file_url: string | null;
          embedding: string | null; // stored as vector(1536) in Postgres
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          title: string;
          content: string;
          source_type: 'manual' | 'file' | 'url' | 'faq' | 'pdf' | 'product';
          file_url?: string | null;
          embedding?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          title?: string;
          content?: string;
          source_type?: 'manual' | 'file' | 'url' | 'faq' | 'pdf' | 'product';
          file_url?: string | null;
          embedding?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'knowledge_base_bot_id_fkey';
            columns: ['bot_id'];
            isOneToOne: false;
            referencedRelation: 'bots';
            referencedColumns: ['id'];
          }
        ];
      };
      analytics_logs: {
        Row: {
          id: string;
          bot_id: string;
          conversation_id: string | null;
          event_type: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          conversation_id?: string | null;
          event_type: string;
          data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          conversation_id?: string | null;
          event_type?: string;
          data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_logs_bot_id_fkey';
            columns: ['bot_id'];
            isOneToOne: false;
            referencedRelation: 'bots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_logs_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          org_id: string;
          plan: 'free' | 'starter' | 'growth' | 'enterprise';
          status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          stripe_subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          plan: 'free' | 'starter' | 'growth' | 'enterprise';
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          stripe_subscription_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          plan?: 'free' | 'starter' | 'growth' | 'enterprise';
          status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
          current_period_start?: string;
          current_period_end?: string;
          stripe_subscription_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      usage_tracking: {
        Row: {
          id: string;
          org_id: string;
          bot_id: string | null;
          date: string;
          conversations: number;
          messages: number;
          tokens_used: number;
        };
        Insert: {
          id?: string;
          org_id: string;
          bot_id?: string | null;
          date: string;
          conversations?: number;
          messages?: number;
          tokens_used?: number;
        };
        Update: {
          id?: string;
          org_id?: string;
          bot_id?: string | null;
          date?: string;
          conversations?: number;
          messages?: number;
          tokens_used?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_tracking_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'usage_tracking_bot_id_fkey';
            columns: ['bot_id'];
            isOneToOne: false;
            referencedRelation: 'bots';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_knowledge_base: {
        Args: {
          query_embedding: string;
          bot_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<{
          id: string;
          bot_id: string;
          title: string;
          content: string;
          source_type: string;
          metadata: Json;
          similarity: number;
        }>;
      };
      match_memory: {
        Args: {
          query_embedding: string;
          bot_id: string;
          session_id?: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<{
          id: string;
          bot_id: string;
          session_id: string;
          type: string;
          key: string;
          value: string;
          similarity: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
