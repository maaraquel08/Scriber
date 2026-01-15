import { transformSavedTranscript, transformToSegmentsAndSpeakers } from "./transformers"
import type { TranscriptData, TranscriptSegment, Speaker } from "./types"

const SAVED_TRANSCRIPT_ID = "ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4"

// Vercel Blob public URL for the media file
const VERCEL_BLOB_MEDIA_URL = "https://abqchsgwasooi2ho.public.blob.vercel-storage.com/%5BINVITATION%5D_%20Help%20shape%20our%20Attrition%20Dashboard%20%28Anna%20Patricia%20Lopez%29%20-%202026_01_15%2009_54%20PST%20-%20Recording.mp4"

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
 * 
 * For Vercel Blob storage:
 * - Public blob URLs can be used directly (no authentication needed)
 * - Supports range requests for video seeking out of the box
 * 
 * For local files (fallback):
 * - Uses API route to stream large files from public/media/
 * - Supports range requests for video seeking
 */
export function getMediaFileUrl(
  transcriptId: string = SAVED_TRANSCRIPT_ID
): { url: string | null; type: string | null } {
  // Use Vercel Blob public URL for the saved transcript
  if (transcriptId === SAVED_TRANSCRIPT_ID) {
    return { url: VERCEL_BLOB_MEDIA_URL, type: "video/mp4" }
  }
  
  // Fallback to local API route for other transcript IDs
  const url = `/api/media/${transcriptId}`
  return { url, type: "video/mp4" }
}

export { SAVED_TRANSCRIPT_ID }
