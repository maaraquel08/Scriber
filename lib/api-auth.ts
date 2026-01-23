import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./supabase-client"
import type { User } from "@supabase/supabase-js"

/**
 * Get the authenticated user from the request cookies
 * For use in API routes (Route Handlers)
 */
export async function getApiUser(): Promise<User | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
          // Can be ignored in API routes
        }
      },
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Check if user is authenticated, throw 401 response if not
 */
export async function requireAuth(): Promise<User> {
  const user = await getApiUser()
  
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  
  return user
}
