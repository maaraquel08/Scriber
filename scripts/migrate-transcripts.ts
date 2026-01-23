import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { createMethodology } from "../lib/methodology-utils"

const transcriptionsDir = join(process.cwd(), "data", "transcriptions")

async function migrateTranscripts() {
  // Create default "Uncategorized" methodology
  const uncategorized = createMethodology("Uncategorized", "Default methodology for existing transcripts")
  console.log(`Created methodology: ${uncategorized.id}`)

  if (!existsSync(transcriptionsDir)) {
    console.log("No transcriptions directory found. Nothing to migrate.")
    return
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

      // Only migrate if methodology is not already set
      if (!transcriptData.methodology) {
        transcriptData.methodology = uncategorized.id
        transcriptData.updatedAt = new Date().toISOString()
        writeFileSync(filePath, JSON.stringify(transcriptData, null, 2), "utf-8")
        migratedCount++
        console.log(`Migrated transcript: ${transcriptId}`)
      }
    } catch (error) {
      console.error(`Error migrating transcript ${transcriptId}:`, error)
    }
  }

  console.log(`Migration complete. Migrated ${migratedCount} transcripts.`)
}

migrateTranscripts().catch(console.error)
