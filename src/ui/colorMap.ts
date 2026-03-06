// src/ui/colorMap.ts

// ✅ 색 키는 "string"으로 둔다.
// 이유: 팔레트에서 pink/sky/lime 등 확장되어도 저장/표시가 깨지지 않게.
export type ColorKey = string;

export type ColorMap = Record<string, ColorKey[]>;

const STORAGE_KEY = "pos.colorMap.v1";
const GRID_SIZE = 30;

// localStorage 파싱 안전 처리
function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeScreenColors(arr: unknown): ColorKey[] {
  const base: ColorKey[] = Array(GRID_SIZE).fill("gray");

  if (!Array.isArray(arr)) return base;

  for (let i = 0; i < Math.min(GRID_SIZE, arr.length); i++) {
    const v = arr[i];

    // null/undefined/빈문자 -> gray
    if (v === null || v === undefined) {
      base[i] = "gray";
      continue;
    }
    const s = String(v).trim();
    base[i] = s.length ? s : "gray";
  }

  return base;
}

function normalizeMap(raw: unknown): ColorMap {
  const out: ColorMap = {};
  if (!raw || typeof raw !== "object") return out;

  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = normalizeScreenColors(v);
  }
  return out;
}

export function loadColorMap(): ColorMap {
  const rawStr = localStorage.getItem(STORAGE_KEY);
  const raw = safeParse(rawStr);
  return normalizeMap(raw);
}

export function saveColorMap(map: ColorMap): void {
  const normalized = normalizeMap(map);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

// (선택) 특정 screenId만 가져오고/세팅하는 유틸 (있어도 되고 없어도 됨)
export function getColorsForScreen(screenId: string): ColorKey[] {
  const map = loadColorMap();
  return map[screenId] ?? Array(GRID_SIZE).fill("gray");
}

export function setColorsForScreen(screenId: string, colors: ColorKey[]): void {
  const map = loadColorMap();
  map[screenId] = normalizeScreenColors(colors);
  saveColorMap(map);
}