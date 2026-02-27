// src/data/validateData.ts
import type { LoadedData } from "./loadData";

type SubTab = { id: string; label: string };

export function validateData(data: LoadedData): void {
  const errors: string[] = [];

  // 1) menu_items id 중복 검사
  const seen = new Set<string>();
  for (const item of data.rawItems) {
    if (seen.has(item.id)) errors.push(`Duplicate menu_items id: ${item.id}`);
    seen.add(item.id);
  }

  // 2) screens.cells id 존재 검사 (null 허용)
  for (const [screenId, screen] of Object.entries(data.screensById)) {
    screen.cells.forEach((cell, idx) => {
      if (!cell) return;
      if (!data.itemsById[cell.id]) {
        errors.push(
          `Screen ${screenId} cell[${idx}] references missing item id: ${cell.id}`
        );
      }
    });
  }

  // 3) pages screenId 존재 검사
  for (const [catSub, pages] of Object.entries(data.ui.pages)) {
    for (const page of pages) {
      if (!data.screensById[page.screenId]) {
        errors.push(
          `menu_ui.pages[${catSub}] references missing screenId: ${page.screenId}`
        );
      }
    }
  }

  // 4) pages의 CAT|SUB 키 유효성 검사
  // catSub = "CAT_X|SUB_Y"
  for (const catSub of Object.keys(data.ui.pages)) {
    const [cat, sub] = catSub.split("|");
    if (!cat || !sub) {
      errors.push(`Invalid pages key format (expected CAT|SUB): ${catSub}`);
      continue;
    }

    const subs = (data.ui.subTabsByTopTab[cat] ?? undefined) as SubTab[] | undefined;
    if (!subs) {
      errors.push(`pages key uses missing CAT in subTabsByTopTab: ${cat}`);
      continue;
    }

    const ok = subs.some((s: SubTab) => s.id === sub);
    if (!ok) {
      errors.push(`pages key uses missing SUB in subTabsByTopTab[${cat}]: ${sub}`);
    }
  }

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }

  console.log("Data validation OK");
}