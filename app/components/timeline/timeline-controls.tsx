"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Plus } from "lucide-react"
import { useState, useEffect } from "react"

interface TimelineControlsProps {
  onPlay?: () => void
  onSpeedChange?: (speed: number) => void
  onZoomChange?: (zoom: number) => void
  onAddSegment?: () => void
  isPlaying?: boolean
  playbackSpeed?: number
}

export function TimelineControls({
  onPlay,
  onSpeedChange,
  onZoomChange,
  onAddSegment,
  isPlaying = false,
  playbackSpeed = 1.0,
}: TimelineControlsProps) {
  const [speed, setSpeed] = useState(playbackSpeed.toString())
  const [zoom, setZoom] = useState([100])

  useEffect(() => {
    setSpeed(playbackSpeed.toString())
  }, [playbackSpeed])

  function handleSpeedChange(value: string) {
    setSpeed(value)
    onSpeedChange?.(parseFloat(value))
  }

  function handleZoomChange(value: number[]) {
    setZoom(value)
    onZoomChange?.(value[0])
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2">
      <Button variant="outline" size="icon" onClick={onPlay}>
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Speed:</span>
        <Select value={speed} onValueChange={handleSpeedChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Zoom:</span>
        <Slider
          value={zoom}
          onValueChange={handleZoomChange}
          min={50}
          max={200}
          step={10}
          className="w-32"
        />
        <span className="text-sm text-muted-foreground w-12">{zoom[0]}%</span>
      </div>
      <Button variant="outline" size="sm" onClick={onAddSegment}>
        <Plus className="mr-2 h-4 w-4" />
        Add segment
      </Button>
    </div>
  )
}
