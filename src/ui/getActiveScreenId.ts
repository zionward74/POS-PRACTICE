export function getActiveScreenId(
  ui: any,
  activeTopTabId: string,
  activeSubTabId: string,
  activePageIndex: number
): string {
  const catSubKey = `${activeTopTabId}|${activeSubTabId}`;

  const pages = ui.pages[catSubKey];
  if (!pages) {
    throw new Error(`No pages found for category-subcategory key: ${catSubKey}`);
  }

  if (activePageIndex < 0 || activePageIndex >= pages.length) {
    throw new Error(
      `Page index ${activePageIndex} is out of bounds for category-subcategory key: ${catSubKey}`
    );
  }

  return pages[activePageIndex].screenId;
}

// Example usage:
// const screenId = getActiveScreenId(ui, "TOP_TAB_1", "SUB_TAB_1", 0);
// console.log("Active Screen ID:", screenId);
// const anotherScreenId = getActiveScreenId(ui, "TOP_TAB_2", "SUB_TAB_3", 2);