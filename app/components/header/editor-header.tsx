"use client"

import { Button } from "@/components/ui/button"
import { Undo2, Redo2, MessageSquare, Download } from "lucide-react"

export function EditorHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">Last saved never</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          Feedback
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </header>
  )
}
