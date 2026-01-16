"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TranscriptEditor } from "./transcript-editor"
import { FactsPanel } from "../facts/facts-panel"
import type { TranscriptSegment, Speaker, Fact } from "@/lib/types"

interface TranscriptTabsContainerProps {
  segments: TranscriptSegment[]
  speakers: Speaker[]
  facts: Fact[]
  isGeneratingFacts?: boolean
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
  onSegmentTextChange,
  currentTime = 0,
  onSegmentClick,
  onTimestampClick,
  onFactUpdate,
}: TranscriptTabsContainerProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <Tabs defaultValue="transcript" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-6 pt-4 pb-4">
          <TabsList>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="facts">
              Facts
              {facts.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {facts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="transcript" className="flex-1 overflow-hidden m-0">
          <TranscriptEditor
            segments={segments}
            speakers={speakers}
            onSegmentTextChange={onSegmentTextChange}
            currentTime={currentTime}
            onSegmentClick={onSegmentClick}
          />
        </TabsContent>
        <TabsContent value="facts" className="flex-1 overflow-hidden m-0">
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
