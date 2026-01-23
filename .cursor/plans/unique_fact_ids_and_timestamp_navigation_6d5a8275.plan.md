---
name: Unique Fact IDs and Timestamp Navigation
overview: Update fact ID format to include transcript ID prefix ({transcriptId}_Facts_{X}) to ensure uniqueness across transcripts, and enable clicking fact IDs in insights to navigate to the transcript with timestamp seeking.
todos:
  - id: prefix-fact-ids
    content: Prefix fact IDs with transcript ID when loading facts in vault page
    status: completed
  - id: update-api-validation
    content: Update insights API to handle prefixed fact IDs in validation
    status: completed
  - id: update-insights-panel-click
    content: Update InsightsPanel to parse fact ID and navigate with timestamp
    status: completed
  - id: update-vault-click-handler
    content: Update vault page click handler to extract transcript ID and timestamp
    status: completed
  - id: add-timestamp-navigation
    content: Add timestamp URL parameter handling in lab page for seeking
    status: completed
---

# Unique Fact IDs and Timestamp Navigation

## Overview

Make fact IDs unique across transcripts by prefixing with transcript ID, and enable clicking fact IDs in insights panel to navigate to the transcript at the specific timestamp.

## Changes Required

### 1. Update Fact Loading in Vault Page

**File**: `app/vault/[methodology]/page.tsx`

When loading facts from multiple transcripts, prefix each fact's `fact_id` with the transcript ID:

- Format: `{transcriptId}_Facts_{originalFactId}`
- Example: `f0d1503064eb01337f25eab56d8ed85839773027e783288c3695843783ea2c2a_Facts_FACT_01`

Modify the facts loading section (lines 59-75) to:

- Map each fact with transcript ID prefix
- Store a mapping of prefixed fact_id to original fact data (including transcript ID and timestamp) for later lookup

### 2. Update Insights Generation API

**File**: `app/api/insights/generate/route.ts`

The API already receives facts with prefixed IDs, but needs to:

- Update validation logic to handle the new format
- Ensure fact quote validation works with prefixed IDs
- Preserve the prefixed format in the response

### 3. Update InsightsPanel Click Handler

**File**: `app/components/insights/insights-panel.tsx`

Update `handleFactClick` to:

- Parse fact ID format: `{transcriptId}_Facts_{factNumber}`
- Extract transcript ID and fact number
- Navigate to `/lab/{transcriptId}` 
- Pass timestamp as URL parameter or use router state

### 4. Update Vault Page Click Handler

**File**: `app/vault/[methodology]/page.tsx`

Update `handleInsightFactClick` to:

- Parse the prefixed fact ID to extract transcript ID
- Find the fact in `allFacts` array (which should have transcript context)
- Navigate to `/lab/{transcriptId}` with timestamp parameter
- Use Next.js router for navigation with state or URL params

### 5. Update Lab Page to Handle Timestamp Parameter

**File**: `app/lab/[transcriptId]/page.tsx`

Add logic to:

- Check for timestamp in URL query params (e.g., `?t=123` or `?timestamp=00:04:47`)
- On mount, if timestamp exists, seek video/audio to that time
- Parse timestamp format (HH:MM:SS or seconds)

## Implementation Details

### Fact ID Format

- Pattern: `{transcriptId}_Facts_{originalFactId}`
- Example: `f0d1503064eb01337f25eab56d8ed85839773027e783288c3695843783ea2c2a_Facts_FACT_11`
- Parsing regex: `^(.+)_Facts_(.+)$`

### Navigation Flow

```
User clicks FACT_11 button
  ↓
Parse: transcriptId = "f0d150...", factId = "FACT_11"
  ↓
Find fact in allFacts array
  ↓
Extract timestamp: "00:04:47"
  ↓
Navigate to /lab/{transcriptId}?timestamp=00:04:47
  ↓
Lab page loads transcript
  ↓
Parse timestamp from URL
  ↓
Seek video/audio to timestamp
```

## Files to Modify

1. `app/vault/[methodology]/page.tsx` - Prefix fact IDs when loading, update click handler
2. `app/api/insights/generate/route.ts` - Handle prefixed fact IDs in validation
3. `app/components/insights/insights-panel.tsx` - Parse fact ID and navigate
4. `app/lab/[transcriptId]/page.tsx` - Handle timestamp URL parameter and seek

## Considerations

- Existing insights may have old format fact IDs - may need migration or backward compatibility
- Fact ID parsing should be robust to handle edge cases
- Timestamp format conversion (HH:MM:SS to seconds) needed for video seeking
- URL parameter approach vs router state - URL params are more shareable/bookmarkable