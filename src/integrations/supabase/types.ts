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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comp_cache: {
        Row: {
          cache_key: string
          created_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          payload?: Json
        }
        Relationships: []
      }
      comp_lookups: {
        Row: {
          address: string | null
          comps_after_filtering: number
          comps_returned: number
          created_at: string
          found: boolean
          id: string
          source: string
          state: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          comps_after_filtering?: number
          comps_returned?: number
          created_at?: string
          found?: boolean
          id?: string
          source: string
          state?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          comps_after_filtering?: number
          comps_returned?: number
          created_at?: string
          found?: boolean
          id?: string
          source?: string
          state?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      developer_profiles: {
        Row: {
          bio: string | null
          certifications: string[]
          created_at: string
          email: string | null
          entity_name: string | null
          full_name: string | null
          headshot_url: string | null
          id: string
          licenses: Json
          phone: string | null
          portfolio: Json
          professional_title: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          certifications?: string[]
          created_at?: string
          email?: string | null
          entity_name?: string | null
          full_name?: string | null
          headshot_url?: string | null
          id?: string
          licenses?: Json
          phone?: string | null
          portfolio?: Json
          professional_title?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          certifications?: string[]
          created_at?: string
          email?: string | null
          entity_name?: string | null
          full_name?: string | null
          headshot_url?: string | null
          id?: string
          licenses?: Json
          phone?: string | null
          portfolio?: Json
          professional_title?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          company_address: string | null
          company_logo_url: string | null
          company_name: string | null
          company_website: string | null
          completed_projects: number | null
          created_at: string
          full_name: string | null
          id: string
          licenses: string | null
          phone: string | null
          photo_url: string | null
          specializations: string[] | null
          title: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_website?: string | null
          completed_projects?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          licenses?: string | null
          phone?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          title?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_website?: string | null
          completed_projects?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          licenses?: string | null
          phone?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          title?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      project_details: {
        Row: {
          completed: boolean
          created_at: string
          data: Json
          id: string
          project_id: string
          section: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          data?: Json
          id?: string
          project_id: string
          section: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          data?: Json
          id?: string
          project_id?: string
          section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_details_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          progress?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          progress?: number
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
