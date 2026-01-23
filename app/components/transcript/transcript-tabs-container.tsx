"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TranscriptEditor } from "./transcript-editor"
import { FactsPanel } from "../facts/facts-panel"
import type { TranscriptSegment, Speaker, Fact } from "@/lib/types"

interface TranscriptTabsContainerProps {
  segments: TranscriptSegment[]
  speakers: Speaker[]
  facts: Fact[]
  isGeneratingFacts?: boolean
  activeTab?: string
  onTabChange?: (tab: string) => void
  onSegmentTextChange?: (segmentId: string, newText: string) => void
  currentTime?: number
  onSegmentClick?: (segment: TranscriptSegment) => void
  onTimestampClick?: (seconds: number) => void
  onFactUpdate?: (factId: string, updates: Partial<Fact>) => void
}

export function TranscriptTabsContainer({
  segments,
  speakers,
  facts,
  isGeneratingFacts = false,
  activeTab: controlledTab,
  onTabChange,
  onSegmentTextChange,
  currentTime = 0,
  onSegmentClick,
  onTimestampClick,
  onFactUpdate,
}: TranscriptTabsContainerProps) {
  const [internalTab, setInternalTab] = useState("transcript")
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab
  
  function handleTabChange(value: string) {
    if (onTabChange) {
      onTabChange(value)
    } else {
      setInternalTab(value)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background min-h-0 h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 flex-col overflow-hidden min-h-0 h-full">
        <div className="border-b px-6 pt-4 pb-4 shrink-0">
          <TabsList>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="facts">
              Atomic Facts
              {facts.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {facts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="transcript" className="flex-1 overflow-hidden m-0 min-h-0 p-0">
          <TranscriptEditor
            segments={segments}
            speakers={speakers}
            onSegmentTextChange={onSegmentTextChange}
            currentTime={currentTime}
            onSegmentClick={onSegmentClick}
          />
        </TabsContent>
        <TabsContent value="facts" className="flex-1 overflow-hidden m-0 min-h-0 p-0">
          <FactsPanel
            facts={facts}
            isLoading={isGeneratingFacts}
            currentTime={currentTime}
            onTimestampClick={onTimestampClick}
            onFactUpdate={onFactUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
