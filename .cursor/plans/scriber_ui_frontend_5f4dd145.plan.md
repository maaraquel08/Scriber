---
name: Scriber UI Frontend
overview: Build the transcript editor UI matching the screenshot layout with Shadcn UI components, featuring an editable transcript viewer, interactive timeline, speaker management, and right sidebar with video player placeholder and metadata panels.
todos:
  - id: setup-shadcn
    content: Initialize Shadcn UI and install required components (button, card, input, select, slider, collapsible, dropdown-menu, avatar, separator)
    status: completed
  - id: create-types
    content: Create TypeScript interfaces in lib/types.ts based on SAMPLE_RETURN.MD structure (TranscriptWord, TranscriptData, Speaker, TranscriptSegment)
    status: completed
  - id: create-utils
    content: Create utility functions in lib/utils.ts for time formatting, segment grouping, and timeline calculations
    status: completed
    dependencies:
      - create-types
  - id: create-mock-data
    content: Create mock data in lib/mock-data.ts transforming SAMPLE_RETURN.MD into usable format with speaker segments
    status: completed
    dependencies:
      - create-types
  - id: build-header
    content: Create editor-header.tsx component with undo/redo buttons, save status, and action buttons
    status: completed
    dependencies:
      - setup-shadcn
  - id: build-transcript-editor
    content: Create transcript-editor.tsx and transcript-segment.tsx components with editable content and speaker attribution
    status: completed
    dependencies:
      - setup-shadcn
      - create-types
      - create-mock-data
  - id: build-timeline
    content: Create audio-timeline.tsx and timeline-controls.tsx with interactive timeline, speaker bars, and playback controls
    status: completed
    dependencies:
      - setup-shadcn
      - create-types
      - create-utils
  - id: build-speakers
    content: Create speaker-list.tsx and speaker-item.tsx components for speaker management panel
    status: completed
    dependencies:
      - setup-shadcn
      - create-types
  - id: build-sidebar
    content: Create video-player.tsx, global-properties.tsx, and metadata-panel.tsx for right sidebar
    status: completed
    dependencies:
      - setup-shadcn
      - create-types
  - id: integrate-page
    content: Integrate all components in app/page.tsx with proper layout structure and state management
    status: completed
    dependencies:
      - build-header
      - build-transcript-editor
      - build-timeline
      - build-speakers
      - build-sidebar
  - id: styling-polish
    content: Apply styling to match screenshot, add hover states, and ensure proper spacing and colors
    status: completed
    dependencies:
      - integrate-page
  - id: todo-1768450228096-gbihrg885
    content: ""
    status: pending
---

# Scriber UI Frontend Implementation Plan

## Overview

Build a transcript editor interface matching the screenshot layout with three main sections: central transcript editor, bottom timeline/speaker management, and right sidebar with video player and metadata.

## Architecture

```
app/
├── page.tsx                    # Main transcript editor page
├── components/
│   ├── transcript/
│   │   ├── transcript-editor.tsx      # Main editable transcript display
│   │   ├── transcript-segment.tsx      # Individual speaker segment component
│   │   └── transcript-word.tsx         # Word-level component with timestamps
│   ├── timeline/
│   │   ├── audio-timeline.tsx          # Interactive timeline with speaker bars
│   │   ├── timeline-controls.tsx      # Play, speed, zoom controls
│   │   └── timeline-marker.tsx         # Time markers component
│   ├── speakers/
│   │   ├── speaker-list.tsx            # Speaker management panel
│   │   └── speaker-item.tsx            # Individual speaker with avatar
│   ├── sidebar/
│   │   ├── video-player.tsx            # Placeholder video/audio player
│   │   ├── global-properties.tsx       # Collapsible properties panel
│   │   └── metadata-panel.tsx          # Additional metadata display
│   └── header/
│       └── editor-header.tsx           # Undo/redo, save status, actions
├── lib/
│   ├── types.ts                        # TypeScript types from SAMPLE_RETURN.MD
│   ├── utils.ts                        # Helper functions (time formatting, etc.)
│   └── mock-data.ts                    # Mock data based on SAMPLE_RETURN.MD
└── hooks/
    ├── use-transcript.ts                # Transcript state management
    └── use-timeline.ts                  # Timeline interaction logic
```

## Data Structure

Based on `SAMPLE_RETURN.MD`, create TypeScript interfaces:

```typescript
interface TranscriptWord {
    text: string;
    start: number; // seconds
    end: number; // seconds
    type: "word" | "spacing";
    speaker_id: string;
}

interface TranscriptData {
    language_code: string;
    language_probability: number;
    text: string;
    words: TranscriptWord[];
}

interface Speaker {
    id: string;
    name: string;
    role?: string;
    color: string;
    avatar?: string;
}

interface TranscriptSegment {
    id: string;
    speaker_id: string;
    start: number;
    end: number;
    text: string;
    words: TranscriptWord[];
}
```

## Component Breakdown

### 1. Header Component (`components/header/editor-header.tsx`)

-   Left: Undo/Redo buttons (Shadcn Button)
-   Center: "Last saved never" text
-   Right: Feedback and Export buttons (Shadcn Button)

### 2. Transcript Editor (`components/transcript/transcript-editor.tsx`)

-   Main scrollable area displaying transcript segments
-   Each segment shows:
    -   Speaker avatar (colored circle)
    -   Speaker name and role
    -   Timestamp (formatted as MM:SS)
    -   Editable text content
