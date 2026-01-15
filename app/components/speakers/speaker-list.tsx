"use client"

import { Button } from "@/components/ui/button"
import { SpeakerItem } from "./speaker-item"
import { Plus } from "lucide-react"
import type { Speaker } from "@/lib/types"

interface SpeakerListProps {
  speakers: Speaker[]
  onAddSpeaker?: () => void
  onSpeakerUpdate?: (speakerId: string, updates: { name?: string; role?: string }) => void
}

export function SpeakerList({
  speakers,
  onAddSpeaker,
  onSpeakerUpdate,
}: SpeakerListProps) {
  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <span className="font-medium">Speakers</span>
        <Button variant="ghost" size="icon" onClick={onAddSpeaker} title="Add speaker">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Body - flex column with no gaps for perfect alignment */}
      {/* Add padding-top to match timeline time markers height */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-10">
        {speakers.map((speaker) => (
          <SpeakerItem
            key={speaker.id}
            speaker={speaker}
            onUpdate={onSpeakerUpdate}
          />
        ))}
      </div>
    </div>
  )
}
