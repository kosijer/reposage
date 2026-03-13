"use client";

import { useState } from "react";
import { useRepoStore } from "@/stores/repo-store";
import { useTabStore } from "@/stores/tab-store";
import { apiUrl } from "@/lib/api-base-url";

export function RepoUrlInput() {
  const [url, setUrl] = useState("");
  const { setLoading, setError, loading, error } = useRepoStore();
  const addTab = useTabStore((s) => s.addTab);

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

      addTab(data);
      setUrl("");
    } catch {
      setError("Failed to index repository");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="repo-bar-wrapper">
      <form onSubmit={handleSubmit} className="repo-bar">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste GitHub repo URL, then Load to open a new tab…"
          disabled={loading}
          aria-label="GitHub repository URL"
        />
        <button type="submit" className="primary" disabled={loading || !url.trim()}>
          {loading ? "Loading…" : "Load"}
        </button>
      </form>
      {error && <p className="repo-error">{error}</p>}
    </div>
  );
}
