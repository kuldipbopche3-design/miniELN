export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          owner_id: string
          plan: string | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          owner_id: string
          plan?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          owner_id?: string
          plan?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string // 'owner' | 'admin' | 'staff'
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          invited_by?: string | null
          joined_at?: string
        }
      }
      lab_entries: {
        Row: {
          id: string
          workspace_id: string
          author_id: string
          title: string
          content: string | null
          sample_name: string | null
          status: string // 'Draft' | 'In Progress' | 'Completed' | 'Archived'
          metadata: Json | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          author_id: string
          title: string
          content?: string | null
          sample_name?: string | null
          status?: string
          metadata?: Json | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          author_id?: string
          title?: string
          content?: string | null
          sample_name?: string | null
          status?: string
          metadata?: Json | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          workspace_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      entry_tags: {
        Row: {
          entry_id: string
          tag_id: string
        }
        Insert: {
          entry_id: string
          tag_id: string
        }
        Update: {
          entry_id?: string
          tag_id?: string
        }
      }
      files: {
        Row: {
          id: string
          workspace_id: string
          entry_id: string | null
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          entry_id?: string | null
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          entry_id?: string | null
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string | null
          created_at?: string
        }
      }
      entry_files: {
        Row: {
          id: string
          workspace_id: string
          entry_id: string
          uploaded_by: string | null
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          entry_id: string
          uploaded_by?: string | null
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          entry_id?: string
          uploaded_by?: string | null
          file_name?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          is_deleted?: boolean
          created_at?: string
        }
      }
      workspace_settings: {
        Row: {
          workspace_id: string
          max_file_size_mb: number
          allowed_mime_types: string[]
          entry_statuses: string[]
          timezone: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          workspace_id: string
          max_file_size_mb?: number
          allowed_mime_types?: string[]
          entry_statuses?: string[]
          timezone?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          workspace_id?: string
          max_file_size_mb?: number
          allowed_mime_types?: string[]
          entry_statuses?: string[]
          timezone?: string
          logo_url?: string | null
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
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
  }
}
