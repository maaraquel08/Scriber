"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateMethodologyDialog } from "./create-methodology-dialog"
import { Folder, Search, Settings, Plus } from "lucide-react"
import { ArrowsLeftRight } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils"
import type { Methodology } from "@/lib/types"

interface MethodologyWithStats extends Methodology {
  transcriptCount: number
  factCount: number
}

interface ResearchRepositorySidebarProps {
  onMethodologySelect?: (methodologyId: string) => void
  selectedMethodologyId?: string | null
  onClose?: () => void
  onTogglePosition?: () => void
  position?: "left" | "right"
}

export function ResearchRepositorySidebar({
  onMethodologySelect,
  selectedMethodologyId,
  onClose,
  onTogglePosition,
  position = "right",
}: ResearchRepositorySidebarProps) {
  const router = useRouter()
  const [methodologies, setMethodologies] = useState<MethodologyWithStats[]>([])
  const [showNewStudy, setShowNewStudy] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadMethodologies() {
      try {
        const response = await fetch("/api/methodologies")
        if (response.ok) {
          const data = await response.json()
          const methodologiesList = data.methodologies || []

          const methodologiesWithStats = await Promise.all(
            methodologiesList.map(async (methodology: Methodology) => {
              try {
                const transcriptsResponse = await fetch(
                  `/api/methodologies/${methodology.id}/transcripts`
                )
                if (transcriptsResponse.ok) {
                  const transcriptsData = await transcriptsResponse.json()
                  const transcripts = transcriptsData.transcripts || []
                  const factCount = transcripts.reduce(
                    (sum: number, t: { factCount: number }) => sum + (t.factCount || 0),
                    0
                  )
                  return {
                    ...methodology,
                    transcriptCount: transcripts.length,
                    factCount,
                  }
                }
              } catch (error) {
                console.error(`Error loading stats for ${methodology.id}:`, error)
              }
              return {
                ...methodology,
                transcriptCount: 0,
                factCount: 0,
              }
            })
          )

          setMethodologies(methodologiesWithStats)
        }
      } catch (error) {
        console.error("Error loading methodologies:", error)
      }
    }

    loadMethodologies()
  }, [])

  const handleMethodologyClick = (methodologyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Always redirect to vault (synthesis lab list view)
    router.push(`/vault/${methodologyId}`)
  }

  const handleMethodologyCreated = async () => {
    // Reload methodologies
    try {
      const response = await fetch("/api/methodologies")
      if (response.ok) {
        const data = await response.json()
        const methodologiesList = data.methodologies || []

        const methodologiesWithStats = await Promise.all(
          methodologiesList.map(async (methodology: Methodology) => {
            try {
              const transcriptsResponse = await fetch(
                `/api/methodologies/${methodology.id}/transcripts`
              )
              if (transcriptsResponse.ok) {
                const transcriptsData = await transcriptsResponse.json()
                const transcripts = transcriptsData.transcripts || []
                const factCount = transcripts.reduce(
                  (sum: number, t: { factCount: number }) => sum + (t.factCount || 0),
                  0
                )
                return {
                  ...methodology,
                  transcriptCount: transcripts.length,
                  factCount,
                }
              }
            } catch (error) {
              console.error(`Error loading stats for ${methodology.id}:`, error)
            }
            return {
              ...methodology,
              transcriptCount: 0,
              factCount: 0,
            }
          })
        )

        setMethodologies(methodologiesWithStats)
      }
    } catch (error) {
      console.error("Error reloading methodologies:", error)
    }
  }


  const filteredMethodologies = methodologies.filter((methodology) =>
    methodology.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Section 1: Research Repository */}
      <div className="flex-1 overflow-y-auto p-4 border-b">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Research Repository</h3>
            {onTogglePosition && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onTogglePosition}
                className="h-8 w-8"
              >
                <ArrowsLeftRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          {filteredMethodologies.map((methodology) => {
            const isSelected = selectedMethodologyId === methodology.id

            return (
              <button
                key={methodology.id}
                onClick={(e) => handleMethodologyClick(methodology.id, e)}
                className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors ${
                  isSelected ? "bg-accent" : ""
                }`}
              >
                <Folder className="h-4 w-4" />
                <span className="flex-1 text-left">{methodology.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(methodology.createdAt)}
                </span>
              </button>
            )
          })}
        </div>

        {methodologies.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground space-y-2">
            <p>No methodologies yet</p>
            <CreateMethodologyDialog 
              onCreated={handleMethodologyCreated}
              trigger={
                <Button variant="outline" size="sm">
                  Create Your First Study
                </Button>
              }
            />
          </div>
        )}

        {methodologies.length > 0 && filteredMethodologies.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p>No folders found</p>
          </div>
        )}
      </div>

      {/* Section 2: Chat History */}
      <div className="flex-1 overflow-y-auto p-4 border-b">
        <h3 className="text-sm font-semibold mb-4">Chat History</h3>
        <div className="text-sm text-muted-foreground">
          <p className="text-center py-8">No chat history yet</p>
          <p className="text-xs text-center text-muted-foreground/70">
            Start a conversation to see your chat history here
          </p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t p-4 space-y-2">
        <Button
          className="w-full"
          onClick={() => setShowNewStudy(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Study
        </Button>
        <CreateMethodologyDialog
          open={showNewStudy}
          onOpenChange={(open) => {
            setShowNewStudy(open)
            if (!open && onClose) {
              onClose()
            }
          }}
          onCreated={handleMethodologyCreated}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}
