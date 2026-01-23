import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type Database } from "./supabase-client"

/**
 * Create a Supabase client for server-side usage (Server Components, Route Handlers)
 * This client handles auth sessions via cookies
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Get the current user from server-side
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error("Error getting server user:", error.message)
    return null
  }
  
  return user
}

/**
 * Get the current session from server-side
 */
export async function getServerSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error("Error getting server session:", error.message)
    return null
  }
  
  return session
}
