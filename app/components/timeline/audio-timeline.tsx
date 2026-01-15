"use client";

import {
    formatTime,
    calculateTimelineMarkers,
    calculateMarkerInterval,
    calculateMinorMarkerInterval,
    calculateMinorTimelineMarkers,
    getTimelinePosition,
    generateColorFromString,
} from "@/lib/utils";
import type { TranscriptSegment, Speaker } from "@/lib/types";
import { useCallback } from "react";

interface AudioTimelineProps {
    segments: TranscriptSegment[];
    speakers: Speaker[];
    duration: number;
    zoom?: number;
    currentTime?: number;
    onTimestampClick?: (timestamp: number) => void;
    onSegmentClick?: (segment: TranscriptSegment) => void;
    onSeek?: (time: number) => void;
}

export function AudioTimeline({
    segments,
    speakers,
    duration,
    zoom = 100,
    currentTime = 0,
    onTimestampClick,
    onSegmentClick,
    onSeek,
}: AudioTimelineProps) {
    // ============================================================================
    // Constants and Calculations
    // ============================================================================
    const MARKER_HEIGHT = 40; // h-10 (increased from 24px h-6)
    const LANE_HEIGHT = 64; // h-16 per speaker lane

    const zoomScale = zoom / 100;
    const markerInterval = calculateMarkerInterval(duration, zoom);
    const markers = calculateTimelineMarkers(duration, markerInterval);
    const minorInterval = calculateMinorMarkerInterval(markerInterval);
    const minorMarkers = calculateMinorTimelineMarkers(
        duration,
        markerInterval,
        minorInterval
    );

    const numSpeakers = Math.max(1, speakers.length);
    const timelineHeight = MARKER_HEIGHT + numSpeakers * LANE_HEIGHT;
    const progressPercentage =
        duration > 0 ? (currentTime / duration) * 100 : 0;

    // ============================================================================
    // Event Handlers
    // ============================================================================
    const handleTimelineClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            // getBoundingClientRect() returns the visual (scaled) dimensions,
            // so x directly maps to the percentage of the scaled width
            const percentage = (x / rect.width) * 100;
            const timestamp = Math.max(
                0,
                Math.min(duration, (percentage / 100) * duration)
            );

            onSeek?.(timestamp);
            onTimestampClick?.(timestamp);
        },
        [duration, onTimestampClick, onSeek]
    );

    const handleTimestampMarkerClick = useCallback(
        (timestamp: number, e: React.MouseEvent) => {
            e.stopPropagation(); // Prevent timeline click
            onSeek?.(timestamp);
            onTimestampClick?.(timestamp);
        },
        [onSeek, onTimestampClick]
    );

    const handleSegmentClick = useCallback(
        (segment: TranscriptSegment, e: React.MouseEvent) => {
            e.stopPropagation(); // Prevent timeline click
            onSegmentClick?.(segment);
        },
        [onSegmentClick]
    );

    return (
        <div
            className="relative w-full border-t bg-muted/30 overflow-x-auto overflow-y-hidden"
            style={{ height: `${timelineHeight}px` }}
        >
            {/* Scrollable timeline content - width scales with zoom */}
            <div
                className="relative flex flex-col"
                style={{
                    width: `${zoomScale * 100}%`,
                    minWidth: "100%",
                    height: `${timelineHeight}px`,
                }}
            >
                {/* Progress indicator */}
                <div
                    className="absolute top-0 left-0 h-full bg-primary/20 pointer-events-none z-10"
                    style={{ width: `${progressPercentage}%` }}
                />
                {/* Enhanced playhead with circle indicator */}
                <div
                    className="absolute top-0 h-full pointer-events-none z-30 flex flex-col items-center"
                    style={{ left: `${progressPercentage}%` }}
                >
                    <div className="w-3 h-3 -mt-1.5 bg-primary rounded-full border-2 border-background shadow-lg" />
                    <div className="w-0.5 h-full bg-primary" />
                </div>

                {/* Time markers - clickable */}
                <div
                    className="relative flex items-center border-b text-xs bg-muted/30 z-20 cursor-pointer"
                    style={{ height: `${MARKER_HEIGHT}px` }}
                    onClick={handleTimelineClick}
                    title="Click to jump to timestamp"
                >
                    {/* Minor markers (subtle lines) */}
                    {minorMarkers.map((marker) => (
                        <div
                            key={`minor-${marker}`}
                            className="absolute border-l border-muted/30 h-full"
                            style={{
                                left: `${getTimelinePosition(
                                    marker,
                                    duration
                                )}%`,
                            }}
                        />
                    ))}
                    {/* Major markers (with labels) */}
                    {markers.map((marker) => (
                        <div
                            key={marker}
                            className="absolute border-l border-foreground/40 px-1 cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                            style={{
                                left: `${getTimelinePosition(
                                    marker,
                                    duration
                                )}%`,
                            }}
                            onClick={(e) =>
                                handleTimestampMarkerClick(marker, e)
                            }
                            title={`Jump to ${formatTime(marker)}`}
                        >
                            {formatTime(marker)}
                        </div>
                    ))}
                </div>

                {/* Speaker lanes container */}
                <div
                    className="relative flex flex-col cursor-pointer"
                    style={{
                        height: `${numSpeakers * LANE_HEIGHT}px`,
                    }}
                    onClick={handleTimelineClick}
                    title="Click to jump to timestamp"
                >
                    {/* Explicit speaker lanes - one per speaker */}
                    {speakers.map((speaker) => {
                        // Filter segments for this speaker
                        const speakerSegments = segments.filter(
                            (segment) => segment.speaker_id === speaker.id
                        );

                        return (
                            <div
                                key={speaker.id}
                                className="relative h-16 border-b border-muted/20 group"
                                title={`${speaker.name}`}
                            >
                                {/* Segments for this speaker */}
                                {speakerSegments.map((segment) => {
                                    const left = getTimelinePosition(
                                        segment.start,
                                        duration
                                    );
                                    const width = getTimelinePosition(
                                        segment.end - segment.start,
                                        duration
                                    );

                                    return (
                                        <div
                                            key={segment.id}
                                            className="absolute top-0 h-full rounded-sm hover:brightness-110 transition-all border border-background/20 cursor-pointer"
                                            style={{
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                backgroundColor: generateColorFromString(speaker.id),
                                            }}
                                            onClick={(e) =>
                                                handleSegmentClick(segment, e)
                                            }
                                            title={`${
                                                speaker.name
                                            } - ${formatTime(
                                                segment.start
                                            )} to ${formatTime(
                                                segment.end
                                            )} (Click to jump to start)`}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
