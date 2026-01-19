"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FACT_GENERATION_CONFIG } from "@/lib/fact-generation-config"
import { Sparkles } from "lucide-react"

interface ResearchMetadataProps {
  dataType?: string
  product?: string
  feature?: string
  isGenerating?: boolean
  selectedTheme?: string
  factsCount?: number
  onDataTypeChange?: (value: string) => void
  onProductChange?: (value: string) => void
  onFeatureChange?: (value: string) => void
  onThemeChange?: (value: string) => void
  onGenerateFacts?: () => void
}

export function ResearchMetadata({
  dataType,
  product,
  feature,
  isGenerating = false,
  selectedTheme,
  factsCount = 0,
  onDataTypeChange,
  onProductChange,
  onFeatureChange,
  onThemeChange,
  onGenerateFacts,
}: ResearchMetadataProps) {
  const canGenerate = dataType && product && feature && !isGenerating
  const hasFacts = factsCount > 0

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Research Metadata</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Data Type</label>
          <Select value={dataType} onValueChange={onDataTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              {FACT_GENERATION_CONFIG.dataTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Product</label>
          <Select value={product} onValueChange={onProductChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {FACT_GENERATION_CONFIG.products.map((prod) => (
                <SelectItem key={prod} value={prod}>
                  {prod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Feature</label>
          <Select value={feature} onValueChange={onFeatureChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select feature" />
            </SelectTrigger>
            <SelectContent>
              {FACT_GENERATION_CONFIG.features.map((feat) => (
                <SelectItem key={feat} value={feat}>
                  {feat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={onGenerateFacts}
          disabled={!canGenerate}
          className="w-full"
          variant="default"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating Facts..." : "Generate Facts"}
        </Button>
        
        {hasFacts && (
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm text-muted-foreground">Filter by Theme</label>
            <Select value={selectedTheme || "all"} onValueChange={onThemeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Themes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes ({factsCount})</SelectItem>
                {FACT_GENERATION_CONFIG.themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
