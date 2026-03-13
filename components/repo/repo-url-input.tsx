"use client";

import { useState } from "react";
import { useRepoStore } from "@/stores/repo-store";
import { apiUrl } from "@/lib/api-base-url";

export function RepoUrlInput() {
  const [url, setUrl] = useState("");
  const { setCurrentRepo, setLoading, setError, loading, currentRepo, error, clear } =
    useRepoStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/repo/index"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to index repository");
        return;
      }

      setCurrentRepo(data);
    } catch {
      setError("Failed to index repository");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste GitHub URL (e.g. https://github.com/owner/repo)"
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-zinc-800 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="shrink-0 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load"}
        </button>
        {currentRepo && (
          <button
            type="button"
            onClick={() => {
              clear();
              setUrl("");
            }}
            className="shrink-0 rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-zinc-800"
          >
            Clear
          </button>
        )}
      </form>
      {currentRepo && (
        <p className="text-sm text-[var(--muted)]">
          Loaded: <span className="text-[var(--foreground)]">{currentRepo.owner}/{currentRepo.name}</span>
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
