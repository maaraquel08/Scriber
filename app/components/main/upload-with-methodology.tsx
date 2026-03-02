"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, File, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { Methodology } from "@/lib/types"
import { getApiConfig } from "@/lib/api-config"
import { createSupabaseClient } from "@/lib/supabase-client"

interface UploadWithMethodologyProps {
  onClose?: () => void
  initialMethodology?: string
}

export function UploadWithMethodology({ onClose, initialMethodology }: UploadWithMethodologyProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedMethodology, setSelectedMethodology] = useState<string>(initialMethodology || "")
  const [methodologies, setMethodologies] = useState<Methodology[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    async function loadMethodologies() {
      try {
        const response = await fetch("/api/methodologies")
        if (response.ok) {
          const data = await response.json()
          setMethodologies(data.methodologies || [])
          // If initialMethodology is provided, ensure it's selected
          if (initialMethodology && !selectedMethodology) {
            setSelectedMethodology(initialMethodology)
          }
        }
      } catch (err) {
        console.error("Error loading methodologies:", err)
      }
    }
    loadMethodologies()
  }, [initialMethodology, selectedMethodology])

  const handleFileSelect = useCallback((file: File) => {
    setFileError(null)
    
    const isValidType =
      file.type.startsWith("video/") || file.type.startsWith("audio/")

    if (!isValidType) {
      const extension = file.name.split(".").pop()?.toLowerCase()
      const validExtensions = [
        "mp4", "mov", "avi", "mkv", "webm",
        "mp3", "wav", "m4a", "ogg", "flac", "aac",
      ]
      if (!extension || !validExtensions.includes(extension)) {
        setFileError("Unsupported file type. Please upload a video or audio file.")
        return
      }
    }

    if (file.size === 0) {
      setFileError("File is empty. Please select a valid file.")
      return
    }

    setSelectedFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    if (!selectedMethodology && methodologies.length > 0) {
      setError("Please select a methodology")
      return
    }

    setIsTranscribing(true)
    setError(null)

    try {
      // Generate transcript ID up front (used as the storage path too)
      const timestamp = Date.now()
      const dataStr = `${selectedFile.name}-${selectedFile.size}-${selectedFile.type}-${timestamp}`
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(dataStr)
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const transcriptId = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

      // Step 1: Upload file directly to Supabase Storage from the browser.
      // This bypasses Vercel's 4.5MB serverless body limit entirely.
      const ext = selectedFile.name.split(".").pop()
      const storagePath = `${transcriptId}.${ext}`
      const supabase = createSupabaseClient()
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, selectedFile, { upsert: true })

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(storagePath)

      const fileUrl = publicUrlData.publicUrl

      // Step 2: Send the public URL to /api/transcribe — AssemblyAI fetches it directly.
      const apiConfig = getApiConfig()
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "X-AssemblyAI-Key": apiConfig.assemblyAiKey || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          try {
            const text = await response.text()
            errorMessage = text || errorMessage
          } catch {
            // Fall back to status-based message
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Step 3: Transform and save transcript
      const { transformToSegmentsAndSpeakers } = await import("@/lib/transformers")
      const { transcriptData: newTranscriptData } = transformToSegmentsAndSpeakers(data)
      const fileTitle = selectedFile.name.replace(/\.[^/.]+$/, "")

      await fetch(`/api/transcript/${transcriptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageCode: newTranscriptData.language_code,
          languageProbability: newTranscriptData.language_probability,
          text: newTranscriptData.text,
          words: newTranscriptData.words,
          title: fileTitle,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileUrl,
          methodology: selectedMethodology || null,
        }),
      })

      router.push(`/lab/${transcriptId}`)
      if (onClose) onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transcribe file"
      setError(errorMessage)
      console.error("Transcription error:", err)
    } finally {
      setIsTranscribing(false)
    }
  }, [selectedFile, selectedMethodology, methodologies, router])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Video or Audio File</CardTitle>
        <CardDescription>
          Upload a file to transcribe and assign it to a methodology.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Methodology Selection */}
        {methodologies.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Methodology</label>
            <Select
              value={selectedMethodology}
              onValueChange={setSelectedMethodology}
              disabled={isTranscribing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a methodology" />
              </SelectTrigger>
              <SelectContent>
                {methodologies.map((methodology) => (
                  <SelectItem key={methodology.id} value={methodology.id}>
                    {methodology.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Drag and drop area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            isTranscribing && "opacity-50 pointer-events-none"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isTranscribing}
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drag and drop your file here, or
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTranscribing}
                >
                  Browse Files
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isTranscribing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {(error || fileError) && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error || fileError}
          </div>
        )}

        {/* Transcribe button */}
        {selectedFile && (
          <Button
            onClick={handleUpload}
            disabled={isTranscribing || (methodologies.length > 0 && !selectedMethodology)}
            className="w-full"
            size="lg"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Transcribe
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
