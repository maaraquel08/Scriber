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
 * Uses API route to stream large files (bypasses static file size limits)
 * 
 * Place your media file in public/media/ with one of these names:
 * - {transcriptId}.mp4 (or .mov, .avi, .mkv, .webm for video)
 * - {transcriptId}.mp3 (or .wav, .m4a, .ogg for audio)
 * - test-media.mp4 (fallback name)
 * 
 * The API route supports range requests for video seeking and handles large files
 * that may exceed static file serving limits in production.
 */
export function getMediaFileUrl(
  transcriptId: string = SAVED_TRANSCRIPT_ID
): { url: string | null; type: string | null } {
  // Use API route to stream media files
  // This bypasses static file size limits and supports range requests for seeking
  const url = `/api/media/${transcriptId}`
  
  // Default to video/mp4 - the API route will detect the actual file type
  // The browser will request the correct MIME type from the API
  return { url, type: "video/mp4" }
}

export { SAVED_TRANSCRIPT_ID }
