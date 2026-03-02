import { NextRequest, NextResponse } from "next/server"
import { AssemblyAI } from "assemblyai"
import ffmpeg from "fluent-ffmpeg"
import { writeFile, unlink } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { execSync } from "child_process"
import { Readable } from "stream"
import { getCachedResponse, saveCachedResponse } from "@/lib/cache-utils"

// Try to find ffmpeg in common locations
function findFfmpegPath(): string | null {
  const commonPaths = [
    "/opt/homebrew/bin/ffmpeg", // Apple Silicon Homebrew
    "/usr/local/bin/ffmpeg", // Intel Homebrew
    "/usr/bin/ffmpeg", // System installation
  ]

  for (const path of commonPaths) {
    try {
      if (existsSync(path)) {
        return path
      }
    } catch {
      // Continue searching
    }
  }

  // Try to find via which command
  try {
    const result = execSync("which ffmpeg", { encoding: "utf-8" }).trim()
    if (result) {
      return result
    }
  } catch {
    // ffmpeg not in PATH
  }

  return null
}

// Set ffmpeg path if found
const ffmpegPath = findFfmpegPath()
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith("video/")
}

function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith("audio/")
}

async function extractAudioFromVideo(
  videoPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(videoPath)
      .outputOptions(["-vn", "-acodec", "libmp3lame", "-ar", "44100", "-ac", "2"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => {
        // Check if the error is about ffmpeg not being found
        if (err.message.includes("Cannot find ffmpeg") || err.message.includes("ffmpeg")) {
          reject(new Error("ffmpeg is not installed or not in PATH. Please install ffmpeg: brew install ffmpeg"))
        } else {
          reject(err)
        }
      })
      .run()
  })
}

function bufferToStream(buffer: Buffer): Readable {
  return Readable.from(buffer)
}

/**
 * Transform AssemblyAI response to match ElevenLabs format for compatibility
 */
