"use client"

import { TranscriptSegmentComponent } from "./transcript-segment"
import type { TranscriptSegment, Speaker } from "@/lib/types"
import { useEffect, useRef } from "react"

interface TranscriptEditorProps {
  segments: TranscriptSegment[]
  speakers: Speaker[]
  onSegmentTextChange?: (segmentId: string, newText: string) => void
  currentTime?: number
  onSegmentClick?: (segment: TranscriptSegment) => void
}

export function TranscriptEditor({
  segments,
  speakers,
  onSegmentTextChange,
  currentTime = 0,
  onSegmentClick,
}: TranscriptEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastActiveSegmentId = useRef<string | null>(null)

  // Helper function to find speaker by ID from the actual speakers prop
  const getSpeakerById = (speakerId: string): Speaker | undefined => {
    return speakers.find((s) => s.id === speakerId)
  }

  // Auto-scroll to active segment
  useEffect(() => {
    if (!containerRef.current) return

    // Find the active segment
    const activeSegment = segments.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    )

    if (!activeSegment) return

    // Only scroll if the active segment changed
    if (lastActiveSegmentId.current === activeSegment.id) return
    lastActiveSegmentId.current = activeSegment.id

    // Find the segment element
    const segmentElement = containerRef.current.querySelector(
      `[data-segment-id="${activeSegment.id}"]`
    )

    if (segmentElement) {
      // Scroll to segment with smooth behavior
      segmentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [currentTime, segments])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-4 bg-background"
    >
      {segments.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No transcript segments available
        </div>
      ) : (
        segments.map((segment) => {
          const speaker = getSpeakerById(segment.speaker_id) || speakers[0]
          return (
            <TranscriptSegmentComponent
              key={segment.id}
              segment={segment}
              speaker={speaker}
              onTextChange={onSegmentTextChange}
              currentTime={currentTime}
              onSegmentClick={onSegmentClick}
            />
          )
        })
      )}
    </div>
  )
}
