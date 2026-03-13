## Why

You land on an unfamiliar GitHub repo and spend 10 minutes reading scattered docs just to understand what it does, how to set it up, or whether it's even relevant to you. RepoSage gives you an instant AI companion that already knows the repo — just ask. No setup, no cloning, no reading walls of text.

## What Changes

- **GitHub URL input** — Paste any public GitHub URL; RepoSage validates and fetches the repo
- **Automatic repo indexing** — Fetches README, file tree, and key config files (package.json, Cargo.toml, pyproject.toml, etc.) without requiring GitHub auth
- **Context-aware streaming chat** — Chat interface where answers stream word-by-word; the AI understands the difference between "what's the architecture?" vs "how do I run this?"
- **Suggest improvements** — One-click prompt that analyzes the repo and suggests concrete next steps, missing docs, or potential issues
- **Zero auth** — Works with any public repo; no GitHub login required

## Capabilities

### New Capabilities

- `repo-url-input`: Accept and validate public GitHub URLs; trigger fetch and indexing
- `repo-fetch-index`: Fetch and index README, file tree, and key config files from public GitHub repos (no auth)
- `context-aware-chat`: Streaming chat interface with repo context; context-aware responses (architecture vs quickstart, etc.)
- `suggest-improvements`: One-click analysis that suggests improvements, missing docs, or potential issues

### Modified Capabilities

- (none — new project)

## Impact

- **Frontend**: New URL input flow, chat panel enhancements, suggest-improvements UI
- **Backend**: New API routes for GitHub fetching (via GitHub REST API or raw content), repo indexing, and context assembly for AI
- **AI**: Extend existing Vercel AI + Gemini setup with repo context injection and tool calling for file lookups
- **Dependencies**: GitHub API client or fetch-based access; possibly file-type detection for "key config" selection
- **Supabase** (optional): Cache indexed repo data to avoid repeated fetches; not required for MVP
