import { transformSavedTranscript, transformToSegmentsAndSpeakers } from "./transformers"
import type { TranscriptData, TranscriptSegment, Speaker } from "./types"

const SAVED_TRANSCRIPT_ID = "ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4"

interface LoadedTranscriptData {
  transcriptData: TranscriptData
  segments: TranscriptSegment[]
  speakers: Speaker[]
  title: string
  language: string
}

/**
 * Load saved transcript JSON file
 */
export async function loadSavedTranscript(
  transcriptId: string = SAVED_TRANSCRIPT_ID
): Promise<LoadedTranscriptData | null> {
  try {
    // Load from public folder or data folder via API
    const response = await fetch(`/api/transcript/${transcriptId}`)
    
    if (!response.ok) {
      console.warn(`Failed to load transcript ${transcriptId}:`, response.statusText)
      return null
    }

    const savedData = await response.json()

    // Transform saved format to expected format
    const elevenLabsFormat = transformSavedTranscript(savedData)
    
    // Transform to segments and speakers
    const { transcriptData, segments, speakers } = transformToSegmentsAndSpeakers(elevenLabsFormat)

    // Generate title from transcript ID or use a default
    const title = `Transcript ${transcriptId.slice(0, 8)}...`

    return {
      transcriptData,
      segments,
      speakers,
      title,
      language: transcriptData.language_code,
    }
  } catch (error) {
    console.error("Error loading saved transcript:", error)
    return null
  }
}

/**
 * Get media file URL for a transcript ID
 * Tries multiple locations and file extensions
 * 
 * Place your media file in public/media/ with one of these names:
 * - {transcriptId}.mp4 (or .mov, .avi, .mkv, .webm for video)
 * - {transcriptId}.mp3 (or .wav, .m4a, .ogg for audio)
 * - test-media.mp4 (fallback name)
 */
export function getMediaFileUrl(
  transcriptId: string = SAVED_TRANSCRIPT_ID
): { url: string | null; type: string | null } {
  // Common video/audio extensions to try (in order of likelihood)
  const videoExtensions = ["mp4", "mov", "webm", "mkv", "avi"]
  const audioExtensions = ["mp3", "wav", "m4a", "ogg"]

  // Try video extensions first (most common for transcripts)
  for (const ext of videoExtensions) {
    const url = `/media/${transcriptId}.${ext}`
    const mimeType = ext === "mov" ? "video/quicktime" : 
                     ext === "webm" ? "video/webm" :
                     ext === "mkv" ? "video/x-matroska" :
                     ext === "avi" ? "video/x-msvideo" :
                     "video/mp4"
    // Return first video format (browser will handle 404 if file doesn't exist)
    return { url, type: mimeType }
  }

  // Fallback: try simpler name
  return { url: "/media/test-media.mp4", type: "video/mp4" }
}

export { SAVED_TRANSCRIPT_ID }
