"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTime, getInitials, generateColorFromString } from "@/lib/utils";
import type { TranscriptSegment, Speaker } from "@/lib/types";
import { useRef, useState, useEffect } from "react";

interface TranscriptSegmentProps {
    segment: TranscriptSegment;
    speaker: Speaker;
    onTextChange?: (segmentId: string, newText: string) => void;
    currentTime?: number;
    onSegmentClick?: (segment: TranscriptSegment) => void;
}

export function TranscriptSegmentComponent({
    segment,
    speaker,
    onTextChange,
    currentTime = 0,
    onSegmentClick,
}: TranscriptSegmentProps) {
    const [text, setText] = useState(segment.text);
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const segmentRef = useRef<HTMLDivElement>(null);

    // Check if this segment is currently active
    const isActive = currentTime >= segment.start && currentTime <= segment.end;

    // Highlight active segment
    useEffect(() => {
        if (segmentRef.current) {
            if (isActive) {
                segmentRef.current.classList.add(
                    "ring-2",
                    "ring-primary",
                    "ring-offset-2"
                );
            } else {
                segmentRef.current.classList.remove(
                    "ring-2",
                    "ring-primary",
                    "ring-offset-2"
                );
            }
        }
    }, [isActive]);

    function handleBlur() {
        if (contentEditableRef.current && onTextChange) {
            const newText = contentEditableRef.current.textContent || "";
            setText(newText);
            onTextChange(segment.id, newText);
        }
    }

    function handleInput(e: React.FormEvent<HTMLDivElement>) {
        const newText = e.currentTarget.textContent || "";
        setText(newText);
    }

    // Render words with highlighting
    const renderWords = () => {
        if (!segment.words || segment.words.length === 0) {
            // Fallback: split text by common punctuation and add spaces
            const fallbackText = text
                .replace(/([.,!?;:])/g, "$1 ")
                .replace(/\s+/g, " ")
                .trim();
            return <span>{fallbackText}</span>;
        }

        return segment.words.map((word, index) => {
            if (word.type === "spacing") {
                // Render spacing as actual space - preserve the spacing text or use regular space
                const spacingText =
                    word.text && word.text.trim() !== "" ? word.text : " ";
                return (
                    <span key={index} className="inline">
                        {spacingText}
                    </span>
                );
            }

            const isWordActive =
                currentTime >= word.start && currentTime <= word.end;
            const isWordPast = currentTime > word.end;
            const isWordFuture = currentTime < word.start;

            return (
                <span
                    key={index}
                    className={`inline transition-all duration-200 ${
                        isWordActive
                            ? "font-bold text-foreground"
                            : isWordPast
                            ? "text-foreground"
                            : isWordFuture
                            ? "opacity-60 text-muted-foreground"
                            : "text-foreground"
                    }`}
                >
                    {word.text}
                </span>
            );
        });
    };

    const handleCardClick = () => {
        if (onSegmentClick) {
            onSegmentClick(segment);
        }
    };

    return (
        <Card
            ref={segmentRef}
            className={`mb-4 p-4 transition-all cursor-pointer hover:bg-muted/50 ${
                isActive ? "bg-primary/5 border-primary/20" : ""
            }`}
            data-segment-id={segment.id}
            onClick={handleCardClick}
        >
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                        className="text-white font-medium"
                        style={{
                            backgroundColor: generateColorFromString(
                                speaker.id
                            ),
                        }}
                    >
                        {getInitials(speaker.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{speaker.name}</span>
                        {speaker.role && (
                            <span className="text-sm text-muted-foreground">
                                ({speaker.role})
                            </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                            {formatTime(segment.start)}
                        </span>
                    </div>
                    <div
                        ref={contentEditableRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBlur}
                        onInput={handleInput}
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-10 w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-3 py-2 hover:bg-muted/30 transition-colors whitespace-pre-wrap wrap-break-word leading-relaxed"
                    >
                        {renderWords()}
                    </div>
                </div>
            </div>
        </Card>
    );
}
