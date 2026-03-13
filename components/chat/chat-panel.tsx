"use client";

import { useEffect } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTabStore } from "@/stores/tab-store";
import { apiUrl } from "@/lib/api-base-url";
import type { ChatMessage } from "@/stores/tab-store";
import { PROMPTS } from "@/lib/constants/messages";

function toChatMessage(m: { id?: string; role: string; content: string }): ChatMessage {
  return {
    id: m.id ?? Math.random().toString(36).slice(2, 11),
    role: m.role,
    content: typeof m.content === "string" ? m.content : "",
  };
}

export function ChatPanel() {
  const { tabs, currentTabId, updateTabMessages } = useTabStore();
  const currentTab = currentTabId ? tabs.find((t) => t.id === currentTabId) : null;
  const currentRepo = currentTab?.repo ?? null;

  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: apiUrl("/api/chat"),
      id: currentTabId ?? undefined,
      initialMessages: currentTab?.messages?.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })) ?? [],
      body: { repoContext: currentRepo },
    });

  // Persist messages to tab when they change
  useEffect(() => {
    if (currentTabId && messages.length > 0) {
      updateTabMessages(
        currentTabId,
        messages.map((m) => toChatMessage(m))
      );
    }
  }, [currentTabId, messages, updateTabMessages]);

  // When switching tab, load that tab's messages into the chat (only on tab id change, not when messages update)
  useEffect(() => {
    if (currentTabId && currentTab) {
      const msgs = currentTab.messages.length > 0
        ? currentTab.messages.map((m) => ({ id: m.id, role: m.role as "user" | "assistant" | "system", content: m.content }))
        : [];
      setMessages(msgs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on tab switch
  }, [currentTabId]);

  function handleSuggestImprovements() {
    if (!currentRepo) return;
    append({ role: "user", content: PROMPTS.suggestImprovements });
  }

  if (!currentTabId) {
    return (
      <>
        <div className="chat-scroll">
          <div className="empty-state">
            <p className="empty-text">Load a repo in the bar above to open a chat tab.</p>
          </div>
        </div>
        <div className="chat-input-wrap">
          <div className="chat-input-inner chat-input-disabled">
            <input placeholder="Load a repo to start…" disabled aria-label="Message" />
            <button type="button" disabled>Send</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="chat-scroll">
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">
            <p className="empty-text">
              Ask anything about <strong>{currentRepo?.owner}/{currentRepo?.name}</strong> — how to run it, what it does, or how to contribute.
            </p>
            <button
              type="button"
              onClick={handleSuggestImprovements}
              className="suggest-link"
            >
              Suggest improvements
            </button>
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
            placeholder={`Ask about ${currentRepo?.owner}/${currentRepo?.name}…`}
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
