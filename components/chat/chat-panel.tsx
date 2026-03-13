"use client";

import { useChat } from "ai/react";
import { useRepoStore } from "@/stores/repo-store";
import { apiUrl } from "@/lib/api-base-url";

const SUGGEST_IMPROVEMENTS_PROMPT = `Analyze this repository and suggest concrete improvements. Structure your response in these categories:

1. **Missing documentation** — What's undocumented or unclear?
2. **Potential issues** — Security, performance, or maintainability concerns
3. **Next steps** — Actionable improvements (e.g. add tests, update deps, refactor X)

Be specific and actionable. Reference actual files or patterns when relevant.`;

export function ChatPanel() {
  const currentRepo = useRepoStore((s) => s.currentRepo);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: apiUrl("/api/chat"),
    body: { repoContext: currentRepo },
  });

  function handleSuggestImprovements() {
    if (!currentRepo) {
      append({
        role: "user",
        content: "I'd like to get improvement suggestions, but no repository is loaded. Please paste a GitHub URL above first to load one.",
      });
      return;
    }
    append({ role: "user", content: SUGGEST_IMPROVEMENTS_PROMPT });
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-zinc-900/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">RepoSage Chat</h2>
        <button
          type="button"
          onClick={handleSuggestImprovements}
          disabled={isLoading}
          className="shrink-0 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-zinc-800 disabled:opacity-50"
        >
          Suggest improvements
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "text-right text-[var(--foreground)]"
                : "text-left text-[var(--muted)]"
            }
          >
            <span className="font-medium">{m.role}: </span>
            {m.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-left text-[var(--muted)]">Thinking…</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder={currentRepo ? `Ask about ${currentRepo.owner}/${currentRepo.name}…` : "Paste a GitHub URL above, then ask…"}
          className="flex-1 rounded-md border border-[var(--border)] bg-zinc-800 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
