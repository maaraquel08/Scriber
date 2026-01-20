import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TranscriptWord, TranscriptSegment } from "./types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generate initials from a name
 * Examples: "John Smith" → "JS", "Speaker 1" → "S1", "Jane" → "JA"
 */
export function getInitials(name: string): string {
    if (!name || name.trim() === "") return "?";

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        // Single word: take first two characters
        // Handle "Speaker1" or "Speaker 1" patterns
        const match = words[0].match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
            // "Speaker1" → "S1"
            return match[1].charAt(0).toUpperCase() + match[2];
        }
        // Regular single word: take first two chars
        return words[0].slice(0, 2).toUpperCase();
    }

    // Multiple words: take first letter of first and last word
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastWord = words[words.length - 1];

    // Check if last word is a number (e.g., "Speaker 1")
    if (/^\d+$/.test(lastWord)) {
        return firstInitial + lastWord;
    }

    return firstInitial + lastWord.charAt(0).toUpperCase();
}

/**
 * Generate a deterministic color from a string (e.g., speaker name)
 * Uses a simple hash function to consistently map strings to colors
 */
export function generateColorFromString(str: string): string {
    // Predefined palette of vibrant, accessible colors
    const colors = [
        "#3b82f6", // blue
        "#10b981", // green
        "#f59e0b", // amber
        "#ef4444", // red
        "#8b5cf6", // purple
        "#ec4899", // pink
        "#06b6d4", // cyan
        "#84cc16", // lime
        "#f97316", // orange
        "#6366f1", // indigo
        "#14b8a6", // teal
        "#a855f7", // violet
        "#22c55e", // emerald
        "#eab308", // yellow
        "#f43f5e", // rose
        "#0ea5e9", // sky
        "#64748b", // slate
        "#78716c", // stone
        "#d97706", // amber-600
        "#059669", // emerald-600
        "#dc2626", // red-600
        "#7c3aed", // violet-600
        "#db2777", // pink-600
        "#0891b2", // cyan-600
        "#65a30d", // lime-600
        "#ea580c", // orange-600
        "#4f46e5", // indigo-600
        "#0d9488", // teal-600
        "#9333ea", // purple-600
        "#be185d", // pink-700
        "#0369a1", // sky-700
        "#1e40af", // blue-700
    ];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

/**
 * Format seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse timestamp string (HH:MM:SS or MM:SS) to seconds
 * Example: "00:04:12" → 252, "4:12" → 252
 */
export function parseTimestampToSeconds(timestamp: string): number {
    if (!timestamp || typeof timestamp !== "string") {
        return 0;
    }

    const parts = timestamp.trim().split(":").map(Number);
    
    // Handle invalid formats
    if (parts.some(isNaN)) {
        return 0;
    }

    // Handle MM:SS format (2 parts)
    if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
    }

    // Handle HH:MM:SS format (3 parts)
    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }

    // Invalid format
    return 0;
}

/**
 * Group words into segments by speaker
 */
export function groupWordsIntoSegments(
    words: TranscriptWord[]
): TranscriptSegment[] {
    if (words.length === 0) return [];

    const segments: TranscriptSegment[] = [];
    let currentSegment: TranscriptSegment | null = null;

    for (const word of words) {
        // Include spacing words in the words array for proper rendering
        if (
            !currentSegment ||
            (word.type !== "spacing" &&
                currentSegment.speaker_id !== word.speaker_id)
        ) {
            // Start a new segment (only on speaker change, not on spacing)
            if (word.type === "spacing") {
                // If we hit spacing at segment boundary, add it to current segment if exists
                if (currentSegment) {
                    currentSegment.words.push(word);
                }
                continue;
            }

            if (currentSegment) {
                segments.push(currentSegment);
            }
            currentSegment = {
                id: `segment_${segments.length}`,
                speaker_id: word.speaker_id,
                start: word.start,
                end: word.end,
                text: word.text,
                words: [word],
            };
        } else {
            // Continue current segment - include all words (including spacing)
            if (word.type === "spacing") {
                currentSegment.words.push(word);
                // Add space to text for fallback display
                currentSegment.text += word.text || " ";
            } else {
                currentSegment.end = word.end;
                currentSegment.text +=
                    (currentSegment.text ? " " : "") + word.text;
                currentSegment.words.push(word);
            }
        }
    }

    if (currentSegment) {
        segments.push(currentSegment);
    }

    return segments;
}

/**
 * Calculate optimal marker interval based on zoom level (pixels-per-second) and duration
 * Returns interval for labeled markers (text timestamps)
 * Properly scales gaps based on total video duration and zoom level
 */
