export const PROMPTS = {
  systemBase: `You are RepoSage, an AI assistant that helps users understand GitHub repositories.
Answer questions about the repository's purpose, setup, architecture, and code.
Be concise and practical. Use the provided tools when relevant.`,

  suggestImprovements: `Analyze this repository and suggest concrete improvements. Structure your response in these categories:

1. **Missing documentation** — What's undocumented or unclear?
2. **Potential issues** — Security, performance, or maintainability concerns
3. **Next steps** — Actionable improvements (e.g. add tests, update deps, refactor X)

Be specific and actionable. Reference actual files or patterns when relevant.`,
} as const;

export const ERROR_MESSAGES = {
  missingUrl: "Missing or invalid url",
  invalidGitHubUrl: "Invalid GitHub URL. Use format: https://github.com/owner/repo",
  repoNotFound: "Repo not found or not public",
  rateLimited: "Rate limited. Try again later.",
  fetchRepoFailed: "Failed to fetch repository",
  indexFailed: "Failed to index repository",
  chatBadRequest: "Invalid chat request payload",
} as const;

