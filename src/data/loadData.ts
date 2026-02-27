// src/data/loadData.ts
import fs from "fs";
import path from "path";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  group: string;
  type?: string;
};

export type MenuUI = {
  topTabs: { id: string; label: string }[];
  subTabsByTopTab: Record<string, { id: string; label: string }[]>;
  pages: Record<string, { screenId: string; label: string }[]>;
};

// ✅ screens.cells는 현재 DB에서
// - { id: "..." } 형태일 수도 있고
// - "..." 문자열일 수도 있고
// - null/빈값이 섞여 있을 수도 있어서
// 로더에서 표준 형태({id} | null)로 정규화합니다.
export type ScreenCellInput = { id?: unknown } | string | null | undefined;

export type ScreenCell = { id: string } | null;

export type Screen = {
  screenId: string;
  cells: ScreenCell[];
};

export type LoadedData = {
  rawItems: MenuItem[];
  itemsById: Record<string, MenuItem>;
  ui: MenuUI;
  screensById: Record<string, Screen>;
};

function readJson<T>(absPath: string): T {
  const text = fs.readFileSync(absPath, "utf-8");
  return JSON.parse(text) as T;
}

function normalizeCell(input: ScreenCellInput): ScreenCell {
  if (input == null) return null;

  // "ITEM_ID" 형태
  if (typeof input === "string") {
    const id = input.trim();
    return id ? { id } : null;
  }

  // { id: "ITEM_ID" } 형태 (혹은 id 키가 다른 타입일 수도)
  if (typeof input === "object") {
    // input이 객체이므로 id 속성이 있는지 확인
    const obj = input as { id?: unknown };
    const raw = obj.id;
    const id = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
    return id ? { id } : null;
  }

  return null;
}

export function loadData(): LoadedData {
  // 실행 위치 = 프로젝트 루트(POS-Practice) 가정
  const projectRoot = process.cwd();

  // ✅ Hyung 프로젝트: menu_items/menu_ui는 DB 폴더 안에 있음
  const menuItemsPath = path.join(projectRoot, "DB", "menu_items.json");
  const menuUiPath = path.join(projectRoot, "DB", "menu_ui.json");
  const screensDir = path.join(projectRoot, "DB", "screens");

  const rawItems = readJson<MenuItem[]>(menuItemsPath);
  const ui = readJson<MenuUI>(menuUiPath);

  const itemsById: Record<string, MenuItem> = {};
  for (const item of rawItems) itemsById[item.id] = item;

  const screensById: Record<string, Screen> = {};
  const files = fs.readdirSync(screensDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const abs = path.join(screensDir, file);

    // screen 파일의 원본 구조는 완전히 신뢰하지 않음(정규화)
    const raw = readJson<{ screenId: string; cells?: ScreenCellInput[] }>(abs);

    const screenId = String(raw.screenId ?? "").trim();
    const cellsInput = Array.isArray(raw.cells) ? raw.cells : [];

    const screen: Screen = {
      screenId,
      cells: cellsInput.map(normalizeCell),
    };

    // screenId가 비어있으면 저장하지 않음(검증 단계에서 걸리게)
    if (screenId) {
      screensById[screenId] = screen;
    }
  }

  return { rawItems, itemsById, ui, screensById };
}