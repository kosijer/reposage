## Context

RepoSage is a Next.js 15 app with Vercel AI SDK (Gemini), React Flow, Supabase, and Zustand. The current UI has a graph canvas (left) and chat panel (right). The chat API streams responses and supports tool calling, but tools are placeholders. There is no GitHub integration yet.

**Constraints:** No GitHub auth for MVP; public repos only. Must work with GitHub REST API unauthenticated (60 req/hr) or raw content URLs (no rate limit for reads). Keep streaming chat responsive.

## Goals / Non-Goals

**Goals:**
- Accept a GitHub repo URL, validate it, and fetch/index the repo
- Provide context-aware streaming chat that knows the indexed repo
- One-click "Suggest improvements" that analyzes the repo and returns actionable suggestions
- Zero auth; works with any public repo

**Non-Goals:**
- Private repo support (requires OAuth)
- Full-file cloning or deep code analysis (MVP: README + tree + key configs)
- Persistent user accounts or chat history (future)
- React Flow integration with repo structure (future; keep graph as-is for now)

## Decisions

### 1. GitHub data access: raw URLs over REST API

**Choice:** Use GitHub raw content URLs (`raw.githubusercontent.com`) and the contents API for file tree.

**Rationale:** Unauthenticated REST API is limited to 60 req/hr. Raw URLs and `api.github.com/repos/{owner}/{repo}/contents` for directory listing have no auth requirement and sufficient limits for MVP. Alternative: Octokit with token — rejected for MVP to keep zero-auth promise.

### 2. Repo context storage: request-scoped vs global store

**Choice:** Store indexed repo (README, tree, key files) in Zustand and pass to chat via request body or system context.

**Rationale:** User pastes URL once; subsequent chat messages need that context. Zustand holds `currentRepo` (owner, name, readme, fileTree, keyFiles). Chat API receives `repoContext` in POST body; if missing, uses store state from client (or we pass it explicitly). Alternative: server-side session — overkill for MVP.

### 3. Key config file detection

**Choice:** Use a fixed list of known config filenames at repo root: `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `requirements.txt`, `Gemfile`, `docker-compose.yml`, `Makefile`, `.env.example`, `README.md` (always). Fetch up to ~10 such files to stay within reasonable token budget.

**Rationale:** Covers common ecosystems. No ML/heuristic detection for MVP. Alternative: recursive search — too many requests and tokens.

### 4. Suggest improvements: dedicated prompt vs tool

**Choice:** Dedicated API route or chat message that injects a fixed "analyze and suggest improvements" prompt plus full repo context. Single turn, no multi-step tool loop.

**Rationale:** Predictable UX; user clicks once, gets a structured response. Simpler than a tool that the model might not invoke. Alternative: tool calling — adds latency and non-determinism.

### 5. Caching: none for MVP

**Choice:** No Supabase/Redis cache for indexed repos in MVP.

**Rationale:** Reduces scope. User can re-paste URL to re-fetch. Add caching later if rate limits or latency become an issue.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| GitHub rate limits (60/hr unauthenticated) | Use raw URLs where possible; limit requests per repo; show clear error when rate limited |
| Large README/config files blow token budget | Truncate README to ~8k chars; fetch only first N config files; cap total context size |
| Invalid or 404 repo URL | Validate URL format; check repo exists via HEAD or lightweight API call before full fetch |
| Stale context after user switches repo | Clear/reset `currentRepo` when new URL is submitted; chat always uses latest context |

## Migration Plan

1. Add URL input component and `repo-fetch-index` API route
2. Add Zustand slice for `currentRepo`
3. Extend chat API to accept and use `repoContext`
4. Add "Suggest improvements" button and handler
5. Deploy; no DB migrations (no cache)
6. Rollback: revert deploy; no data loss

## Open Questions

- Exact token budget for repo context (Gemini 2.0 Flash context window; aim for &lt;32k tokens for repo + conversation)
- Whether to show file tree in UI (left panel) or keep it backend-only for AI context
