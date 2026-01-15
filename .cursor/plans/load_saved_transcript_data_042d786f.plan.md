---
name: Load Saved Transcript Data
overview: Set up automatic loading of saved transcript data and media file so the app loads with test data instead of showing the upload page, allowing UI development without wasting API credits.
todos:
    - id: "1"
      content: Create adapter function in transformers.ts to handle saved JSON format (camelCase to snake_case)
      status: completed
    - id: "2"
      content: Create load-saved-data.ts utility to load transcript JSON and media file
      status: completed
    - id: "3"
      content: Set up media file storage location (public/media or data/media)
      status: completed
    - id: "4"
      content: Update page.tsx to load saved data on mount with useEffect
      status: completed
    - id: "5"
      content: Test that app loads with saved data instead of upload page
      status: completed
---

# Load Saved Transcript Data

## Overview

Configure the app to automatically load the saved transcript JSON file and associated media file on startup, bypassing the upload page. This allows UI development and bug fixing without making API calls.

## Changes Required

### 1. Create Adapter for Saved JSON Format

**File**: `lib/transformers.ts`

The saved JSON uses camelCase (`speakerId`, `languageCode`) while the transformer expects snake_case (`speaker_id`, `language_code`). Add a new function to handle the saved format:

-   Create `transformSavedTranscript()` function that:
    -   Accepts the saved JSON format (camelCase)
    -   Normalizes field names to match expected format
    -   Maps `speakerId` → `speaker_id` in words array
    -   Maps `languageCode` → `language_code`
    -   Maps `languageProbability` → `language_probability`
    -   Returns data in format compatible with `transformToSegmentsAndSpeakers()`

### 2. Create Data Loading Utility

**File**: `lib/load-saved-data.ts` (new file)

Create utility functions to:

-   Load transcript JSON from `data/transcriptions/` directory
-   Load media file from a `data/media/` directory (or public folder)
-   Return both transcript data and media file path/URL

Functions:

-   `loadSavedTranscript(transcriptId: string)` - loads JSON and transforms it
-   `getMediaFileUrl(transcriptId: string)` - returns path to media file (or null if not found)

### 3. Store Media File

**Directory**: `data/media/` (create if needed)

-   Place the original audio/video file in `data/media/` directory
-   Name it with the same hash/ID as the transcript: `ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4.{ext}`
-   Or use a simpler naming convention like `test-media.mp4` / `test-media.mp3`

### 4. Update page.tsx to Load Saved Data

**File**: `app/page.tsx`

Add `useEffect` hook on component mount to:

-   Load saved transcript data using the utility function
-   Load media file URL
-   Transform and set state (segments, speakers, transcriptData, fileUrl, fileType, etc.)
-   Set title and language from transcript data
-   Skip upload page if data loads successfully

Implementation approach:

-   Use a constant for the transcript ID: `const SAVED_TRANSCRIPT_ID = "ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4"`
-   Load on mount, show loading state if needed
-   Fall back to upload page if loading fails

### 5. Handle Media File Storage Options

Two approaches for media files:

**Option A: Public folder** (simpler, works for development)

-   Place file in `public/media/` directory
-   Use `/media/filename.ext` as the URL
-   Works immediately without additional setup

**Option B: Data folder with API route** (more production-like)

-   Store in `data/media/`
-   Create API route `/api/media/[id]` to serve files
-   More secure but requires API setup

**Recommendation**: Start with Option A (public folder) for simplicity during development.

## Implementation Details

### Transcript ID Constant

Add to `app/page.tsx` or a config file:

```typescript
const SAVED_TRANSCRIPT_ID =
    "ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4";
```

### Loading Logic Flow

1. On mount, check if we should load saved data (can use environment variable or constant)
2. Load transcript JSON from `data/transcriptions/`
3. Transform using new adapter function
4. Load media file URL (from public folder or API)
5. Set all state variables
6. App renders with data loaded

### Error Handling

-   If transcript file not found → show upload page
-   If media file not found → show transcript but no media player
-   Log errors to console for debugging

## File Structure

```
data/
  transcriptions/
    ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4.json
  media/
    ee7f8d5afabc0e529dcc9be8c351947c7026f57cbca16217eb81aec8476184c4.mp4 (or .mp3)

public/
  media/
    test-media.mp4 (alternative location)

lib/
  load-saved-data.ts (new)
  transformers.ts (updated)
```

## Testing

-   Verify transcript loads correctly on page refresh
-   Verify media file plays in video/audio player
-   Verify all segments and speakers are displayed
-   Verify timeline shows correct duration and segments
-   Test that upload page still works if saved data fails to load
