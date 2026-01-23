"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  selectedMethodologyId?: string | null
  methodologies?: Array<{ id: string; name: string }>
}

export function ChatInterface({
  selectedMethodologyId,
  methodologies = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput("")
    setIsLoading(true)

    // Mock AI response (UI-only as per plan)
    setTimeout(() => {
      setIsLoading(false)
      // In future, this will show results in a modal or expand the input area
      console.log("Query:", query)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      // Trigger upload flow
      const uploadEvent = new CustomEvent("upload-file", { detail: { file } })
      window.dispatchEvent(uploadEvent)
    }
  }

  const getContextBreadcrumbs = () => {
    if (selectedMethodologyId) {
      const methodology = methodologies.find((m) => m.id === selectedMethodologyId)
      if (methodology) {
        return `Context: ${methodology.name}`
      }
    }
    return "Context: All Research"
  }

  return (
    <div
      className="flex-1 flex flex-col h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl space-y-4">
          <div className="relative">
            <div
              className={cn(
                "flex items-center gap-3 rounded-full border-2 px-6 py-4 shadow-lg transition-all",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isLoading && "opacity-50"
              )}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your research..."
                className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="rounded-full shrink-0"
              >
                {isLoading ? (
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-full pointer-events-none">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Upload className="h-5 w-5" />
                  <span>Drop file to upload</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            AI-powered research assistant for your user research repository
          </p>
        </div>
      </div>
    </div>
  )
}
