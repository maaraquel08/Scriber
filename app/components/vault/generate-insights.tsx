"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface GenerateInsightsProps {
  isGenerating?: boolean
  factsCount?: number
  onGenerateInsights?: () => void
}

export function GenerateInsights({
  isGenerating = false,
  factsCount = 0,
  onGenerateInsights,
}: GenerateInsightsProps) {
  const canGenerate = factsCount > 0 && !isGenerating

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Generate Insights</h3>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Analyze all facts across transcripts to generate comprehensive insights and patterns.
        </p>
        <Button
          onClick={onGenerateInsights}
          disabled={!canGenerate}
          className="w-full"
          variant="default"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating Insights..." : "Generate Insights"}
        </Button>
        {factsCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {factsCount} {factsCount === 1 ? "fact" : "facts"} available
          </p>
        )}
      </div>
    </div>
  )
}
