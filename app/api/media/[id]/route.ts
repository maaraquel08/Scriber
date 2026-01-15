import { NextRequest, NextResponse } from "next/server"
import { createReadStream } from "fs"
import { stat } from "fs/promises"
import { join } from "path"
import { Readable } from "stream"

/**
 * API route to stream media files from public/media directory
 * Supports range requests for video seeking (HTTP 206)
 * 
 * This bypasses static file size limits in production deployments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 })
    }

    // Try different file extensions
    const videoExtensions = ["mp4", "mov", "webm", "mkv", "avi"]
    const audioExtensions = ["mp3", "wav", "m4a", "ogg"]
    const allExtensions = [...videoExtensions, ...audioExtensions]

    // Find the file that exists
    let filePath: string | null = null
    let mimeType: string | null = null
    let extension: string | null = null

    for (const ext of allExtensions) {
      const candidatePath = join(process.cwd(), "public", "media", `${id}.${ext}`)
      try {
        await stat(candidatePath)
        filePath = candidatePath
        extension = ext
        // Set MIME type based on extension
        mimeType = getMimeType(ext)
        break
      } catch {
        // File doesn't exist, try next extension
        continue
      }
    }

    // Fallback: try test-media.mp4
    if (!filePath) {
      const fallbackPath = join(process.cwd(), "public", "media", "test-media.mp4")
      try {
        await stat(fallbackPath)
        filePath = fallbackPath
        extension = "mp4"
        mimeType = "video/mp4"
      } catch {
        return NextResponse.json(
          { error: "Media file not found" },
          { status: 404 }
        )
      }
    }

    if (!filePath || !mimeType) {
      return NextResponse.json(
        { error: "Media file not found" },
        { status: 404 }
      )
    }

    // Get file stats
    const fileStats = await stat(filePath)
    const fileSize = fileStats.size

    // Check for range request (for video seeking)
    const range = request.headers.get("range")

    if (range) {
      // Parse range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      // Create a readable stream for the requested chunk
      const stream = createReadStream(filePath, { start, end })
      // Convert Node.js stream to Web ReadableStream
      const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>

      // Return 206 Partial Content with streaming
      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    } else {
      // No range request - stream entire file
      const stream = createReadStream(filePath)
      // Convert Node.js stream to Web ReadableStream
      const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }
  } catch (error) {
    console.error("Error serving media file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
  }

  return mimeTypes[ext.toLowerCase()] || "application/octet-stream"
}
