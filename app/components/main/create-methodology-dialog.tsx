"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, File, X, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { Methodology } from "@/lib/types"
import { getApiConfig } from "@/lib/api-config"

interface CreateMethodologyDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreated?: (methodology: Methodology) => void
  trigger?: React.ReactNode
}

export function CreateMethodologyDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCreated,
  trigger,
}: CreateMethodologyDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedMethodology, setSelectedMethodology] = useState<string>("")
  const [methodologies, setMethodologies] = useState<Methodology[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen

  useEffect(() => {
    async function loadMethodologies() {
      try {
        const response = await fetch("/api/methodologies")
        if (response.ok) {
          const data = await response.json()
          setMethodologies(data.methodologies || [])
        }
      } catch (err) {
        console.error("Error loading methodologies:", err)
      }
    }
    if (open) {
      loadMethodologies()
    }
  }, [open])

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

  const handleCreateMethodology = async () => {
    setError(null)

    if (!name.trim()) {
      setError("Methodology name is required")
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/methodologies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create methodology")
      }

      const data = await response.json()
      const newMethodology = data.methodology
      
      // Update methodologies list
      setMethodologies((prev) => [newMethodology, ...prev])
      setSelectedMethodology(newMethodology.id)
      
      // If file is selected, proceed to transcribe
      if (selectedFile) {
        await handleTranscribe(newMethodology.id)
      } else {
        // Just create the methodology
        setName("")
        setDescription("")
        setOpen(false)
        
        if (onCreated) {
          onCreated(newMethodology)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create methodology")
    } finally {
      setIsCreating(false)
    }
  }

  const handleTranscribe = async (methodologyId?: string) => {
    if (!selectedFile) return
    
    const targetMethodologyId = methodologyId || selectedMethodology
    
    if (!targetMethodologyId && methodologies.length > 0) {
      setError("Please select or create a methodology")
      return
    }

    setIsTranscribing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (targetMethodologyId) {
        formData.append("methodology", targetMethodologyId)
      }

      const apiConfig = getApiConfig()
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "X-AssemblyAI-Key": apiConfig.assemblyAiKey || "",
        },
        body: formData,
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
      
      // Generate transcript ID
      const timestamp = Date.now()
      const dataStr = `${selectedFile.name}-${selectedFile.size}-${selectedFile.type}-${timestamp}`
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(dataStr)
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const transcriptId = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

      // Transform and save transcript
      const { transformToSegmentsAndSpeakers } = await import("@/lib/transformers")
      const { transcriptData: newTranscriptData } = transformToSegmentsAndSpeakers(data)

      const fileTitle = selectedFile.name.replace(/\.[^/.]+$/, "")

      // Save transcript with methodology
      await fetch(`/api/transcript/${transcriptId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languageCode: newTranscriptData.language_code,
          languageProbability: newTranscriptData.language_probability,
          text: newTranscriptData.text,
          words: newTranscriptData.words,
          title: fileTitle,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          methodology: targetMethodologyId || null,
        }),
      })

      // Create blob URL for session-only video playback
      const blobUrl = URL.createObjectURL(selectedFile)
      sessionStorage.setItem(`media_blob_${transcriptId}`, blobUrl)

      // Close modal and navigate to lab
      setOpen(false)
      setSelectedFile(null)
      setName("")
      setDescription("")
      setSelectedMethodology("")
      router.push(`/lab/${transcriptId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transcribe file"
      setError(errorMessage)
      console.error("Transcription error:", err)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If file is selected but no methodology selected, create new one
    if (selectedFile && !selectedMethodology && !name.trim()) {
      setError("Please create a new study or select an existing one")
      return
    }
    
    // If file is selected and methodology exists, just transcribe
    if (selectedFile && selectedMethodology && !name.trim()) {
      await handleTranscribe()
      return
    }
    
    // If creating new methodology (with or without file)
    if (name.trim()) {
      await handleCreateMethodology()
      return
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setSelectedFile(null)
    setSelectedMethodology("")
    setError(null)
    setFileError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const dialogContent = (
    <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Study</DialogTitle>
            <DialogDescription>
              Create a new research methodology and optionally upload a file to transcribe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Methodology Selection or Creation */}
            {methodologies.length > 0 && (
              <div className="space-y-2">
                <Label>Use Existing Study</Label>
                <Select
                  value={selectedMethodology}
                  onValueChange={setSelectedMethodology}
                  disabled={isCreating || isTranscribing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an existing study (optional)" />
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

            {(!selectedMethodology || methodologies.length === 0) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Study Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Usability Testing"
                    required={!selectedMethodology}
                    disabled={isCreating || isTranscribing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description of this research methodology"
                    rows={3}
                    disabled={isCreating || isTranscribing}
                  />
                </div>
              </>
            )}

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Upload File (Optional)</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  (isCreating || isTranscribing) && "opacity-50 pointer-events-none"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isCreating || isTranscribing}
                />

                {!selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Drag and drop your file here, or
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCreating || isTranscribing}
                      >
                        Browse Files
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      {!(isCreating || isTranscribing) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFile(null)}
                          className="ml-auto h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error message */}
            {(error || fileError) && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error || fileError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={isCreating || isTranscribing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isTranscribing || (!name.trim() && !selectedMethodology && !selectedFile)}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : selectedFile ? (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {name.trim() || selectedMethodology ? "Create & Transcribe" : "Transcribe"}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
  )

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) {
          resetForm()
        }
      }}
    >
      {trigger && !isControlled && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        {dialogContent}
      </DialogContent>
    </Dialog>
  )
}
