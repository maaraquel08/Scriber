"use client"

import { EditorHeader } from "./components/header/editor-header"
import { TranscriptTabsContainer } from "./components/transcript/transcript-tabs-container"
import { SpeakersTimelineContainer } from "./components/timeline/speakers-timeline-container"
import { VideoPlayer } from "./components/sidebar/video-player"
import { GlobalProperties } from "./components/sidebar/global-properties"
import { MetadataPanel } from "./components/sidebar/metadata-panel"
import { ResearchMetadata } from "./components/sidebar/research-metadata"
import { FileUpload } from "./components/upload/file-upload"
import { TranscriptList } from "./components/upload/transcript-list"
import { transformToSegmentsAndSpeakers } from "@/lib/transformers"
import { loadSavedTranscript, getMediaFileUrl, SAVED_TRANSCRIPT_ID } from "@/lib/load-saved-data"
import { useState, useCallback, useEffect, useRef } from "react"
import type { TranscriptSegment, Speaker, TranscriptData, Fact } from "@/lib/types"

function calculateDuration(segments: TranscriptSegment[]): number {
  if (segments.length === 0) return 0
  return Math.max(...segments.map((s) => s.end))
}

/**
 * Generate a transcript ID based on file metadata
 * Uses a combination of filename, size, type, and timestamp for uniqueness
 */
