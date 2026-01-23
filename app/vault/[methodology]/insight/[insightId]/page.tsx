"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"
import type { Insight, Fact } from "@/lib/types"

interface FactWithTranscript extends Fact {
  _transcriptId?: string
}

function getTypeColor(type: Insight["type"]): string {
  switch (type) {
    case "Behavioral":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    case "Functional":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    case "Need":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "Pain Point":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

function getStrengthColor(strength: Insight["strength"]): string {
  switch (strength) {
    case "Strong":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "Emerging":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

function getLevelColor(level: Insight["level"]): string {
  switch (level) {
    case "Principle":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
    case "Strategic":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400"
    case "Tactical":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export default function InsightDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const methodologyId = params.methodology as string
  const insightId = params.insightId as string
  const tab = searchParams.get("tab") || "insights"

  const [insight, setInsight] = useState<Insight | null>(null)
  const [allFacts, setAllFacts] = useState<FactWithTranscript[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Load insights for the methodology
        const insightsResponse = await fetch(`/api/methodologies/${methodologyId}/insights`)
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          const found = insightsData.insights?.find((i: Insight) => i.id === insightId)
          if (found) {
            setInsight(found)
          } else {
            setError("Insight not found")
          }
        }

        // Load transcripts and facts for navigation
        const transcriptsResponse = await fetch(`/api/methodologies/${methodologyId}/transcripts`)
        if (transcriptsResponse.ok) {
          const transcriptsData = await transcriptsResponse.json()
          const loadedTranscripts = transcriptsData.transcripts || []

          const factsPromises = loadedTranscripts.map(async (transcript: { id: string }) => {
            try {
              const factsResponse = await fetch(`/api/facts/${transcript.id}`)
              if (factsResponse.ok) {
                const factsData = await factsResponse.json()
                return (factsData.facts || []).map((fact: Fact) => ({
                  ...fact,
                  fact_id: `${transcript.id}_Facts_${fact.fact_id}`,
                  _transcriptId: transcript.id,
                }))
              }
            } catch (err) {
              console.error(`Error loading facts for ${transcript.id}:`, err)
            }
            return []
          })

          const factsArrays = await Promise.all(factsPromises)
          setAllFacts(factsArrays.flat())
        }
      } catch (err) {
        console.error("Error loading insight:", err)
        setError("Failed to load insight")
      } finally {
        setIsLoading(false)
      }
    }

    if (methodologyId && insightId) {
      loadData()
    }
  }, [methodologyId, insightId])

  function handleFactClick(factId: string) {
    const match = factId.match(/^(.+)_Facts_(.+)$/)
    if (match) {
      const [, transcriptId, originalFactId] = match
      const fact = allFacts.find((f) => f.fact_id === factId)
      if (fact && fact.timestamp) {
        const params = new URLSearchParams({
          timestamp: fact.timestamp,
          factId: originalFactId,
        })
        window.location.href = `/lab/${transcriptId}?${params.toString()}`
      } else {
        window.location.href = `/lab/${transcriptId}`
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !insight) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-destructive">{error || "Insight not found"}</div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/vault/${methodologyId}?tab=${tab}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {tab === "transcripts" ? "Transcripts" : "Insights"}
        </Button>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor(insight.level)}`}>
                {insight.level}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(insight.type)}`}>
                {insight.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStrengthColor(insight.strength)}`}>
                {insight.strength}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{insight.id}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Context</h3>
              <p className="text-base text-foreground leading-relaxed">{insight.context}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Cause</h3>
              <p className="text-base text-foreground leading-relaxed">{insight.cause}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Effect</h3>
              <p className="text-base text-foreground leading-relaxed">{insight.effect}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Relevance</h3>
              <p className="text-base text-foreground leading-relaxed">{insight.relevance}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Recommendation</h3>
              <p className="text-base text-foreground leading-relaxed">{insight.recommendation}</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Evidence ({insight.evidence.fact_ids.length} {insight.evidence.fact_ids.length === 1 ? "fact" : "facts"})
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {insight.evidence.fact_ids.map((factId, idx) => (
                  <Button
                    key={`${insight.id}-${factId}-${idx}`}
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => handleFactClick(factId)}
                  >
                    {factId.length > 30 ? `...${factId.slice(-20)}` : factId}
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </Button>
                ))}
              </div>

              {insight.evidence.supporting_quotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Supporting Quotes ({insight.evidence.supporting_quotes.length})
                  </h4>
                  <div className="space-y-3">
                    {insight.evidence.supporting_quotes.map((quote, idx) => (
                      <blockquote
                        key={idx}
                        className="text-sm italic border-l-2 border-primary pl-4 py-1 text-muted-foreground bg-muted/30 rounded-r"
                      >
                        "{quote}"
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
