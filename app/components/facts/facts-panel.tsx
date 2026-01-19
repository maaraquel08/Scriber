"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { parseTimestampToSeconds } from "@/lib/utils";
import type { Fact } from "@/lib/types";
import { Clock, Quote, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FactsPanelProps {
    facts: Fact[];
    isLoading?: boolean;
    currentTime?: number;
    onTimestampClick?: (seconds: number) => void;
    onFactUpdate?: (factId: string, updates: Partial<Fact>) => void;
}

// Available themes for user selection
const AVAILABLE_THEMES = [
    "User Behavior",
    "Needs",
    "Painpoint",
    "Visual Design",
    "Expectation",
    "Routine",
    "Security",
    "Motivation",
    "Frustration",
    "Accessibility",
    "Mental Models",
    "Workaround",
    "Language and Terminology",
    "Technical Limitation",
    "Suggestions",
    "Retention Drivers",
    "Decision Making Process",
    "Satisfaction",
    "Preference",
    "Comparative Feedback",
    "Usability",
] as const;

// Window (in seconds) to consider a fact as "active" based on currentTime
const ACTIVE_WINDOW_SECONDS = 5;

function getSentimentColor(sentiment: Fact["sentiment"]): string {
    switch (sentiment) {
        case "Positive":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "Negative":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "Neutral":
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
}

function getThemeColor(theme: string): string {
    // Generate consistent colors for different theme categories
    const themeColors: Record<string, string> = {
        "User Behavior":
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        Needs: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        Painpoint:
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        "Visual Design":
            "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
        Expectation:
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
        Routine:
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
        Security:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        Motivation:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        Frustration:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        Accessibility:
            "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
        "Mental Models":
            "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
        Workaround:
            "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
        "Language and Terminology":
            "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
        "Technical Limitation":
            "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
        Suggestions:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        "Retention Drivers":
            "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
        "Decision Making Process":
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        Satisfaction:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        Preference:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        "Comparative Feedback":
            "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
        Usability:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return (
        themeColors[theme] ||
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    );
}

export function FactsPanel({
    facts,
    isLoading,
    currentTime = 0,
    onTimestampClick,
    onFactUpdate,
}: FactsPanelProps) {
    const [editingSummaryId, setEditingSummaryId] = useState<string | null>(
        null
    );
    const [editingSummaryText, setEditingSummaryText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when editing starts
    useEffect(() => {
        if (editingSummaryId && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [editingSummaryId]);

    function handleTimestampClick(timestamp: string) {
        if (onTimestampClick) {
            const seconds = parseTimestampToSeconds(timestamp);
            onTimestampClick(seconds);
        }
    }

    function isFactActive(factTimestamp: string): boolean {
        const factSeconds = parseTimestampToSeconds(factTimestamp);
        return Math.abs(currentTime - factSeconds) <= ACTIVE_WINDOW_SECONDS;
    }

    function handleSummaryClick(e: React.MouseEvent, fact: Fact) {
        e.stopPropagation();
        setEditingSummaryId(fact.fact_id);
        setEditingSummaryText(fact.summary_of_observation);
    }

    function handleSummarySave(factId: string) {
        if (onFactUpdate && editingSummaryText.trim()) {
            onFactUpdate(factId, {
                summary_of_observation: editingSummaryText.trim(),
            });
        }
        setEditingSummaryId(null);
        setEditingSummaryText("");
    }

    function handleSummaryCancel() {
        setEditingSummaryId(null);
        setEditingSummaryText("");
    }

    function handleSummaryKeyDown(e: React.KeyboardEvent, factId: string) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSummarySave(factId);
        } else if (e.key === "Escape") {
            handleSummaryCancel();
        }
    }

    function handleThemeChange(factId: string, newTheme: string) {
        if (onFactUpdate) {
            onFactUpdate(factId, { theme: newTheme });
        }
    }

    if (isLoading) {
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

    if (facts.length === 0) {
        return (
            <div className="h-full overflow-y-auto px-6 py-4 bg-background">
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Quote className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        No facts generated yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Select Data Type, Product, and Feature in the sidebar,
                        then generate facts to see them here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-6 py-4 bg-background">
            <div className="space-y-4">
                {facts.map((fact) => {
                    const isActive = isFactActive(fact.timestamp);

                    return (
                        <Card
                            key={fact.fact_id}
                            className={`hover:shadow-md transition-all cursor-pointer ${
                                isActive
                                    ? "ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary/20"
                                    : ""
                            }`}
                            onClick={() => handleTimestampClick(fact.timestamp)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 hover:opacity-80 transition-opacity ${getThemeColor(
                                                        fact.theme
                                                    )}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {fact.theme}
                                                    <ChevronDown className="h-3 w-3" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="start"
                                                className="max-h-64 overflow-y-auto"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {AVAILABLE_THEMES.map(
                                                    (theme) => (
                                                        <DropdownMenuItem
                                                            key={theme}
                                                            onClick={() =>
                                                                handleThemeChange(
                                                                    fact.fact_id,
                                                                    theme
                                                                )
                                                            }
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getThemeColor(
                                                                    theme
                                                                )}`}
                                                            >
                                                                {theme}
                                                            </span>
                                                            {fact.theme ===
                                                                theme && (
                                                                <Check className="h-4 w-4 ml-2" />
                                                            )}
                                                        </DropdownMenuItem>
                                                    )
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentColor(
                                                fact.sentiment
                                            )}`}
                                        >
                                            {fact.sentiment}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTimestampClick(
                                                fact.timestamp
                                            );
                                        }}
                                    >
                                        <Clock className="h-3 w-3 mr-1" />
                                        {fact.timestamp}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            Quote
                                        </p>
                                        <p className="text-base leading-relaxed italic border-l-2 border-primary pl-3">
                                            "{fact.verbatim_quote}"
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            Summary
                                        </p>
                                        {editingSummaryId === fact.fact_id ? (
                                            <div
                                                className="space-y-2"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Textarea
                                                    ref={textareaRef}
                                                    value={editingSummaryText}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLTextAreaElement>
                                                    ) =>
                                                        setEditingSummaryText(
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyDown={(
                                                        e: React.KeyboardEvent<HTMLTextAreaElement>
                                                    ) =>
                                                        handleSummaryKeyDown(
                                                            e,
                                                            fact.fact_id
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        handleSummarySave(
                                                            fact.fact_id
                                                        )
                                                    }
                                                    className="text-sm min-h-[60px] resize-none"
                                                    placeholder="Enter summary..."
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Press Enter to save, Escape
                                                    to cancel
                                                </p>
                                            </div>
                                        ) : (
                                            <p
                                                className="text-sm text-foreground cursor-text hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors"
                                                onClick={(e) =>
                                                    handleSummaryClick(e, fact)
                                                }
                                                title="Click to edit"
                                            >
                                                {fact.summary_of_observation}
                                            </p>
                                        )}
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
