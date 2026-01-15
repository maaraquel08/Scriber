"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GripVertical } from "lucide-react"
import type { Speaker } from "@/lib/types"
import { getInitials, generateColorFromString } from "@/lib/utils"
import { useRef, useEffect } from "react"

interface SpeakerItemProps {
  speaker: Speaker
  onUpdate?: (speakerId: string, updates: { name?: string; role?: string }) => void
}

export function SpeakerItem({ speaker, onUpdate }: SpeakerItemProps) {
  const nameRef = useRef<HTMLDivElement>(null)
  const roleRef = useRef<HTMLDivElement>(null)

  // Sync contenteditable with speaker prop when it changes externally
  useEffect(() => {
    if (nameRef.current && nameRef.current.textContent !== speaker.name) {
      nameRef.current.textContent = speaker.name
    }
    if (roleRef.current && roleRef.current.textContent !== (speaker.role || "")) {
      roleRef.current.textContent = speaker.role || ""
    }
  }, [speaker.name, speaker.role])

  function handleNameBlur() {
    if (nameRef.current && onUpdate) {
      const newName = nameRef.current.textContent || ""
      if (newName !== speaker.name) {
        onUpdate(speaker.id, { name: newName })
      }
    }
  }

  function handleRoleBlur() {
    if (roleRef.current && onUpdate) {
      const newRole = roleRef.current.textContent || ""
      if (newRole !== (speaker.role || "")) {
        onUpdate(speaker.id, { role: newRole || undefined })
      }
    }
  }

  // Generate avatar color based on speaker ID for consistency
  const avatarColor = generateColorFromString(speaker.id)

  return (
    <div className="h-16 flex items-center gap-3 border-b border-muted/20 px-3 hover:bg-muted/50 transition-colors shrink-0">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move shrink-0" />
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className="text-white text-xs font-medium"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(speaker.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div
          ref={nameRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleNameBlur}
          className="font-medium truncate focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1 py-0.5 hover:bg-muted/30 transition-colors text-sm leading-tight"
        >
          {speaker.name}
        </div>
        <div
          ref={roleRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleRoleBlur}
          data-placeholder="Role (optional)"
          className="text-xs text-muted-foreground truncate focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1 py-0.5 hover:bg-muted/30 transition-colors min-h-4 leading-tight empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
        >
          {speaker.role || ""}
        </div>
      </div>
    </div>
  )
}
