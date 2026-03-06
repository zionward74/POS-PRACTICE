// src/ui/makePagesKey.ts
export function makePagesKey(topTabId: string, subTabId: string): string {
  return `${topTabId}|${subTabId}`;
}