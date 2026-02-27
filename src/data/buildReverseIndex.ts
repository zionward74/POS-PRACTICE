// src/data/buildReverseIndex.ts
import type { LoadedData } from "./loadData";

/**
 * Represents the location of an item within the UI structure.
 */
export type ItemLocation = {
  catId: string;
  subId: string;
  pageIndex: number;
  screenId: string;
  cellIndex: number;
};

/**
 * Reverse index mapping item IDs to their locations.
 */
export type ReverseIndex = Record<string, ItemLocation[]>;

export function buildReverseIndex(data: LoadedData): ReverseIndex {
  const reverseIndex: ReverseIndex = {};

  for (const [catSubKey, pages] of Object.entries(data.ui.pages)) {
    const [catId, subId] = catSubKey.split("|");
    if (!catId || !subId) continue;

    for (const [pageIndex, page] of pages.entries()) {
      const screenId = page.screenId;
      const screen = data.screensById[screenId];

      if (!screen) {
        throw new Error(
          `Screen ID '${screenId}' defined in menu_ui.pages is missing in screensById.`
        );
      }

      for (const [cellIndex, cell] of screen.cells.entries()) {
        if (!cell) continue;

        const itemId = cell.id;
        (reverseIndex[itemId] ??= []).push({
          catId,
          subId,
          pageIndex,
          screenId,
          cellIndex,
        });
      }
    }
  }

  return reverseIndex;
}