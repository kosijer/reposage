"use client";

import { create } from "zustand";
import type { IndexedRepo } from "@/lib/repo/types";

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
}

export interface Tab {
  id: string;
  repo: IndexedRepo;
  label: string;
  messages: ChatMessage[];
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

interface TabState {
  tabs: Tab[];
  currentTabId: string | null;
  addTab: (repo: IndexedRepo) => string;
  setCurrentTab: (id: string | null) => void;
  closeTab: (id: string) => void;
  updateTabMessages: (tabId: string, messages: ChatMessage[]) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  currentTabId: null,

  addTab: (repo) => {
    const id = generateId();
    const label = `${repo.owner}/${repo.name}`;
    set((state) => ({
      tabs: [...state.tabs, { id, repo, label, messages: [] }],
      currentTabId: id,
    }));
    return id;
  },

  setCurrentTab: (id) => set({ currentTabId: id }),

  closeTab: (id) => {
    const { tabs, currentTabId } = get();
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const next = tabs.filter((t) => t.id !== id);
    const newCurrent =
      currentTabId === id
        ? next[idx]?.id ?? next[idx - 1]?.id ?? null
        : currentTabId;
    set({ tabs: next, currentTabId: newCurrent });
  },

  updateTabMessages: (tabId, messages) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, messages } : t
      ),
    }));
  },
}));
