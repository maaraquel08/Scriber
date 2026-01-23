"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Methodology } from "@/lib/types"

interface VaultHeaderProps {
  methodology: Methodology
  transcriptCount: number
  factCount: number
}

export function VaultHeader({
  methodology,
  transcriptCount,
  factCount,
}: VaultHeaderProps) {
  const router = useRouter()

  return (
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
        </div>
    </div>
  )
}
