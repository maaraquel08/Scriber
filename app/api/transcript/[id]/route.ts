import { NextRequest, NextResponse } from "next/server"
import { getTranscript, saveTranscript, updateTranscript, deleteTranscript } from "@/lib/supabase-db"
import { getApiUser } from "@/lib/api-auth"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

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
    const transcript = await getTranscript(transcriptId)

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
    const existing = await getTranscript(transcriptId)
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

    await updateTranscript(transcriptId, updates)

    // Return updated transcript
    const updated = await getTranscript(transcriptId)

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

export async function DELETE(
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
    
    // Check if transcript exists and belongs to user
    const existing = await getTranscript(transcriptId)
    if (!existing) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      )
    }

    // Delete transcript from database
    await deleteTranscript(transcriptId)

    // Delete associated media file if it exists
    const videoExtensions = ["mp4", "mov", "webm", "mkv", "avi"]
    const audioExtensions = ["mp3", "wav", "m4a", "ogg"]
    const allExtensions = [...videoExtensions, ...audioExtensions]

    for (const ext of allExtensions) {
      const mediaPath = join(process.cwd(), "public", "media", `${transcriptId}.${ext}`)
      if (existsSync(mediaPath)) {
        try {
          await unlink(mediaPath)
        } catch (err) {
          console.warn(`Failed to delete media file ${mediaPath}:`, err)
          // Continue even if file deletion fails
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Transcript deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting transcript:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete transcript" },
      { status: 500 }
    )
  }
}
