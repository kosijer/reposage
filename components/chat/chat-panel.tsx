"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTabStore } from "@/stores/tab-store";
import { apiUrl } from "@/lib/api-base-url";
import type { ChatMessage } from "@/stores/tab-store";
import { PROMPTS, SUGGESTED_PROMPTS } from "@/lib/constants/messages";

function pickRandom<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const prevShowSuggestionsRef = useRef(false);

  const [showSuggestionsAfterMessage, setShowSuggestionsAfterMessage] = useState(false);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<typeof SUGGESTED_PROMPTS[number][] | null>(null);
  const [suggestionsFadedIn, setSuggestionsFadedIn] = useState(false);

  const showSuggestionsCondition =
    (messages.length === 0 && !!currentRepo && !isLoading) ||
    (messages.length > 0 && !isLoading && showSuggestionsAfterMessage);

  // When we transition to "show suggestions", pick 3 random
  useEffect(() => {
    if (showSuggestionsCondition && !prevShowSuggestionsRef.current && currentRepo) {
      setDisplayedSuggestions(pickRandom(SUGGESTED_PROMPTS, 3));
    }
    prevShowSuggestionsRef.current = showSuggestionsCondition;
  }, [showSuggestionsCondition, currentRepo]);

  // After 5s idle: show suggestions. Hide when user types/sends.
  useEffect(() => {
    if (messages.length === 0 || isLoading) return;
    const t = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= 5000) {
        setShowSuggestionsAfterMessage(true);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [messages.length, isLoading]);

  // Fade-in suggestions after they mount (after response or 5s idle)
  useEffect(() => {
    if (messages.length > 0 && showSuggestionsCondition && showSuggestionsAfterMessage) {
      const id = setTimeout(() => setSuggestionsFadedIn(true), 50);
      return () => clearTimeout(id);
    }
    setSuggestionsFadedIn(false);
  }, [messages.length, showSuggestionsCondition, showSuggestionsAfterMessage]);

  const onUserActivity = () => {
    lastActivityRef.current = Date.now();
    setShowSuggestionsAfterMessage(false);
  };

  // Scroll chat to bottom when messages change or while streaming
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when stream finishes so user can type next question immediately
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

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

  if (!currentTabId) {
    return (
      <>
        <div className="chat-scroll" ref={scrollRef}>
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

  const repoUrl = currentRepo?.metadata?.htmlUrl ?? (currentRepo ? `https://github.com/${currentRepo.owner}/${currentRepo.name}` : null);

  return (
    <>
      <div className="chat-panel-inner">
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-repo-link"
            aria-label={`Open ${currentRepo?.owner}/${currentRepo?.name} on GitHub`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        )}
        <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">
            <p className="empty-text">
              Ask anything about <strong>{currentRepo?.owner}/{currentRepo?.name}</strong> — how to run it, what it does, or how to contribute.
            </p>
            {currentRepo && displayedSuggestions && displayedSuggestions.length > 0 && (
              <div className="suggestions-list">
                {displayedSuggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="suggest-link"
                    onClick={() => append({ role: "user", content: s.getContent(currentRepo.owner, currentRepo.name) })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
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
        {messages.length > 0 && showSuggestionsCondition && displayedSuggestions && currentRepo && (
          <div className={`suggestions-list suggestions-fade-in ${suggestionsFadedIn ? "suggestions-visible" : ""}`}>
            {displayedSuggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                className="suggest-link"
                onClick={() => append({ role: "user", content: s.getContent(currentRepo.owner, currentRepo.name) })}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      <div className="chat-input-wrap">
        <form
          onSubmit={(e) => {
            onUserActivity();
            handleSubmit(e);
          }}
          className="chat-input-inner"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              onUserActivity();
              handleInputChange(e);
            }}
            placeholder={`Ask about ${currentRepo?.owner}/${currentRepo?.name}…`}
            disabled={isLoading}
            aria-label="Message"
          />
          <button type="submit" disabled={isLoading} aria-label="Send">
            Send
          </button>
        </form>
      </div>
    </>
  );
}
