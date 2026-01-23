"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Insight } from "@/lib/types";
import { Lightbulb, Sparkles, ExternalLink, ChevronRight } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

interface InsightsPanelProps {
    insights: Insight[];
    isLoading?: boolean;
    isGenerating?: boolean;
    onGenerateInsights?: () => void;
    onFactClick?: (factId: string) => void;
}

function getTypeColor(type: Insight["type"]): string {
    switch (type) {
        case "Behavioral":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        case "Functional":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
        case "Need":
            return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
        case "Pain Point":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
}

function getStrengthColor(strength: Insight["strength"]): string {
    switch (strength) {
        case "Strong":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "Emerging":
            return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
}

function getLevelColor(level: Insight["level"]): string {
    switch (level) {
        case "Principle":
            return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
        case "Strategic":
            return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400";
        case "Tactical":
            return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
}

export function InsightsPanel({
    insights,
    isLoading = false,
    isGenerating = false,
    onGenerateInsights,
    onFactClick,
}: InsightsPanelProps) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const methodologyId = params.methodology as string;

    function handleCardClick(insightId: string, e?: React.MouseEvent) {
        if (e) {
            e.stopPropagation();
        }
        if (methodologyId) {
            // Get current tab from URL or default to "insights"
            const tab = searchParams.get("tab") || "insights";
            router.push(`/vault/${methodologyId}/insight/${insightId}?tab=${tab}`);
        }
    }

    function handleFactClick(factId: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (onFactClick) {
            onFactClick(factId);
        }
    }

    if (isLoading || isGenerating) {
        return (
            <div className="h-full overflow-y-auto px-6 py-4 bg-background">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-3 bg-muted rounded w-full"></div>
                                    <div className="h-3 bg-muted rounded w-5/6"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="h-full overflow-y-auto px-6 py-4 bg-background">
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        No insights generated yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4">
                        Generate insights from your Atomic Facts to discover
                        patterns and actionable recommendations.
                    </p>
                    {onGenerateInsights && (
                        <Button
                            onClick={onGenerateInsights}
                            variant="default"
                            className="mt-2"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Insights
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-6 py-4 bg-background">
            <div className="space-y-4">
                {insights.map((insight) => {
                    const maxEvidence = 5;
                    const displayedFacts = insight.evidence.fact_ids.slice(0, maxEvidence);
                    const remainingFacts = insight.evidence.fact_ids.length - maxEvidence;

                    return (
                        <Card
                            key={insight.id}
                            className="hover:shadow-md transition-all cursor-pointer group"
                            onClick={(e) => handleCardClick(insight.id, e)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor(
                                                    insight.level
                                                )}`}
                                            >
                                                {insight.level}
                                            </span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(
                                                    insight.type
                                                )}`}
                                            >
                                                {insight.type}
                                            </span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStrengthColor(
                                                    insight.strength
                                                )}`}
                                            >
                                                {insight.strength}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Context
                                        </p>
                                        <p className="text-sm text-foreground line-clamp-2">
                                            {insight.context}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Cause
                                        </p>
                                        <p className="text-sm text-foreground line-clamp-2">
                                            {insight.cause}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Effect
                                        </p>
                                        <p className="text-sm text-foreground line-clamp-2">
                                            {insight.effect}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1.5">
                                                {displayedFacts.map(
                                                    (factId, idx) => (
                                                        <Button
                                                            key={`${insight.id}-${factId}-${idx}`}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-5 px-1.5 text-[10px]"
                                                            onClick={(e) =>
                                                                handleFactClick(
                                                                    factId,
                                                                    e
                                                                )
                                                            }
                                                        >
                                                            {factId.length > 20 
                                                                ? `...${factId.slice(-15)}` 
                                                                : factId}
                                                            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                                                        </Button>
                                                    )
                                                )}
                                                {remainingFacts > 0 && (
                                                    <span className="text-[10px] text-muted-foreground self-center ml-1">
                                                        +{remainingFacts} more
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {insight.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
