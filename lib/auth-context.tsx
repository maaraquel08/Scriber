"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createSupabaseClient } from "./supabase-client"
import type { User, Session, AuthError } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  sendMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // createSupabaseClient is called here (inside useEffect) so it only runs
    // in the browser — never during static prerendering at build time.
    let supabase: ReturnType<typeof createSupabaseClient>
    try {
      supabase = createSupabaseClient()
    } catch {
      setIsLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error.message)
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const sendMagicLink = async (email: string) => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.signOut()
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    sendMagicLink,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
