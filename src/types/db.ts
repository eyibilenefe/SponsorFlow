export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      company_tags: {
        Row: {
          company_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          company_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          company_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_tags_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      threads: {
        Row: {
          id: string;
          contact_id: string;
          status: Database["public"]["Enums"]["thread_status"];
          gmail_thread_id: string | null;
          last_activity_at: string;
          owner_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          status?: Database["public"]["Enums"]["thread_status"];
          gmail_thread_id?: string | null;
          last_activity_at?: string;
          owner_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          status?: Database["public"]["Enums"]["thread_status"];
          gmail_thread_id?: string | null;
          last_activity_at?: string;
          owner_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "threads_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "threads_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          direction: Database["public"]["Enums"]["message_direction"];
          subject: string;
          body: string;
          gmail_message_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          direction: Database["public"]["Enums"]["message_direction"];
          subject: string;
          body: string;
          gmail_message_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          direction?: Database["public"]["Enums"]["message_direction"];
          subject?: string;
          body?: string;
          gmail_message_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          subject_template: string;
          body_template: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject_template: string;
          body_template: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject_template?: string;
          body_template?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      campaign_recipients: {
        Row: {
          campaign_id: string;
          contact_id: string;
          thread_id: string | null;
          send_status: Database["public"]["Enums"]["campaign_send_status"];
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          campaign_id: string;
          contact_id: string;
          thread_id?: string | null;
          send_status?: Database["public"]["Enums"]["campaign_send_status"];
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          campaign_id?: string;
          contact_id?: string;
          thread_id?: string | null;
          send_status?: Database["public"]["Enums"]["campaign_send_status"];
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_recipients_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      thread_status: "NEW" | "SENT" | "WAITING" | "REPLIED" | "MEETING" | "WON" | "LOST";
      message_direction: "OUTBOUND" | "INBOUND";
      campaign_send_status: "PENDING" | "SENT" | "FAILED";
    };
    CompositeTypes: Record<string, never>;
  };
};
