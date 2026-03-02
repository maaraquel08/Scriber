import { NextRequest, NextResponse } from "next/server"
import { getMethodology, deleteMethodology } from "@/lib/supabase-db"
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

    const { id } = await params
    const methodology = await getMethodology(id)

    if (!methodology) {
      return NextResponse.json(
        { error: "Methodology not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(methodology)
  } catch (error) {
    console.error("Error getting methodology:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get methodology" },
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

    const { id: methodologyId } = await params
    
    // Check if methodology exists and belongs to user
    const existing = await getMethodology(methodologyId)
    if (!existing) {
      return NextResponse.json(
        { error: "Methodology not found" },
        { status: 404 }
      )
    }

    // Get all transcripts for this methodology to delete their media files
    const transcriptsResponse = await fetch(
      `${request.nextUrl.origin}/api/methodologies/${methodologyId}/transcripts`
    )
    let transcriptIds: string[] = []
    if (transcriptsResponse.ok) {
      const transcriptsData = await transcriptsResponse.json()
      transcriptIds = (transcriptsData.transcripts || []).map((t: any) => t.id)
    }

    // Delete methodology from database (this will cascade delete transcripts and facts)
    await deleteMethodology(methodologyId)

    // Delete associated media files for all transcripts
    const videoExtensions = ["mp4", "mov", "webm", "mkv", "avi"]
    const audioExtensions = ["mp3", "wav", "m4a", "ogg"]
    const allExtensions = [...videoExtensions, ...audioExtensions]

    for (const transcriptId of transcriptIds) {
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
    }

    return NextResponse.json({ 
      success: true,
      message: "Methodology deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting methodology:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete methodology" },
      { status: 500 }
    )
  }
}
