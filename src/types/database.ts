export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          channel: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          designer_id: string | null
          id: string
          language: string | null
          phone: string | null
          reference_image_urls: Json | null
          request_note: string | null
          reservation_date: string
          reservation_time: string
          service_label: string | null
          status: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          designer_id?: string | null
          id: string
          language?: string | null
          phone?: string | null
          reference_image_urls?: Json | null
          request_note?: string | null
          reservation_date: string
          reservation_time: string
          service_label?: string | null
          status?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          designer_id?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          reference_image_urls?: Json | null
          request_note?: string | null
          reservation_date?: string
          reservation_time?: string
          service_label?: string | null
          status?: string | null
        }
        Relationships: []
      }
      consultation_records: {
        Row: {
          checklist: Json | null
          consultation: Json
          created_at: string | null
          customer_id: string
          designer_id: string
          estimated_minutes: number | null
          final_price: number | null
          finalized_at: string | null
          id: string
          image_urls: Json | null
          notes: string | null
          pricing_adjustments: Json | null
          shop_id: string
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          checklist?: Json | null
          consultation: Json
          created_at?: string | null
          customer_id: string
          designer_id: string
          estimated_minutes?: number | null
          final_price?: number | null
          finalized_at?: string | null
          id: string
          image_urls?: Json | null
          notes?: string | null
          pricing_adjustments?: Json | null
          shop_id: string
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          checklist?: Json | null
          consultation?: Json
          created_at?: string | null
          customer_id?: string
          designer_id?: string
          estimated_minutes?: number | null
          final_price?: number | null
          finalized_at?: string | null
          id?: string
          image_urls?: Json | null
          notes?: string | null
          pricing_adjustments?: Json | null
          shop_id?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_tags: {
        Row: {
          accent: string | null
          category: string
          created_at: string | null
          customer_id: string
          id: string
          is_custom: boolean | null
          pinned: boolean | null
          sort_order: number | null
          value: string
        }
        Insert: {
          accent?: string | null
          category: string
          created_at?: string | null
          customer_id: string
          id: string
          is_custom?: boolean | null
          pinned?: boolean | null
          sort_order?: number | null
          value: string
        }
        Update: {
          accent?: string | null
          category?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_custom?: boolean | null
          pinned?: boolean | null
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          assigned_designer_id: string | null
          assigned_designer_name: string | null
          average_spend: number | null
          created_at: string | null
          first_visit_date: string | null
          id: string
          is_regular: boolean | null
          last_visit_date: string | null
          membership: Json | null
          name: string
          phone: string | null
          preference: Json | null
          profile_image_url: string | null
          regular_since: string | null
          shop_id: string
          total_spend: number | null
          treatment_history: Json | null
          updated_at: string | null
          visit_count: number | null
          visit_frequency: string | null
        }
        Insert: {
          assigned_designer_id?: string | null
          assigned_designer_name?: string | null
          average_spend?: number | null
          created_at?: string | null
          first_visit_date?: string | null
          id: string
          is_regular?: boolean | null
          last_visit_date?: string | null
          membership?: Json | null
          name: string
          phone?: string | null
          preference?: Json | null
          profile_image_url?: string | null
          regular_since?: string | null
          shop_id: string
          total_spend?: number | null
          treatment_history?: Json | null
          updated_at?: string | null
          visit_count?: number | null
          visit_frequency?: string | null
        }
        Update: {
          assigned_designer_id?: string | null
          assigned_designer_name?: string | null
          average_spend?: number | null
          created_at?: string | null
          first_visit_date?: string | null
          id?: string
          is_regular?: boolean | null
          last_visit_date?: string | null
          membership?: Json | null
          name?: string
          phone?: string | null
          preference?: Json | null
          profile_image_url?: string | null
          regular_since?: string | null
          shop_id?: string
          total_spend?: number | null
          treatment_history?: Json | null
          updated_at?: string | null
          visit_count?: number | null
          visit_frequency?: string | null
        }
        Relationships: []
      }
      designers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          profile_image_url: string | null
          role: string
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          role: string
          shop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          role?: string
          shop_id?: string
        }
        Relationships: []
      }
      portfolio_photos: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          image_data_url: string | null
          kind: string
          note: string | null
          record_id: string | null
          tags: Json | null
          taken_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id: string
          image_data_url?: string | null
          kind: string
          note?: string | null
          record_id?: string | null
          tags?: Json | null
          taken_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          image_data_url?: string | null
          kind?: string
          note?: string | null
          record_id?: string | null
          tags?: Json | null
          taken_at?: string | null
        }
        Relationships: []
      }
      shops: {
        Row: {
          address: string | null
          base_foot_price: number | null
          base_hand_price: number | null
          business_hours: Json | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          base_foot_price?: number | null
          base_hand_price?: number | null
          business_hours?: Json | null
          created_at?: string | null
          id: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          base_foot_price?: number | null
          base_hand_price?: number | null
          business_hours?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      small_talk_notes: {
        Row: {
          consultation_record_id: string | null
          created_at: string | null
          created_by_designer_id: string | null
          created_by_designer_name: string | null
          customer_id: string
          id: string
          note_text: string
        }
        Insert: {
          consultation_record_id?: string | null
          created_at?: string | null
          created_by_designer_id?: string | null
          created_by_designer_name?: string | null
          customer_id: string
          id: string
          note_text: string
        }
        Update: {
          consultation_record_id?: string | null
          created_at?: string | null
          created_by_designer_id?: string | null
          created_by_designer_name?: string | null
          customer_id?: string
          id?: string
          note_text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
