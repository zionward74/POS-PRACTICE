// src/store/uiStore.ts
import { createStore } from "zustand/vanilla";
import type { MenuUI } from "../data/loadData";
import { makePagesKey } from "../ui/makePagesKey";

interface UiState {
  activeTopTabId: string;
  activeSubTabId: string;
  activePageIndex: number;

  initFromUi: (ui: MenuUI) => void;

  setTopTab: (ui: MenuUI, topTabId: string) => void;
  setSubTab: (ui: MenuUI, subTabId: string) => void;

  nextPage: (ui: MenuUI) => void;
  prevPage: (ui: MenuUI) => void;
}

function firstTopTabId(ui: MenuUI): string {
  return ui.topTabs?.[0]?.id ?? "";
}

function firstSubTabId(ui: MenuUI, topTabId: string): string {
  const subs = ui.subTabsByTopTab?.[topTabId] ?? [];
  return subs?.[0]?.id ?? "";
}

function pagesCount(ui: MenuUI, topTabId: string, subTabId: string): number {
  if (!topTabId || !subTabId) return 0;
  const key = makePagesKey(topTabId, subTabId);
  const pages = ui.pages?.[key];
  return Array.isArray(pages) ? pages.length : 0;
}

export const uiStore = createStore<UiState>((set, get) => ({
  activeTopTabId: "",
  activeSubTabId: "",
  activePageIndex: 0,

  initFromUi: (ui) => {
    const top = firstTopTabId(ui);
    const sub = top ? firstSubTabId(ui, top) : "";

    if (!top || !sub) {
      console.warn("[uiStore] UI structure is empty or missing tabs.", {
        topTabs: ui.topTabs?.length ?? 0,
        subTabsForTop: top ? (ui.subTabsByTopTab?.[top]?.length ?? 0) : 0,
      });
    }

    set({
      activeTopTabId: top,
      activeSubTabId: sub,
      activePageIndex: 0,
    });
  },

  setTopTab: (ui, topTabId) => {
    const topTabs = ui.topTabs ?? [];
    const topExists = topTabs.some((t) => t.id === topTabId);

    if (!topExists) {
      console.warn("[uiStore] setTopTab blocked: invalid topTabId", {
        topTabId,
        validTopTabs: topTabs.map((t) => t.id),
      });
      return;
    }

    const sub = firstSubTabId(ui, topTabId);

    set({
      activeTopTabId: topTabId,
      activeSubTabId: sub,
      activePageIndex: 0,
    });

    console.log("[uiStore] setTopTab", {
      activeTopTabId: topTabId,
      activeSubTabId: sub,
      activePageIndex: 0,
    });
  },

  setSubTab: (ui, subTabId) => {
    const { activeTopTabId } = get();
    const subs = ui.subTabsByTopTab?.[activeTopTabId] ?? [];
    const exists = subs.some((s) => s.id === subTabId);

    if (!exists) {
      console.warn("[uiStore] setSubTab blocked: invalid subTab for activeTopTabId", {
        activeTopTabId,
        subTabId,
        validSubs: subs.map((s) => s.id),
      });
      return;
    }

    set({
      activeSubTabId: subTabId,
      activePageIndex: 0,
    });

    console.log("[uiStore] setSubTab", {
      activeTopTabId,
      activeSubTabId: subTabId,
      activePageIndex: 0,
    });
  },

  nextPage: (ui) => {
    const { activeTopTabId, activeSubTabId, activePageIndex } = get();
    const count = pagesCount(ui, activeTopTabId, activeSubTabId);

    if (count <= 0) {
      const key = makePagesKey(activeTopTabId, activeSubTabId);
      console.warn("[uiStore] nextPage: no pages for key:", key);
      return;
    }

    const nextIndex = Math.min(count - 1, activePageIndex + 1);
    if (nextIndex === activePageIndex) return;

    set({ activePageIndex: nextIndex });

    console.log("[uiStore] nextPage", {
      activeTopTabId,
      activeSubTabId,
      activePageIndex: nextIndex,
    });
  },

  prevPage: (ui) => {
    const { activeTopTabId, activeSubTabId, activePageIndex } = get();
    const count = pagesCount(ui, activeTopTabId, activeSubTabId);

    if (count <= 0) {
      const key = makePagesKey(activeTopTabId, activeSubTabId);
      console.warn("[uiStore] prevPage: no pages for key:", key);
      return;
    }

    const nextIndex = Math.max(0, activePageIndex - 1);
    if (nextIndex === activePageIndex) return;

    set({ activePageIndex: nextIndex });

    console.log("[uiStore] prevPage", {
      activeTopTabId,
      activeSubTabId,
      activePageIndex: nextIndex,
    });
  },
}));