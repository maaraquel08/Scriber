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
import { useCallback, useRef } from "react";

interface AudioTimelineProps {
    segments: TranscriptSegment[];
    speakers: Speaker[];
    duration: number;
    zoom?: number; // pixels per second (px/s) - default 100 px/s
    currentTime?: number;
    onTimestampClick?: (timestamp: number) => void;
    onSegmentClick?: (segment: TranscriptSegment) => void;
    onSeek?: (time: number) => void;
}

export function AudioTimeline({
    segments,
    speakers,
    duration,
    zoom = 100, // pixels per second (px/s)
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

    // Calculate timeline width based on pixels-per-second (px/s)
    // Timeline width = duration (seconds) * zoom (pixels per second)
    // Example: 100 seconds * 200 px/s = 20,000px wide timeline
    const timelineWidthPx = duration * zoom;
    
    // Marker positioning still uses percentages relative to timeline width
    // This works correctly because percentages are calculated from the pixel width
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

    // Ref to the timeline content div for accurate click position calculation
    const timelineContentRef = useRef<HTMLDivElement>(null);

    // ============================================================================
    // Event Handlers
    // ============================================================================
    const handleTimelineClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!timelineContentRef.current || duration === 0) return;
            
            // Get the scrollable container (parent with overflow-x-auto)
            const scrollContainer = timelineContentRef.current.parentElement;
            if (!scrollContainer) return;
            
            // Get the scroll container rect to calculate click position relative to scroll viewport
            const scrollRect = scrollContainer.getBoundingClientRect();
            const clickX = e.clientX - scrollRect.left;
            const scrollLeft = scrollContainer.scrollLeft;
            
            // Calculate absolute position in the timeline (accounting for scroll)
            // clickX is relative to visible scroll viewport, add scrollLeft to get absolute position
            const absoluteX = clickX + scrollLeft;
            
            // Get the actual rendered width of the timeline content
            const timelineRect = timelineContentRef.current.getBoundingClientRect();
            const actualWidth = timelineRect.width;
            
            // Check if timeline is stretched beyond its natural width (due to minWidth: "100%")
            // At low zoom (e.g., 2px/s), actualWidth might be larger than timelineWidthPx
            if (actualWidth > timelineWidthPx) {
                // Timeline is stretched - use percentage-based calculation
                const percentage = Math.max(0, Math.min(100, (absoluteX / actualWidth) * 100));
                const timestamp = (percentage / 100) * duration;
                onSeek?.(timestamp);
                onTimestampClick?.(timestamp);
            } else {
                // Timeline is at natural width - use zoom-based calculation
                const timestamp = Math.max(
                    0,
                    Math.min(duration, absoluteX / zoom)
                );
                onSeek?.(timestamp);
                onTimestampClick?.(timestamp);
            }
        },
        [duration, zoom, onTimestampClick, onSeek, timelineWidthPx]
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
            className="relative w-full h-fit border-t bg-muted/30 overflow-x-auto overflow-y-auto"
        >
            {/* Scrollable timeline content - width scales with pixels-per-second */}
            <div
                ref={timelineContentRef}
                className="relative flex flex-col"
                style={{
                    width: `${timelineWidthPx}px`,
                    minWidth: "100%",
                    minHeight: `${timelineHeight}px`,
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
                    {markers.map((marker) => {
                        const position = getTimelinePosition(marker, duration);
                        // Calculate spacing to prevent overlap
                        // Use transform to center the marker text on the position
                        return (
                            <div
                                key={marker}
                                className="absolute border-l border-foreground/40 cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                                style={{
                                    left: `${position}%`,
                                    transform: "translateX(-50%)",
                                    paddingLeft: "2px",
                                    paddingRight: "2px",
                                    fontSize: "0.75rem", // text-xs - keep font size constant, don't scale with zoom
                                }}
                                onClick={(e) =>
                                    handleTimestampMarkerClick(marker, e)
                                }
                                title={`Jump to ${formatTime(marker)}`}
                            >
                                {formatTime(marker)}
                            </div>
                        );
                    })}
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
