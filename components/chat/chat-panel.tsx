"use client";

import { useChat } from "ai/react";

export function ChatPanel() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-zinc-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">RepoSage Chat</h2>
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
          placeholder="Ask about repos or the graph…"
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
