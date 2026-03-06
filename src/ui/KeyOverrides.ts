// src/ui/keyOverrides.ts
// 목적: screenId + cellIndex 단위로 "표시용" 이름/가격을 저장/로드 (pos-data.json은 건드리지 않음)

export type KeyOverride = {
  label?: string; // 표시용 이름
  price?: number; // 표시용 가격
};

export type KeyOverridesMap = Record<string, Record<number, KeyOverride>>;

const STORAGE_KEY = "pos.keyOverrides.v1";

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalize(raw: unknown): KeyOverridesMap {
  const out: KeyOverridesMap = {};
  if (!raw || typeof raw !== "object") return out;

  for (const [screenId, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;

    const byIndex: Record<number, KeyOverride> = {};
    for (const [k, vv] of Object.entries(v as Record<string, unknown>)) {
      const idx = Number(k);
      if (!Number.isFinite(idx)) continue;
      if (!vv || typeof vv !== "object") continue;

      const obj = vv as Record<string, unknown>;
      const label = typeof obj.label === "string" ? obj.label : undefined;
      const price =
        typeof obj.price === "number" && Number.isFinite(obj.price) ? obj.price : undefined;

      if (label !== undefined || price !== undefined) {
        byIndex[idx] = { label, price };
      }
    }

    if (Object.keys(byIndex).length) out[screenId] = byIndex;
  }

  return out;
}

export function loadKeyOverrides(): KeyOverridesMap {
  const raw = safeParse(localStorage.getItem(STORAGE_KEY));
  return normalize(raw);
}

export function saveKeyOverrides(map: KeyOverridesMap): void {
  const normalized = normalize(map);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function getOverride(screenId: string, cellIndex: number): KeyOverride | null {
  const map = loadKeyOverrides();
  return map?.[screenId]?.[cellIndex] ?? null;
}

export function setOverride(screenId: string, cellIndex: number, patch: KeyOverride): void {
  const map = loadKeyOverrides();
  if (!map[screenId]) map[screenId] = {};
  map[screenId][cellIndex] = {
    ...(map[screenId][cellIndex] ?? {}),
    ...patch,
  };
  saveKeyOverrides(map);
}

export function clearOverride(screenId: string, cellIndex: number): void {
  const map = loadKeyOverrides();
  if (!map[screenId]) return;
  delete map[screenId][cellIndex];
  if (Object.keys(map[screenId]).length === 0) delete map[screenId];
  saveKeyOverrides(map);
}