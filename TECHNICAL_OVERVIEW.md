# RepoSage – Technical Overview

This document explains how RepoSage works from a technical perspective so you can quickly re-orient yourself when you come back to the project.

---

## 1. High-level flow

1. User pastes a **public GitHub repo URL** into the header and clicks **Load**.
2. The client calls `POST /api/repo/index` with `{ url }`.
3. The repo index route:
   - Validates the URL.
   - Calls the GitHub REST API to verify the repo exists and is public.
   - Fetches:
     - README (truncated to `README_MAX_CHARS`),
     - root file tree (`/contents`),
     - key config files in the repo root (e.g. `package.json`, `pyproject.toml`, `go.mod`, etc.),
     - basic repo metadata (description, language, topics, stars, forks, open issues, license, default branch, created/updated/pushed timestamps, HTML URL),
     - a shallow commit history (most recent 3 commits: SHA, 1st-line message, author, date, URL).
   - Returns a single `IndexedRepo` object.
4. The client **creates a new chat tab** for the repo and sets it as the active tab.
5. When the user sends a message, the chat UI calls `POST /api/chat` with:
   - `messages`: the full conversation history for the current tab.
   - `repoContext`: the `IndexedRepo` for the current tab.
6. The chat route:
   - Builds a system prompt that embeds the repo context.
   - Streams a Gemini (`gemini-2.0-flash`) response back via the Vercel AI SDK.
7. The client renders messages in a **ChatGPT-style** UI with:
   - Right-aligned user bubbles.
   - Left-aligned assistant bubbles rendered with markdown (`react-markdown` + `remark-gfm`).

---

## 2. API routes

### 2.1 `POST /api/repo/index`

**File:** `app/api/repo/index/route.ts`

Types:

- `IndexedRepo` in `lib/repo/types.ts`:
  - `owner: string`
  - `name: string`
  - `readme: string`
  - `fileTree: string[]` (root-level files and folders; folders end with `/`)
  - `keyFiles: { name: string; content: string }[]`
  - `metadata?: RepoMetadata` – repo metadata (description, language, topics, stars, forks, open issues, default branch, license, created/updated/pushed timestamps, HTML URL)
  - `recentCommits?: RepoCommitSummary[]` – most recent commit summaries (SHA, 1st-line message, author, date, URL)

Constants:

- `GITHUB_API = "https://api.github.com"`
- `GITHUB_HEADERS` – shared `Accept` header for GitHub v3 API.
- `README_MAX_CHARS = 8000`
- `KEY_CONFIG_FILES` – list of filenames to treat as “key config files”.

Error messages come from `ERROR_MESSAGES` in `lib/constants/messages.ts`:

- `missingUrl`
- `invalidGitHubUrl`
- `repoNotFound`
- `rateLimited`
- `fetchRepoFailed`
- `indexFailed`

Key steps:

1. **Validate URL body:**
   - Parse JSON body.
   - Ensure `url` is a string, else `400` with `missingUrl`.

2. **Parse GitHub URL:**
   - `parseGitHubUrl(url: string)` – regex matches:
     - `https://github.com/owner/repo`
     - `github.com/owner/repo`
     - optional `.git` suffix or trailing slash.
   - Returns `{ owner, repo }` or `null` → `400` with `invalidGitHubUrl`.

3. **Verify repo:**
   - `GET /repos/{owner}/{repo}`.
   - `404` → `404` with `repoNotFound`.
   - `403` → `429` with `rateLimited`.
   - Any other non-OK → propagate status with `fetchRepoFailed`.

4. **Fetch README:**
   - `GET /repos/{owner}/{repo}/readme`.
   - If response is OK and `encoding === "base64"`, decode and truncate at `README_MAX_CHARS` with a `"[... truncated]"` marker.

5. **Fetch root file tree:**
   - `GET /repos/{owner}/{repo}/contents`.
   - Map items to `fileTree: string[]`:
     - `dir` → `name/`
     - `file` → `name`.