-   Uses Shadcn Card or custom styling for segments
-   ContentEditable for inline editing

### 3. Timeline Component (`components/timeline/audio-timeline.tsx`)

-   Horizontal timeline with time markers (0:00, 0:05, 0:10, etc.)
-   Colored bars for each speaker showing active periods
-   Clickable to jump to specific timestamps
-   Zoom controls (Shadcn Slider or custom)
-   Playback speed selector (Shadcn Select)
-   Play button (Shadcn Button)
-   "Add segment" button

### 4. Speaker Management (`components/speakers/speaker-list.tsx`)

-   Collapsible panel (Shadcn Collapsible)
-   List of speakers with:
    -   Drag handle icon
    -   Colored avatar
    -   Name and role
    -   Menu icon (Shadcn DropdownMenu)
-   "+" button to add new speaker

### 5. Right Sidebar Components

**Video Player** (`components/sidebar/video-player.tsx`):

-   Placeholder black rectangle
-   Centered avatar/icon
-   Static display (no functionality yet)

**Global Properties** (`components/sidebar/global-properties.tsx`):

-   Collapsible panel (Shadcn Collapsible)
-   Title field (Shadcn Input)
-   Language selector (Shadcn Select)
-   Subtitles section with "+" button

**Metadata Panel** (`components/sidebar/metadata-panel.tsx`):

-   Duration display
-   Speaker count
-   Word count
-   Language probability
-   Additional statistics

## Shadcn UI Components Needed

Install via Shadcn MCP:

-   `button` - For all action buttons
-   `card` - For transcript segments
-   `input` - For editable fields
-   `select` - For dropdowns (language, speed)
-   `slider` - For zoom controls
-   `collapsible` - For collapsible panels
-   `dropdown-menu` - For speaker menu options
-   `avatar` - For speaker avatars
-   `separator` - For visual dividers

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Undo] [Redo] | Last saved never | [Feedback] [Export]│
├──────────────────────────┬───────────────────────────────────┤
│                          │                                   │
│  Transcript Editor       │  Right Sidebar                    │
│  (Scrollable)            │  ┌─────────────────────────────┐ │
│                          │  │ Video Player (Placeholder)  │ │
│  [Speaker] 02:45         │  └─────────────────────────────┘ │
│  Transcript text...      │  ┌─────────────────────────────┐ │
│                          │  │ Global Properties           │ │
│  [Speaker] 14:66         │  │ - Title                    │ │
│  More text...            │  │ - Language                 │ │
│                          │  │ - Subtitles                │ │
│                          │  └─────────────────────────────┘ │
│                          │  ┌─────────────────────────────┐ │
│                          │  │ Metadata                    │ │
│                          │  │ - Duration                  │ │
│                          │  │ - Speakers                 │ │
│                          │  │ - Word count                │ │
│                          │  └─────────────────────────────┘ │
├──────────┬───────────────┴───────────────────────────────────┤
│ Speakers │ Timeline: [0:00] [0:05] [0:10] [0:15] [0:20]     │
│ [List]   │ [Colored bars] [Zoom] [1.0x] [Play] [Add segment]│
└──────────┴───────────────────────────────────────────────────┘
```

## Implementation Steps

1. **Setup Shadcn UI**

    - Initialize Shadcn UI configuration
    - Install required components via Shadcn MCP

2. **Create Type Definitions** (`lib/types.ts`)

    - Define interfaces based on SAMPLE_RETURN.MD structure
    - Add speaker and segment types

3. **Create Mock Data** (`lib/mock-data.ts`)

    - Transform SAMPLE_RETURN.MD into usable format
    - Generate speaker segments from word-level data
    - Create sample speakers with colors/avatars

4. **Build Utility Functions** (`lib/utils.ts`)

    - Time formatting (seconds to MM:SS)
    - Segment grouping logic
    - Timeline calculations

5. **Create Header Component**

    - Layout with undo/redo, save status, action buttons

6. **Create Transcript Editor**

    - Segment rendering with speaker info
    - ContentEditable implementation
    - Scrollable container

7. **Create Timeline Component**

    - SVG or div-based timeline visualization
    - Speaker bar rendering
    - Click handlers for timestamp jumping
    - Control components (play, speed, zoom)

8. **Create Speaker Management**

    - Speaker list with avatars
    - Drag handles (visual only for now)
    - Add speaker functionality

9. **Create Right Sidebar**

    - Video player placeholder
    - Global Properties collapsible panel
    - Metadata panel

10. **Main Page Integration** (`app/page.tsx`)

    - Combine all components
    - Layout with proper grid/flex structure
    - State management hooks

11. **Styling & Polish**

    - Match screenshot colors and spacing
    - Responsive considerations
    - Hover states and interactions

## Key Features

-   **Editable Transcript**: ContentEditable segments with speaker attribution
-   **Interactive Timeline**: Click to jump, visual speaker representation
-   **Speaker Management**: Visual list with avatars and roles
-   **Metadata Display**: Comprehensive information panel
-   **Mock Data**: Uses SAMPLE_RETURN.MD structure for realistic preview

## Notes

-   All components use Shadcn UI for consistency
-   Timeline uses mock data calculations from word timestamps
-   Video player is placeholder only (no actual playback)
-   Transcript editing is basic inline editing (no advanced features yet)
-   Timeline interaction updates transcript scroll position