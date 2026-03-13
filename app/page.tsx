import { ChatPanel } from "@/components/chat/chat-panel";
import { RepoUrlInput } from "@/components/repo/repo-url-input";

export default function Home() {
  return (
    <main className="main">
      <header className="header">
        <h1 className="header-title">RepoSage</h1>
        <RepoUrlInput />
      </header>
      <section className="chat-area" aria-label="Chat">
        <ChatPanel />
      </section>
    </main>
  );
}
