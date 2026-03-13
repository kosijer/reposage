"use client";

import { create } from "zustand";
import type { IndexedRepo } from "@/lib/repo/types";

export interface RepoState {
  currentRepo: IndexedRepo | null;
  loading: boolean;
  error: string | null;
  setCurrentRepo: (repo: IndexedRepo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  currentRepo: null,
  loading: false,
  error: null,

  setCurrentRepo: (repo) => set({ currentRepo: repo, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clear: () => set({ currentRepo: null, error: null }),
}));
