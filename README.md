# Scriber

A UX research tool that transcribes audio/video interviews, extracts atomic insight facts, and synthesizes them into structured research findings.

## What It Does

- **Transcribe** — Upload audio or video files and automatically transcribe them using AssemblyAI
- **Extract Facts** — Use Gemini AI to shred transcripts into atomic "nuggets" tagged by theme, sentiment, speaker, and timestamp
- **Synthesize Insights** — Group facts across multiple transcripts into research insights inside methodology folders (the Vault)
- **Playback** — Review transcripts with a synchronized media player and timeline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI |
| Auth & Database | Supabase |
| Transcription | AssemblyAI |
| AI / LLM | Google Gemini 2.5 Flash |
| Video processing | ffmpeg |
| Icons | Phosphor Icons + Lucide |

---

## Local Setup Guide

Follow these steps in order to get Scriber running on your machine.

### Step 1 — Install Node.js

Make sure you have **Node.js v18 or higher** installed.

```bash
node -v   # should print v18.x.x or higher
```

Download it at [nodejs.org](https://nodejs.org/) if you don't have it.

---

### Step 2 — Install ffmpeg

ffmpeg is required to extract audio from video files before sending them to AssemblyAI.

**macOS (Homebrew)**
```bash
brew install ffmpeg
```

**Windows**
1. Download the latest build from [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extract the zip and move the `bin/` folder somewhere permanent (e.g. `C:\ffmpeg\bin`)
3. Add `C:\ffmpeg\bin` to your system PATH:
   - Search "Environment Variables" in the Start menu
   - Under "System variables" → select `Path` → click Edit → Add new → paste the path

**Linux (Ubuntu/Debian)**
```bash
sudo apt update && sudo apt install ffmpeg
```

Verify the installation:
```bash
ffmpeg -version   # should print version info
```

---

### Step 3 — Clone the repository

```bash
git clone https://github.com/maaraquel08/Scriber.git
cd Scriber
```

---

### Step 4 — Install dependencies

```bash
npm install
```

---

### Step 5 — Set up Supabase

Scriber uses Supabase for authentication and database storage.

1. Go to [supabase.com](https://supabase.com/) and create a free account
2. Click **New project** and fill in the details
3. Wait for the project to finish provisioning (~1 minute)
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

Also configure the Auth settings:
- Go to **Authentication → URL Configuration**
- Set **Site URL** to `http://localhost:3000`
- Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

---

### Step 6 — Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### Step 7 — Get your API keys

Scriber needs two external AI API keys. You configure these inside the app (not in `.env.local`).

**AssemblyAI** (transcription)
1. Sign up at [assemblyai.com](https://www.assemblyai.com/)
2. Go to your dashboard and copy your API key

**Google Gemini** (fact extraction + insights)
1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Click **Get API key** and create a new key

---

### Step 8 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 9 — Add your API keys in the app

1. Click the **Settings** icon in the sidebar
2. Enter your **AssemblyAI API Key** and **Gemini API Key**
3. Click **Save Configuration**

Keys are stored in your browser's `localStorage` and sent per-request. They are never stored on the server.

> **Optional:** You can also add `ASSEMBLY_API_KEY` and `GEMINI_API_KEY` directly to `.env.local` as a fallback for server-side use.

---

### You're ready

Upload a video or audio file, transcribe it, extract facts, and start building research insights.

---

## Project Structure

```
/
├── app/
│   ├── api/                   # API routes (transcribe, facts, insights, methodologies)
│   ├── auth/                  # Login, signup, and OAuth callback pages
│   ├── lab/[transcriptId]/    # Transcript viewer with media player and fact extraction
│   ├── vault/[methodology]/   # Methodology folders and insight synthesis
│   ├── settings/              # API key configuration page
│   └── page.tsx               # Home / research repository
├── lib/
│   ├── types.ts               # Shared TypeScript types
│   ├── supabase-client.ts     # Supabase browser client
│   ├── supabase-db.ts         # Database query helpers
│   └── fact-generation-config.ts  # Dropdown options for fact generation
├── public/
│   └── media/                 # Uploaded video/audio files for local playback
├── next.config.ts
└── package.json
```

---

## Customizing AI Prompts and Output Structure

Scriber uses Gemini to generate two types of AI output: **Facts** and **Insights**. You can change the prompt instructions, output fields, themes, enums, and JSON schema by editing the files below.

---

### Facts (Atomic Nuggets)

**What it does:** Shreds a transcript into atomic observations tagged by theme, sentiment, speaker, and timestamp.

**Where to edit:**

| What you want to change | File |
|---|---|
| System prompt (role, rules, instructions) | `app/api/facts/generate/route.ts` → `buildSystemPrompt()` |
| Output JSON schema (fields, types, required) | `app/api/facts/generate/route.ts` → `buildResponseSchema()` |
| Theme list (enum values) | `app/api/facts/generate/route.ts` → `THEMES` array at the top |
| Sentiment options | `buildResponseSchema()` → `sentiment.enum` |
| Dropdown options shown in the UI (Data Type, Product, Feature) | `lib/fact-generation-config.ts` |

**Current output fields per fact:**

| Field | Description |
|---|---|
| `fact_id` | Unique ID (e.g. `FACT_01`) |
| `verbatim_quote` | Direct word-for-word quote from the transcript |
| `timestamp` | `HH:MM:SS` of when it was said |
| `speaker_label` | Who said it (e.g. `Speaker 1`) |
| `sentiment` | `Positive`, `Neutral`, or `Negative` |
| `theme` | One of 21 UX research themes |
| `summary_of_observation` | Short objective summary of the fact |

---

### Insights

**What it does:** Synthesizes a collection of Facts across transcripts into higher-level research insights with evidence traceability.

**Where to edit:**

| What you want to change | File |
|---|---|
| System prompt (role, rules, synthesis instructions) | `app/CONTEXT/STRICT_SCHEME_PROMPT_INSIGHTS_V3.MD` |
| Output JSON schema (fields, types, required) | `app/api/insights/generate/route.ts` → `buildResponseSchema()` |
| Insight level options (`Principle`, `Strategic`, `Tactical`) | `buildResponseSchema()` → `level.enum` |
| Insight type options (`Behavioral`, `Functional`, etc.) | `buildResponseSchema()` → `type.enum` |
| Evidence strength options (`Strong`, `Emerging`) | `buildResponseSchema()` → `strength.enum` |

**Current output fields per insight:**

| Field | Description |
|---|---|
| `id` | Unique ID (e.g. `INS-001`) |
| `level` | Scope — `Principle`, `Strategic`, or `Tactical` |
| `type` | `Behavioral`, `Functional`, `Need`, or `Pain Point` |
| `strength` | `Strong` (3+ facts) or `Emerging` (1–2 facts) |
| `context` | The scenario where the issue occurs |
| `cause` | Evidence-backed reason it is happening |
| `effect` | User or business impact if it persists |
| `relevance` | Why it matters for design or strategy |
| `evidence.fact_ids` | Array of Fact IDs that support this insight |
| `evidence.supporting_quotes` | Verbatim quotes pulled from those facts |
| `recommendation` | An evidence-appropriate next step |

> **Note:** The insights prompt is intentionally kept in a separate Markdown file (`STRICT_SCHEME_PROMPT_INSIGHTS_V3.MD`) so non-developers can edit the instructions without touching code. The route reads it at runtime and falls back to an inline version if the file is missing.

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run lint:fix  # Run ESLint with auto-fix
```
