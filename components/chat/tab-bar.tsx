"use client";

import { useTabStore } from "@/stores/tab-store";

export function TabBar() {
  const { tabs, currentTabId, setCurrentTab, closeTab } = useTabStore();

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-item ${tab.id === currentTabId ? "active" : ""}`}
          role="tab"
          aria-selected={tab.id === currentTabId}
        >
          <button
            type="button"
            className="tab-label"
            onClick={() => setCurrentTab(tab.id)}
          >
            {tab.label}
          </button>
          <button
            type="button"
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            aria-label={`Close ${tab.label}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
