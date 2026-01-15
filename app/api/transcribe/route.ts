import { NextRequest, NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
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

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY is not configured")
      return NextResponse.json(
        {
          error:
            "Server configuration error: ElevenLabs API key is not set. Please configure ELEVENLABS_API_KEY in your environment variables.",
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Please use a smaller file.`,
        },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    // Check cache first
    const cachedResponse = getCachedResponse(file.name, file.size, file.type)
    if (cachedResponse) {
      console.log("Returning cached transcription response")
      return NextResponse.json(cachedResponse)
    }

    // Check file type
    const mimeType = file.type
    const isValidType = isVideoFile(mimeType) || isAudioFile(mimeType)
    
    // If MIME type is not available, try to infer from extension
    let inferredValid = false
    if (!isValidType) {
      const extension = file.name.split(".").pop()?.toLowerCase()
      const validExtensions = [
        "mp4",
        "mov",
        "avi",
        "mkv",
        "webm",
        "mp3",
        "wav",
        "m4a",
        "ogg",
        "flac",
        "aac",
      ]
      inferredValid = extension ? validExtensions.includes(extension) : false
    }

    if (!isValidType && !inferredValid) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${mimeType || "unknown"}. Please upload a video (MP4, MOV, AVI, etc.) or audio (MP3, WAV, M4A, etc.) file.`,
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let audioBuffer: Buffer = buffer
    let audioMimeType = mimeType

    // Extract audio from video if needed
    if (isVideoFile(mimeType)) {
      const tempDir = tmpdir()
      const videoPath = join(tempDir, `video_${Date.now()}_${file.name}`)
      const audioPath = join(tempDir, `audio_${Date.now()}.mp3`)

      try {
        // Write video to temp file
        await writeFile(videoPath, buffer)

        // Extract audio
        await extractAudioFromVideo(videoPath, audioPath)

        // Read extracted audio
        const { readFile } = await import("fs/promises")
        audioBuffer = await readFile(audioPath)
        audioMimeType = "audio/mpeg"

        // Clean up temp files
        await unlink(videoPath).catch(() => {})
        await unlink(audioPath).catch(() => {})
      } catch (error) {
        // Clean up on error
        await unlink(videoPath).catch(() => {})
        await unlink(audioPath).catch(() => {})

        // Check if error is about ffmpeg not being found
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("ffmpeg is not installed") || errorMessage.includes("Cannot find ffmpeg")) {
          // Return a clear error to the user
          return NextResponse.json(
            {
              error: "ffmpeg is not installed. Please install ffmpeg to process video files:\n\nOn macOS: brew install ffmpeg\n\nAfter installation, restart your development server.",
            },
            { status: 500 }
          )
        }

        // If ffmpeg fails for other reasons, try sending the video file directly
        // Some video formats might work with ElevenLabs
        console.warn("Audio extraction failed, trying video file directly:", error)
      }
    }

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey,
    })

    // Convert buffer to Blob for ElevenLabs
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: audioMimeType })

    // Call ElevenLabs Speech-to-Text API
    try {
      const transcription = await elevenlabs.speechToText.convert({
        file: audioBlob,
        modelId: "scribe_v2",
        tagAudioEvents: true,
        diarize: true,
        languageCode: undefined, // Auto-detect language
      })

      // Save to cache
      saveCachedResponse(file.name, file.size, file.type, transcription)

      return NextResponse.json(transcription)
    } catch (apiError) {
      console.error("ElevenLabs API error:", apiError)
      
      // Provide more specific error messages
      if (apiError instanceof Error) {
        if (apiError.message.includes("401") || apiError.message.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Invalid API key. Please check your ElevenLabs API key configuration." },
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
