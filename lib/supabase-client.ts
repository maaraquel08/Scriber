import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

// Database types (will be generated from Supabase schema)
export interface Database {
  public: {
    Tables: {
      transcripts: {
        Row: {
          id: string
          title: string
          text: string
          language_code: string
          language_probability: number
          words: any
          file_name: string | null
          file_type: string | null
          methodology_id: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          text: string
          language_code?: string
          language_probability?: number
          words: any
          file_name?: string | null
          file_type?: string | null
          methodology_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          text?: string
          language_code?: string
          language_probability?: number
          words?: any
          file_name?: string | null
          file_type?: string | null
          methodology_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      facts: {
        Row: {
          id: string
          transcript_id: string
          fact_id: string
          verbatim_quote: string
          timestamp: string
          speaker_label: string
          sentiment: "Positive" | "Neutral" | "Negative"
          theme: string
          summary_of_observation: string
          created_at: string
        }
        Insert: {
          id?: string
          transcript_id: string
          fact_id: string
          verbatim_quote: string
          timestamp: string
          speaker_label: string
          sentiment: "Positive" | "Neutral" | "Negative"
          theme: string
          summary_of_observation: string
          created_at?: string
        }
        Update: {
          id?: string
          transcript_id?: string
          fact_id?: string
          verbatim_quote?: string
          timestamp?: string
          speaker_label?: string
          sentiment?: "Positive" | "Neutral" | "Negative"
          theme?: string
          summary_of_observation?: string
          created_at?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          id: string
          methodology_id: string
          insight_id: string
          level: "Principle" | "Strategic" | "Tactical"
          type: "Behavioral" | "Functional" | "Need" | "Pain Point"
          strength: "Strong" | "Emerging"
          context: string
          cause: string
          effect: string
          relevance: string
          evidence: any
          recommendation: string
          insight_summary: any | null
          created_at: string
        }
        Insert: {
          id?: string
          methodology_id: string
          insight_id: string
          level: "Principle" | "Strategic" | "Tactical"
          type: "Behavioral" | "Functional" | "Need" | "Pain Point"
          strength: "Strong" | "Emerging"
          context: string
          cause: string
          effect: string
          relevance: string
          evidence: any
          recommendation: string
          insight_summary?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          methodology_id?: string
          insight_id?: string
          level?: "Principle" | "Strategic" | "Tactical"
          type?: "Behavioral" | "Functional" | "Need" | "Pain Point"
          strength?: "Strong" | "Emerging"
          context?: string
          cause?: string
          effect?: string
          relevance?: string
          evidence?: any
          recommendation?: string
          insight_summary?: any | null
          created_at?: string
        }
        Relationships: []
      }
      methodologies: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
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

// Type aliases for convenience
export type TranscriptRow = Database["public"]["Tables"]["transcripts"]["Row"]
export type TranscriptInsert = Database["public"]["Tables"]["transcripts"]["Insert"]
export type FactRow = Database["public"]["Tables"]["facts"]["Row"]
export type FactInsert = Database["public"]["Tables"]["facts"]["Insert"]
export type MethodologyRow = Database["public"]["Tables"]["methodologies"]["Row"]
export type MethodologyInsert = Database["public"]["Tables"]["methodologies"]["Insert"]
export type InsightRow = Database["public"]["Tables"]["insights"]["Row"]
export type InsightInsert = Database["public"]["Tables"]["insights"]["Insert"]

// Singleton browser client
let browserClient: SupabaseClient<Database> | null = null

/**
 * Create a Supabase client for browser/client-side usage
 * This client handles auth sessions automatically
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    )
  }

  // Return singleton for browser (PKCE so magic link uses ?code=; code_verifier stored in cookies)
  if (typeof window !== "undefined") {
    if (!browserClient) {
      browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: { flowType: "pkce", detectSessionInUrl: true },
      })
    }
    return browserClient
  }

  // Server-side: create new client each time
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

/**
 * Server-side Supabase client (uses service role key for admin operations)
 * This bypasses RLS - use carefully
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get the current authenticated user from the browser client
 */
export async function getCurrentUser() {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error("Error getting user:", error.message)
    return null
  }
  
  return user
}

/**
 * Get the current session from the browser client
 */
export async function getSession() {
  const supabase = createSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error("Error getting session:", error.message)
    return null
  }
  
  return session
}

// Default export for client-side usage
export default createSupabaseClient
