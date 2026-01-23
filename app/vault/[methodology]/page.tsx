"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { VaultHeader } from "@/app/components/vault/vault-header"
import { TranscriptList } from "@/app/components/vault/transcript-list"
import { GenerateInsights } from "@/app/components/vault/generate-insights"
import { InsightsPanel } from "@/app/components/insights/insights-panel"
import { ResizablePanel } from "@/app/components/ui/resizable-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Methodology, Fact, Insight } from "@/lib/types"
import { getApiConfig } from "@/lib/api-config"

interface Transcript {
  id: string
  title: string
  duration: number
  factCount: number
  createdAt: string
  updatedAt: string
}

interface FactWithTranscript extends Fact {
  _transcriptId?: string
}

export default function VaultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const methodologyId = params.methodology as string
  
  const [methodology, setMethodology] = useState<Methodology | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [allFacts, setAllFacts] = useState<FactWithTranscript[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize activeTab from URL or default to "transcripts"
  const tabFromUrl = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabFromUrl || "transcripts")
  
  // Sync tab with URL when it changes
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && (tab === "transcripts" || tab === "insights")) {
      setActiveTab(tab)
    }
  }, [searchParams])
  
  // Update URL when tab changes
  function handleTabChange(value: string) {
    setActiveTab(value)
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set("tab", value)
    router.replace(`/vault/${methodologyId}?${newSearchParams.toString()}`, { scroll: false })
  }

  useEffect(() => {
    async function loadData() {
      try {
        // Load methodology
        const methodologyResponse = await fetch("/api/methodologies")
        if (methodologyResponse.ok) {
          const data = await methodologyResponse.json()
          const found = data.methodologies?.find((m: Methodology) => m.id === methodologyId)
          if (found) {
            setMethodology(found)
          } else {
            setError("Methodology not found")
          }
        }

        // Load transcripts
        const transcriptsResponse = await fetch(
          `/api/methodologies/${methodologyId}/transcripts`
        )
        if (transcriptsResponse.ok) {
          const transcriptsData = await transcriptsResponse.json()
          const loadedTranscripts = transcriptsData.transcripts || []
          setTranscripts(loadedTranscripts)

          // Load all facts from all transcripts and prefix with transcript ID
          const factsPromises = loadedTranscripts.map(async (transcript: Transcript) => {
            try {
              const factsResponse = await fetch(`/api/facts/${transcript.id}`)
              if (factsResponse.ok) {
                const factsData = await factsResponse.json()
                // Prefix each fact_id with transcript ID for uniqueness
                return (factsData.facts || []).map((fact: Fact) => ({
                  ...fact,
                  fact_id: `${transcript.id}_Facts_${fact.fact_id}`,
                  _transcriptId: transcript.id, // Store original transcript ID for navigation
                }))
              }
            } catch (err) {
              console.error(`Error loading facts for ${transcript.id}:`, err)
            }
            return []
          })

          const factsArrays = await Promise.all(factsPromises)
          const allFactsData = factsArrays.flat()
          setAllFacts(allFactsData)
        }

        // Load insights for the methodology
        try {
          const insightsResponse = await fetch(`/api/methodologies/${methodologyId}/insights`)
          if (insightsResponse.ok) {
            const insightsData = await insightsResponse.json()
            if (insightsData.insights && insightsData.insights.length > 0) {
              setInsights(insightsData.insights)
            }
          }
        } catch (insightsErr) {
          console.warn("Failed to load insights:", insightsErr)
        }
      } catch (err) {
        console.error("Error loading vault data:", err)
        setError("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    if (methodologyId) {
      loadData()
    }
  }, [methodologyId])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !methodology) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-destructive">{error || "Methodology not found"}</div>
      </div>
    )
  }

  const transcriptCount = transcripts.length
  const factCount = transcripts.reduce((sum, t) => sum + (t.factCount || 0), 0)

  const handleGenerateInsights = async () => {
    if (allFacts.length === 0) {
      setError("No facts available to generate insights")
      return
    }

    setIsGeneratingInsights(true)
    setError(null)

    try {
      // Use default values for dataType, product, feature
      // These could be stored in methodology metadata in the future
      const dataType = "Usability Test"
      const product = "Web App"
      const feature = "Dashboard"

      const apiConfig = getApiConfig()
      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": apiConfig.geminiKey || "",
        },
        body: JSON.stringify({
          facts: allFacts,
          dataType,
          product,
          feature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const generatedInsights = data.insights || []
      setInsights(generatedInsights)

      // Cache the generated insights at methodology level
      if (generatedInsights.length > 0 && methodologyId) {
        try {
          await fetch(`/api/methodologies/${methodologyId}/insights`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              insight_summary: data.insight_summary,
              insights: generatedInsights,
            }),
          })
        } catch (cacheErr) {
          console.warn("Failed to cache insights:", cacheErr)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate insights"
      setError(errorMessage)
      console.error("Insights generation error:", err)
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const handleInsightFactClick = (factId: string) => {
    // Parse fact ID format: {transcriptId}_Facts_{originalFactId}
    const match = factId.match(/^(.+)_Facts_(.+)$/)
    if (match) {
      const [, transcriptId, originalFactId] = match
      
      // Find the fact to get timestamp
      const fact = allFacts.find((f) => f.fact_id === factId)
      if (fact && fact.timestamp) {
        // Navigate to lab page with timestamp and factId parameters
        const params = new URLSearchParams({
          timestamp: fact.timestamp,
          factId: originalFactId, // Use original fact ID for finding in facts panel
        })
        window.location.href = `/lab/${transcriptId}?${params.toString()}`
      } else {
        // Fallback: navigate without timestamp
        window.location.href = `/lab/${transcriptId}`
      }
    } else {
      // Fallback for old format (backward compatibility)
      const fact = allFacts.find((f) => f.fact_id === factId)
      if (fact && fact._transcriptId) {
        const params = new URLSearchParams()
        if (fact.timestamp) {
          params.set("timestamp", fact.timestamp)
          // Try to extract original fact ID if possible
          const originalMatch = fact.fact_id.match(/Facts_(.+)$/)
          if (originalMatch) {
            params.set("factId", originalMatch[1])
          }
        }
        const queryString = params.toString()
        const url = `/lab/${fact._transcriptId}${queryString ? `?${queryString}` : ""}`
        window.location.href = url
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <VaultHeader
        methodology={methodology}
        transcriptCount={transcriptCount}
        factCount={factCount}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="container mx-auto flex-1 px-6 py-8 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="transcripts">
                Transcripts
                {transcripts.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {transcripts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="insights">
                Insights
                {insights.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {insights.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="transcripts" className="mt-0">
              <TranscriptList transcripts={transcripts} />
            </TabsContent>
            <TabsContent value="insights" className="mt-0">
              <InsightsPanel
                insights={insights}
                isLoading={false}
                isGenerating={isGeneratingInsights}
                onGenerateInsights={handleGenerateInsights}
                onFactClick={handleInsightFactClick}
              />
            </TabsContent>
          </Tabs>
        </main>

        <ResizablePanel
          defaultWidth={320}
          minWidth={200}
          maxWidth={800}
          className="border-l bg-background"
        >
          <div className="p-4 space-y-4">
            <GenerateInsights
              isGenerating={isGeneratingInsights}
              factsCount={allFacts.length}
              onGenerateInsights={handleGenerateInsights}
            />
          </div>
        </ResizablePanel>
      </div>
    </div>
  )
}
