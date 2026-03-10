// src/ui/bindPosUI.ts
import { validateData } from "../data/validateData";
import { buildReverseIndex } from "../data/buildReverseIndex";
import { uiStore } from "../store/uiStore";
import { getActiveScreenId } from "./getActiveScreenId";
import { renderMenuGrid } from "./renderMenuGrid";
import { orderStore } from "../store/orderStore";
import { renderOrderTable } from "./renderOrderTable";
import { renderSummary } from "./renderSummary";
import type { LoadedData } from "../data/loadData";
import { isUnlocked } from "./adminUnlock";
import { loadColorMap, saveColorMap } from "./colorMap";
import type { ColorKey } from "./colorMap";
import { makePagesKey } from "./makePagesKey";

// 표시용(이름/가격) 오버라이드 저장
import { getOverride, setOverride, clearOverride } from "./keyOverrides";

let bindPosUICalled = false;

async function fetchData(): Promise<LoadedData> {
  const response = await fetch("/pos-data.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch pos-data.json: ${response.statusText}`);
  }
  return response.json();
}

export async function bindPosUI(): Promise<void> {
  if (bindPosUICalled) {
    console.warn("bindPosUI already called. Skipping duplicate initialization.");
    return;
  }
  bindPosUICalled = true;

  // 1) Load data
  const data = await fetchData();

  // 2) Validate
  validateData(data);

  // 3) Reverse index (future use)
  buildReverseIndex(data);

  // 4) Init UI store
  uiStore.getState().initFromUi(data.ui);

  // 5) DOM refs
  const gridRootEl = document.querySelector<HTMLElement>("#menu-grid-root");
  if (!gridRootEl) {
    throw new Error("Grid root element not found. '#menu-grid-root' missing.");
  }

  const subTabsRowEl = document.getElementById("sub-tabs-row");
  if (!subTabsRowEl) {
    throw new Error("Sub tabs row element not found. '#sub-tabs-row' missing.");
  }

  const editPanel = document.getElementById("edit-panel");
  const palette = document.getElementById("palette");
  const btnEditToggle = document.getElementById("btn-edit-toggle");
  const btnEditLock = document.getElementById("btn-edit-lock");

  // 키 편집 UI (표시용 이름/가격)
  const inputKeyLabel = document.getElementById("edit-key-label") as HTMLInputElement | null;
  const inputKeyPrice = document.getElementById("edit-key-price") as HTMLInputElement | null;
  const btnKeySave = document.getElementById("btn-key-save") as HTMLButtonElement | null;
  const btnKeyClear = document.getElementById("btn-key-clear") as HTMLButtonElement | null;

  // -------------------------
  // Edit state
  // -------------------------
  let editModeOn = false;
  let selectedCellIndex: number | null = null;

  const updateEditPanelVisibility = () => {
    const unlocked = isUnlocked();
    if (editPanel) editPanel.style.display = unlocked ? "block" : "none";

    if (!unlocked) {
      editModeOn = false;
      selectedCellIndex = null;

      if (palette) palette.style.display = "none";
      gridRootEl.querySelectorAll(".cell-selected").forEach((el) => el.classList.remove("cell-selected"));

      if (inputKeyLabel) inputKeyLabel.value = "";
      if (inputKeyPrice) inputKeyPrice.value = "";
    }
  };

  updateEditPanelVisibility();

  // -------------------------
  // Top / Sub tab active styles
  // -------------------------
  function synchronizeTabStyles() {
    const { activeTopTabId, activeSubTabId } = uiStore.getState();

    document.querySelectorAll<HTMLButtonElement>("[data-top-tab-id]").forEach((button) => {
      const topTabId = button.getAttribute("data-top-tab-id");

      button.classList.remove("top-tab-active", "top-tab-inactive");
      button.classList.add(topTabId === activeTopTabId ? "top-tab-active" : "top-tab-inactive");
    });

    document.querySelectorAll<HTMLButtonElement>("[data-sub-tab-id]").forEach((button) => {
      const subTabId = button.getAttribute("data-sub-tab-id");

      button.classList.remove("sub-tab-active", "sub-tab-inactive");
      button.classList.add(subTabId === activeSubTabId ? "sub-tab-active" : "sub-tab-inactive");
    });
  }

  // -------------------------
  // Rebuild sub tabs for current top tab
  // -------------------------
  function rebuildSubTabs(loadedData: LoadedData) {
    const { activeTopTabId } = uiStore.getState();
    const subs = loadedData.ui.subTabsByTopTab?.[activeTopTabId] ?? [];

    // 기존 내용을 완전히 재구성
    subTabsRowEl.innerHTML = "";

    // 서브탭 슬롯은 최대 7칸 유지
    const maxVisibleSubTabs = 7;

    for (let i = 0; i < maxVisibleSubTabs; i += 1) {
      const sub = subs[i];

      if (sub) {
        const button = document.createElement("button");
        button.setAttribute("data-sub-tab-id", sub.id);
        button.className = "col-span-1 bg-[#888] text-white text-[10px] py-1";
        button.textContent = sub.label;
        subTabsRowEl.appendChild(button);
      } else {
        const filler = document.createElement("div");
        filler.className = "col-span-1 bg-[#888]";
        subTabsRowEl.appendChild(filler);
      }
    }

    // 서브탭 pager 유지
    const prevButton = document.createElement("button");
    prevButton.setAttribute("data-action", "SUBTAB_PREV");
    prevButton.className = "bg-[#888] text-white text-lg py-1";
    prevButton.textContent = "<";
    subTabsRowEl.appendChild(prevButton);

    const nextButton = document.createElement("button");
    nextButton.setAttribute("data-action", "SUBTAB_NEXT");
    nextButton.className = "bg-[#888] text-white text-lg py-1";
    nextButton.textContent = ">";
    subTabsRowEl.appendChild(nextButton);
  }

  // -------------------------
  // Render helper
  // -------------------------
  const rerender = () => {
    const { activeTopTabId, activeSubTabId, activePageIndex } = uiStore.getState();

    console.log("[POS] rerender state", {
      activeTopTabId,
      activeSubTabId,
      activePageIndex,
    });

    const screenId = getActiveScreenId(
      data.ui,
      activeTopTabId,
      activeSubTabId,
      activePageIndex
    );

    (window as any).__pos_screenId = screenId;

    console.log("[POS] resolved screenId", screenId);

    // 현재 메인 탭에 맞게 서브탭 줄부터 재구성
    rebuildSubTabs(data);

    renderMenuGrid(data, screenId, gridRootEl);

    // 현재 active 상태에 맞게 탭 색상 동기화
    synchronizeTabStyles();

    // 편집 모드에서 선택 강조 유지
    if (editModeOn && selectedCellIndex !== null) {
      const btn = gridRootEl.querySelector(`button[data-cell-index="${selectedCellIndex}"]`);
      btn?.classList.add("cell-selected");
    }
  };

  // 1st render
  rerender();

  // -------------------------
  // TopTab buttons (static)
  // -------------------------
  document.querySelectorAll<HTMLButtonElement>("[data-top-tab-id]").forEach((button) => {
    const topTabId = button.getAttribute("data-top-tab-id");
    if (!topTabId) {
      console.warn("TopTab button missing data-top-tab-id attribute.");
      return;
    }

    button.addEventListener("click", () => {
      console.log("[TOP CLICK]", {
        topTabId,
        before: uiStore.getState(),
      });

      uiStore.getState().setTopTab(data.ui, topTabId);

      console.log("[TOP CLICK AFTER]", uiStore.getState());

      rerender();
    });
  });

  // -------------------------
  // SubTab row (dynamic) - event delegation
  // -------------------------
  subTabsRowEl.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest("button");

    if (!button) return;

    const subTabId = button.getAttribute("data-sub-tab-id");
    if (subTabId) {
      console.log("[SUB CLICK]", {
        subTabId,
        before: uiStore.getState(),
      });

      uiStore.getState().setSubTab(data.ui, subTabId);

      console.log("[SUB CLICK AFTER]", uiStore.getState());

      rerender();
      return;
    }

    const action = button.getAttribute("data-action");
    if (!action) return;

    const state = uiStore.getState();
    const { activeTopTabId, activeSubTabId } = state;

    if (action === "SUBTAB_PREV" || action === "SUBTAB_NEXT") {
      const subs = (data.ui.subTabsByTopTab as Record<string, Array<{ id: string }>> | undefined)?.[
        activeTopTabId
      ] ?? [];

      if (!Array.isArray(subs) || subs.length === 0) {
        console.warn("No subTabs for activeTopTabId:", activeTopTabId);
        return;
      }

      const found = subs.findIndex((s) => s.id === activeSubTabId);
      const curIndex = found >= 0 ? found : 0;

      const delta = action === "SUBTAB_NEXT" ? 1 : -1;
      const nextIndex = (curIndex + delta + subs.length) % subs.length;
      const nextSubTabId = subs[nextIndex]?.id;
      if (!nextSubTabId) return;

      uiStore.getState().setSubTab(data.ui, nextSubTabId);

      console.log("[ACTION AFTER SUBTAB]", {
        action,
        nextSubTabId,
        stateAfter: uiStore.getState(),
      });

      rerender();
    }
  });

  // -------------------------
  // Static action buttons
  // - TOPTAB_PREV/NEXT
  // -------------------------
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    const action = button.getAttribute("data-action");
    if (!action) {
      console.warn("Nav button missing data-action attribute.");
      return;
    }

    // 동적으로 다시 만들어지는 SUBTAB_* 버튼은 위임 처리
    if (action === "SUBTAB_PREV" || action === "SUBTAB_NEXT") {
      return;
    }

    button.addEventListener("click", () => {
      const state = uiStore.getState();
      const { activeTopTabId } = state;

      console.log("[ACTION CLICK]", {
        action,
        stateBefore: state,
      });

      // 1) Top tab pager
      if (action === "TOPTAB_PREV" || action === "TOPTAB_NEXT") {
        const topTabs = data.ui.topTabs ?? [];
        if (!topTabs.length) {
          console.warn("No topTabs in UI.");
          return;
        }

        const found = topTabs.findIndex((t) => t.id === activeTopTabId);
        const curIndex = found >= 0 ? found : 0;

        const delta = action === "TOPTAB_NEXT" ? 1 : -1;
        const nextIndex = (curIndex + delta + topTabs.length) % topTabs.length;
        const nextTopTabId = topTabs[nextIndex]?.id;
        if (!nextTopTabId) return;

        uiStore.getState().setTopTab(data.ui, nextTopTabId);

        console.log("[ACTION AFTER TOPTAB]", {
          action,
          nextTopTabId,
          stateAfter: uiStore.getState(),
        });

        rerender();
        return;
      }

      console.warn("Unknown static action:", action);
    });
  });

  // -------------------------
  // Edit panel buttons
  // -------------------------
  if (btnEditToggle && palette) {
    btnEditToggle.addEventListener("click", () => {
      if (!isUnlocked()) return;

      editModeOn = !editModeOn;
      console.log("[EDIT] toggle", { editModeOn, unlocked: isUnlocked() });

      palette.style.display = editModeOn ? "flex" : "none";

      if (!editModeOn) {
        selectedCellIndex = null;
        gridRootEl.querySelectorAll(".cell-selected").forEach((el) => el.classList.remove("cell-selected"));

        if (inputKeyLabel) inputKeyLabel.value = "";
        if (inputKeyPrice) inputKeyPrice.value = "";
      }
    });
  }

  if (btnEditLock) {
    btnEditLock.addEventListener("click", () => {
      updateEditPanelVisibility();
    });
  }

  // -------------------------
  // Grid click handler (single)
  // 1) grid nav (< >)
  // 2) edit mode: select
  // 3) normal: order add
  // -------------------------
  gridRootEl.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    // 1) Grid nav (< >)
    const navBtn = target.closest("button[data-grid-nav]") as HTMLButtonElement | null;
    if (navBtn) {
      const { activeTopTabId, activeSubTabId, activePageIndex } = uiStore.getState();
      if (!activeTopTabId || !activeSubTabId) return;

      const key = makePagesKey(activeTopTabId, activeSubTabId);
      const pages = (data.ui.pages as Record<string, Array<{ screenId: string }>> | undefined)?.[key] ?? [];
      if (!Array.isArray(pages) || pages.length === 0) return;

      const dir = navBtn.dataset.gridNav; // "prev" | "next"
      const rawNext = dir === "next" ? activePageIndex + 1 : activePageIndex - 1;
      const nextIndex = Math.max(0, Math.min(pages.length - 1, rawNext));
      if (nextIndex === activePageIndex) return;

      uiStore.setState({ activePageIndex: nextIndex });

      console.log("[GRID NAV]", {
        dir,
        key,
        activePageIndex,
        nextIndex,
      });

      rerender();
      return;
    }

    // Always resolve to a cell button
    const cellBtn = target.closest("button[data-cell-index]") as HTMLButtonElement | null;

    // 2) Edit mode: select cell
    if (cellBtn && editModeOn && isUnlocked()) {
      selectedCellIndex = Number(cellBtn.dataset.cellIndex);

      gridRootEl.querySelectorAll(".cell-selected").forEach((el) => el.classList.remove("cell-selected"));
      cellBtn.classList.add("cell-selected");

      console.log("[EDIT] selected applied", { cellIndex: selectedCellIndex });

      const screenId = (window as any).__pos_screenId as string;
      const ov = getOverride(screenId, selectedCellIndex);

      const nameEl = cellBtn.querySelector(".name");
      const priceEl = cellBtn.querySelector(".price");

      if (inputKeyLabel) {
        inputKeyLabel.value = ov?.label ?? (nameEl?.textContent ?? "");
      }

      if (inputKeyPrice) {
        const rawPrice = ov?.price ?? (priceEl?.textContent ?? "");
        const num =
          typeof rawPrice === "number"
            ? rawPrice
            : Number(String(rawPrice).replace(/[^\d]/g, ""));

        inputKeyPrice.value = Number.isFinite(num) && num > 0 ? String(num) : "";
      }

      return;
    }

    // 3) Edit mode blocks ordering
    if (editModeOn && isUnlocked()) return;

    // 4) Normal order
    if (!cellBtn) return;

    const itemId = cellBtn.getAttribute("data-item-id");
    if (!itemId) return;

    const item = data.itemsById[itemId];
    if (!item) {
      console.warn(`Item with ID '${itemId}' not found.`);
      return;
    }

    orderStore.getState().addItem({
      id: itemId,
      name: item.name,
      price: item.price,
    });

    renderOrderTable(
      orderStore.getState().lines,
      orderStore.getState().selectedIndex
    );
    renderSummary();
  });

  // -------------------------
  // Palette click -> save color for current screenId
  // -------------------------
  if (palette) {
    palette.addEventListener("click", (e) => {
      if (!isUnlocked()) return;
      if (!editModeOn) return;
      if (selectedCellIndex === null) return;

      const colorBtn = (e.target as HTMLElement | null)?.closest("button[data-color]") as HTMLElement | null;
      if (!colorBtn) return;

      const chosenKey = (colorBtn.dataset.color as ColorKey | undefined) ?? "gray";

      const { activeTopTabId, activeSubTabId, activePageIndex } = uiStore.getState();
      const screenId = getActiveScreenId(
        data.ui,
        activeTopTabId,
        activeSubTabId,
        activePageIndex
      );

      const map = loadColorMap();
      if (!map[screenId]) map[screenId] = Array(30).fill("gray");

      map[screenId][selectedCellIndex] = String(chosenKey);
      saveColorMap(map);

      console.log("[COLOR SAVE]", {
        screenId,
        selectedCellIndex,
        chosenKey,
      });

      rerender();
    });
  }

  // -------------------------
  // Key editor: save / clear (표시용 이름/가격)
  // -------------------------
  if (btnKeySave) {
    btnKeySave.addEventListener("click", () => {
      if (!isUnlocked()) return;
      if (!editModeOn) return;
      if (selectedCellIndex === null) return;

      const screenId = (window as any).__pos_screenId as string;
      if (!screenId) return;

      const label = inputKeyLabel?.value ?? "";
      const priceStr = inputKeyPrice?.value ?? "";
      const priceNum = priceStr.trim().length ? Number(priceStr) : NaN;

      setOverride(screenId, selectedCellIndex, {
        label: label.trim().length ? label.trim() : undefined,
        price: Number.isFinite(priceNum) ? priceNum : undefined,
      });

      console.log("[KEY OVERRIDE SAVE]", {
        screenId,
        selectedCellIndex,
        label,
        price: Number.isFinite(priceNum) ? priceNum : undefined,
      });

      rerender();
    });
  }

  if (btnKeyClear) {
    btnKeyClear.addEventListener("click", () => {
      if (!isUnlocked()) return;
      if (!editModeOn) return;
      if (selectedCellIndex === null) return;

      const screenId = (window as any).__pos_screenId as string;
      if (!screenId) return;

      clearOverride(screenId, selectedCellIndex);

      if (inputKeyLabel) inputKeyLabel.value = "";
      if (inputKeyPrice) inputKeyPrice.value = "";

      console.log("[KEY OVERRIDE CLEAR]", {
        screenId,
        selectedCellIndex,
      });

      rerender();
    });
  }
}