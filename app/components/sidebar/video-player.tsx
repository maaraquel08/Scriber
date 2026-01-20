"use client"

import { Play, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface VideoPlayerProps {
  fileUrl?: string | null
  fileType?: string | null
  isPlaying?: boolean
  currentTime?: number
  playbackSpeed?: number
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (time: number) => void
  onSpeedChange?: (speed: number) => void
  videoRef?: React.RefObject<HTMLVideoElement | HTMLAudioElement | null>
}

export function VideoPlayer({
  fileUrl,
  fileType,
  isPlaying = false,
  currentTime = 0,
  playbackSpeed = 1.0,
  onPlay,
  onPause,
  onTimeUpdate,
  onSpeedChange,
  videoRef,
}: VideoPlayerProps) {
  // Determine if it's a video based on file type or URL extension
  const isVideo = fileUrl
    ? fileType?.startsWith("video/") ||
      /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(fileUrl) ||
      /\/api\/media\//.test(fileUrl) // Assume API media routes are videos
    : false

  // Ref to track if we're programmatically controlling playback
  // This prevents event handlers from creating feedback loops
  const isProgrammaticControlRef = useRef(false)
  // Ref to track pending play promise to avoid interrupting it
  const playPromiseRef = useRef<Promise<void> | null>(null)
  
  // Track video loading state
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Sync playback state
  useEffect(() => {
    if (!videoRef?.current) return

    const video = videoRef.current

    if (isPlaying) {
      isProgrammaticControlRef.current = true
      // Only call play if we're not already playing
      if (video.paused) {
        playPromiseRef.current = video.play()
        playPromiseRef.current
          .then(() => {
            playPromiseRef.current = null
            setTimeout(() => {
              isProgrammaticControlRef.current = false
            }, 0)
          })
          .catch((err) => {
            // Ignore AbortError - this happens when play() is interrupted by pause()
            // which is expected behavior when user quickly toggles play/pause
            if (err.name !== 'AbortError') {
              console.error('Play error:', err)
            }
            playPromiseRef.current = null
            isProgrammaticControlRef.current = false
          })
      } else {
        isProgrammaticControlRef.current = false
      }
    } else {
      // Only pause if there's no pending play request
      // This prevents the "play() interrupted by pause()" error
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          if (!isPlaying && videoRef.current) {
            isProgrammaticControlRef.current = true
            videoRef.current.pause()
            setTimeout(() => {
              isProgrammaticControlRef.current = false
            }, 0)
          }
        }).catch(() => {
          // Play was already aborted, no need to pause
        })
      } else if (!video.paused) {
        isProgrammaticControlRef.current = true
        video.pause()
        setTimeout(() => {
          isProgrammaticControlRef.current = false
        }, 0)
      }
    }
  }, [isPlaying, videoRef])

  // NOTE: We intentionally do NOT sync currentTime here during playback.
  // The video element is the source of truth for time during playback.
  // Seeking is handled by handleSeek in page.tsx which directly sets video.currentTime.
  // Syncing currentTime here would cause a feedback loop and choppy playback.

  // Sync playback speed
  useEffect(() => {
    if (!videoRef?.current) return
    videoRef.current.playbackRate = playbackSpeed
  }, [playbackSpeed, videoRef])

  // Ensure video element is ready and force initial timeupdate
  useEffect(() => {
    if (!videoRef?.current || !fileUrl) return
    
    const video = videoRef.current
    
    // Force an initial timeupdate when video is ready
    const handleCanPlayThrough = () => {
      if (onTimeUpdate && video.currentTime >= 0) {
        onTimeUpdate(video.currentTime)
      }
    }
    
    // Also check periodically if timeupdate isn't firing (fallback)
    const intervalId = setInterval(() => {
      if (video && !video.paused && onTimeUpdate) {
        const currentTime = video.currentTime
        if (!isNaN(currentTime) && isFinite(currentTime) && currentTime >= 0) {
          onTimeUpdate(currentTime)
        }
      }
    }, 100) // Check every 100ms as fallback
    
    video.addEventListener("canplaythrough", handleCanPlayThrough)
    
    return () => {
      video.removeEventListener("canplaythrough", handleCanPlayThrough)
      clearInterval(intervalId)
    }
  }, [fileUrl, videoRef, onTimeUpdate])

  // Handle timeupdate from video element
  // Re-run effect when fileUrl changes to ensure event listeners are attached to the new video element
  useEffect(() => {
    if (!videoRef?.current) return

    const handleTimeUpdate = () => {
      if (videoRef.current && onTimeUpdate) {
        const currentTime = videoRef.current.currentTime
        // Only update if time is valid and video is playing
        if (!isNaN(currentTime) && isFinite(currentTime) && currentTime >= 0) {
          onTimeUpdate(currentTime)
        }
      }
    }
    
    // Also listen for seeking events to update time immediately
    const handleSeeking = () => {
      if (videoRef.current && onTimeUpdate) {
        const currentTime = videoRef.current.currentTime
        if (!isNaN(currentTime) && isFinite(currentTime) && currentTime >= 0) {
          onTimeUpdate(currentTime)
        }
      }
    }

    const handlePlay = () => {
      // Skip if this is from programmatic control (prevent feedback loop)
      if (isProgrammaticControlRef.current) return
      if (onPlay) onPlay()
    }

    const handlePause = () => {
      // Skip if this is from programmatic control (prevent feedback loop)
      if (isProgrammaticControlRef.current) return
      if (onPause) onPause()
    }

    const handleLoadedMetadata = () => {
      setIsLoading(false)
      setHasError(false)
    }

    const handleLoadedData = () => {
      setIsLoading(false)
    }

    const handleError = (e: Event) => {
      setIsLoading(false)
      setHasError(true)
      const video = e.target as HTMLVideoElement
      console.error("Video error:", {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        src: video.src,
      })
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }

    const element = videoRef.current
    element.addEventListener("timeupdate", handleTimeUpdate, { passive: true })
    element.addEventListener("seeking", handleSeeking, { passive: true })
    element.addEventListener("seeked", handleSeeking, { passive: true })
    element.addEventListener("play", handlePlay)
    element.addEventListener("pause", handlePause)
    element.addEventListener("loadedmetadata", handleLoadedMetadata)
    element.addEventListener("loadeddata", handleLoadedData)
    element.addEventListener("error", handleError)
    element.addEventListener("loadstart", handleLoadStart)

    return () => {
      element.removeEventListener("timeupdate", handleTimeUpdate)
      element.removeEventListener("seeking", handleSeeking)
      element.removeEventListener("seeked", handleSeeking)
      element.removeEventListener("play", handlePlay)
      element.removeEventListener("pause", handlePause)
      element.removeEventListener("loadedmetadata", handleLoadedMetadata)
      element.removeEventListener("loadeddata", handleLoadedData)
      element.removeEventListener("error", handleError)
      element.removeEventListener("loadstart", handleLoadStart)
    }
  }, [onTimeUpdate, onPlay, onPause, videoRef, fileUrl]) // Add fileUrl to dependencies

  // NOTE: We no longer handle onSeeked events here because:
  // 1. Seeking is initiated from the timeline and handled by directly setting videoRef.currentTime in page.tsx
  // 2. Having onSeeked call onSeek creates a feedback loop (seek -> onSeeked -> onSeek -> seek...)
  // 3. This feedback loop was causing choppy video playback when clicking timestamps

  if (!fileUrl) {
    return (
      <div className="relative aspect-video w-full bg-black rounded-lg flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/20 p-8">
            <Play className="h-12 w-12 text-white ml-1" fill="white" />
          </div>
        </div>
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white text-sm text-center p-4">
              <p>Failed to load video</p>
              <p className="text-xs text-white/70 mt-2">{fileUrl}</p>
            </div>
          </div>
        )}
        <video
          key={fileUrl} // Force re-mount when URL changes
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          src={fileUrl}
          className="w-full h-full object-contain"
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget
            console.log("Video metadata loaded:", {
              duration: video.duration,
              readyState: video.readyState,
              src: video.src,
            })
            setIsLoading(false)
            setHasError(false)
          }}
          onCanPlay={(e) => {
            const video = e.currentTarget
            console.log("Video can play:", {
              duration: video.duration,
              currentTime: video.currentTime,
            })
            setIsLoading(false)
          }}
          onError={(e) => {
            const video = e.currentTarget
            console.error("Video error:", {
              error: video.error,
              code: video.error?.code,
              message: video.error?.message,
              src: video.src,
            })
            setIsLoading(false)
            setHasError(true)
          }}
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg flex items-center justify-center overflow-hidden">
      <audio
        ref={videoRef as React.RefObject<HTMLAudioElement>}
        src={fileUrl}
        className="w-full"
      />
    </div>
  )
}
