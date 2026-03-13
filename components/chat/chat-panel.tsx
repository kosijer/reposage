"use client";

import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    <>
      <div className="chat-scroll">
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">
            <p className="empty-text">
              {currentRepo
                ? (
                  <>
                    Ask anything about <strong>{currentRepo.owner}/{currentRepo.name}</strong> — how to run it, what it does, or how to contribute.
                  </>
                )
                : "Load a repo in the bar above, then ask questions here."}
            </p>
            {currentRepo && (
              <button
                type="button"
                onClick={handleSuggestImprovements}
                className="suggest-link"
              >
                Suggest improvements
              </button>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`message-row ${m.role}`}>
            <div className="message-bubble">
              {m.role === "user" ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <div className="chat-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-row">
            <div className="message-bubble">
              <span className="typing-dots">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-wrap">
        <form onSubmit={handleSubmit} className="chat-input-inner">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={currentRepo ? `Ask about ${currentRepo.owner}/${currentRepo.name}…` : "Load a repo above, then type your question…"}
            disabled={isLoading}
            aria-label="Message"
          />
          <button type="submit" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}
