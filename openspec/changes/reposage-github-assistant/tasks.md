## 1. Repo Store and Types

- [x] 1.1 Add Zustand store slice for `currentRepo` (owner, name, readme, fileTree, keyFiles, loading, error)
- [x] 1.2 Define TypeScript types for indexed repo context (IndexedRepo, KeyFile, etc.)

## 2. GitHub Fetch API

- [x] 2.1 Create API route `POST /api/repo/index` that accepts `{ url: string }` and parses owner/repo from GitHub URL
- [x] 2.2 Implement URL validation (GitHub format) and repo existence check (HEAD or lightweight API call)
- [x] 2.3 Fetch README from repo root (README.md or common variants) via GitHub contents/raw API
- [x] 2.4 Fetch top-level file tree via `api.github.com/repos/{owner}/{repo}/contents`
- [x] 2.5 Fetch key config files (package.json, Cargo.toml, pyproject.toml, go.mod, requirements.txt, Gemfile, docker-compose.yml, Makefile, .env.example) when present at root
- [x] 2.6 Truncate README to ~8k chars and cap total context size; return structured response

## 3. URL Input UI

- [x] 3.1 Add URL input component (paste GitHub URL, submit button) to header or prominent area
- [x] 3.2 Wire URL submit to call `/api/repo/index` and update Zustand store with result
- [x] 3.3 Show loading state during fetch; display validation errors for invalid/non-existent repos
- [x] 3.4 Display current indexed repo name (owner/repo) when loaded

## 4. Context-Aware Chat

- [x] 4.1 Extend chat API to accept `repoContext` in POST body (from client)
- [x] 4.2 Update `useChat` / ChatPanel to pass `currentRepo` from Zustand as `body.repoContext`
- [x] 4.3 Inject repo context into system prompt or as initial context for AI (README, file tree, key configs)
- [x] 4.4 Handle no-context case: prompt user to paste repo URL or respond that no repo is loaded

## 5. Suggest Improvements

- [x] 5.1 Add "Suggest improvements" button to chat panel (or header)
- [x] 5.2 On click: if no repo indexed, show prompt to paste URL; else send analysis request
- [x] 5.3 Create analysis flow: inject fixed "analyze and suggest improvements" prompt + full repo context, single-turn response
- [x] 5.4 Stream analysis response into chat (or dedicated area) with categorized suggestions
