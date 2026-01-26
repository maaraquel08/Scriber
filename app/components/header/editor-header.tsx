"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, MessageSquare, Download, FileText, Lightbulb, Trash2 } from "lucide-react"
import type { TranscriptSegment, Speaker, Fact } from "@/lib/types"

interface EditorHeaderProps {
  segments?: TranscriptSegment[]
  speakers?: Speaker[]
  facts?: Fact[]
  title?: string
  languageCode?: string
  onBack?: () => void
  lastSaved?: Date | null
  transcriptId?: string
  onDelete?: () => void
}

function downloadJSON(data: object, filename: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function EditorHeader({
  segments = [],
  speakers = [],
  facts = [],
  title = "transcript",
  languageCode = "en",
  onBack,
  lastSaved = null,
  transcriptId,
  onDelete,
}: EditorHeaderProps) {
  const hasTranscript = segments.length > 0
  const hasFacts = facts.length > 0

  function handleExportTranscript() {
    const transcriptExport = {
      title,
      language_code: languageCode,
      segments: segments.map((seg) => {
        const speaker = speakers.find((s) => s.id === seg.speaker_id)
        return {
          id: seg.id,
          speaker_id: seg.speaker_id,
          speaker_name: speaker?.name || seg.speaker_id,
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }
      }),
      speakers: speakers.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
      })),
    }
    
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_transcript.json`
    downloadJSON(transcriptExport, filename)
  }

  function handleExportFacts() {
    const factsExport = {
      facts: facts.map((fact) => ({
        fact_id: fact.fact_id,
        verbatim_quote: fact.verbatim_quote,
        timestamp: fact.timestamp,
        speaker_label: fact.speaker_label,
        sentiment: fact.sentiment,
        theme: fact.theme,
        summary_of_observation: fact.summary_of_observation,
      })),
    }
    
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_facts.json`
    downloadJSON(factsExport, filename)
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="icon" title="Back to upload" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hasTranscript && (
        <div className="text-sm text-muted-foreground">
          {lastSaved
            ? `Last saved ${lastSaved.toLocaleTimeString()}`
            : "Last saved never"}
        </div>
      )}
      {hasTranscript && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!hasTranscript}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportTranscript} disabled={!hasTranscript}>
                <FileText className="mr-2 h-4 w-4" />
                Download Transcript JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportFacts} disabled={!hasFacts}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Download Facts JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {transcriptId && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Transcript</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this transcript? This action cannot be undone and will also delete all associated facts and media files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </header>
  )
}
