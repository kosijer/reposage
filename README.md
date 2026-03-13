# RepoSage

RepoSage is a small Next.js app that lets you paste any **public GitHub repo URL** and then **chat with an AI** that already knows the repo (README, root file tree, key config files, basic metadata, and the most recent commits).

There is:

- No cloning
- No local indexing process to manage
- A **ChatGPT-style UI** with:
  - Tabs (one per loaded repo)
  - Markdown rendering
  - Repo-aware system prompt

## Stack

- **Next.js 15** + **TypeScript** (App Router)
- **Vercel AI SDK** – streaming chat + tool calling with **Gemini** (`@ai-sdk/google`)
- **Zustand** – lightweight client-side state (`repo` and `tab` stores)
- **Supabase** – optional (helpers are wired, but not used yet)

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Env**

   Copy `.env.example` to `.env.local` and set:

   - `GOOGLE_GENERATIVE_AI_API_KEY` – [Google AI Studio](https://aistudio.google.com/apikey)
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` – [Supabase](https://supabase.com) project

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project layout

- `app/`
  - `page.tsx` – mounts the chat layout
  - `api/chat/route.ts` – AI chat endpoint (Gemini + tools)
  - `api/repo/index/route.ts` – repo indexing endpoint (README + root file tree + key config files)
- `components/chat/`
  - `chat-layout.tsx` – header + tab bar + chat area
  - `chat-panel.tsx` – ChatGPT-style chat UI (bubbles, markdown, input)
  - `tab-bar.tsx` – one tab per loaded repo
- `components/repo/`
  - `repo-url-input.tsx` – paste GitHub URL and load a repo
- `lib/`
  - `ai/tools.ts` – AI tools (e.g. `getRepoSummary`)
  - `constants/messages.ts` – shared prompts and error messages
  - `repo/types.ts` – `IndexedRepo` and related types
  - `supabase/*` – Supabase helpers (currently unused)
- `stores/`
  - `repo-store.ts` – simple loading/error state for repo indexing
  - `tab-store.ts` – tab state (`tabs`, `currentTabId`, per-tab messages)

For a deeper technical description, see **`TECHNICAL_OVERVIEW.md`**.

## Scripts

- `npm run dev` – dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – ESLint
