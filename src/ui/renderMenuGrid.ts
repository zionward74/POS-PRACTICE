import type { LoadedData } from "../data/loadData";
import { loadColorMap, type ColorKey } from "./colorMap";
import { getOverride } from "./keyOverrides";

export function renderMenuGrid(
  data: LoadedData,
  screenId: string,
  gridRootEl: HTMLElement
): void {
  gridRootEl.innerHTML = "";

  const screen = data.screensById[screenId];
  if (!screen) {
    throw new Error(`Screen with ID '${screenId}' not found.`);
  }

  const colorMap = loadColorMap();
  const colors: ColorKey[] = (colorMap as any)[screenId] ?? Array(30).fill("gray");

  const ALLOWED = new Set([
    "pink",
    "yellow",
    "lime",
    "gray",
    "sky",
    "purple",
    "orange",
    "white",
    // 레거시 호환
    "green",
    "blue",
  ]);

  for (let i = 0; i < 30; i++) {
    // 29 = 그리드 내부 < >
    if (i === 29) {
      const navEl = document.createElement("div");
      navEl.classList.add("menu-grid-nav-cell");
      navEl.innerHTML = `
        <button class="menu-grid-nav-btn" data-grid-nav="prev">&lt;</button>
        <button class="menu-grid-nav-btn" data-grid-nav="next">&gt;</button>
      `;
      gridRootEl.appendChild(navEl);
      continue;
    }

    // ✅ 중요: "모든 키 편집"을 위해 항상 button으로 만든다
    const cell = screen.cells[i] || null;
    const cellEl = document.createElement("button");
    cellEl.classList.add("menu-grid-cell");
    cellEl.setAttribute("data-cell-index", String(i));

    // 색 적용
    const raw = String((colors as any)[i] ?? "gray").trim();
    const key = ALLOWED.has(raw) ? raw : "gray";
    cellEl.classList.add(`tile-${key}`);

    // override(표시용) 우선
    const ov = getOverride(screenId, i);

    if (cell) {
      const item = data.itemsById[cell.id];
      if (item) {
        const name = (ov?.label ?? item.name) as string;

        const basePrice = typeof item.price === "number" ? item.price : 0;
        const price = typeof ov?.price === "number" ? ov.price : basePrice;
        const priceText = `${Number(price).toLocaleString("ko-KR")}원`;

        cellEl.innerHTML = `<div class="name">${name}</div><div class="price">${priceText}</div>`;
        cellEl.setAttribute("data-item-id", cell.id);
        cellEl.setAttribute("data-menu-id", cell.id);
      } else {
        // item 누락
        cellEl.classList.add("inactive");
        cellEl.innerHTML = `<div class="name"></div><div class="price"></div>`;
      }
    } else {
      // 빈 칸도 선택 가능해야 하므로 버튼 유지 + inactive 표시
      cellEl.classList.add("inactive");
      const name = ov?.label ?? "";
      const price = typeof ov?.price === "number" ? ov.price : undefined;
      const priceText = price !== undefined ? `${Number(price).toLocaleString("ko-KR")}원` : "";
      cellEl.innerHTML = `<div class="name">${name}</div><div class="price">${priceText}</div>`;
      // data-item-id 없음 → 주문 로직에서 자동으로 무시됨
    }

    gridRootEl.appendChild(cellEl);
  }
}