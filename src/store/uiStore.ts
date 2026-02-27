import { createStore, StateCreator } from "zustand/vanilla";
import type { MenuUI } from "../data/loadData";

interface UiState {
  activeTopTabId: string;
  activeSubTabId: string;
  activePageIndex: number;
  initFromUi: (ui: MenuUI) => void;
  setTopTab: (ui: MenuUI, topTabId: string) => void;
  setSubTab: (ui: MenuUI, subTabId: string) => void;
  nextPage: (ui: MenuUI) => void;
  prevPage: (ui: MenuUI) => void;
  getCurrentCatSubKey: () => string;
}

const uiStoreCreator: StateCreator<UiState> = (set, get) => ({
  activeTopTabId: "",
  activeSubTabId: "",
  activePageIndex: 0,

  initFromUi: (ui: MenuUI) => {
    const topTabId = ui.topTabs[0]?.id;
    const subTabId = ui.subTabsByTopTab[topTabId]?.[0]?.id;
    if (!topTabId || !subTabId) {
      throw new Error("Invalid UI structure");
    }
    set({
      activeTopTabId: topTabId,
      activeSubTabId: subTabId,
      activePageIndex: 0,
    });
  },

  setTopTab: (ui: MenuUI, topTabId: string) => {
    const subTabs = ui.subTabsByTopTab[topTabId];
    if (!subTabs || subTabs.length === 0) {
      throw new Error(`No subTabs found for topTabId: ${topTabId}`);
    }
    set({
      activeTopTabId: topTabId,
      activeSubTabId: subTabs[0].id,
      activePageIndex: 0,
    });
  },

  setSubTab: (ui: MenuUI, subTabId: string) => {
    set({
      activeSubTabId: subTabId,
      activePageIndex: 0,
    });
  },

  nextPage: (ui: MenuUI) => {
    const { activeTopTabId, activeSubTabId, activePageIndex } = get();
    const catSubKey = `${activeTopTabId}|${activeSubTabId}`;
    const pages = ui.pages[catSubKey];
    if (!pages) {
      throw new Error(`No pages found for category-subcategory key: ${catSubKey}`);
    }
    const nextPageIndex = (activePageIndex + 1) % pages.length;
    set({ activePageIndex: nextPageIndex });
  },

  prevPage: (ui: MenuUI) => {
    const { activeTopTabId, activeSubTabId, activePageIndex } = get();
    const catSubKey = `${activeTopTabId}|${activeSubTabId}`;
    const pages = ui.pages[catSubKey];
    if (!pages) {
      throw new Error(`No pages found for category-subcategory key: ${catSubKey}`);
    }
    const prevPageIndex = (activePageIndex - 1 + pages.length) % pages.length;
    set({ activePageIndex: prevPageIndex });
  },

  getCurrentCatSubKey: () => {
    const { activeTopTabId, activeSubTabId } = get();
    return `${activeTopTabId}|${activeSubTabId}`;
  },
});

export const uiStore = createStore<UiState>(uiStoreCreator);