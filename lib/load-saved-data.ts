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

    // Generate title from transcript data or use transcript ID
    let title = `Transcript ${transcriptId.slice(0, 8)}...`
    if (savedData.title) {
      title = savedData.title
    } else if (transcriptData.text) {
      // Use first few words as title
      const preview = transcriptData.text.slice(0, 50).trim()
      title = preview.length < transcriptData.text.length ? preview + "..." : preview
    }

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
 * Uses local API route to stream files from public/media/
 * Supports range requests for video seeking
 */
export function getMediaFileUrl(
  transcriptId: string = SAVED_TRANSCRIPT_ID
): { url: string | null; type: string | null } {
  // Use local API route for all transcript IDs
  const url = `/api/media/${transcriptId}`
  return { url, type: null } // Type will be detected by API route
}

export { SAVED_TRANSCRIPT_ID }