export function calculateMarkerInterval(
    duration: number,
    zoomPxPerSec: number // pixels per second
): number {
    if (duration <= 0) return 5; // Default for invalid duration
    
    // Target spacing between markers in pixels (for readability)
    // Higher zoom allows more markers, but we want consistent visual spacing
    const TARGET_SPACING_PX = Math.max(80, Math.min(200, zoomPxPerSec * 0.5));
    
    // Calculate ideal interval based on target spacing
    // interval (seconds) = spacing (px) / zoom (px/s)
    let idealInterval = TARGET_SPACING_PX / zoomPxPerSec;
    
    // Round to nearest "nice" interval for better readability
    // Nice intervals: 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, etc.
    const niceIntervals = [
        1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600
    ];
    
    // Find the nearest nice interval that's >= idealInterval
    let interval = niceIntervals.find(i => i >= idealInterval) || niceIntervals[niceIntervals.length - 1];
    
    // For very short videos (< 30s), use smaller intervals
    if (duration < 30) {
        interval = Math.min(interval, 1);
    }
    // For short videos (< 5 min), cap at 5 seconds
    else if (duration < 300) {
        interval = Math.min(interval, 5);
    }
    // For medium videos (< 30 min), cap at 30 seconds
    else if (duration < 1800) {
        interval = Math.min(interval, 30);
    }
    // For long videos (< 2 hours), cap at 5 minutes
    else if (duration < 7200) {
        interval = Math.min(interval, 300);
    }
    
    // Ensure we don't have too many markers (performance and readability)
    const numMarkers = Math.ceil(duration / interval);
    const MAX_MARKERS = 200;
    
    if (numMarkers > MAX_MARKERS) {
        // Scale up to stay within marker limit
        const scaledInterval = Math.ceil(duration / MAX_MARKERS);
        // Round up to next nice interval
        interval = niceIntervals.find(i => i >= scaledInterval) || niceIntervals[niceIntervals.length - 1];
    }
    
    // Ensure we have at least a few markers for very short videos
    if (duration > 0 && duration / interval < 3) {
        const targetInterval = Math.max(1, Math.floor(duration / 3));
        // Round down to nearest nice interval (find largest interval <= targetInterval)
        const reversedIntervals = [...niceIntervals].reverse();
        interval = reversedIntervals.find(i => i <= targetInterval) || 1;
    }
    
    return interval;
}

/**
 * Calculate minor markers (subtle lines) between major markers
 * Returns intervals for subtle lines between main markers
 * Scales appropriately based on major interval
 */
export function calculateMinorMarkerInterval(majorInterval: number): number {
    // Divide major interval into 2-5 sub-intervals for minor markers
    // Use nice divisions: 2, 3, 4, or 5 parts
    
    if (majorInterval <= 1) {
        // For 1 second intervals, no minor markers needed
        return majorInterval;
    } else if (majorInterval <= 5) {
        // For 2-5 second intervals, divide by 2
        return Math.max(1, Math.floor(majorInterval / 2));
    } else if (majorInterval <= 15) {
        // For 5-15 second intervals, divide by 3
        return Math.max(1, Math.floor(majorInterval / 3));
    } else if (majorInterval <= 60) {
        // For 15-60 second intervals, divide by 4
        return Math.max(1, Math.floor(majorInterval / 4));
    } else if (majorInterval <= 300) {
        // For 1-5 minute intervals, divide by 5
        return Math.max(1, Math.floor(majorInterval / 5));
    } else {
        // For longer intervals, divide by 6
        return Math.max(1, Math.floor(majorInterval / 6));
    }
}

/**
 * Calculate timeline markers for a given duration
 */
export function calculateTimelineMarkers(
    duration: number,
    interval: number = 5
): number[] {
    const markers: number[] = [];
    for (let i = 0; i <= duration; i += interval) {
        markers.push(i);
    }
    return markers;
}

/**
 * Calculate minor timeline markers (subtle lines) for a given duration
 */
export function calculateMinorTimelineMarkers(
    duration: number,
    majorInterval: number,
    minorInterval: number
): number[] {
    const markers: number[] = [];
    // Start from 0 and add minor markers, but skip positions that align with major markers
    for (let i = 0; i <= duration; i += minorInterval) {
        // Only include if it's not a major marker position
        if (i % majorInterval !== 0) {
            markers.push(i);
        }
    }
    return markers;
}

/**
 * Get the position percentage for a timestamp on the timeline
 */
export function getTimelinePosition(
    timestamp: number,
    duration: number
): number {
    if (duration === 0) return 0;
    return Math.min(100, Math.max(0, (timestamp / duration) * 100));
}
