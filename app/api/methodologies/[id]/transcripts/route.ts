import { NextRequest, NextResponse } from "next/server"
import { readdirSync, statSync, readFileSync, existsSync } from "fs"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: methodologyId } = await params
    const transcriptionsDir = join(process.cwd(), "data", "transcriptions")
    
    if (!existsSync(transcriptionsDir)) {
      return NextResponse.json({ transcripts: [] })
    }
    
    const files = readdirSync(transcriptionsDir)
    
    const transcripts = files
      .filter((file) => file.endsWith(".json") && !file.endsWith("-facts.json"))
      .map((file) => {
        const transcriptId = file.replace(".json", "")
        const filePath = join(transcriptionsDir, file)
        const stats = statSync(filePath)
        
        let title = transcriptId.slice(0, 8) + "..."
        let methodology = null
        let duration = 0
        let factCount = 0
        
        try {
          const content = readFileSync(filePath, "utf-8")
          const transcriptData = JSON.parse(content)
          
          if (transcriptData.title) {
            title = transcriptData.title
          }
          methodology = transcriptData.methodology || null
          
          // Calculate duration from words
          if (transcriptData.words && transcriptData.words.length > 0) {
            const lastWord = transcriptData.words[transcriptData.words.length - 1]
            duration = lastWord.end || 0
          }
        } catch {
          // Use defaults
        }
        
        // Check for facts file
        const factsPath = join(transcriptionsDir, `${transcriptId}-facts.json`)
        if (existsSync(factsPath)) {
          try {
            const factsContent = readFileSync(factsPath, "utf-8")
            const factsData = JSON.parse(factsContent)
            // Facts file is an array, not an object with a facts property
            factCount = Array.isArray(factsData) ? factsData.length : (factsData.facts?.length || 0)
          } catch {
            // Ignore errors reading facts
          }
        }
        
        return {
          id: transcriptId,
          title,
          methodology,
          duration,
          factCount,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        }
      })
      .filter((t) => t.methodology === methodologyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ transcripts })
  } catch (error) {
    console.error("Error listing transcripts for methodology:", error)
    return NextResponse.json(
      { error: "Failed to list transcripts", transcripts: [] },
      { status: 500 }
    )
  }
}
