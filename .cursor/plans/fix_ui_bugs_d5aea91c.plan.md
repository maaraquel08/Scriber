---
name: Fix UI Bugs
overview: "Fix four UI bugs: make speaker name/role editable inline, remove delete button from speakers, implement timeline zoom functionality, and remove box shadows from transcript cards."
todos:
    - id: "1"
      content: Remove shadow-sm from Card component
      status: completed
    - id: "2"
      content: Remove delete button and dropdown menu from SpeakerItem, make name and role contentEditable
      status: completed
    - id: "3"
      content: Add speaker update handler in page.tsx and pass to SpeakerList/SpeakerItem
      status: completed
    - id: "4"
      content: Add zoom state management in page.tsx and connect TimelineControls to AudioTimeline
      status: completed
    - id: "5"
      content: Implement zoom transform in AudioTimeline component
      status: completed
---

# Fix UI Bugs

## Overview

This plan addresses four UI bugs identified in the application:

1. Make speaker name and role editable inline in SpeakerItem
2. Remove delete button from speaker dropdown menu
3. Implement functional zoom for the timeline
4. Remove box shadows from transcript segment cards

## Changes Required

### 1. SpeakerItem Component - Inline Editing

**File**: `app/components/speakers/speaker-item.tsx`

-   Remove the dropdown menu entirely (including Edit and Delete options)
-   Make the speaker name and role fields contentEditable (similar to transcript segment text editing)
-   Add state management for name and role with local state
-   Add `onUpdate` callback prop to handle speaker updates: `onUpdate?: (speakerId: string, updates: { name?: string; role?: string }) => void`
-   Handle blur events to save changes
-   Add visual feedback for editable fields (focus styles, hover states)

### 2. Remove Delete Button

**File**: `app/components/speakers/speaker-item.tsx`

-   Remove the entire DropdownMenu component and its imports
-   Remove `onDelete` prop from interface
-   Remove `MoreVertical` icon import

### 3. Timeline Zoom Functionality

**Files**:

-   `app/components/timeline/timeline-controls.tsx`
-   `app/components/timeline/audio-timeline.tsx`
-   `app/page.tsx`

**Changes**:

-   In `app/page.tsx`: Add zoom state and handler, pass zoom value to both TimelineControls and AudioTimeline
-   In `app/components/timeline/audio-timeline.tsx`:
    -   Add `zoom?: number` prop (defaults to 100)
    -   Apply zoom transform to the timeline container using CSS transform: `scaleX(zoom / 100)`
    -   Adjust the container width calculation or use transform-origin to zoom from left
    -   Update marker and segment positioning calculations to account for zoom
-   In `app/components/timeline/timeline-controls.tsx`: Ensure zoom value is properly passed to parent via `onZoomChange`

### 4. Remove Card Shadows

**File**: `components/ui/card.tsx`

-   Remove `shadow-sm` from the Card component's default className (line 10)
-   Keep all other styling intact

## Implementation Details

### Speaker Editing Pattern

Follow the same pattern used in `transcript-segment.tsx`:

-   Use `contentEditable` with `suppressContentEditableWarning`
-   Local state for editing values
-   `onBlur` to save changes
-   Focus styles for better UX

### Zoom Implementation

The zoom should affect the visual scale of the timeline. Options:

-   Use CSS `transform: scaleX()` on the timeline container
-   Adjust the effective duration calculation based on zoom (zoom > 100 shows more detail, zoom < 100 shows less)
-   Ensure markers and segments scale proportionally

### State Management

-   Speaker updates: Add `onSpeakerUpdate` handler in `app/page.tsx` to update speakers state
-   Zoom state: Manage in `app/page.tsx` and pass down to components

## Testing Considerations

-   Verify inline editing saves correctly on blur
-   Ensure zoom slider updates timeline visual scale
-   Confirm no delete option appears in speaker menu
-   Verify card shadows are removed