6. **Fetch key config files:**
   - Build `rootNames` set from `fileTree` (strip `/` from folder names).
   - For each `KEY_CONFIG_FILES` name present in `rootNames`:
     - `GET /repos/{owner}/{repo}/contents/{name}`.
     - If OK and base64-encoded, decode and push into `keyFiles`.

7. **Fetch shallow commit history:**
   - `GET /repos/{owner}/{repo}/commits?per_page=3`.
   - Map each entry to `RepoCommitSummary` (SHA, 1st-line message, author name, date, URL).

8. **Return `IndexedRepo`:**
   - Combine all pieces into `{ owner, name: repo, readme, fileTree, keyFiles, metadata, recentCommits }`.

9. **Global error handler:**
   - Catches unexpected errors, logs `[repo/index]` tag, and returns `500` with `indexFailed`.

### 2.2 `POST /api/chat`

**File:** `app/api/chat/route.ts`

Types:

- `CoreMessage` from `ai` – shape used by Vercel AI SDK.
- `RepoContext` from `lib/repo/types.ts` – same structure as `IndexedRepo`.

Constants:

- `maxDuration = 30` – route timeout hint.
- `PROMPTS.systemBase` – base system prompt (in `lib/constants/messages.ts`).
- `ERROR_MESSAGES.chatBadRequest` – invalid request error message.

Flow:

1. **Parse and validate body:**
   - Parse JSON.
   - Destructure `{ messages, repoContext }`.
   - Ensure `messages` is an array; otherwise return `400` with `chatBadRequest`.

2. **Build system prompt:**
   - `buildSystemPrompt(repoContext: RepoContext | null)`:
     - If `null`:
       - Uses `PROMPTS.systemBase` and appends instructions telling the model to ask for a repo URL first.
     - If present:
       - Injects:
         - An explicit note about the current repo/tab: `You are currently answering about repository: owner/name. Do not refer to other repositories or previous tabs unless the user explicitly asks you to switch context.`
         - **Repo metadata**: description, language, stars/forks/open issues, topics, created/last pushed timestamps.
         - **Recent commits**: a short bullet list of the last 3 commits (date, 1st-line message, author).
         - **README**: README content (or `(no README)`), prefixed with a note when it was truncated: `(NOTE: README truncated to 8000 characters)`.
         - **File tree**: grouped summary of root directories and key files instead of a raw flat list:
           - `Directories:` — only folder names.
           - `Key files:` — important config/entry files like `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `docker-compose.yml`, `README.md`, `Makefile`, etc.
         - **Key config files**: rendered as `### name` + fenced code block with up to 2000 characters (truncated with `"... truncated"` marker).

3. **Call Gemini via Vercel AI SDK:**
   - `google("gemini-2.0-flash")`.
   - `streamText({ model, system, messages, tools: reposageTools, maxSteps: 5 })`.
   - Exposes the result as `toDataStreamResponse()` for streaming back to the client.

4. **Error handling:**
   - Wraps the whole handler in `try/catch`.
   - Logs `[chat]` tag on error.
   - Returns `500` with a generic `"Unexpected error while handling chat request"` message.

---

## 3. Client-side architecture

### 3.1 State stores

**`stores/repo-store.ts`**

Very small store for **indexing state** only:

- `loading: boolean` – true while `/api/repo/index` is in flight.
- `error: string | null` – last indexing error to show under the URL bar.
- `setLoading`, `setError`, `clear`.

Chat tabs do **not** live here—they live in a separate store.

**`stores/tab-store.ts`**

Tabs and chat history per repo:

- `ChatMessage` – `{ id: string; role: string; content: string }`
- `Tab` – `{ id, repo: IndexedRepo, label, messages: ChatMessage[] }`
- `tabs: Tab[]`
- `currentTabId: string | null`
- `addTab(repo: IndexedRepo): string`
  - Creates a new tab with label `owner/name`, empty `messages`, sets it as current.
- `setCurrentTab(id: string | null)`
- `closeTab(id: string)`
  - Removes a tab and selects a neighbor as current (next or previous) or `null` when no tabs remain.
- `updateTabMessages(tabId: string, messages: ChatMessage[])`
  - Persists message history per tab (used by `ChatPanel`).

