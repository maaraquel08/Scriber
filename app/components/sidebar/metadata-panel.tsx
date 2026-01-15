"use client"

import { formatTime } from "@/lib/utils"
import type { TranscriptData, Speaker } from "@/lib/types"

interface MetadataPanelProps {
  transcriptData: TranscriptData
  speakers: Speaker[]
  duration: number
}

export function MetadataPanel({ transcriptData, speakers, duration }: MetadataPanelProps) {
  const wordCount = transcriptData.words.filter((w) => w.type === "word").length

  return (
    <div className="space-y-4 p-4 border-t">
      <h3 className="font-medium">Metadata</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">{formatTime(duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Speakers:</span>
          <span className="font-medium">{speakers.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Word count:</span>
          <span className="font-medium">{wordCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Language:</span>
          <span className="font-medium uppercase">{transcriptData.language_code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Language probability:</span>
          <span className="font-medium">{(transcriptData.language_probability * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
