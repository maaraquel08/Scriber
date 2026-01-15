---
name: Restructure Timeline with Explicit Speaker Lanes
overview: Completely restructure the timeline HTML and CSS to use explicit speaker lanes - each speaker gets their own dedicated row/lane container, ensuring perfect alignment with the speaker list and eliminating positioning issues.
todos:
    - id: "1"
      content: Restructure timeline HTML to use explicit speaker lanes with flexbox column layout
      status: completed
    - id: "2"
      content: Update segment rendering to filter by speaker and render within their lane container
      status: completed
    - id: "3"
      content: Adjust timeline height calculation to accommodate dynamic number of speaker lanes
      status: completed
    - id: "4"
      content: Ensure zoom transform and click handlers work with new structure
      status: completed
    - id: "5"
      content: Test alignment between speaker list and timeline lanes
      status: completed
---

# Restructure Timeline with Explicit Speaker Lanes

## Overview

Completely rework the timeline HTML structure to use explicit speaker lanes. Instead of absolute positioning with percentage calculations, each speaker will have their own dedicated row/lane container, ensuring perfect 1:1 alignment with the speaker list.

## Current Problem

-   Using absolute positioning with percentage-based `top` and `height` calculations
-   Segments can overlap or misalign due to calculation errors
-   No explicit visual connection between speaker list and timeline lanes
-   Hard to maintain and debug

## Solution: Explicit Lane Structure

### New HTML Structure

Instead of one container with absolutely positioned segments, create:

-   A flex column container for all speaker lanes
-   Each speaker gets their own dedicated lane row
-   Segments are positioned within their speaker's lane container
-   Perfect alignment: Speaker 1 in list = Lane 1 in timeline

## Implementation

### File: `app/components/timeline/audio-timeline.tsx`

**Current Structure:**

```tsx
<div className="absolute inset-x-0 top-6 h-16">
    {segments.map((segment) => (
        <div style={{ top: `${laneIndex * laneHeight}%` }} />
    ))}
</div>
```

**New Structure:**

```tsx
<div className="flex flex-col">
    {speakers.map((speaker, index) => (
        <div key={speaker.id} className="relative h-12 border-b">
            {/* Speaker label (optional) */}
            {/* Segments for this speaker */}
            {segments
                .filter((s) => s.speaker_id === speaker.id)
                .map((segment) => (
                    <div />
                ))}
        </div>
    ))}
</div>
```

**Key Changes:**

1. **Remove absolute positioning for lanes** - Use flexbox column layout
2. **Iterate over speakers first** - Create one lane per speaker in order
3. **Filter segments per lane** - Each lane only shows segments for its speaker
4. **Fixed height per lane** - Each lane has consistent height (e.g., `h-12` or `h-16`)
5. **Relative positioning within lanes** - Segments use relative/absolute within their lane container
6. **Maintain zoom transform** - Apply zoom to the entire lanes container

**Implementation Details:**

-   Calculate lane height: `h-16` per speaker (or dynamic based on number of speakers)
-   Timeline container height: `h-24` (time markers) + `h-16 * numSpeakers` (lanes)
-   Each lane container: `relative h-16 border-b border-muted/30`
-   Segments within lane: `absolute` positioned by timestamp percentage
-   Click handler: Apply to each lane or the entire lanes container

**Zoom Handling:**

-   Apply `transform: scaleX()` to the lanes container (not individual segments)
-   Ensure playhead and progress indicator are outside the zoom transform
-   Maintain click coordinate calculations with zoom

**Playhead and Progress:**

-   Playhead spans all lanes (full height)
-   Progress indicator spans all lanes
-   Positioned above the lanes with proper z-index

## Benefits

1. **Perfect Alignment**: Speaker 1 in list = Lane 1 in timeline (guaranteed)
2. **No Calculation Errors**: No percentage-based positioning for lanes
3. **Easier Debugging**: Clear HTML structure shows which lane is which
4. **Maintainable**: Adding/removing speakers automatically creates/removes lanes
5. **Visual Clarity**: Optional speaker labels in each lane for clarity

## Optional Enhancements

-   Add speaker name/avatar to each lane (left side)
-   Add hover effects per lane
-   Add lane borders/separators for clarity
-   Make lane height responsive to number of speakers

## Testing Considerations

-   Verify alignment: Speaker 1 segments appear in Lane 1
-   Test with different numbers of speakers (1, 2, 3, 5+)
-   Ensure zoom works correctly with new structure
-   Verify click-to-seek works in all lanes
-   Check playhead spans all lanes correctly
