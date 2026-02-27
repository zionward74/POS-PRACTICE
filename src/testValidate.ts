// src/testValidate.ts
import { loadData } from "./data/loadData";
import { validateData } from "./data/validateData";
import { buildReverseIndex } from "./data/buildReverseIndex";
import { uiStore } from "./store/uiStore";
import { getActiveScreenId } from "./ui/getActiveScreenId";

console.log("────────────────────────────────────────────");
console.log("🚀 POS Data Validation Script");
console.log("────────────────────────────────────────────");

try {
  console.log("1. Loading data...");
  const data = loadData();
  console.log(`   - Items loaded: ${data.rawItems.length}`);
  console.log(`   - Screens loaded: ${Object.keys(data.screensById).length}`);

  console.log("2. Validating data...");
  validateData(data);

  console.log("3. Building Reverse Index...");
  const reverseIndex = buildReverseIndex(data);
  const itemIds = Object.keys(reverseIndex);
  console.log(`   - Indexed items count: ${itemIds.length}`);

  // 샘플 3개 출력(첫 3개)
  console.log("   - Sample locations (first 3 indexed itemIds):");
  itemIds.slice(0, 3).forEach((id) => {
    console.log(
      `     [Item ID: ${id}] Locations:\n${JSON.stringify(reverseIndex[id], null, 2)}`
    );
  });

  // 특정 id 2개도 같이 출력 (없으면 메시지)
  const spotlightIds = ["PAPER_BAG_SMALL", "CAKE_WHOLE_STRAWBERRY_FRESHCREAM"];
  console.log("   - Spotlight locations:");
  for (const id of spotlightIds) {
    if (!reverseIndex[id]) {
      console.log(`     [Item ID: ${id}] (no locations found)`);
      continue;
    }
    console.log(
      `     [Item ID: ${id}] Locations:\n${JSON.stringify(reverseIndex[id], null, 2)}`
    );
  }

  // Test uiStore and getActiveScreenId
  console.log("4. Testing uiStore and getActiveScreenId...");
  
  // Initialize uiStore with temporary values
  uiStore.setState({
    activeTopTabId: "CAT_COFFEE",
    activeSubTabId: "SUB_ESPRESSO_VAR",
    activePageIndex: 0,
  });

  const { activeTopTabId, activeSubTabId, activePageIndex } = uiStore.getState();

  try {
    const screenId = getActiveScreenId(
      data.ui,
      activeTopTabId,
      activeSubTabId,
      activePageIndex
    );
    console.log(`   - Active Screen ID: ${screenId}`);
  } catch (error) {
    console.error("   - Error fetching active screen ID:", error);
  }

  console.log("\n✅ All checks passed.");
} catch (error) {
  console.error("\n❌ Validation Failed!");
  if (error instanceof Error) {
    console.error("   - Error Message:", error.message);
  } else {
    console.error("   - Error:", String(error));
  }
  process.exit(1);
}