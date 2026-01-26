"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Upload, Trash2, X, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UploadWithMethodology } from "@/app/components/main/upload-with-methodology"
import type { Methodology, Insight } from "@/lib/types"

interface VaultHeaderProps {
  methodology: Methodology
  transcriptCount: number
  factCount: number
  onDelete?: () => void
  insights?: Insight[]
  onDownloadInsights?: () => void
}

export function VaultHeader({
  methodology,
  transcriptCount,
  factCount,
  onDelete,
  insights = [],
  onDownloadInsights,
}: VaultHeaderProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      console.error("Error deleting methodology:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="border-b bg-background w-full px-6 py-3">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{methodology.name}</h1>
            {methodology.description && (
              <p className="text-muted-foreground text-sm">
                {methodology.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>{transcriptCount} {transcriptCount === 1 ? "transcript" : "transcripts"}</span>
            <span>{factCount} {factCount === 1 ? "fact" : "facts"}</span>
          </div>
          <div className="flex items-center gap-2">
            {insights.length > 0 && onDownloadInsights && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadInsights}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Insights
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Methodology</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this methodology? This action cannot be undone and will delete all associated transcripts, facts, insights, and media files.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUpload(false)}>
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <UploadWithMethodology 
              onClose={() => setShowUpload(false)}
              initialMethodology={methodology.id}
            />
          </div>
        </div>
      )}
    </>
  )
}
