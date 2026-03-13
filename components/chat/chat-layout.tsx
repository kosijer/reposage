"use client";

import { RepoUrlInput } from "@/components/repo/repo-url-input";
import { TabBar } from "@/components/chat/tab-bar";
import { ChatPanel } from "@/components/chat/chat-panel";

export function ChatLayout() {
  return (
    <div className="layout-main">
      <header className="header">
        <h1 className="header-title">RepoSage</h1>
        <RepoUrlInput />
      </header>
      <TabBar />
      <section className="chat-area" aria-label="Chat">
        <ChatPanel />
      </section>
    </div>
  );
}