async function generateTranscriptId(
  fileName: string,
  fileSize: number,
  fileType: string
): Promise<string> {
  // Create a unique identifier using file metadata and timestamp
  const timestamp = Date.now()
  const data = `${fileName}-${fileSize}-${fileType}-${timestamp}`
  
  // Use Web Crypto API for hashing (available in browser)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  
  return hashHex
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
  const [currentTranscriptId, setCurrentTranscriptId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Fact generation state
  const [dataType, setDataType] = useState<string>("")
  const [product, setProduct] = useState<string>("")
  const [feature, setFeature] = useState<string>("")
  const [facts, setFacts] = useState<Fact[]>([])
  const [isGeneratingFacts, setIsGeneratingFacts] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string>("all")

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
  
  // Filter facts by selected theme
  const filteredFacts = selectedTheme === "all" 
    ? facts 
    : facts.filter((fact) => fact.theme === selectedTheme)

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
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text()
            errorMessage = text || errorMessage
          } catch {
            // Fall back to status-based message
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Transform API response to our format
      const { transcriptData: newTranscriptData, segments: newSegments, speakers: newSpeakers } =
        transformToSegmentsAndSpeakers(data)

      setTranscriptData(newTranscriptData)
      setSegments(newSegments)
      setSpeakers(newSpeakers)
      setLanguage(newTranscriptData.language_code)
      const fileTitle = file.name.replace(/\.[^/.]+$/, "") // Remove file extension
      setTitle(fileTitle)

      // Generate transcript ID based on file name, size, and timestamp
      const transcriptId = await generateTranscriptId(file.name, file.size, file.type)

      // Store transcript ID for future updates
      setCurrentTranscriptId(transcriptId)

      // Auto-save transcript
      try {
        await fetch(`/api/transcript/${transcriptId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            languageCode: newTranscriptData.language_code,
            languageProbability: newTranscriptData.language_probability,
            text: newTranscriptData.text,
            words: newTranscriptData.words,
            title: fileTitle,
            fileName: file.name,
            fileType: file.type,
          }),
        })
        
        // Save media file to public/media folder
        try {
          const mediaFormData = new FormData()
          mediaFormData.append("file", file)
          await fetch(`/api/media/${transcriptId}`, {
            method: "POST",
            body: mediaFormData,
          })
          console.log("Media file saved successfully:", transcriptId)
          
          // Update file URL to use the saved media file
          setFileUrl(`/api/media/${transcriptId}`)
        } catch (mediaSaveError) {
          console.error("Failed to save media file:", mediaSaveError)
          // Don't throw - media saving is secondary
        }
        
        setLastSaved(new Date())
        console.log("Transcript saved successfully:", transcriptId)
      } catch (saveError) {
        console.error("Failed to save transcript:", saveError)
        // Don't throw - transcription succeeded, saving is secondary
      }
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

  const handleFactUpdate = useCallback((factId: string, updates: Partial<Fact>) => {
    setFacts((prev) =>
      prev.map((fact) =>
        fact.fact_id === factId
          ? { ...fact, ...updates }
          : fact
      )
    )
  }, [])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(2, Math.min(200, newZoom)))
  }, [])

  // Playback handlers
  // Only update state - let VideoPlayer's useEffect handle actual play/pause
  // This prevents feedback loops between state and video element events
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleTimeUpdate = useCallback((time: number) => {
    // Skip state updates while seeking to avoid choppiness
    if (isSeekingRef.current) return
    
    // Validate time value
    if (isNaN(time) || !isFinite(time) || time < 0) {
      return
    }
    
    setCurrentTime(time)
  }, [])

  const handleSeek = useCallback((time: number) => {
    // Mark as seeking to prevent timeupdate from causing state thrashing
    isSeekingRef.current = true
    setCurrentTime(time)
    
    if (videoRef.current) {
      const video = videoRef.current
      // Only seek if video is ready and has valid duration
      if (video.readyState >= 2 && !isNaN(video.duration) && video.duration > 0) {
        try {
          // Clamp time to valid range
          const clampedTime = Math.max(0, Math.min(time, video.duration))
          video.currentTime = clampedTime
        } catch (error) {
          console.error("Error seeking video:", error)
        }
      } else {
        // If video isn't ready, wait for it to load
        const handleCanPlay = () => {
          try {
            const clampedTime = Math.max(0, Math.min(time, video.duration))
            video.currentTime = clampedTime
          } catch (error) {
            console.error("Error seeking video after load:", error)
          }
          video.removeEventListener("canplay", handleCanPlay)
        }
        video.addEventListener("canplay", handleCanPlay, { once: true })
      }
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

  const handleGenerateFacts = useCallback(async () => {
    if (!dataType || !product || !feature) {
      setError("Please select Data Type, Product, and Feature before generating facts")
      return
    }

    if (!transcriptData) {
      setError("No transcript data available")
      return
    }

    setIsGeneratingFacts(true)
    setError(null)

    try {
      const response = await fetch("/api/facts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptData,
          dataType,
          product,
          feature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const generatedFacts = data.facts || []
      setFacts(generatedFacts)

      // Cache the generated facts
      if (generatedFacts.length > 0 && currentTranscriptId) {
        try {
          await fetch(`/api/facts/${currentTranscriptId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ facts: generatedFacts }),
          })
        } catch (cacheErr) {
          console.warn("Failed to cache facts:", cacheErr)
          // Non-critical - facts are still in state
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate facts"
      setError(errorMessage)
      console.error("Fact generation error:", err)
    } finally {
      setIsGeneratingFacts(false)
    }
  }, [dataType, product, feature, transcriptData, currentTranscriptId])

  const handleBackToUpload = useCallback(() => {
    // Clear all transcript-related state to show upload page
    setSegments([])
    setSpeakers([])
    setTranscriptData(null)
    setTitle("")
    setLanguage("")
    setFacts([])
    setFileUrl(null)
    setFileType(null)
    setUploadedFile(null)
    setError(null)
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  const handleLoadTranscript = useCallback(async (transcriptId: string) => {
    setIsLoadingSavedData(true)
    setError(null)

    try {
      const loadedData = await loadSavedTranscript(transcriptId)
      
      if (loadedData) {
        // Set transcript data
        setTranscriptData(loadedData.transcriptData)
        setSegments(loadedData.segments)
        setSpeakers(loadedData.speakers)
        setLanguage(loadedData.language)
        setTitle(loadedData.title)
        setCurrentTranscriptId(transcriptId)
        
        // Try to get updatedAt and fileType from the saved transcript
        try {
          const transcriptResponse = await fetch(`/api/transcript/${transcriptId}`)
          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json()
            if (transcriptData.updatedAt) {
              setLastSaved(new Date(transcriptData.updatedAt))
            }
            // Set file type from saved transcript if available
            if (transcriptData.fileType) {
              setFileType(transcriptData.fileType)
            }
          }
        } catch {
          // Ignore errors - last saved time is not critical
        }

        // Load media file URL (always uses local API route now)
        const { url: mediaUrl } = getMediaFileUrl(transcriptId)
        if (mediaUrl) {
          setFileUrl(mediaUrl)
        }

        // Load cached facts
        try {
          const factsResponse = await fetch(`/api/facts/${transcriptId}`)
          if (factsResponse.ok) {
            const factsData = await factsResponse.json()
            if (factsData.facts && factsData.facts.length > 0) {
              setFacts(factsData.facts)
            }
          }
        } catch (factsErr) {
          console.warn("Failed to load cached facts:", factsErr)
          // Non-critical - continue without cached facts
        }
      } else {
        setError("Failed to load transcript")
      }
    } catch (err) {
      console.error("Failed to load transcript:", err)
      setError(err instanceof Error ? err.message : "Failed to load transcript")
    } finally {
      setIsLoadingSavedData(false)
    }
  }, [])

  // Set loading to false on mount - always start on upload page
  useEffect(() => {
    setIsLoadingSavedData(false)
  }, [])

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
        <EditorHeader 
          segments={segments}
          speakers={speakers}
          facts={facts}
          title={title}
          languageCode={language}
          lastSaved={lastSaved}
        />
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 gap-8 overflow-y-auto">
          <div className="text-center">
            <div className="text-muted-foreground">Loading saved transcript...</div>
          </div>
          <TranscriptList
            onSelectTranscript={handleLoadTranscript}
            isLoading={true}
          />
        </div>
      </div>
    )
  }

  // Show upload UI when no transcript is loaded
  if (!hasTranscript) {
    return (
      <div className="flex h-screen flex-col">
        <EditorHeader 
          segments={segments}
          speakers={speakers}
          facts={facts}
          title={title}
          languageCode={language}
        />
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 gap-8 overflow-y-auto">
          <FileUpload
            onFileSelect={handleFileSelect}
            onTranscribe={handleTranscribe}
            isTranscribing={isTranscribing}
            error={error}
          />
          <TranscriptList
            onSelectTranscript={handleLoadTranscript}
            isLoading={isLoadingSavedData}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader 
        segments={segments}
        speakers={speakers}
        facts={facts}
        title={title}
        languageCode={language}
        onBack={handleBackToUpload}
        lastSaved={lastSaved}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Main transcript editor area */}
        <TranscriptTabsContainer
          segments={segments}
          speakers={speakers}
          facts={filteredFacts}
          isGeneratingFacts={isGeneratingFacts}
          onSegmentTextChange={handleSegmentTextChange}
          currentTime={currentTime}
          onSegmentClick={handleSegmentClick}
          onTimestampClick={handleSeek}
          onFactUpdate={handleFactUpdate}
        />

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
            <ResearchMetadata
              dataType={dataType}
              product={product}
              feature={feature}
              isGenerating={isGeneratingFacts}
              selectedTheme={selectedTheme}
              factsCount={facts.length}
              onDataTypeChange={setDataType}
              onProductChange={setProduct}
              onFeatureChange={setFeature}
              onThemeChange={setSelectedTheme}
              onGenerateFacts={handleGenerateFacts}
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
