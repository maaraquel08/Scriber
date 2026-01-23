import { NextRequest, NextResponse } from "next/server"
import { getTranscript, saveTranscript, updateTranscript } from "@/lib/supabase-db"
import { getApiUser } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: transcriptId } = await params
    const transcript = await getTranscript(transcriptId, user.id)

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transcript)
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
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

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
      fileType,
      methodology 
    } = body

    // Validate required fields
    if (!words || !Array.isArray(words)) {
      return NextResponse.json(
        { error: "Invalid transcript data: words array is required" },
        { status: 400 }
      )
    }

    await saveTranscript(transcriptId, {
      languageCode: languageCode || "en",
      languageProbability: languageProbability || 1.0,
      text: text || "",
      words: words.map((word: any) => ({
        text: word.text,
        start: word.start,
        end: word.end,
        type: word.type || "word",
        speaker_id: word.speaker_id || word.speakerId,
      })),
      title: title || fileName || `Transcript ${transcriptId.slice(0, 8)}...`,
      fileName: fileName,
      fileType: fileType,
      methodology: methodology || null,
      userId: user.id,
    })

    return NextResponse.json({ 
      success: true, 
      id: transcriptId,
      message: "Transcript saved successfully" 
    })
  } catch (error) {
    console.error("Error saving transcript:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save transcript" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: transcriptId } = await params
    const body = await request.json()
    
    // Check if transcript exists and belongs to user
    const existing = await getTranscript(transcriptId, user.id)
    if (!existing) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      )
    }

    // Update only provided fields
    const updates: { title?: string; methodology?: string | null } = {}
    if (body.methodology !== undefined) {
      updates.methodology = body.methodology || null
    }
    if (body.title !== undefined) {
      updates.title = body.title
    }

    await updateTranscript(transcriptId, updates, user.id)

    // Return updated transcript
    const updated = await getTranscript(transcriptId, user.id)

    return NextResponse.json({ 
      success: true, 
      transcript: updated,
      message: "Transcript updated successfully" 
    })
  } catch (error) {
    console.error("Error updating transcript:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update transcript" },
      { status: 500 }
    )
  }
}
