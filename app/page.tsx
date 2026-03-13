import { RepoSageFlow } from "@/components/flow/reposage-flow";
import { ChatPanel } from "@/components/chat/chat-panel";
import { RepoUrlInput } from "@/components/repo/repo-url-input";

export default function Home() {
  return (
    <main className="flex h-screen flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">RepoSage</h1>
          <span className="text-sm text-[var(--muted)]">
            Next.js · React Flow · Vercel AI (Gemini) · Supabase · Zustand
          </span>
        </div>
        <RepoUrlInput />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full min-h-0 rounded-lg border border-[var(--border)] bg-zinc-950">
            <RepoSageFlow />
          </div>
        </div>
        <aside className="w-[360px] shrink-0 overflow-hidden p-4">
          <ChatPanel />
        </aside>
      </div>
    </main>
  );
}
