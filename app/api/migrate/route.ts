import { NextResponse } from "next/server"
import { createMethodology } from "@/lib/methodology-utils"
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

export async function POST() {
  try {
    // Create "Attrition Usability Testing" methodology
    const methodology = createMethodology(
      "Attrition Usability Testing",
      "Usability testing focused on user attrition patterns"
    )
    console.log(`Created methodology: ${methodology.id}`)

    const transcriptionsDir = join(process.cwd(), "data", "transcriptions")

    if (!existsSync(transcriptionsDir)) {
      return NextResponse.json({
        success: true,
        message: "No transcriptions directory found",
        methodologyId: methodology.id,
      })
    }

    const files = readdirSync(transcriptionsDir)
    const transcriptFiles = files.filter(
      (file) => file.endsWith(".json") && !file.endsWith("-facts.json")
    )

    let migratedCount = 0

    for (const file of transcriptFiles) {
      const transcriptId = file.replace(".json", "")
      const filePath = join(transcriptionsDir, file)

      try {
        const content = readFileSync(filePath, "utf-8")
        const transcriptData = JSON.parse(content)

        // Migrate if methodology is not already set
        if (!transcriptData.methodology) {
          transcriptData.methodology = methodology.id
          transcriptData.updatedAt = new Date().toISOString()
          writeFileSync(filePath, JSON.stringify(transcriptData, null, 2), "utf-8")
          migratedCount++
        }
      } catch (error) {
        console.error(`Error migrating transcript ${transcriptId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. Migrated ${migratedCount} transcripts.`,
      methodologyId: methodology.id,
      migratedCount,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: "Failed to migrate", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
