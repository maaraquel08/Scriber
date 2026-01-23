import { NextResponse } from "next/server"
import { readdirSync, statSync, readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    const transcriptionsDir = join(process.cwd(), "data", "transcriptions")
    
    // Read all files in the transcriptions directory
    const files = readdirSync(transcriptionsDir)
    
    // Filter for JSON files (excluding -facts.json files)
    const transcriptFiles = files
      .filter((file) => file.endsWith(".json") && !file.endsWith("-facts.json"))
      .map((file) => {
        const transcriptId = file.replace(".json", "")
        const filePath = join(transcriptionsDir, file)
        const stats = statSync(filePath)
        
        // Try to read the transcript to get metadata
        let title = transcriptId.slice(0, 8) + "..."
        let createdAt = stats.birthtime
        
        try {
          const content = readFileSync(filePath, "utf-8")
          const transcriptData = JSON.parse(content)
          
          // Try to extract title from transcript data if available
          if (transcriptData.title) {
            title = transcriptData.title
          } else if (transcriptData.text) {
            // Use first few words as title
            const preview = transcriptData.text.slice(0, 50).trim()
            title = preview.length < transcriptData.text.length ? preview + "..." : preview
          }
        } catch {
          // If we can't read the file, use defaults
        }
        
        let methodology = null
        try {
          const content = readFileSync(filePath, "utf-8")
          const transcriptData = JSON.parse(content)
          methodology = transcriptData.methodology || null
        } catch {
          // If we can't read the file, use defaults
        }
        
        return {
          id: transcriptId,
          title,
          methodology,
          createdAt: createdAt.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ transcripts: transcriptFiles })
  } catch (error) {
    console.error("Error listing transcripts:", error)
    return NextResponse.json(
      { error: "Failed to list transcripts", transcripts: [] },
      { status: 500 }
    )
  }
}
