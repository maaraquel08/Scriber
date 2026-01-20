import type { TranscriptData, TranscriptWord, Speaker, TranscriptSegment } from "./types"
import { groupWordsIntoSegments, generateColorFromString } from "./utils"

// Predefined colors for speakers (up to 32 speakers as per ElevenLabs limit)
const SPEAKER_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#a855f7", // violet
  "#22c55e", // emerald
  "#eab308", // yellow
  "#f43f5e", // rose
  "#0ea5e9", // sky
  "#64748b", // slate
  "#78716c", // stone
  "#d97706", // amber-600
  "#059669", // emerald-600
  "#dc2626", // red-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#0891b2", // cyan-600
  "#65a30d", // lime-600
  "#ea580c", // orange-600
  "#4f46e5", // indigo-600
  "#0d9488", // teal-600
  "#9333ea", // purple-600
  "#be185d", // pink-700
  "#0369a1", // sky-700
  "#1e40af", // blue-700
]

interface ElevenLabsWord {
  text: string
  start: number
  end: number
  type: "word" | "spacing" | "audio_event"
  speaker_id?: string
  logprob?: number
}

interface ElevenLabsResponse {
  language_code: string
  language_probability: number
  text: string
  words: ElevenLabsWord[]
}

// Saved JSON format (camelCase)
interface SavedTranscriptResponse {
  languageCode: string
  languageProbability: number
  text: string
  words: Array<{
    text: string
    start: number
    end: number
    type: "word" | "spacing" | "audio_event"
    speakerId?: string
    logprob?: number
  }>
  transcriptionId?: string
}

/**
 * Transform ElevenLabs API response to our TranscriptData format
 */
export function transformElevenLabsResponse(
  response: ElevenLabsResponse
): TranscriptData {
  const words: TranscriptWord[] = response.words.map((word) => ({
    text: word.text,
    start: word.start,
    end: word.end,
    type: word.type === "audio_event" ? "word" : word.type, // Normalize audio_event to word
    speaker_id: word.speaker_id || "speaker_0", // Default to speaker_0 if no speaker_id
  }))

  return {
    language_code: response.language_code,
    language_probability: response.language_probability,
    text: response.text,
    words,
  }
}

/**
 * Extract unique speakers from transcript data and create Speaker objects
 */
export function extractSpeakersFromTranscript(
  transcriptData: TranscriptData
): Speaker[] {
  const speakerIds = new Set<string>()
  
  // Collect all unique speaker IDs
  transcriptData.words.forEach((word) => {
    if (word.speaker_id) {
      speakerIds.add(word.speaker_id)
    }
  })

  // Convert to array and sort for consistent ordering
  const sortedSpeakerIds = Array.from(speakerIds).sort()

  // Create Speaker objects with colors
  return sortedSpeakerIds.map((speakerId, index) => {
    const speakerNumber = index + 1
    const speakerName = `Speaker ${speakerNumber}`
    return {
      id: speakerId,
      name: speakerName,
      color: generateColorFromString(speakerName),
    }
  })
}

/**
 * Transform saved transcript JSON (camelCase or snake_case) to ElevenLabs format (snake_case)
 * Handles both formats for backward compatibility
 * Also adds spacing words if they're missing
 */
export function transformSavedTranscript(
  saved: SavedTranscriptResponse | any
): ElevenLabsResponse {
  // Handle both camelCase and snake_case formats
  const languageCode = saved.languageCode || saved.language_code || "en"
  const languageProbability = saved.languageProbability || saved.language_probability || 1.0
  const text = saved.text || ""
  
  // Transform words array, handling both formats
  let words = (saved.words || []).map((word: any) => ({
    text: word.text,
    start: word.start,
    end: word.end,
    type: word.type || "word",
    speaker_id: word.speakerId || word.speaker_id || "speaker_0",
    logprob: word.logprob,
  }))
  
  // Check if spacing words are missing and add them
  const hasSpacingWords = words.some((w: any) => w.type === "spacing")
  if (!hasSpacingWords && words.length > 0) {
    // Add spacing words between consecutive words
    const wordsWithSpacing: any[] = []
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      
      // Add spacing before word if there's a gap from previous word
      if (i > 0) {
        const prevWord = words[i - 1]
        const gap = word.start - prevWord.end
        
        // Add spacing if there's a gap (even small gaps should have spacing)
        if (gap > 0.01) {
          wordsWithSpacing.push({
            text: " ",
            start: prevWord.end,
            end: word.start,
            type: "spacing",
            speaker_id: word.speaker_id,
          })
        } else {
          // Even if no gap, add a space for proper rendering
          wordsWithSpacing.push({
            text: " ",
            start: prevWord.end,
            end: word.start,
            type: "spacing",
            speaker_id: word.speaker_id,
          })
        }
      }
      
      wordsWithSpacing.push(word)
    }
    words = wordsWithSpacing
  }
  
  return {
    language_code: languageCode,
    language_probability: languageProbability,
    text: text,
    words: words,
  }
}

/**
 * Transform ElevenLabs response to segments and speakers
 */
export function transformToSegmentsAndSpeakers(
  response: ElevenLabsResponse
): {
  transcriptData: TranscriptData
  segments: TranscriptSegment[]
  speakers: Speaker[]
} {
  const transcriptData = transformElevenLabsResponse(response)
  const segments = groupWordsIntoSegments(transcriptData.words)
  const speakers = extractSpeakersFromTranscript(transcriptData)

  return {
    transcriptData,
    segments,
    speakers,
  }
}
