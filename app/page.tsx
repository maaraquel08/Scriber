"use client"

import { EditorHeader } from "./components/header/editor-header"
import { TranscriptEditor } from "./components/transcript/transcript-editor"
import { SpeakersTimelineContainer } from "./components/timeline/speakers-timeline-container"
import { VideoPlayer } from "./components/sidebar/video-player"
import { GlobalProperties } from "./components/sidebar/global-properties"
import { MetadataPanel } from "./components/sidebar/metadata-panel"
import { FileUpload } from "./components/upload/file-upload"
import { transformToSegmentsAndSpeakers } from "@/lib/transformers"
import { loadSavedTranscript, getMediaFileUrl, SAVED_TRANSCRIPT_ID } from "@/lib/load-saved-data"
import { useState, useCallback, useEffect, useRef } from "react"
import type { TranscriptSegment, Speaker, TranscriptData } from "@/lib/types"

function calculateDuration(segments: TranscriptSegment[]): number {
  if (segments.length === 0) return 0
  return Math.max(...segments.map((s) => s.end))
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null)
  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState("")
  const [zoom, setZoom] = useState(100)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

  // Ref for video/audio element (single source of truth)
  const videoRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  // Ref to track if we're currently seeking (to avoid state thrashing)
  const isSeekingRef = useRef(false)

  const hasTranscript = segments.length > 0
  const duration = calculateDuration(segments)

  const handleFileSelect = useCallback((file: File) => {
    // Clean up previous file URL to prevent memory leaks
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }

    setUploadedFile(file)
    setFileType(file.type)
    // Create object URL for video/audio player
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    setError(null)
  }, [fileUrl])

  const handleTranscribe = useCallback(async (file: File) => {
    setIsTranscribing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Transform ElevenLabs response to our format
      const { transcriptData: newTranscriptData, segments: newSegments, speakers: newSpeakers } =
        transformToSegmentsAndSpeakers(data)

      setTranscriptData(newTranscriptData)
      setSegments(newSegments)
      setSpeakers(newSpeakers)
      setLanguage(newTranscriptData.language_code)
      setTitle(file.name.replace(/\.[^/.]+$/, "")) // Remove file extension
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transcribe file"
      setError(errorMessage)
      console.error("Transcription error:", err)
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const handleSegmentTextChange = useCallback((segmentId: string, newText: string) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === segmentId ? { ...seg, text: newText } : seg))
    )
  }, [])

  const handleTimestampClick = useCallback((timestamp: number) => {
    // Scroll to segment at timestamp
    const segment = segments.find(
      (s) => s.start <= timestamp && s.end >= timestamp
    )
    if (segment) {
      const element = document.querySelector(`[data-segment-id="${segment.id}"]`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [segments])

  const handleSpeakerUpdate = useCallback((speakerId: string, updates: { name?: string; role?: string }) => {
    setSpeakers((prev) =>
      prev.map((speaker) =>
        speaker.id === speakerId
          ? { ...speaker, ...updates }
          : speaker
      )
    )
  }, [])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  // Playback handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    videoRef.current?.play()
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    videoRef.current?.pause()
  }, [])

  const handleTimeUpdate = useCallback((time: number) => {
    // Skip state updates while seeking to avoid choppiness
    if (isSeekingRef.current) return
    setCurrentTime(time)
  }, [])

  const handleSeek = useCallback((time: number) => {
    // Mark as seeking to prevent timeupdate from causing state thrashing
    isSeekingRef.current = true
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    // Clear seeking flag after a short delay to allow the seek to complete
    setTimeout(() => {
      isSeekingRef.current = false
    }, 100)
  }, [])

  const handleSegmentClick = useCallback((segment: TranscriptSegment) => {
    handleSeek(segment.start)
    // Highlighting happens automatically via currentTime update
    // Scroll to segment in transcript
    const element = document.querySelector(`[data-segment-id="${segment.id}"]`)
    element?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [handleSeek])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }, [])

  // Load saved transcript data on mount (only once)
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const loadedData = await loadSavedTranscript(SAVED_TRANSCRIPT_ID)
        
        if (loadedData && isMounted) {
          // Set transcript data
          setTranscriptData(loadedData.transcriptData)
          setSegments(loadedData.segments)
          setSpeakers(loadedData.speakers)
          setLanguage(loadedData.language)
          setTitle(loadedData.title)

          // Load media file URL
          const { url: mediaUrl, type: mediaType } = getMediaFileUrl(SAVED_TRANSCRIPT_ID)
          if (mediaUrl) {
            setFileUrl(mediaUrl)
            setFileType(mediaType)
          }
        }
      } catch (err) {
        console.error("Failed to load saved transcript:", err)
        // Fall through to show upload page
      } finally {
        if (isMounted) {
          setIsLoadingSavedData(false)
        }
      }
    }

    // Only load if we don't have transcript data yet
    if (segments.length === 0) {
      loadData()
    } else {
      setIsLoadingSavedData(false)
    }

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array - only run on mount

  // Cleanup file URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith("blob:")) {
        // Only revoke blob URLs (from file uploads), not public URLs
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  // Spacebar shortcut to toggle play/pause
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.code === "Space") {
        e.preventDefault() // Prevent page scroll
        if (isPlaying) {
          handlePause()
        } else {
          handlePlay()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, handlePlay, handlePause])

  // Show loading state while loading saved data
  if (isLoadingSavedData && !hasTranscript) {
    return (
      <div className="flex h-screen flex-col">
        <EditorHeader />
        <div className="flex flex-1 items-center justify-center bg-background p-8">
          <div className="text-center">
            <div className="text-muted-foreground">Loading saved transcript...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show upload UI when no transcript is loaded
  if (!hasTranscript) {
    return (
      <div className="flex h-screen flex-col">
        <EditorHeader />
        <div className="flex flex-1 items-center justify-center bg-background p-8">
          <FileUpload
            onFileSelect={handleFileSelect}
            onTranscribe={handleTranscribe}
            isTranscribing={isTranscribing}
            error={error}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Main transcript editor area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          <TranscriptEditor
            segments={segments}
            speakers={speakers}
            onSegmentTextChange={handleSegmentTextChange}
            currentTime={currentTime}
            onSegmentClick={handleSegmentClick}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-80 border-l flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            <VideoPlayer
              fileUrl={fileUrl}
              fileType={fileType}
              isPlaying={isPlaying}
              currentTime={currentTime}
              playbackSpeed={playbackSpeed}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onSpeedChange={handleSpeedChange}
              videoRef={videoRef}
            />
            <GlobalProperties
              title={title}
              onTitleChange={setTitle}
            />
            {transcriptData && (
              <MetadataPanel
                transcriptData={transcriptData}
                speakers={speakers}
                duration={duration}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom area: Speakers and Timeline */}
      <SpeakersTimelineContainer
        speakers={speakers}
        segments={segments}
        duration={duration}
        zoom={zoom}
        onSpeakerUpdate={handleSpeakerUpdate}
        onZoomChange={handleZoomChange}
        onPlay={isPlaying ? handlePause : handlePlay}
        isPlaying={isPlaying}
        onSpeedChange={handleSpeedChange}
        playbackSpeed={playbackSpeed}
        currentTime={currentTime}
        onSeek={handleSeek}
        onTimestampClick={handleSeek}
        onSegmentClick={handleSegmentClick}
      />
    </div>
  )
}
