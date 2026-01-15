"use client"

import { Input } from "@/components/ui/input"

interface GlobalPropertiesProps {
  title?: string
  onTitleChange?: (title: string) => void
}

export function GlobalProperties({
  title = "",
  onTitleChange,
}: GlobalPropertiesProps) {
  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium">Title</label>
      <Input
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
        placeholder="Enter transcript title"
      />
    </div>
  )
}
