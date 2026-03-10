// src/ui/getActiveScreenId.ts
import type { MenuUI } from "../data/loadData";
import { makePagesKey } from "./makePagesKey";

/**
 * Returns the screenId for the currently active category/subcategory/pageIndex.
 * ui.pages is a flat map keyed by "TOPTAB_ID|SUBTAB_ID".
 */
export function getActiveScreenId(
  ui: MenuUI,
  topTabId: string,
  subTabId: string,
  pageIndex: number
): string {
  if (!topTabId || !subTabId) {
    throw new Error(
      `[getActiveScreenId] Missing tab ids. topTabId="${topTabId}", subTabId="${subTabId}"`
    );
  }

  const key = makePagesKey(topTabId, subTabId);
  const pages = ui.pages?.[key];

  console.log("[getActiveScreenId] resolve", {
    topTabId,
    subTabId,
    pageIndex,
    key,
    pages,
    availableKeys: Object.keys(ui.pages ?? {}),
  });

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(
      `[getActiveScreenId] No pages found for key="${key}". Check ui.pages keys and tab ids.`
    );
  }

  const idx = Math.max(0, Math.min(pages.length - 1, pageIndex));
  const screenId = pages[idx]?.screenId;

  if (!screenId) {
    throw new Error(
      `[getActiveScreenId] Missing screenId at key="${key}" pageIndex=${idx}.`
    );
  }

  return screenId;
}