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

### Environment Variables

Create a `.env.local` file in the root directory with the following environment variables:

```bash
# ElevenLabs API Key (required for transcription)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Gemini API Key (required for fact generation)
GEMINI_API_KEY=your_gemini_api_key_here
```

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
