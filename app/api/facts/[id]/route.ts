import { NextRequest, NextResponse } from "next/server"
import { getFacts, saveFacts, getTranscript } from "@/lib/supabase-db"
import { getApiUser } from "@/lib/api-auth"
import type { Fact } from "@/lib/types"

/**
 * GET /api/facts/[id]
 * Load cached facts for a transcript
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", facts: [] },
        { status: 401 }
      )
    }

    const { id: transcriptId } = await params
    
    // Verify user owns this transcript
    const transcript = await getTranscript(transcriptId, user.id)
    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found", facts: [] },
        { status: 404 }
      )
    }

    const facts = await getFacts(transcriptId)
    return NextResponse.json({ facts })
  } catch (error) {
    console.error("Error loading cached facts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load cached facts", facts: [] },
      { status: 500 }
    )
  }
}

/**
 * POST /api/facts/[id]
 * Save facts to cache
 */
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
    
    // Verify user owns this transcript
    const transcript = await getTranscript(transcriptId, user.id)
    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { facts } = body

    if (!Array.isArray(facts)) {
      return NextResponse.json(
        { error: "Facts must be an array" },
        { status: 400 }
      )
    }

    const result = await saveFacts(transcriptId, facts as Fact[])
    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("Error saving facts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save facts" },
      { status: 500 }
    )
  }
}
