export const PROMPTS = {
  systemBase: `You are RepoSage, an AI assistant that helps users understand GitHub repositories.

Your responsibilities:
- Always answer FIRST from the current repository context (README, root files, key configs, metadata, and recent commits). If something is not present in that context, say so explicitly.
- Prefer short, step-by-step answers with concrete commands (shell snippets, file paths, etc.).
- When giving commands, target the repo's tech stack (languages, tools, and frameworks inferred from metadata and key config files).
- If the repo does not contain enough information (for example, no README or config), say that clearly and propose next steps or questions instead of inventing details.

What you can inspect:
- README (possibly truncated).
- Root-level files and folders.
- Key config files (e.g. package.json, pyproject.toml, go.mod, requirements.txt, docker-compose.yml, etc.).
- Basic repo metadata (description, language, topics, stars, forks, open issues, license, default branch, creation/last push times).
- A shallow commit history (e.g., the most recent 3 commits) and the first commit (project start). When mentioning commit dates, use human-readable format (e.g. March 13, 2026 at 7:44 PM), not raw ISO.

Tool usage:
- Use the getRepoSummary tool when the user asks for a high-level overview of the repository or wants a concise summary.`,

  suggestImprovements: `Analyze this repository and suggest concrete improvements. Structure your response in these categories:

1. **Missing documentation** — What's undocumented or unclear?
2. **Potential issues** — Security, performance, or maintainability concerns
3. **Next steps** — Actionable improvements (e.g. add tests, update deps, refactor X)

Be specific and actionable. Reference actual files or patterns when relevant.`,
} as const;

/** Suggested prompts: pick 3 random when showing. getContent(owner, name) fills in repo. */
export const SUGGESTED_PROMPTS: ReadonlyArray<{
  label: string;
  getContent: (owner: string, name: string) => string;
}> = [
  { label: "Overview of this repo", getContent: (o, n) => `Give me a high-level overview of ${o}/${n} and its main components.` },
  { label: "How to set up and run it", getContent: (o, n) => `How do I set up and run ${o}/${n} locally?` },
  { label: "Good first improvements", getContent: (o, n) => `Suggest good first issues or improvements I could work on in ${o}/${n}.` },
  { label: "Full repo improvement analysis", getContent: () => PROMPTS.suggestImprovements },
  { label: "What does this project do?", getContent: (o, n) => `In one short paragraph, what does ${o}/${n} do?` },
  { label: "Explain the main entry points", getContent: (o, n) => `What are the main entry points or scripts to run in ${o}/${n}?` },
  { label: "Dependencies and how to install", getContent: (o, n) => `What are the dependencies of ${o}/${n} and how do I install them?` },
  { label: "Testing and how to run tests", getContent: (o, n) => `How do I run tests in ${o}/${n}?` },
  { label: "Contribution and code style", getContent: (o, n) => `How do I contribute to ${o}/${n}? Any code style or PR guidelines?` },
  { label: "Key config files explained", getContent: (o, n) => `Explain the key config files at the root of ${o}/${n}.` },
  { label: "Recent changes summary", getContent: (o, n) => `Summarize the most recent commits in ${o}/${n}.` },
  { label: "Security or deployment notes", getContent: (o, n) => `Are there any security considerations or deployment notes for ${o}/${n}?` },
  { label: "Project structure and folders", getContent: (o, n) => `Explain the folder structure and main directories in ${o}/${n}.` },
  { label: "Available scripts and commands", getContent: (o, n) => `What scripts or npm/yarn/cargo etc. commands are available in ${o}/${n}?` },
  { label: "When did this project start?", getContent: (o, n) => `When did ${o}/${n} start? What was the first commit about?` },
  { label: "License and usage terms", getContent: (o, n) => `What license does ${o}/${n} use and what can I do with it?` },
  { label: "Environment variables and config", getContent: (o, n) => `What environment variables or config does ${o}/${n} need?` },
  { label: "CI/CD and automation", getContent: (o, n) => `Does ${o}/${n} have CI/CD, GitHub Actions, or other automation? Describe it.` },
  { label: "Performance or scaling notes", getContent: (o, n) => `Any performance tips, scaling considerations, or bottlenecks for ${o}/${n}?` },
  { label: "Public API or main exports", getContent: (o, n) => `What is the main public API or exports of ${o}/${n}?` },
  { label: "Debugging and logging", getContent: (o, n) => `How do I debug or enable verbose logging in ${o}/${n}?` },
  { label: "Common pitfalls for new contributors", getContent: (o, n) => `What are common pitfalls or gotchas when working with ${o}/${n}?` },
  { label: "Docker or container usage", getContent: (o, n) => `How do I build or run ${o}/${n} with Docker or containers?` },
  { label: "Database or storage setup", getContent: (o, n) => `Does ${o}/${n} use a database or storage? How do I set it up?` },
];

export const ERROR_MESSAGES = {
  missingUrl: "Missing or invalid url",
  invalidGitHubUrl: "Invalid GitHub URL. Use format: https://github.com/owner/repo",
  repoNotFound: "Repo not found or not public",
  rateLimited: "Rate limited. Try again later.",
  fetchRepoFailed: "Failed to fetch repository",
  indexFailed: "Failed to index repository",
  chatBadRequest: "Invalid chat request payload",
} as const;

