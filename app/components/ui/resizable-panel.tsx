"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  className?: string
}

export function ResizablePanel({
  children,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 800,
  className,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isDragging, setIsDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(defaultWidth)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [width])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX // Inverted: dragging left increases width
      const newWidth = startWidthRef.current + deltaX
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging, minWidth, maxWidth])

  return (
    <>
      {/* Resizer handle */}
      <div
        className={cn(
          "w-1 cursor-col-resize hover:bg-primary/50 transition-colors group relative shrink-0",
          isDragging && "bg-primary"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <GripVertical className="h-4 w-4 text-primary" />
        </div>
      </div>
      {/* Panel content */}
      <div
        ref={panelRef}
        className={cn("flex flex-col overflow-y-auto shrink-0", className)}
        style={{ width: `${width}px` }}
      >
        {children}
      </div>
    </>
  )
}
