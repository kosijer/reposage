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
    <div className="repo-bar-wrapper">
      <form onSubmit={handleSubmit} className="repo-bar">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste GitHub repo URL…"
          disabled={loading}
          aria-label="GitHub repository URL"
        />
        <button type="submit" className="primary" disabled={loading || !url.trim()}>
          {loading ? "Loading…" : "Load"}
        </button>
        {currentRepo && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              clear();
              setUrl("");
            }}
          >
            Clear
          </button>
        )}
      </form>
      {currentRepo && (
        <p className="repo-status">
          Loaded: <strong>{currentRepo.owner}/{currentRepo.name}</strong>
        </p>
      )}
      {error && <p className="repo-error">{error}</p>}
    </div>
  );
}
