"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, FileText, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Methodology } from "@/lib/types"

interface MethodologyFolderProps {
  methodology: Methodology
  transcriptCount: number
  factCount: number
}

export function MethodologyFolder({
  methodology,
  transcriptCount,
  factCount,
}: MethodologyFolderProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/vault/${methodology.id}`)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <Folder className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg">{methodology.name}</CardTitle>
        </div>
        {methodology.description && (
          <CardDescription>{methodology.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{transcriptCount} {transcriptCount === 1 ? "transcript" : "transcripts"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>{factCount} {factCount === 1 ? "fact" : "facts"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
