export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activation_campaigns: {
        Row: {
          contacts_count: number
          created_at: string
          filter_days_since: number
          filter_status: string
          filter_type: string
          id: string
          message_prompt: string
          name: string
          responses_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contacts_count?: number
          created_at?: string
          filter_days_since?: number
          filter_status?: string
          filter_type?: string
          id?: string
          message_prompt?: string
          name?: string
          responses_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contacts_count?: number
          created_at?: string
          filter_days_since?: number
          filter_status?: string
          filter_type?: string
          id?: string
          message_prompt?: string
          name?: string
          responses_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_configs: {
        Row: {
          agent_type: string
          created_at: string
          id: string
          system_prompt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          id?: string
          system_prompt?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          id?: string
          system_prompt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_agent_config: {
        Row: {
          activate_command: string
          active: boolean
          created_at: string
          energy: string
          fallback_message: string
          faq: string
          human_takeover_minutes: number
          id: string
          knowledge_base: string
          objections: string
          opening_message: string
          out_of_scope: string
          pitch: string
          prohibited_words: string
          prompt: string
          stop_command: string
          updated_at: string
          user_id: string
          voice_tone: string
        }
        Insert: {
          activate_command?: string
          active?: boolean
          created_at?: string
          energy?: string
          fallback_message?: string
          faq?: string
          human_takeover_minutes?: number
          id?: string
          knowledge_base?: string
          objections?: string
          opening_message?: string
          out_of_scope?: string
          pitch?: string
          prohibited_words?: string
          prompt?: string
          stop_command?: string
          updated_at?: string
          user_id: string
          voice_tone?: string
        }
        Update: {
          activate_command?: string
          active?: boolean
          created_at?: string
          energy?: string
          fallback_message?: string
          faq?: string
          human_takeover_minutes?: number
          id?: string
          knowledge_base?: string
          objections?: string
          opening_message?: string
          out_of_scope?: string
          pitch?: string
          prohibited_words?: string
          prompt?: string
          stop_command?: string
          updated_at?: string
          user_id?: string
          voice_tone?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          google_event_id: string | null
          id: string
          lead_id: string | null
          lead_name: string
          notes: string
          service: string
          status: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string
          notes?: string
          service?: string
          status?: string
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          lead_name?: string
          notes?: string
          service?: string
          status?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_name: string
          created_at: string
          faq: Json
          follow_up_config: Json
          funnel_stages: Json
          id: string
          objections: Json
          qualified_lead_criteria: string
          segment: string
          service_prices: Json
          services: Json
          tone: string
          updated_at: string
          user_id: string
          working_hours: Json
        }
        Insert: {
          business_name?: string
          created_at?: string
          faq?: Json
          follow_up_config?: Json
          funnel_stages?: Json
          id?: string
          objections?: Json
          qualified_lead_criteria?: string
          segment?: string
          service_prices?: Json
          services?: Json
          tone?: string
          updated_at?: string
          user_id: string
          working_hours?: Json
        }
        Update: {
          business_name?: string
          created_at?: string
          faq?: Json
          follow_up_config?: Json
          funnel_stages?: Json
          id?: string
          objections?: Json
          qualified_lead_criteria?: string
          segment?: string
          service_prices?: Json
          services?: Json
          tone?: string
          updated_at?: string
          user_id?: string
          working_hours?: Json
        }
        Relationships: []
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          contact_name: string
          contact_phone: string
          created_at: string
          error_message: string | null
          id: string
          message_text: string
          send_at: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          contact_name?: string
          contact_phone: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_text: string
          send_at: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_text?: string
          send_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          failed_count: number
          id: string
          message_text: string | null
          name: string
          scheduled_at: string | null
          segment: string
          sent_count: number
          status: string
          total_contacts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_count?: number
          id?: string
          message_text?: string | null
          name?: string
          scheduled_at?: string | null
          segment?: string
          sent_count?: number
          status?: string
          total_contacts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_count?: number
          id?: string
          message_text?: string | null
          name?: string
          scheduled_at?: string | null
          segment?: string
          sent_count?: number
          status?: string
          total_contacts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_memory: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          interaction_count: number
          last_interaction_at: string
          last_topics: string
          preferences: string
          sentiment: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          interaction_count?: number
          last_interaction_at?: string
          last_topics?: string
          preferences?: string
          sentiment?: string
          summary?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          interaction_count?: number
          last_interaction_at?: string
          last_topics?: string
          preferences?: string
          sentiment?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_flows: {
        Row: {
          active: boolean
          attempts: number
          created_at: string
          id: string
          interval_time: string
          lead_status: string
          message_prompt: string
          name: string
          no_response_time: string
          objective: string
          trigger_description: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          attempts?: number
          created_at?: string
          id?: string
          interval_time?: string
          lead_status?: string
          message_prompt?: string
          name?: string
          no_response_time?: string
          objective?: string
          trigger_description?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          attempts?: number
          created_at?: string
          id?: string
          interval_time?: string
          lead_status?: string
          message_prompt?: string
          name?: string
          no_response_time?: string
          objective?: string
          trigger_description?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_status: string
          ai_stopped: boolean
          created_at: string
          current_agent: string
          human_takeover_until: string | null
          id: string
          interest: string
          last_contact: string
          name: string
          next_step: string
          notes: string
          origin: string
          phone: string
          status: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_status?: string
          ai_stopped?: boolean
          created_at?: string
          current_agent?: string
          human_takeover_until?: string | null
          id?: string
          interest?: string
          last_contact?: string
          name?: string
          next_step?: string
          notes?: string
          origin?: string
          phone?: string
          status?: string
          summary?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_status?: string
          ai_stopped?: boolean
          created_at?: string
          current_agent?: string
          human_takeover_until?: string | null
          id?: string
          interest?: string
          last_contact?: string
          name?: string
          next_step?: string
          notes?: string
          origin?: string
          phone?: string
          status?: string
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          instance_name: string
          is_audio: boolean
          last_message_at: string
          lead_id: string | null
          messages: Json
          status: string
          user_id: string
        }
        Insert: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_audio?: boolean
          last_message_at?: string
          lead_id?: string | null
          messages?: Json
          status?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_audio?: boolean
          last_message_at?: string
          lead_id?: string | null
          messages?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          ai_usage_percent: number
          avatar: string | null
          brand_name: string
          business_description: string | null
          business_hours: string | null
          contacts_limit: number
          contacts_used: number
          created_at: string
          email: string
          id: string
          is_onboarded: boolean
          name: string
          niche: string
          objective: string
          plan: string
          services: string[]
          trial_ends_at: string | null
          updated_at: string
          voice_tone: string | null
          whatsapp: string
        }
        Insert: {
          address?: string | null
          ai_usage_percent?: number
          avatar?: string | null
          brand_name?: string
          business_description?: string | null
          business_hours?: string | null
          contacts_limit?: number
          contacts_used?: number
          created_at?: string
          email?: string
          id: string
          is_onboarded?: boolean
          name?: string
          niche?: string
          objective?: string
          plan?: string
          services?: string[]
          trial_ends_at?: string | null
          updated_at?: string
          voice_tone?: string | null
          whatsapp?: string
        }
        Update: {
          address?: string | null
          ai_usage_percent?: number
          avatar?: string | null
          brand_name?: string
          business_description?: string | null
          business_hours?: string | null
          contacts_limit?: number
          contacts_used?: number
          created_at?: string
          email?: string
          id?: string
          is_onboarded?: boolean
          name?: string
          niche?: string
          objective?: string
          plan?: string
          services?: string[]
          trial_ends_at?: string | null
          updated_at?: string
          voice_tone?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      reminders_config: {
        Row: {
          active: boolean
          confirmation_expected: string
          created_at: string
          first_reminder: string
          id: string
          message_template: string
          second_reminder: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          confirmation_expected?: string
          created_at?: string
          first_reminder?: string
          id?: string
          message_template?: string
          second_reminder?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          confirmation_expected?: string
          created_at?: string
          first_reminder?: string
          id?: string
          message_template?: string
          second_reminder?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reminders: {
        Row: {
          appointment_at: string | null
          appointment_id: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          message_text: string
          send_at: string
          sent_at: string | null
          service_name: string
          status: string
          user_id: string
        }
        Insert: {
          appointment_at?: string | null
          appointment_id?: string | null
          contact_name?: string
          contact_phone: string
          created_at?: string
          id?: string
          message_text?: string
          send_at: string
          sent_at?: string | null
          service_name?: string
          status?: string
          user_id: string
        }
        Update: {
          appointment_at?: string | null
          appointment_id?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          message_text?: string
          send_at?: string
          sent_at?: string | null
          service_name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_config: {
        Row: {
          blocked_dates: string[]
          buffer_minutes: number
          created_at: string
          default_duration: number
          id: string
          lunch_end: string | null
          lunch_start: string | null
          updated_at: string
          user_id: string
          work_days: number[]
          work_end: string
          work_start: string
        }
        Insert: {
          blocked_dates?: string[]
          buffer_minutes?: number
          created_at?: string
          default_duration?: number
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          updated_at?: string
          user_id: string
          work_days?: number[]
          work_end?: string
          work_start?: string
        }
        Update: {
          blocked_dates?: string[]
          buffer_minutes?: number
          created_at?: string
          default_duration?: number
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          updated_at?: string
          user_id?: string
          work_days?: number[]
          work_end?: string
          work_start?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          google_access_token: string | null
          google_calendar_connected: boolean
          google_refresh_token: string | null
          id: string
          reminder_1_message: string | null
          reminder_1_offset: string | null
          reminder_2_message: string | null
          reminder_2_offset: string | null
          reminder_3_message: string | null
          reminder_3_offset: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          google_access_token?: string | null
          google_calendar_connected?: boolean
          google_refresh_token?: string | null
          id?: string
          reminder_1_message?: string | null
          reminder_1_offset?: string | null
          reminder_2_message?: string | null
          reminder_2_offset?: string | null
          reminder_3_message?: string | null
          reminder_3_offset?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          google_access_token?: string | null
          google_calendar_connected?: boolean
          google_refresh_token?: string | null
          id?: string
          reminder_1_message?: string | null
          reminder_1_offset?: string | null
          reminder_2_message?: string | null
          reminder_2_offset?: string | null
          reminder_3_message?: string | null
          reminder_3_offset?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          instance_id: string | null
          instance_name: string
          phone: string | null
          qr_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id?: string | null
          instance_name: string
          phone?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string | null
          instance_name?: string
          phone?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_campaign_counter: {
        Args: { p_campaign_id: string; p_field: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
