"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transcript {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface TranscriptListProps {
  onSelectTranscript: (transcriptId: string) => void
  isLoading?: boolean
}

export function TranscriptList({ onSelectTranscript, isLoading: externalLoading }: TranscriptListProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTranscripts() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/transcripts")
        
        if (!response.ok) {
          throw new Error("Failed to load transcripts")
        }
        
        const data = await response.json()
        setTranscripts(data.transcripts || [])
      } catch (err) {
        console.error("Error fetching transcripts:", err)
        setError(err instanceof Error ? err.message : "Failed to load transcripts")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTranscripts()
  }, [])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading || externalLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Transcripts</CardTitle>
          <CardDescription>Previously uploaded transcripts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Transcripts</CardTitle>
          <CardDescription>Previously uploaded transcripts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (transcripts.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Transcripts</CardTitle>
          <CardDescription>Previously uploaded transcripts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No transcripts found. Upload your first video or audio file above.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Transcripts</CardTitle>
        <CardDescription>Previously uploaded transcripts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transcripts.map((transcript) => (
            <Button
              key={transcript.id}
              variant="outline"
              className={cn(
                "w-full justify-start h-auto p-4",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onSelectTranscript(transcript.id)}
            >
              <div className="flex items-start gap-3 w-full">
                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">{transcript.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(transcript.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
