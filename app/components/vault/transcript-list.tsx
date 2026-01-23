"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

interface Transcript {
  id: string
  title: string
  duration: number
  factCount: number
  createdAt: string
  updatedAt: string
}

interface TranscriptListProps {
  transcripts: Transcript[]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export function TranscriptList({ transcripts }: TranscriptListProps) {
  const router = useRouter()

  if (transcripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground mb-2 font-medium">No transcripts yet</p>
        <p className="text-muted-foreground text-sm">
          Upload a file to get started with transcription
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transcripts.map((transcript) => (
        <Card
          key={transcript.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push(`/lab/${transcript.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-1 line-clamp-2">{transcript.title}</CardTitle>
                <CardDescription className="text-xs mb-2">
                  {formatDate(transcript.createdAt)}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(transcript.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>{transcript.factCount} {transcript.factCount === 1 ? "fact" : "facts"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
