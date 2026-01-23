"use client"

import { useState, useEffect } from "react"
import { ResearchRepositorySidebar } from "./components/main/research-repository-sidebar"
import { ChatInterface } from "./components/main/chat-interface"
import { ResizablePanel } from "./components/ui/resizable-panel"
import type { Methodology } from "@/lib/types"

export function HomeClient() {
  const [selectedMethodologyId, setSelectedMethodologyId] = useState<string | null>(null)
  const [methodologies, setMethodologies] = useState<Methodology[]>([])
  const [sidebarPosition, setSidebarPosition] = useState<"left" | "right">("right")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadMethodologies() {
      try {
        const response = await fetch("/api/methodologies")
        if (response.ok) {
          const data = await response.json()
          setMethodologies(data.methodologies || [])
        }
      } catch (error) {
        console.error("Error loading methodologies:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadMethodologies()
  }, [])

  useEffect(() => {
    // Listen for upload file events from chat interface
    const handleUploadFile = (e: CustomEvent) => {
      const file = e.detail.file
      console.log("File dropped in chat:", file)
    }

    window.addEventListener("upload-file", handleUploadFile as EventListener)
    return () => {
      window.removeEventListener("upload-file", handleUploadFile as EventListener)
    }
  }, [])

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => (prev === "right" ? "left" : "right"))
  }

  return (
    <div className="flex h-screen">
      {sidebarPosition === "left" && (
        <ResizablePanel
          defaultWidth={300}
          minWidth={200}
          maxWidth={500}
          className="border-r"
        >
          <ResearchRepositorySidebar
            onMethodologySelect={setSelectedMethodologyId}
            selectedMethodologyId={selectedMethodologyId}
            onTogglePosition={toggleSidebarPosition}
            position={sidebarPosition}
          />
        </ResizablePanel>
      )}

      <div className="flex-1 flex flex-col">
        <ChatInterface
          selectedMethodologyId={selectedMethodologyId}
          methodologies={methodologies}
        />
      </div>

      {sidebarPosition === "right" && (
        <ResizablePanel
          defaultWidth={300}
          minWidth={200}
          maxWidth={500}
          className="border-l"
        >
          <ResearchRepositorySidebar
            onMethodologySelect={setSelectedMethodologyId}
            selectedMethodologyId={selectedMethodologyId}
            onTogglePosition={toggleSidebarPosition}
            position={sidebarPosition}
          />
        </ResizablePanel>
      )}
    </div>
  )
}
