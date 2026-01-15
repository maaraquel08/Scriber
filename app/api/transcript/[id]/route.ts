import { NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
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
