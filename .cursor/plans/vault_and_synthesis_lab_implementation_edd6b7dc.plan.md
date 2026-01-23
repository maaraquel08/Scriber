---
name: Vault and Synthesis Lab Implementation
overview: Restructure app into Main Page (methodology folders) → The Vault (transcript list per methodology) → Synthesis Lab (transcript editor with Transcript and Atomic Facts tabs).
todos:
  - id: extend-types
    content: Extend lib/types.ts with Methodology interface and add methodology field to transcript metadata
    status: completed
  - id: methodology-utils
    content: Create lib/methodology-utils.ts for methodology folder management and session linking
    status: completed
  - id: methodology-api
    content: Create app/api/methodologies/ route for CRUD operations
    status: in_progress
  - id: main-page
    content: Create app/page.tsx as main page showing research repository with methodology folders
    status: pending
  - id: methodology-folder-component
    content: Create app/components/main/methodology-folder.tsx for displaying methodology folders
    status: pending
  - id: vault-page
    content: Create app/vault/[methodology]/page.tsx showing list of transcripts in that methodology
    status: pending
  - id: transcript-list-vault
    content: Create app/components/vault/transcript-list.tsx for displaying transcripts in The Vault
    status: pending
  - id: synthesis-lab-route
    content: Move current app/page.tsx to app/lab/[transcriptId]/page.tsx as Synthesis Lab
    status: pending
  - id: update-transcript-tabs
    content: Update transcript-tabs-container to have Tab 1 (Transcript) and Tab 2 (Atomic Facts)
    status: pending
  - id: update-transcript-api
    content: Update app/api/transcript/[id]/route.ts to support methodology assignment
    status: pending
  - id: upload-with-methodology
    content: Update file upload flow to allow methodology selection during upload
    status: pending
---

# Implementation Plan: Main Page → The Vault → Synthesis Lab

## Overview

Restructure the application into a clear three-level hierarchy:

1. **Main Page** (`/`) - Research repository showing methodology folders
2. **The Vault** (`/vault/[methodology]`) - Shows list of transcripts within a methodology
3. **Synthesis Lab** (`/lab/[transcriptId]`) - Transcript editor with two tabs:

   - **Tab 1**: Transcript/Raw Audio (current transcript editor view)
   - **Tab 2**: Atomic Facts (current facts view)

## Architecture

### Route Structure

```
/                           → Main Page (methodology folders)
/vault/[methodology]        → The Vault (transcript list for methodology)
/lab/[transcriptId]         → Synthesis Lab (transcript editor with tabs)
```

### Data Model

**New Types** (`lib/types.ts`):

- `Methodology` - Research framework container with metadata
- Transcript metadata extended with `methodology` field

**File System Structure**:

```
data/
├── transcriptions/          # Existing transcripts (unchanged)
├── methodologies/           # New structure
│   ├── usability-testing/
│   │   └── metadata.json   # Methodology metadata
│   └── user-interviews/
│       └── metadata.json
```

Methodology-to-transcript linking stored in transcript metadata (methodology field).

## Implementation Tasks

### Phase 1: Data Model & Storage

1. **Extend Type Definitions** (`lib/types.ts`)

   - Add `Methodology` interface with `id`, `name`, `description`, `createdAt`, `updatedAt`
   - Add optional `methodology` field to transcript metadata

