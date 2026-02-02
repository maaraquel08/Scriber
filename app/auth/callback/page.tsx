"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {}
  hash
    .replace(/^#/, "")
    .split("&")
    .forEach((pair) => {
      const [k, v] = pair.split("=")
      if (k && v) params[k] = decodeURIComponent(v.replace(/\+/g, " "))
    })
  return params
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    const next = searchParams.get("next") ?? "/"
    const supabase = createSupabaseClient()

    const redirect = () => {
      router.replace(next)
      router.refresh()
    }

    // token_hash + type (no cookies needed; set in Supabase Dashboard → Auth → Email Templates)
    if (tokenHash && type === "email") {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: "email" })
        .then(({ error: verifyError }) => {
          if (verifyError) {
            setError(verifyError.message)
            return
          }
          redirect()
        })
        .catch(() => setError("Could not sign in"))
      return
    }

    // Implicit flow: tokens in hash (#access_token=...&refresh_token=...)
    if (typeof window !== "undefined" && window.location.hash) {
      const params = parseHashParams(window.location.hash)
      const accessToken = params.access_token
      const refreshToken = params.refresh_token
      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => {
            window.history.replaceState(null, "", window.location.pathname + window.location.search)
            redirect()
          })
          .catch(() => setError("Could not sign in"))
        return
      }
    }

    // PKCE: ?code= (code_verifier in cookies when link opened in same browser)
    const code = searchParams.get("code")
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error: exchangeError }) => {
          if (exchangeError) {
            setError(
              /code verifier|storage/i.test(exchangeError.message)
                ? "Open the link in the same browser where you requested it."
                : exchangeError.message
            )
            return
          }
          redirect()
        })
        .catch(() => setError("Open the link in the same browser where you requested it."))
      return
    }

    setError("Missing auth data or link expired")
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <a href="/auth/login" className="text-primary hover:underline text-sm">
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
