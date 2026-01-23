import { NextRequest, NextResponse } from "next/server"
import { listTranscriptsByMethodology } from "@/lib/supabase-db"
import { getApiUser } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", transcripts: [] },
        { status: 401 }
      )
    }

    const { id: methodologyId } = await params
    const transcripts = await listTranscriptsByMethodology(methodologyId, user.id)
    return NextResponse.json({ transcripts })
  } catch (error) {
    console.error("Error listing transcripts for methodology:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list transcripts", transcripts: [] },
      { status: 500 }
    )
  }
}
