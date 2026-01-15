import { createHash } from "crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

const CACHE_DIR = join(process.cwd(), "data", "transcriptions")

// Ensure cache directory exists
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

/**
 * Generate a hash for a file based on its name, size, and type
 */
export function generateFileHash(
  filename: string,
  size: number,
  type: string
): string {
  const hash = createHash("sha256")
  hash.update(`${filename}-${size}-${type}`)
  return hash.digest("hex")
}

/**
 * Get cache file path for a given hash
 */
function getCachePath(hash: string): string {
  return join(CACHE_DIR, `${hash}.json`)
}

/**
 * Check if a cached response exists for the given file
 */
export function getCachedResponse(
  filename: string,
  size: number,
  type: string
): any | null {
  ensureCacheDir()
  const hash = generateFileHash(filename, size, type)
  const cachePath = getCachePath(hash)

  if (existsSync(cachePath)) {
    try {
      const cachedData = readFileSync(cachePath, "utf-8")
      return JSON.parse(cachedData)
    } catch (error) {
      console.error("Error reading cache file:", error)
      return null
    }
  }

  return null
}

/**
 * Save a response to cache
 */
export function saveCachedResponse(
  filename: string,
  size: number,
  type: string,
  response: any
): void {
  ensureCacheDir()
  const hash = generateFileHash(filename, size, type)
  const cachePath = getCachePath(hash)

  try {
    writeFileSync(cachePath, JSON.stringify(response, null, 2), "utf-8")
  } catch (error) {
    console.error("Error saving cache file:", error)
  }
}
