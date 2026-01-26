"use client"

import { EditorHeader } from "@/app/components/header/editor-header"
import { TranscriptTabsContainer } from "@/app/components/transcript/transcript-tabs-container"
import { SpeakersTimelineContainer } from "@/app/components/timeline/speakers-timeline-container"
import { VideoPlayer } from "@/app/components/sidebar/video-player"
import { GlobalProperties } from "@/app/components/sidebar/global-properties"
import { MetadataPanel } from "@/app/components/sidebar/metadata-panel"
import { ResearchMetadata } from "@/app/components/sidebar/research-metadata"
import { ResizablePanel } from "@/app/components/ui/resizable-panel"
import { transformToSegmentsAndSpeakers } from "@/lib/transformers"
import { loadSavedTranscript } from "@/lib/load-saved-data"
import { parseTimestampToSeconds } from "@/lib/utils"
import { useState, useCallback, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import type { TranscriptSegment, Speaker, TranscriptData, Fact } from "@/lib/types"
import { getApiConfig } from "@/lib/api-config"

function calculateDuration(segments: TranscriptSegment[]): number {
  if (segments.length === 0) return 0
  return Math.max(...segments.map((s) => s.end))
}

export default function SynthesisLabPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const transcriptId = params.transcriptId as string

  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null)
  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState("")
  const [zoom, setZoom] = useState(100)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [methodology, setMethodology] = useState<string | null>(null)

  // Fact generation state
  const [dataType, setDataType] = useState<string>("")
  const [product, setProduct] = useState<string>("")
  const [feature, setFeature] = useState<string>("")
  const [facts, setFacts] = useState<Fact[]>([])
  const [isGeneratingFacts, setIsGeneratingFacts] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("transcript")

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)

  // Ref for video/audio element
  const videoRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const isSeekingRef = useRef(false)
  const targetSeekTimeRef = useRef<number | null>(null)

  const duration = calculateDuration(segments)
  
  // Filter facts by selected theme
  const filteredFacts = selectedTheme === "all" 
    ? facts 
    : facts.filter((fact) => fact.theme === selectedTheme)

  const handleSegmentTextChange = useCallback((segmentId: string, newText: string) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === segmentId ? { ...seg, text: newText } : seg))
    )
  }, [])

  const handleTimestampClick = useCallback((timestamp: number) => {
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

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleTimeUpdate = useCallback((time: number) => {
    // Skip updates while seeking to prevent resetting to 0
    if (isSeekingRef.current) return
    
    // Skip if time is invalid
    if (isNaN(time) || !isFinite(time) || time < 0) {
      return
    }
    
    // If we have a target seek time and video jumped backwards significantly, restore it
    if (targetSeekTimeRef.current !== null) {
      const targetTime = targetSeekTimeRef.current
      if (Math.abs(time - targetTime) > 1 && time < targetTime - 1) {
        // Video reset to earlier time, restore the seek position
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            videoRef.current.currentTime = Math.min(targetTime, videoRef.current.duration || targetTime)
          } catch (error) {
            // Ignore seek errors
          }
        }
        return
      }
    }
    
    // Only update if the time change is reasonable (not a sudden jump to 0)
    // This prevents the video from resetting to 0 when playback starts
    setCurrentTime((prevTime) => {
      // If we're jumping backwards more than 5 seconds, it's likely a reset - ignore it
      if (prevTime > 5 && time < prevTime - 5) {
        return prevTime
      }
      return time
    })
  }, [])

  const handleSeek = useCallback((time: number) => {
    isSeekingRef.current = true
    targetSeekTimeRef.current = time
    setCurrentTime(time)
    
    if (videoRef.current) {
      const video = videoRef.current
      const clampedTime = Math.max(0, time)
      
      const performSeek = () => {
        try {
          if (video.duration > 0) {
            const finalTime = Math.min(clampedTime, video.duration)
            video.currentTime = finalTime
          } else {
            video.currentTime = clampedTime
          }
          // Ensure the time stays set even after seeking completes
          setTimeout(() => {
            if (videoRef.current && targetSeekTimeRef.current !== null) {
              const targetTime = targetSeekTimeRef.current
              if (Math.abs(videoRef.current.currentTime - targetTime) > 0.5) {
                // Time was reset, restore it
                videoRef.current.currentTime = Math.min(targetTime, videoRef.current.duration || targetTime)
              }
            }
          }, 100)
        } catch (error) {
          console.error("Error seeking video:", error)
        }
      }
      
      if (video.readyState >= 2 && !isNaN(video.duration) && video.duration > 0) {
        performSeek()
      } else {
        // Video not ready yet - wait for it to load
        const handleCanPlay = () => {
          performSeek()
          video.removeEventListener("canplay", handleCanPlay)
          video.removeEventListener("loadedmetadata", handleCanPlay)
        }
        // Listen to both events to catch when video is ready
        video.addEventListener("canplay", handleCanPlay, { once: true })
        video.addEventListener("loadedmetadata", handleCanPlay, { once: true })
      }
    }
    
    setTimeout(() => {
      isSeekingRef.current = false
      targetSeekTimeRef.current = null
    }, 500)
  }, [])

  const handleSegmentClick = useCallback((segment: TranscriptSegment) => {
    handleSeek(segment.start)
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
      const apiConfig = getApiConfig()
      const response = await fetch("/api/facts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": apiConfig.geminiKey || "",
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
      if (generatedFacts.length > 0 && transcriptId) {
        try {
          await fetch(`/api/facts/${transcriptId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ facts: generatedFacts }),
          })
        } catch (cacheErr) {
          console.warn("Failed to cache facts:", cacheErr)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate facts"
      setError(errorMessage)
      console.error("Fact generation error:", err)
    } finally {
      setIsGeneratingFacts(false)
    }
  }, [dataType, product, feature, transcriptData, transcriptId])

  const handleBack = useCallback(() => {
    if (methodology) {
      router.push(`/vault/${methodology}`)
    } else {
      router.push("/")
    }
  }, [router, methodology])

  const handleDelete = useCallback(async () => {
    if (!transcriptId) return

    try {
      const response = await fetch(`/api/transcript/${transcriptId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete transcript" }))
        throw new Error(errorData.error || "Failed to delete transcript")
      }

      // Navigate back after successful deletion
      if (methodology) {
        router.push(`/vault/${methodology}`)
      } else {
        router.push("/")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete transcript"
      setError(errorMessage)
      console.error("Delete error:", err)
    }
  }, [transcriptId, router, methodology])

  // Load transcript data
  useEffect(() => {
    async function loadTranscript() {
      if (!transcriptId) {
        setError("No transcript ID provided")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loadedData = await loadSavedTranscript(transcriptId)
        
        if (loadedData) {
          setTranscriptData(loadedData.transcriptData)
          setSegments(loadedData.segments)
          setSpeakers(loadedData.speakers)
          setLanguage(loadedData.language)
          setTitle(loadedData.title)
          
          // Try to get updatedAt and fileType from the saved transcript
          try {
            const transcriptResponse = await fetch(`/api/transcript/${transcriptId}`)
            if (transcriptResponse.ok) {
              const transcriptData = await transcriptResponse.json()
              if (transcriptData.updatedAt) {
                setLastSaved(new Date(transcriptData.updatedAt))
              }
              if (transcriptData.fileType) {
                setFileType(transcriptData.fileType)
              }
              if (transcriptData.methodology) {
                setMethodology(transcriptData.methodology)
              }
            }
          } catch {
            // Ignore errors
          }

          // Load video from API route (saved to public/media/)
          // Check if video exists by trying to fetch it
          const { getMediaFileUrl } = await import("@/lib/load-saved-data")
          const mediaUrl = getMediaFileUrl(transcriptId)
          if (mediaUrl.url) {
            // Verify the media file exists before setting URL
            try {
              const mediaCheck = await fetch(mediaUrl.url, { method: "HEAD" })
              if (mediaCheck.ok) {
                setFileUrl(mediaUrl.url)
              } else {
                console.warn(`Media file not found for transcript ${transcriptId}`)
                // Don't set fileUrl if media doesn't exist - video player will handle gracefully
              }
            } catch (err) {
              console.warn(`Error checking media file:`, err)
              // Don't set fileUrl if check fails
            }
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
          }
        } else {
          setError("Failed to load transcript")
        }
      } catch (err) {
        console.error("Failed to load transcript:", err)
        setError(err instanceof Error ? err.message : "Failed to load transcript")
      } finally {
        setIsLoading(false)
      }
    }

    loadTranscript()
  }, [transcriptId])

  // Handle timestamp parameter from URL (e.g., ?timestamp=00:04:47)
  useEffect(() => {
    const timestampParam = searchParams.get("timestamp")
    const factIdParam = searchParams.get("factId")
    
    if (timestampParam && segments.length > 0) {
      // Parse timestamp (HH:MM:SS format) to seconds
      const seconds = parseTimestampToSeconds(timestampParam)
      if (seconds > 0) {
        // Wait for video to be ready before seeking
        const performSeek = () => {
          if (videoRef.current) {
            const video = videoRef.current
            // Check if video is ready
            if (video.readyState >= 2) {
              // Video is ready, seek immediately
              handleSeek(seconds)
              scrollTimelineAndHandleFact(seconds, factIdParam)
            } else {
              // Wait for video to load
              const handleReady = () => {
                handleSeek(seconds)
                scrollTimelineAndHandleFact(seconds, factIdParam)
                video.removeEventListener("canplay", handleReady)
                video.removeEventListener("loadedmetadata", handleReady)
              }
              video.addEventListener("canplay", handleReady, { once: true })
              video.addEventListener("loadedmetadata", handleReady, { once: true })
            }
          } else {
            // Video ref not ready yet, try again after a short delay
            setTimeout(performSeek, 100)
          }
        }
        
        const scrollTimelineAndHandleFact = (seekSeconds: number, factId: string | null) => {
          // Scroll timeline to show playhead position
          setTimeout(() => {
            // Find the timeline scroll container (the parent div with overflow-x-auto)
            const timelineContainer = document.querySelector('.border-t.flex.bg-background [class*="overflow-x-auto"]') as HTMLElement
            if (timelineContainer && duration > 0 && zoom > 0) {
              // Calculate playhead position in pixels based on zoom
              const timelineWidthPx = duration * zoom
              const playheadPositionPx = (seekSeconds / duration) * timelineWidthPx
              // Scroll to center the playhead in the viewport
              const containerWidth = timelineContainer.clientWidth
              const scrollPosition = Math.max(0, playheadPositionPx - containerWidth / 2)
              timelineContainer.scrollTo({
                left: scrollPosition,
                behavior: "smooth",
              })
            }
          }, 500)
          
          // If factId is provided, switch to facts tab and scroll to the fact
          if (factId && facts.length > 0) {
            setActiveTab("facts")
            setTimeout(() => {
              // Try to find fact by original fact_id (without prefix)
              const factElement = document.querySelector(`[data-fact-id="${factId}"]`)
              if (factElement) {
                factElement.scrollIntoView({ behavior: "smooth", block: "center" })
                // Highlight the fact briefly
                factElement.classList.add("ring-2", "ring-primary", "ring-offset-2")
                setTimeout(() => {
                  factElement.classList.remove("ring-2", "ring-primary", "ring-offset-2")
                }, 2000)
              }
            }, 1000)
          }
        }
        
        performSeek()
        
        // Remove timestamp and factId from URL after handling
        setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams.toString())
          newSearchParams.delete("timestamp")
          newSearchParams.delete("factId")
          const newUrl = newSearchParams.toString()
          router.replace(`/lab/${transcriptId}${newUrl ? `?${newUrl}` : ""}`, { scroll: false })
        }, 2000)
      }
    }
  }, [searchParams, segments.length, transcriptId, router, facts.length, handleSeek, duration, zoom, videoRef])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl)
        // Also remove from sessionStorage
        sessionStorage.removeItem(`media_blob_${transcriptId}`)
      }
    }
  }, [fileUrl, transcriptId])

  // Spacebar shortcut to toggle play/pause
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.code === "Space") {
        e.preventDefault()
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

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <EditorHeader 
          segments={segments}
          speakers={speakers}
          facts={facts}
          title={title}
          languageCode={language}
          onBack={handleBack}
        />
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-8">
          <div className="text-center">
            <div className="text-muted-foreground">Loading transcript...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error && segments.length === 0) {
    return (
      <div className="flex h-screen flex-col">
        <EditorHeader 
          segments={segments}
          speakers={speakers}
          facts={facts}
          title={title}
          languageCode={language}
          onBack={handleBack}
        />
        <div className="flex flex-1 flex-col items-center justify-center bg-background p-8">
          <div className="text-center">
            <div className="text-destructive mb-4">{error}</div>
            <button
              onClick={handleBack}
              className="text-primary hover:underline"
            >
              Go back
            </button>
          </div>
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
        onBack={handleBack}
        lastSaved={lastSaved}
        transcriptId={transcriptId}
        onDelete={handleDelete}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Main transcript editor area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <TranscriptTabsContainer
            segments={segments}
            speakers={speakers}
            facts={filteredFacts}
            isGeneratingFacts={isGeneratingFacts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSegmentTextChange={handleSegmentTextChange}
            currentTime={currentTime}
            onSegmentClick={handleSegmentClick}
            onTimestampClick={handleSeek}
            onFactUpdate={handleFactUpdate}
          />
        </div>

        {/* Right sidebar - resizable */}
        <ResizablePanel
          defaultWidth={320}
          minWidth={200}
          maxWidth={800}
          className="border-l bg-background"
        >
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
        </ResizablePanel>
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
