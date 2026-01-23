import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-client"
import { getApiUser } from "@/lib/api-auth"

export async function GET() {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", transcripts: [] },
        { status: 401 }
      )
    }

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from("transcripts")
      .select("id, title, methodology_id, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to list transcripts: ${error.message}`)
    }

    const transcripts = (data || []).map((transcript) => ({
      id: transcript.id,
      title: transcript.title,
      methodology: transcript.methodology_id,
      createdAt: transcript.created_at,
      updatedAt: transcript.updated_at,
    }))
    
    return NextResponse.json({ transcripts })
  } catch (error) {
    console.error("Error listing transcripts:", error)
    return NextResponse.json(
      { error: "Failed to list transcripts", transcripts: [] },
      { status: 500 }
    )
  }
}
