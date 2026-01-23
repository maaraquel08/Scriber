"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, Check, ExternalLink, LogOut, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getApiConfig, setApiConfig } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut, isLoading: authLoading } = useAuth()
  const [assemblyAiKey, setAssemblyAiKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [showAssemblyKey, setShowAssemblyKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const config = getApiConfig()
    setAssemblyAiKey(config.assemblyAiKey)
    setGeminiKey(config.geminiKey)
    setIsLoaded(true)
  }, [])

  const handleSave = () => {
    setApiConfig({
      assemblyAiKey,
      geminiKey,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await signOut()
      if (!error) {
        router.push("/auth/login")
      }
    } finally {
      setIsSigningOut(false)
    }
  }

  const assemblyConfigured = Boolean(assemblyAiKey)
  const geminiConfigured = Boolean(geminiKey)

  if (!isLoaded || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and API keys</p>
          </div>
        </div>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Your account information and session management.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email || "Not signed in"}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Enter your API keys to enable transcription and AI features. Your keys are stored locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AssemblyAI Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="assembly-key">AssemblyAI API Key</Label>
                <div className="flex items-center gap-2">
                  {assemblyConfigured ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Configured
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not configured</span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="assembly-key"
                  type={showAssemblyKey ? "text" : "password"}
                  value={assemblyAiKey}
                  onChange={(e) => setAssemblyAiKey(e.target.value)}
                  placeholder="Enter your AssemblyAI API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowAssemblyKey(!showAssemblyKey)}
                >
                  {showAssemblyKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for audio/video transcription.{" "}
                <a
                  href="https://www.assemblyai.com/dashboard/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Get your key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Gemini Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <div className="flex items-center gap-2">
                  {geminiConfigured ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Configured
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not configured</span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for fact extraction and insight generation.{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Get your key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button onClick={handleSave} className="w-full">
                {saved ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Security Notice</p>
              <p>
                Your API keys are stored locally in your browser and are never sent to our servers. 
                They are only used to make direct requests to AssemblyAI and Google AI services.
                Avoid using this on shared or public computers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
