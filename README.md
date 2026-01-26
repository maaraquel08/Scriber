# Scriber

A Next.js boilerplate project with Tailwind CSS.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

### API Configuration

**Primary Method (Recommended):** Configure your API keys through the Settings page in the app. Your keys will be stored locally in your browser's localStorage.

1. Start the development server
2. Navigate to the Settings page
3. Enter your API keys:
   - **AssemblyAI API Key** - For audio/video transcription
   - **Gemini API Key** - For fact extraction and insight generation
4. Click "Save Configuration"

**Alternative Method (Optional):** You can also set environment variables in a `.env.local` file as a fallback:

```bash
# AssemblyAI API Key (optional - fallback only)
ASSEMBLY_API_KEY=your_assemblyai_api_key_here

# Gemini API Key (optional - fallback only)
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** Environment variables are optional. The app will use API keys from the Settings page (stored in localStorage) by default. Environment variables only serve as a fallback for server-side operations.

Then, run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Next.js** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## Project Structure

```
/
├── app/
│   ├── globals.css      # Global styles with Tailwind imports
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Home page
├── public/              # Static assets
├── next.config.ts       # Next.js configuration
├── postcss.config.mjs   # PostCSS configuration for Tailwind
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
