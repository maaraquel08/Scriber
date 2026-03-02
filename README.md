# Scriber

A UX research tool that transcribes audio/video interviews, extracts atomic insight facts, and synthesizes them into structured research findings.

## What It Does

- **Transcribe** — Upload audio or video files and automatically transcribe them using AssemblyAI
- **Extract Facts** — Use Gemini AI to shred transcripts into atomic "nuggets" tagged by theme, sentiment, speaker, and timestamp
- **Synthesize Insights** — Group facts across multiple transcripts into research insights inside methodology folders (the Vault)
- **Playback** — Review transcripts with a synchronized media player and timeline

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) project (for auth and database)
- An [AssemblyAI](https://www.assemblyai.com/) API key (for transcription)
- A [Google Gemini](https://aistudio.google.com/) API key (for fact extraction and insights)

---

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/scriber.git
cd scriber
```

**2. Install dependencies**

```bash
npm install
# or
pnpm install
# or
yarn install
```

**3. Set up environment variables**

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> Your Supabase URL and keys can be found in your Supabase project under **Project Settings → API**.

**4. Run the development server**

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Key Configuration

Scriber requires two external AI API keys. You can configure them directly in the app — no need to hardcode them into environment files.

1. Start the dev server and open the app
2. Go to **Settings** (gear icon in the sidebar)
3. Enter your API keys:
   - **AssemblyAI API Key** — used for audio/video transcription. Get one at [assemblyai.com](https://www.assemblyai.com/)
   - **Gemini API Key** — used for fact extraction and insight generation. Get one at [aistudio.google.com](https://aistudio.google.com/)
4. Click **Save Configuration**

Keys are stored in your browser's `localStorage` and sent securely per-request. They never leave your device beyond the API calls themselves.

> **Optional fallback:** You can also add `ASSEMBLY_API_KEY` and `GEMINI_API_KEY` to your `.env.local` file. The app will use localStorage keys first and fall back to env vars if none are set.

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
├── public/                    # Static assets
├── next.config.ts             # Next.js configuration
└── package.json
```

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
| Icons | Phosphor Icons + Lucide |

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run lint:fix  # Run ESLint with auto-fix
```
