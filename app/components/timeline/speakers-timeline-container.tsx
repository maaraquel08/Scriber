"use client"

import { SpeakerList } from "../speakers/speaker-list"
import { TimelineControls } from "./timeline-controls"
import { AudioTimeline } from "./audio-timeline"
import type { TranscriptSegment, Speaker } from "@/lib/types"

interface SpeakersTimelineContainerProps {
  speakers: Speaker[]
  segments: TranscriptSegment[]
  duration: number
  zoom: number
  onSpeakerUpdate?: (speakerId: string, updates: { name?: string; role?: string }) => void
  onZoomChange?: (zoom: number) => void
  onPlay?: () => void
  onSpeedChange?: (speed: number) => void
  playbackSpeed?: number
  isPlaying?: boolean
  currentTime?: number
  onSeek?: (time: number) => void
  onTimestampClick?: (timestamp: number) => void
  onSegmentClick?: (segment: TranscriptSegment) => void
  onAddSpeaker?: () => void
  onAddSegment?: () => void
}

export function SpeakersTimelineContainer({
  speakers,
  segments,
  duration,
  zoom,
  onSpeakerUpdate,
  onZoomChange,
  onPlay,
  onSpeedChange,
  playbackSpeed = 1.0,
  isPlaying = false,
  currentTime = 0,
  onSeek,
  onTimestampClick,
  onSegmentClick,
  onAddSpeaker,
  onAddSegment,
}: SpeakersTimelineContainerProps) {
  return (
    <div className="border-t flex bg-background h-fit">
      {/* Speakers Section */}
      <div className="w-80 border-r bg-muted/20 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <SpeakerList
            speakers={speakers}
            onSpeakerUpdate={onSpeakerUpdate}
            onAddSpeaker={onAddSpeaker}
          />
        </div>
      </div>

      {/* Timeline Section */}
      <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
        {/* Action Controls - matches Speakers header height */}
        <div className="shrink-0">
          <TimelineControls
            zoom={zoom}
            onZoomChange={onZoomChange}
            onPlay={onPlay}
            isPlaying={isPlaying}
            onSpeedChange={onSpeedChange}
            playbackSpeed={playbackSpeed}
            onAddSegment={onAddSegment}
          />
        </div>

        {/* Timeline Body - aligns with Speakers body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AudioTimeline
            segments={segments}
            speakers={speakers}
            duration={duration}
            zoom={zoom}
            currentTime={currentTime}
            onTimestampClick={onTimestampClick}
            onSegmentClick={onSegmentClick}
            onSeek={onSeek}
          />
        </div>
      </div>
    </div>
  )
}
