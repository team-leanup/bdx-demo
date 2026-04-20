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
      booking_requests: {
        Row: {
          channel: string | null
          consultation_link_id: string | null
          consultation_link_sent_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          deposit: number | null
          designer_id: string | null
          id: string
          language: string | null
          phone: string | null
          pre_consultation_completed_at: string | null
          pre_consultation_data: Json | null
          reference_image_urls: Json | null
          request_note: string | null
          reservation_date: string
          reservation_time: string
          service_label: string | null
          shop_id: string
          status: string | null
        }
        Insert: {
          channel?: string | null
          consultation_link_id?: string | null
          consultation_link_sent_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          deposit?: number | null
          designer_id?: string | null
          id: string
          language?: string | null
          phone?: string | null
          pre_consultation_completed_at?: string | null
          pre_consultation_data?: Json | null
          reference_image_urls?: Json | null
          request_note?: string | null
          reservation_date: string
          reservation_time: string
          service_label?: string | null
          shop_id: string
          status?: string | null
        }
        Update: {
          channel?: string | null
          consultation_link_id?: string | null
          consultation_link_sent_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          deposit?: number | null
          designer_id?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          pre_consultation_completed_at?: string | null
          pre_consultation_data?: Json | null
          reference_image_urls?: Json | null
          request_note?: string | null
          reservation_date?: string
          reservation_time?: string
          service_label?: string | null
          shop_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_consultation_link_id_fkey"
            columns: ["consultation_link_id"]
            isOneToOne: false
            referencedRelation: "consultation_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_links: {
        Row: {
          booking_count: number
          created_at: string
          description: string | null
          designer_id: string | null
          estimated_duration_min: number
          expires_at: string
          id: string
          shop_id: string
          slot_interval_min: number
          status: string
          style_category: string | null
          title: string | null
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          booking_count?: number
          created_at?: string
          description?: string | null
          designer_id?: string | null
          estimated_duration_min?: number
          expires_at?: string
          id: string
          shop_id: string
          slot_interval_min?: number
          status?: string
          style_category?: string | null
          title?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          booking_count?: number
          created_at?: string
          description?: string | null
          designer_id?: string | null
          estimated_duration_min?: number
          expires_at?: string
          id?: string
          shop_id?: string
          slot_interval_min?: number
          status?: string
          style_category?: string | null
          title?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_links_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_links_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
          is_quick_sale: boolean
          language: string | null
          notes: string | null
          payment_method: string | null
          pricing_adjustments: Json | null
          share_card_id: string | null
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
          is_quick_sale?: boolean
          language?: string | null
          notes?: string | null
          payment_method?: string | null
          pricing_adjustments?: Json | null
          share_card_id?: string | null
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
          is_quick_sale?: boolean
          language?: string | null
          notes?: string | null
          payment_method?: string | null
          pricing_adjustments?: Json | null
          share_card_id?: string | null
          shop_id?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_records_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_records_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "customer_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_designer_id: string | null
          assigned_designer_name: string | null
          average_spend: number | null
          created_at: string | null
          duration_preference: string | null
          first_visit_date: string | null
          id: string
          is_regular: boolean | null
          last_visit_date: string | null
          membership: Json | null
          name: string
          phone: string | null
          preference: Json | null
          preferred_language: string | null
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
          duration_preference?: string | null
          first_visit_date?: string | null
          id: string
          is_regular?: boolean | null
          last_visit_date?: string | null
          membership?: Json | null
          name: string
          phone?: string | null
          preference?: Json | null
          preferred_language?: string | null
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
          duration_preference?: string | null
          first_visit_date?: string | null
          id?: string
          is_regular?: boolean | null
          last_visit_date?: string | null
          membership?: Json | null
          name?: string
          phone?: string | null
          preference?: Json | null
          preferred_language?: string | null
          profile_image_url?: string | null
          regular_since?: string | null
          shop_id?: string
          total_spend?: number | null
          treatment_history?: Json | null
          updated_at?: string | null
          visit_count?: number | null
          visit_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_designer_id_fkey"
            columns: ["assigned_designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      designers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          pin: string | null
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
          pin?: string | null
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
          pin?: string | null
          profile_image_url?: string | null
          role?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "designers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_transactions: {
        Row: {
          created_at: string
          customer_id: string
          date: string
          id: string
          note: string | null
          record_id: string | null
          sessions_delta: number
          shop_id: string
          type: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          date?: string
          id: string
          note?: string | null
          record_id?: string | null
          sessions_delta?: number
          shop_id: string
          type: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          note?: string | null
          record_id?: string | null
          sessions_delta?: number
          shop_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_transactions_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "consultation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number
          shop_id: string
          sort_order: number
          total_sessions: number
          updated_at: string
          valid_days: number | null
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          price: number
          shop_id: string
          sort_order?: number
          total_sessions: number
          updated_at?: string
          valid_days?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          shop_id?: string
          sort_order?: number
          total_sessions?: number
          updated_at?: string
          valid_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_photos: {
        Row: {
          color_labels: Json
          created_at: string | null
          customer_id: string
          design_type: string | null
          id: string
          image_data_url: string | null
          image_path: string | null
          is_featured: boolean
          is_public: boolean
          kind: string
          note: string | null
          price: number | null
          record_id: string | null
          service_type: string | null
          shop_id: string
          style_category: string | null
          tags: Json | null
          taken_at: string | null
        }
        Insert: {
          color_labels?: Json
          created_at?: string | null
          customer_id: string
          design_type?: string | null
          id: string
          image_data_url?: string | null
          image_path?: string | null
          is_featured?: boolean
          is_public?: boolean
          kind: string
          note?: string | null
          price?: number | null
          record_id?: string | null
          service_type?: string | null
          shop_id: string
          style_category?: string | null
          tags?: Json | null
          taken_at?: string | null
        }
        Update: {
          color_labels?: Json
          created_at?: string | null
          customer_id?: string
          design_type?: string | null
          id?: string
          image_data_url?: string | null
          image_path?: string | null
          is_featured?: boolean
          is_public?: boolean
          kind?: string
          note?: string | null
          price?: number | null
          record_id?: string | null
          service_type?: string | null
          shop_id?: string
          style_category?: string | null
          tags?: Json | null
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_photos_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "consultation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_photos_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
          onboarding_completed_at: string | null
          owner_id: string | null
          phone: string | null
          settings: Json | null
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
          onboarding_completed_at?: string | null
          owner_id?: string | null
          phone?: string | null
          settings?: Json | null
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
          onboarding_completed_at?: string | null
          owner_id?: string | null
          phone?: string | null
          settings?: Json | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pre_consultations: {
        Row: {
          id: string
          shop_id: string
          booking_id: string | null
          customer_id: string | null
          language: string
          status: string
          data: Json
          design_category: string | null
          confirmed_price: number | null
          estimated_minutes: number | null
          reference_image_paths: Json
          customer_name: string | null
          customer_phone: string | null
          created_at: string | null
          completed_at: string | null
          reviewed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id: string
          shop_id: string
          booking_id?: string | null
          customer_id?: string | null
          language: string
          status?: string
          data?: Json
          design_category?: string | null
          confirmed_price?: number | null
          estimated_minutes?: number | null
          reference_image_paths?: Json
          customer_name?: string | null
          customer_phone?: string | null
          created_at?: string | null
          completed_at?: string | null
          reviewed_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          shop_id?: string
          booking_id?: string | null
          customer_id?: string | null
          language?: string
          status?: string
          data?: Json
          design_category?: string | null
          confirmed_price?: number | null
          estimated_minutes?: number | null
          reference_image_paths?: Json
          customer_name?: string | null
          customer_phone?: string | null
          created_at?: string | null
          completed_at?: string | null
          reviewed_at?: string | null
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_consultations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_small_talk_notes_record"
            columns: ["consultation_record_id"]
            isOneToOne: false
            referencedRelation: "consultation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "small_talk_notes_created_by_designer_id_fkey"
            columns: ["created_by_designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "small_talk_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_shop_account: {
        Args: { p_shop_id: string; p_shop_name: string; p_owner_name: string }
        Returns: Json
      }
      complete_preconsultation_for_booking: {
        Args: {
          target_booking_id: string
          payload: Json
          completed_at: string
          linked_customer_id: string | null
        }
        Returns: undefined
      }
      get_my_shop_id: { Args: never; Returns: string }
      get_consultation_link_public: {
        Args: { p_link_id: string }
        Returns: Json
      }
      get_shop_pre_consult_data: {
        Args: { p_shop_id: string }
        Returns: Json
      }
      get_shop_public_data: {
        Args: { p_shop_id: string }
        Returns: Json
      }
      increment_consultation_link_booking: {
        Args: { p_link_id: string }
        Returns: undefined
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
