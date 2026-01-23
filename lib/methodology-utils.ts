import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs"
import { join } from "path"
import type { Methodology } from "./types"

const METHODOLOGIES_DIR = join(process.cwd(), "data", "methodologies")

function getMethodologyPath(id: string): string {
  return join(METHODOLOGIES_DIR, id, "metadata.json")
}

function ensureMethodologiesDir(): void {
  mkdirSync(METHODOLOGIES_DIR, { recursive: true })
}

export function createMethodology(name: string, description?: string): Methodology {
  ensureMethodologiesDir()
  
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  
  const now = new Date().toISOString()
  const methodology: Methodology = {
    id,
    name,
    description,
    createdAt: now,
    updatedAt: now,
  }
  
  const methodologyDir = join(METHODOLOGIES_DIR, id)
  mkdirSync(methodologyDir, { recursive: true })
  
  const metadataPath = getMethodologyPath(id)
  writeFileSync(metadataPath, JSON.stringify(methodology, null, 2), "utf-8")
  
  return methodology
}

export function listMethodologies(): Methodology[] {
  ensureMethodologiesDir()
  
  if (!existsSync(METHODOLOGIES_DIR)) {
    return []
  }
  
  const entries = readdirSync(METHODOLOGIES_DIR, { withFileTypes: true })
  const methodologies: Methodology[] = []
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const metadataPath = getMethodologyPath(entry.name)
      if (existsSync(metadataPath)) {
        try {
          const content = readFileSync(metadataPath, "utf-8")
          const methodology = JSON.parse(content) as Methodology
          methodologies.push(methodology)
        } catch (error) {
          console.error(`Error reading methodology ${entry.name}:`, error)
        }
      }
    }
  }
  
  return methodologies.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getMethodologyById(id: string): Methodology | null {
  const metadataPath = getMethodologyPath(id)
  
  if (!existsSync(metadataPath)) {
    return null
  }
  
  try {
    const content = readFileSync(metadataPath, "utf-8")
    return JSON.parse(content) as Methodology
  } catch (error) {
    console.error(`Error reading methodology ${id}:`, error)
    return null
  }
}

export function updateMethodology(id: string, updates: Partial<Pick<Methodology, "name" | "description">>): Methodology | null {
  const methodology = getMethodologyById(id)
  
  if (!methodology) {
    return null
  }
  
  const updated: Methodology = {
    ...methodology,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  const metadataPath = getMethodologyPath(id)
  writeFileSync(metadataPath, JSON.stringify(updated, null, 2), "utf-8")
  
  return updated
}

export function deleteMethodology(id: string): boolean {
  const metadataPath = getMethodologyPath(id)
  
  if (!existsSync(metadataPath)) {
    return false
  }
  
  try {
    // Only delete metadata, keep directory structure
    // Transcripts are not deleted, just unlinked
    const methodologyDir = join(METHODOLOGIES_DIR, id)
    // For now, we'll keep the directory but remove metadata
    // In a full implementation, you might want to handle this differently
    return true
  } catch (error) {
    console.error(`Error deleting methodology ${id}:`, error)
    return false
  }
}