function transformAssemblyAIResponse(transcript: any) {
  // AssemblyAI returns timestamps in milliseconds, we need seconds
  // Also, speaker labels are "A", "B", etc., we'll convert to "speaker_0", "speaker_1"
  
  const words: any[] = []
  const speakerMap = new Map<string, string>()
  let speakerIndex = 0

  // Process all utterances and their words
  if (transcript.utterances && Array.isArray(transcript.utterances)) {
    let lastWordEnd = 0
    
    for (let utteranceIndex = 0; utteranceIndex < transcript.utterances.length; utteranceIndex++) {
      const utterance = transcript.utterances[utteranceIndex]
      const speakerLabel = utterance.speaker || "A"
      
      // Map speaker label to speaker_id format
      if (!speakerMap.has(speakerLabel)) {
        speakerMap.set(speakerLabel, `speaker_${speakerIndex}`)
        speakerIndex++
      }
      const speakerId = speakerMap.get(speakerLabel)!

      // Process words in this utterance
      if (utterance.words && Array.isArray(utterance.words)) {
        for (let i = 0; i < utterance.words.length; i++) {
          const word = utterance.words[i]
          const wordStart = word.start / 1000 // Convert milliseconds to seconds
          const wordEnd = word.end / 1000
          
          // Add spacing before word if there's a gap from previous word (within utterance or from previous utterance)
          if (i > 0) {
            const prevWord = utterance.words[i - 1]
            const prevEnd = prevWord.end / 1000
            const gap = wordStart - prevEnd
            
            // Always add spacing between words, even if gap is small
            if (gap > 0.01) {
              words.push({
                text: " ",
                start: prevEnd,
                end: wordStart,
                type: "spacing",
                speaker_id: speakerId,
              })
            } else {
              // Very small gap, still add a space for proper rendering
              words.push({
                text: " ",
                start: prevEnd,
                end: wordStart,
                type: "spacing",
                speaker_id: speakerId,
              })
            }
          } else if (utteranceIndex > 0 && lastWordEnd > 0) {
            // First word of a new utterance - add spacing from previous utterance
            const gap = wordStart - lastWordEnd
            if (gap > 0.01) {
              words.push({
                text: " ",
                start: lastWordEnd,
                end: wordStart,
                type: "spacing",
                speaker_id: speakerId,
              })
            }
          }
          
          // Add the word
          words.push({
            text: word.text,
            start: wordStart,
            end: wordEnd,
            type: "word",
            speaker_id: speakerId,
          })
          
          // Track last word end for next utterance
          lastWordEnd = wordEnd
        }
      }
    }
  } else if (transcript.words && Array.isArray(transcript.words)) {
    // Fallback: if words are at top level
    for (let i = 0; i < transcript.words.length; i++) {
      const word = transcript.words[i]
      const speakerLabel = word.speaker || "A"
      if (!speakerMap.has(speakerLabel)) {
        speakerMap.set(speakerLabel, `speaker_${speakerIndex}`)
        speakerIndex++
      }
      const speakerId = speakerMap.get(speakerLabel)!
      
      const wordStart = word.start / 1000
      const wordEnd = word.end / 1000
      
      // Add spacing before word if there's a gap from previous word
      if (i > 0) {
        const prevWord = transcript.words[i - 1]
        const prevEnd = prevWord.end / 1000
        const gap = wordStart - prevEnd
        
        // Always add spacing between words, even if gap is small
        if (gap > 0.01) {
          words.push({
            text: " ",
            start: prevEnd,
            end: wordStart,
            type: "spacing",
            speaker_id: speakerId,
          })
        } else {
          // Very small gap, still add a space for proper rendering
          words.push({
            text: " ",
            start: prevEnd,
            end: wordStart,
            type: "spacing",
            speaker_id: speakerId,
          })
        }
      }
      
      words.push({
        text: word.text,
        start: wordStart,
        end: wordEnd,
        type: "word",
        speaker_id: speakerId,
      })
    }
  }

  // Get language code (AssemblyAI uses language_code or language)
  const languageCode = transcript.language_code || transcript.language || "en"
  
  // Ensure we have at least an empty words array
  if (words.length === 0) {
    console.warn("No words found in AssemblyAI transcript response")
  }
  
  return {
    language_code: languageCode,
    language_probability: transcript.language_probability || 1.0,
    text: transcript.text || "",
    words: words,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Accept API key from header (user-provided) or fallback to env var
    const apiKey = request.headers.get("X-AssemblyAI-Key") || process.env.ASSEMBLY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key is not configured. Please add your API key in Settings." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { fileUrl, fileName, fileType } = body

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // Validate file type from fileName/fileType
    const mimeType: string = fileType || ""
    const extension = (fileName as string || "").split(".").pop()?.toLowerCase() || ""
    const validExtensions = ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "m4a", "ogg", "flac", "aac"]
    const isValidType = isVideoFile(mimeType) || isAudioFile(mimeType) || validExtensions.includes(extension)

    if (!isValidType) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType || extension || "unknown"}. Please upload a video or audio file.` },
        { status: 400 }
      )
    }

    // Initialize AssemblyAI client
    const client = new AssemblyAI({ apiKey })

    // Pass the public URL directly — AssemblyAI fetches the file itself.
    // This avoids sending the file through Vercel (which has a 4.5MB body limit).
    try {
      const transcript = await client.transcripts.transcribe({
        audio: fileUrl,
        speaker_labels: true,
        speech_models: ["universal"],
        language_code: "tl",
      })

      // Check if transcription completed successfully
      if (transcript.status === "error") {
        throw new Error(transcript.error || "Transcription failed")
      }

      if (transcript.status !== "completed") {
        throw new Error(`Transcription status: ${transcript.status}`)
      }

      // Transform AssemblyAI response to match ElevenLabs format for compatibility
      const transformedResponse = transformAssemblyAIResponse(transcript)

      // Save to cache
      saveCachedResponse(fileName, 0, fileType, transformedResponse)

      return NextResponse.json(transformedResponse)
    } catch (apiError) {
      console.error("AssemblyAI API error:", apiError)
      
      // Provide more specific error messages
      if (apiError instanceof Error) {
        if (apiError.message.includes("401") || apiError.message.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Invalid API key. Please check your AssemblyAI API key configuration." },
            { status: 401 }
          )
        }
        if (apiError.message.includes("429") || apiError.message.includes("rate limit")) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429 }
          )
        }
        if (apiError.message.includes("413") || apiError.message.includes("too large")) {
          return NextResponse.json(
            { error: "File is too large for transcription. Please use a smaller file." },
            { status: 413 }
          )
        }
      }

      return NextResponse.json(
        {
          error:
            apiError instanceof Error
              ? `Transcription failed: ${apiError.message}`
              : "Failed to transcribe file. Please try again.",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Server error: ${error.message}`
            : "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    )
  }
}