### 3.2 Layout & UI components

**`components/chat/chat-layout.tsx`**

Top-level layout under `main`:

- Header:
  - `RepoSage` title.
  - `RepoUrlInput` (URL bar and Load button).
- `TabBar`:
  - Tabs for each loaded repo.
- `ChatPanel`:
  - Main chat UI.

**`components/repo/repo-url-input.tsx`**

- Local `url` state.
- Uses `repo-store` for `loading` + `error`.
- Uses `tab-store` `addTab` to create/select a new tab after successful indexing.
- On submit:
  - Calls `/api/repo/index` with the pasted URL.
  - On non-OK, shows `error` from JSON response or a generic `"Failed to index repository"`.
  - On success:
    - Calls `addTab(data)` where `data` is `IndexedRepo`.
    - Clears the input.

**`components/chat/tab-bar.tsx`**

Renders one tab per repo from `tab-store`:

- Active tab is styled as selected.
- Clicking a tab sets `currentTabId`.
- Clicking × closes the tab.

**`components/chat/chat-panel.tsx`**

Chat UI using `useChat` from `ai/react`:

- Determines the **current repo** from `tab-store` via `currentTabId`.
- Calls `useChat` with:
  - `api: "/api/chat"` (wrapped via `apiUrl`).
  - `id: currentTabId` – ensures each tab has its own stream identity.
  - `initialMessages`: seeded from the tab’s `messages` array when the hook mounts.
  - `body: { repoContext: currentRepo }` – passes `IndexedRepo` to the server.

Side effects:

- `useEffect` that syncs local `messages` back into `tab-store` with `updateTabMessages` whenever `messages` change.
- `useEffect` that reloads messages from the active tab when `currentTabId` changes.

Buttons:

- Empty-state button calls `handleSuggestImprovements()`:
  - Sends `PROMPTS.suggestImprovements` as a user message if a repo is loaded.

Rendering:

- Messages are rendered as **bubbles**:
  - `.message-row.user` (right-aligned) for user messages (plain text).
  - `.message-row` (left-aligned) for assistant messages (markdown).
- Assistant content uses:
  - `ReactMarkdown` with `remarkGfm`.
  - Styled via `.chat-markdown` in `globals.css`.

Input:

- Fixed bottom bar:
  - Input with placeholder `"Ask about owner/repo…"`.
  - `Send` button disabled while `isLoading`.

---

## 4. Styling

**File:** `app/globals.css`

Key design choices:

- Dark background (`--bg-page`) with subtle card/input backgrounds.
- Single accent (`--accent`) for primary actions and focus states.
- Chat layout:
  - `.chat-scroll` – centered column with max width `48rem`.
  - `.message-row`/`.message-bubble` – bubble shapes with slight “tail” via asymmetric radii.
  - `.chat-input-wrap` + `.chat-input-inner` – floating pill input centered at the bottom, similar to ChatGPT.
- Repo URL bar:
  - `.repo-bar` – full-width input + “Load” button in the header.
  - `.repo-error` – error text under the bar.

---

## 5. Extensibility notes

Ideas for future work and where they would plug in:

1. **Graph/visualization of repo structure**
   - Use `IndexedRepo.fileTree` + additional analysis (e.g. import graph) and render with a graph library in a new component (`components/graph/*`).
   - Could be displayed as a separate view or as a secondary panel next to the chat.

2. **Persisting history**
   - Currently, messages are in-memory only (per tab).
   - To persist:
     - Attach a `tabId` or derived `repoId` and send chat logs to Supabase (see `onFinish` in `api/chat/route.ts`).

3. **Authentication / multi-user**
   - Add auth (e.g. Supabase Auth) and associate tabs/history with a user id.

4. **More tools**
   - Extend `lib/ai/tools.ts` with tools that:
     - Fetch live files from GitHub.
     - Run static analysis on indexed content.
   - Model can call these via the Vercel AI SDK’s tool calling.

This overview should give you enough context to resume work on RepoSage even after a long break. If you add major features, update this file with new flows and entry points.

