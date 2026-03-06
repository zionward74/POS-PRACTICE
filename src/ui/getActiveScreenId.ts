// src/ui/getActiveScreenId.ts
import type { MenuUI } from "../data/loadData";
import { makePagesKey } from "./makePagesKey";

/**
 * Returns the screenId for the currently active category/subcategory/pageIndex.
 * ui.pages is a flat map keyed by "CAT_ID|SUB_ID".
 */
export function getActiveScreenId(
  ui: MenuUI,
  topTabId: string,
  subTabId: string,
  pageIndex: number
): string {
  // If inputs are empty, fallback immediately (silent)
  if (!topTabId || !subTabId) {
    return fallbackFirstScreenId(ui);
  }

  const key = makePagesKey(topTabId, subTabId);
  const pages = ui.pages?.[key];

  if (!Array.isArray(pages) || pages.length === 0) {
    return fallbackFirstScreenId(ui);
  }

  const idx = Math.max(0, Math.min(pages.length - 1, pageIndex));
  const screenId = pages[idx]?.screenId;

  if (!screenId) {
    return fallbackFirstScreenId(ui);
  }

  return screenId;
}

function fallbackFirstScreenId(ui: MenuUI): string {
  const pagesMap = ui.pages ?? {};
  const keys = Object.keys(pagesMap);

  for (const k of keys) {
    const pages = pagesMap[k];
    if (Array.isArray(pages) && pages.length > 0 && pages[0]?.screenId) {
      return pages[0].screenId;
    }
  }

  // Nothing usable exists
  throw new Error("No pages found in ui.pages. Cannot determine active screenId.");
}