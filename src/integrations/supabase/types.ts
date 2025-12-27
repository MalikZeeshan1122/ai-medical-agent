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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_api_integrations: {
        Row: {
          api_key_encrypted: string
          api_name: string
          base_url: string | null
          cache_enabled: boolean | null
          cache_ttl_seconds: number | null
          config: Json | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          rate_limit_calls: number | null
          rate_limit_enabled: boolean | null
          rate_limit_window_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_name: string
          base_url?: string | null
          cache_enabled?: boolean | null
          cache_ttl_seconds?: number | null
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          rate_limit_calls?: number | null
          rate_limit_enabled?: boolean | null
          rate_limit_window_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_name?: string
          base_url?: string | null
          cache_enabled?: boolean | null
          cache_ttl_seconds?: number | null
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          rate_limit_calls?: number | null
          rate_limit_enabled?: boolean | null
          rate_limit_window_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          model_used: string | null
          provider_id: string | null
          role: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model_used?: string | null
          provider_id?: string | null
          role: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model_used?: string | null
          provider_id?: string | null
          role?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_key_encrypted: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          model_name: string
          provider_config: Json | null
          provider_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          model_name: string
          provider_config?: Json | null
          provider_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          model_name?: string
          provider_config?: Json | null
          provider_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      allergies: {
        Row: {
          allergen: string
          allergy_type: string | null
          created_at: string
          diagnosed_date: string | null
          id: string
          notes: string | null
          reaction: string | null
          severity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergen: string
          allergy_type?: string | null
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          reaction?: string | null
          severity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergen?: string
          allergy_type?: string | null
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          notes?: string | null
          reaction?: string | null
          severity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          calls_count: number | null
          created_at: string | null
          id: string
          integration_id: string
          updated_at: string | null
          user_id: string
          window_start: string
        }
        Insert: {
          calls_count?: number | null
          created_at?: string | null
          id?: string
          integration_id: string
          updated_at?: string | null
          user_id: string
          window_start: string
        }
        Update: {
          calls_count?: number | null
          created_at?: string | null
          id?: string
          integration_id?: string
          updated_at?: string | null
          user_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "ai_api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_response_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          integration_id: string
          response_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          integration_id: string
          response_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          integration_id?: string
          response_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "api_response_cache_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "ai_api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          cached: boolean | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          integration_id: string
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          cached?: boolean | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          integration_id: string
          method: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          cached?: boolean | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "ai_api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string | null
          created_at: string
          doctor_name: string
          doctor_specialty: string | null
          duration_minutes: number | null
          follow_up_actions: string | null
          id: string
          location: string | null
          notes: string | null
          notification_type: string | null
          outcome: string | null
          parent_appointment_id: string | null
          prescriptions: string | null
          reason: string
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder_enabled: boolean | null
          reminder_minutes_before: number | null
          reminder_sent: boolean | null
          status: string
          updated_at: string
          user_id: string
          user_phone: string | null
          visit_notes: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string | null
          created_at?: string
          doctor_name: string
          doctor_specialty?: string | null
          duration_minutes?: number | null
          follow_up_actions?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          notification_type?: string | null
          outcome?: string | null
          parent_appointment_id?: string | null
          prescriptions?: string | null
          reason: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          user_phone?: string | null
          visit_notes?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string | null
          created_at?: string
          doctor_name?: string
          doctor_specialty?: string | null
          duration_minutes?: number | null
          follow_up_actions?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          notification_type?: string | null
          outcome?: string | null
          parent_appointment_id?: string | null
          prescriptions?: string | null
          reason?: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes_before?: number | null
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          user_phone?: string | null
          visit_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_parent_appointment_id_fkey"
            columns: ["parent_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chronic_conditions: {
        Row: {
          condition_name: string
          created_at: string
          diagnosed_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          severity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          condition_name: string
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          severity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          condition_name?: string
          created_at?: string
          diagnosed_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          severity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chronic_conditions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          appointment_date: string | null
          created_at: string
          doctor_id: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          availability_description: string | null
          average_rating: number | null
          bio: string | null
          consultation_fee: number | null
          created_at: string
          email: string | null
          id: string
          image_url: string | null
          is_accepting_patients: boolean | null
          name: string
          office_location: string | null
          phone: string | null
          specialty: string
          total_reviews: number | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          availability_description?: string | null
          average_rating?: number | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          is_accepting_patients?: boolean | null
          name: string
          office_location?: string | null
          phone?: string | null
          specialty: string
          total_reviews?: number | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          availability_description?: string | null
          average_rating?: number | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          is_accepting_patients?: boolean | null
          name?: string
          office_location?: string | null
          phone?: string | null
          specialty?: string
          total_reviews?: number | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          contact_type: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          notes: string | null
          phone_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_type: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          notes?: string | null
          phone_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_type?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          notes?: string | null
          phone_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_numbers: {
        Row: {
          country_region: string | null
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country_region?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country_region?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_history: {
        Row: {
          age_of_onset: number | null
          condition_name: string
          created_at: string
          id: string
          notes: string | null
          relation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_of_onset?: number | null
          condition_name: string
          created_at?: string
          id?: string
          notes?: string | null
          relation: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_of_onset?: number | null
          condition_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          relation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_pages: {
        Row: {
          content: string | null
          created_at: string
          hospital_id: string
          id: string
          metadata: Json | null
          page_type: string | null
          scraped_at: string
          title: string | null
          url: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          metadata?: Json | null
          page_type?: string | null
          scraped_at?: string
          title?: string | null
          url: string
        }
        Update: {
          content?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          metadata?: Json | null
          page_type?: string | null
          scraped_at?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_pages_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_scraping_stats: {
        Row: {
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          hospital_id: string
          id: string
          method: string
          pages_failed: number
          pages_scraped: number
          scrape_date: string
          success: boolean
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          hospital_id: string
          id?: string
          method: string
          pages_failed?: number
          pages_scraped?: number
          scrape_date?: string
          success?: boolean
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          hospital_id?: string
          id?: string
          method?: string
          pages_failed?: number
          pages_scraped?: number
          scrape_date?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hospital_scraping_stats_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          auto_scrape_enabled: boolean | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          scrape_frequency: string | null
          scraped_at: string | null
          updated_at: string
          website_url: string
        }
        Insert: {
          address?: string | null
          auto_scrape_enabled?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          scrape_frequency?: string | null
          scraped_at?: string | null
          updated_at?: string
          website_url: string
        }
        Update: {
          address?: string | null
          auto_scrape_enabled?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          scrape_frequency?: string | null
          scraped_at?: string | null
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_current: boolean | null
          medication_name: string
          prescribing_doctor: string | null
          purpose: string | null
          side_effects: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_current?: boolean | null
          medication_name: string
          prescribing_doctor?: string | null
          purpose?: string | null
          side_effects?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_current?: boolean | null
          medication_name?: string
          prescribing_doctor?: string | null
          purpose?: string | null
          side_effects?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          appointment_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message_sid: string | null
          notification_type: string
          read_at: string | null
          recipient: string
          sent_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_sid?: string | null
          notification_type: string
          read_at?: string | null
          recipient: string
          sent_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message_sid?: string | null
          notification_type?: string
          read_at?: string | null
          recipient?: string
          sent_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          phone: string | null
          updated_at: string
          username: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          phone?: string | null
          updated_at?: string
          username?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          updated_at?: string
          username?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      symptoms: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          severity: string
          symptom: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          severity: string
          symptom: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          severity?: string
          symptom?: string
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
      get_hospital_scraping_stats: {
        Args: { hospital_uuid: string }
        Returns: {
          avg_duration_seconds: number
          failed_scrapes: number
          last_scrape_date: string
          last_scrape_method: string
          successful_scrapes: number
          total_pages_scraped: number
          total_scrapes: number
        }[]
      }
      get_upcoming_appointments: {
        Args: { days_ahead?: number; user_uuid: string }
        Returns: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          doctor_name: string
          doctor_specialty: string
          duration_minutes: number
          id: string
          location: string
          reason: string
          status: string
        }[]
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
    Enums: {},
  },
} as const
