# RepoSage

Boilerplate for an AI-powered repository insights and graph app.

## Stack

- **Next.js 15** + **TypeScript** (App Router)
- **React Flow** (`@xyflow/react`) – drag-and-drop graph canvas
- **Vercel AI SDK** – streaming chat + **tool calling** with **Gemini** (`@ai-sdk/google`)
- **Supabase** – auth, DB, realtime (client + server helpers)
- **Zustand** – global state (e.g. flow store)

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

- `app/` – Next.js App Router (layout, page, `api/chat`)
- `app/api/chat/route.ts` – AI chat endpoint (Gemini + tools)
- `components/flow/` – React Flow canvas
- `components/chat/` – Chat UI using `useChat`
- `lib/ai/tools.ts` – AI tools (e.g. `getRepoSummary`, `searchGraphNodes`)
- `lib/supabase/` – Supabase client (browser) and server client
- `stores/` – Zustand stores (e.g. `flow-store`)

## AI tools

Edit `lib/ai/tools.ts` to add or change tools. Wire tool logic to Supabase or your graph state as needed. The chat route uses `streamText` with `maxSteps: 5` for multi-turn tool use.

## Scripts

- `npm run dev` – dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – ESLint