2. **Create Methodology Storage Utilities** (`lib/methodology-utils.ts`)

   - `createMethodology(name, description)` - Create methodology folder and metadata
   - `listMethodologies()` - Read all methodology folders
   - `getMethodologyById(id)` - Get single methodology metadata
   - `updateMethodology(id, updates)` - Update methodology metadata
   - `deleteMethodology(id)` - Remove methodology (doesn't delete transcripts)

3. **Create Methodology API** (`app/api/methodologies/route.ts`)

   - `GET` - List all methodologies
   - `POST` - Create new methodology

4. **Update Transcript API** (`app/api/transcript/[id]/route.ts`)

   - Add `methodology` field to transcript metadata on save
   - Add `PATCH` endpoint to update methodology assignment

### Phase 2: Main Page (Research Repository)

5. **Create Main Page** (`app/page.tsx`)

   - Display research repository with methodology folders
   - Grid or list view of methodology folders
   - Each folder shows: name, transcript count, fact count
   - `[+ New Study]` button to create new methodology or upload
   - Click methodology folder → navigate to `/vault/[methodology]`

6. **Methodology Folder Component** (`app/components/main/methodology-folder.tsx`)

   - Display methodology card with metadata
   - Show volume metrics (session count, fact count)
   - Click handler to navigate to The Vault

7. **Create Methodology Dialog** (`app/components/main/create-methodology-dialog.tsx`)

   - Dialog for creating new methodology
   - Form: name, description
   - On submit, creates methodology and optionally allows file upload

### Phase 3: The Vault (Methodology Transcript List)

8. **Create Vault Page** (`app/vault/[methodology]/page.tsx`)

   - Display list of all transcripts in the selected methodology
   - Header with methodology name and metadata
   - Back button to main page
   - Transcript list component

9. **Transcript List Component** (`app/components/vault/transcript-list.tsx`)

   - Display transcripts as cards or list items
   - Show: title, date, duration, fact count
   - Click transcript → navigate to `/lab/[transcriptId]`
   - Filter/search functionality

10. **Vault Header** (`app/components/vault/vault-header.tsx`)

    - Methodology name and description
    - Statistics: total transcripts, total facts
    - `[Generate Insight]` button (future feature)
    - Back navigation

### Phase 4: Synthesis Lab (Transcript Editor)

11. **Move Current Page to Lab Route** (`app/lab/[transcriptId]/page.tsx`)

    - Move entire current `app/page.tsx` logic here
    - Load transcript by ID from route params
    - Keep all existing functionality (transcription, fact generation, video player)

12. **Update Transcript Tabs Container** (`app/components/transcript/transcript-tabs-container.tsx`)

    - Ensure two tabs are clearly labeled:
      - **Tab 1: Transcript** - Current transcript editor view
      - **Tab 2: Atomic Facts** - Current facts list view
    - Update tab labels if needed

13. **Update Navigation in Synthesis Lab**

    - Add breadcrumb: Main Page → The Vault → Synthesis Lab
    - Back button to return to The Vault
    - Show methodology context in header

### Phase 5: Upload Flow Integration

14. **Update File Upload Component** (`app/components/upload/file-upload.tsx`)

    - Add methodology selector during upload
    - Allow creating new methodology from upload dialog
    - Save transcript with methodology assignment

15. **Update Upload Handler** (`app/page.tsx` or new upload page)

    - After transcription, assign to selected methodology
    - Navigate to Synthesis Lab after upload
    - Show upload progress and methodology assignment

### Phase 6: Navigation & Polish

16. **Breadcrumb Component** (`app/components/navigation/breadcrumb.tsx`)

    - Show navigation path: Main → Vault → Lab
    - Clickable breadcrumb items

17. **Update Root Layout** (`app/layout.tsx`)

    - Ensure consistent layout across all pages
    - Add global styles if needed

18. **Data Migration**

    - Create default "Uncategorized" methodology
    - Assign existing transcripts to "Uncategorized" methodology
    - Update transcript metadata files with methodology field

## Key Files to Modify

- `lib/types.ts` - Add Methodology interface
- `app/page.tsx` - Complete rewrite as main page with methodology folders
- `app/components/transcript/transcript-tabs-container.tsx` - Ensure proper tab labels
- `app/components/upload/file-upload.tsx` - Add methodology selector
- `app/api/transcript/[id]/route.ts` - Add methodology field support

## Key Files to Create

- `app/vault/[methodology]/page.tsx` - The Vault page
- `app/lab/[transcriptId]/page.tsx` - Synthesis Lab (moved from page.tsx)
- `app/components/main/methodology-folder.tsx` - Methodology folder card
- `app/components/main/create-methodology-dialog.tsx` - Create methodology dialog
- `app/components/vault/transcript-list.tsx` - Transcript list in The Vault
- `app/components/vault/vault-header.tsx` - Vault page header
- `app/components/navigation/breadcrumb.tsx` - Breadcrumb navigation
- `lib/methodology-utils.ts` - Methodology storage utilities
- `app/api/methodologies/route.ts` - Methodology API

## User Flow

1. **Main Page**: User sees methodology folders (e.g., "Usability Testing", "User Interviews")
2. **Click Methodology**: Navigate to `/vault/usability-testing` showing all transcripts in that methodology
3. **Click Transcript**: Navigate to `/lab/[transcriptId]` (Synthesis Lab)
4. **Synthesis Lab**: 

   - Tab 1: Edit transcript, view video/audio
   - Tab 2: View and manage atomic facts

5. **Upload Flow**: Upload file → Select/Create methodology → Transcribe → Auto-navigate to Synthesis Lab

## Data Structure Example

**Methodology Metadata** (`data/methodologies/usability-testing/metadata.json`):

```json
{
  "id": "usability-testing",
  "name": "Usability Testing",
  "description": "Q1 2026 usability studies",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-01-20T14:30:00Z"
}
```

**Transcript Metadata** (existing structure, add `methodology` field):

```json
{
  "id": "abc123...",
  "title": "Participant 1 - Onboarding",
  "methodology": "usability-testing",
  "createdAt": "...",
  ...
}
```