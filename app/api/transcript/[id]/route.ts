import { NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptId } = await params
    const transcriptPath = join(
      process.cwd(),
      "data",
      "transcriptions",
      `${transcriptId}.json`
    )

    if (!existsSync(transcriptPath)) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      )
    }

    const fileContent = readFileSync(transcriptPath, "utf-8")
    const transcriptData = JSON.parse(fileContent)

    return NextResponse.json(transcriptData)
  } catch (error) {
    console.error("Error loading transcript:", error)
    return NextResponse.json(
      { error: "Failed to load transcript" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptId } = await params
    const body = await request.json()
    
    // Extract transcript data, title, and optional media file info
    const { 
      languageCode, 
      languageProbability, 
      text, 
      words, 
      title,
      fileName,
      fileType 
    } = body

    // Validate required fields
    if (!words || !Array.isArray(words)) {
      return NextResponse.json(
        { error: "Invalid transcript data: words array is required" },
        { status: 400 }
      )
    }

    // Prepare saved transcript format (camelCase for consistency)
    const savedTranscript = {
      languageCode: languageCode || "en",
      languageProbability: languageProbability || 1.0,
      text: text || "",
      words: words.map((word: any) => ({
        text: word.text,
        start: word.start,
        end: word.end,
        type: word.type || "word",
        speakerId: word.speaker_id,
        logprob: word.logprob,
      })),
      title: title || fileName || `Transcript ${transcriptId.slice(0, 8)}...`,
      fileName: fileName,
      fileType: fileType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Ensure data/transcriptions directory exists
    const transcriptionsDir = join(process.cwd(), "data", "transcriptions")
    mkdirSync(transcriptionsDir, { recursive: true })

    // Save transcript to file
    const transcriptPath = join(transcriptionsDir, `${transcriptId}.json`)
    writeFileSync(transcriptPath, JSON.stringify(savedTranscript, null, 2), "utf-8")

    return NextResponse.json({ 
      success: true, 
      id: transcriptId,
      message: "Transcript saved successfully" 
    })
  } catch (error) {
    console.error("Error saving transcript:", error)
    return NextResponse.json(
      { error: "Failed to save transcript" },
      { status: 500 }
    )
  }
}
