"use client"

import { Play } from "lucide-react"
import { useEffect, useRef } from "react"

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
      /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(fileUrl)
    : false

  // Ref to track if we're programmatically controlling playback
  // This prevents event handlers from creating feedback loops
  const isProgrammaticControlRef = useRef(false)
  // Ref to track pending play promise to avoid interrupting it
  const playPromiseRef = useRef<Promise<void> | null>(null)

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

  // Handle timeupdate from video element
  useEffect(() => {
    if (!videoRef?.current) return

    const handleTimeUpdate = () => {
      if (videoRef.current && onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime)
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

    const element = videoRef.current
    element.addEventListener("timeupdate", handleTimeUpdate)
    element.addEventListener("play", handlePlay)
    element.addEventListener("pause", handlePause)

    return () => {
      element.removeEventListener("timeupdate", handleTimeUpdate)
      element.removeEventListener("play", handlePlay)
      element.removeEventListener("pause", handlePause)
    }
  }, [onTimeUpdate, onPlay, onPause, videoRef])

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
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          src={fileUrl}
          className="w-full h-full object-contain"
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
