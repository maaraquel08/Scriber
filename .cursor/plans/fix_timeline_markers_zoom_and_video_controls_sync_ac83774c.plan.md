---
name: Fix Timeline Markers Zoom and Video Controls Sync
overview: Make timeline markers dynamically adjust with zoom level, ensure TimelineControls sync with sidebar video player, and remove default browser video controls from the side panel.
todos:
    - id: "1"
      content: Implement dynamic marker interval calculation based on zoom level
      status: completed
    - id: "2"
      content: Move time markers inside zoom transform and ensure proper scaling
      status: completed
    - id: "3"
      content: Verify TimelineControls sync with sidebar video player
      status: completed
    - id: "4"
      content: Remove controls attribute from VideoPlayer video/audio elements
      status: completed
---

# Fix Timeline Markers Zoom and Video Controls Sync

## Overview

Three improvements needed:

1. Make timeline markers scalable - adjust interval based on zoom level to prevent overlap
2. Sync TimelineControls to sidebar video player
3. Remove default browser controls from VideoPlayer component

## Changes Required

### 1. Scalable Timeline Markers with Zoom

**File**: `app/components/timeline/audio-timeline.tsx`

**Current Issue**:

-   Fixed 5-second interval regardless of zoom
-   Markers are outside zoom transform, causing misalignment
-   Markers overlap when zoomed in

**Solution**:

-   Calculate marker interval dynamically based on zoom level
-   Move time markers inside zoom transform container
-   Adjust interval: higher zoom = smaller interval (more markers), lower zoom = larger interval (fewer markers)

**Implementation**:

-   Create function to calculate optimal interval based on zoom and duration
-   Interval calculation logic:
    -   At 100% zoom: use 5-second intervals (baseline)
    -   At 200% zoom (zoomed in): use 1-2 second intervals (more detail)
    -   At 50% zoom (zoomed out): use 10-30 second intervals (less detail)
-   Move time markers div inside the zoom transform container
-   Ensure markers scale with timeline content

**Interval Calculation**:

```typescript
// Calculate interval based on zoom
// Higher zoom = smaller interval (more markers)
// Lower zoom = larger interval (fewer markers)
const calculateMarkerInterval = (duration: number, zoom: number): number => {
    const baseInterval = 5; // 5 seconds at 100% zoom
    const zoomFactor = zoom / 100;
    // Inverse relationship: zoom 200% = 0.5x interval, zoom 50% = 2x interval
    const adjustedInterval = baseInterval / zoomFactor;

    // Round to nice intervals: 1, 2, 5, 10, 15, 30, 60
    if (adjustedInterval <= 1) return 1;
    if (adjustedInterval <= 2) return 2;
    if (adjustedInterval <= 5) return 5;
    if (adjustedInterval <= 10) return 10;
    if (adjustedInterval <= 15) return 15;
    if (adjustedInterval <= 30) return 30;
    return 60;
};
```

### 2. Sync TimelineControls to Sidebar Video

**Files**:

-   `app/components/timeline/speakers-timeline-container.tsx`
-   `app/page.tsx`

**Current Issue**:

-   TimelineControls are in the container but may not be syncing with sidebar video
-   Need to ensure TimelineControls actions affect sidebarVideoRef

**Solution**:

-   Verify TimelineControls callbacks are properly connected
-   Ensure onPlay, onSpeedChange from TimelineControls update sidebar video
-   TimelineControls should control sidebarVideoRef, not just timelineVideoRef

**Implementation**:

-   In `page.tsx`, ensure TimelineControls handlers update both video refs
-   Or pass sidebarVideoRef to TimelineControls/container
-   Verify play/pause/speed changes affect sidebar video

**Current Flow Check**:

-   TimelineControls → onPlay → handlePlay/handlePause → should affect sidebarVideoRef
-   TimelineControls → onSpeedChange → handleSpeedChange → should affect sidebarVideoRef
-   Need to verify these connections work

### 3. Remove Default Video Controls

**File**: `app/components/sidebar/video-player.tsx`

**Current Issue**:

-   Video/audio elements have `controls` attribute
-   Shows native browser controls (play, pause, volume, fullscreen, etc.)
-   User wants only TimelineControls to control playback

**Solution**:

-   Remove `controls` attribute from both `<video>` and `<audio>` elements
-   Keep all event handlers (onSeeked, etc.) for programmatic control
-   Video should be controlled only via TimelineControls

**Changes**:

-   Remove `controls` from line 119 (video element)
-   Remove `controls` from line 132 (audio element)
-   Video/audio will be controlled programmatically via refs

## Implementation Details

### Timeline Markers Zoom Logic

**File**: `lib/utils.ts` or `app/components/timeline/audio-timeline.tsx`

Add function:

```typescript
function calculateMarkerInterval(duration: number, zoom: number): number {
    const baseInterval = 5;
    const zoomFactor = zoom / 100;
    let interval = baseInterval / zoomFactor;

    // Round to nice intervals
    const intervals = [1, 2, 5, 10, 15, 30, 60];
    return (
        intervals.find((i) => i >= interval) || intervals[intervals.length - 1]
    );
}
```

**In AudioTimeline**:

-   Use calculated interval instead of fixed 5
-   Move time markers inside zoom transform container
-   Ensure markers position correctly with zoom

### Video Controls Sync

**Verification Points**:

-   `handlePlay` in page.tsx should call `sidebarVideoRef.current?.play()`
-   `handlePause` should call `sidebarVideoRef.current?.pause()`
-   `handleSpeedChange` should set `sidebarVideoRef.current.playbackRate`
-   `handleSeek` should set `sidebarVideoRef.current.currentTime`

If these are already implemented, verify they're working correctly.

## File Changes Summary

1. **app/components/timeline/audio-timeline.tsx**:

    - Add calculateMarkerInterval function
    - Use dynamic interval based on zoom
    - Move time markers inside zoom transform
    - Adjust marker positioning for zoom

2. **app/components/sidebar/video-player.tsx**:

    - Remove `controls` attribute from video element
    - Remove `controls` attribute from audio element

3. **app/page.tsx** (if needed):

    - Verify TimelineControls handlers properly sync with sidebarVideoRef
    - Ensure all video control actions affect sidebar video
