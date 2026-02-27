import type { LoadedData } from "../data/loadData";
import type { ReverseIndex } from "../data/buildReverseIndex";

export function getHint(itemId: string, data: LoadedData, reverseIndex: ReverseIndex) {
  if (!itemId) {
    throw new Error("Item ID is required.");
  }

  if (!reverseIndex || !reverseIndex[itemId]) {
    throw new Error(`No locations found for item ID: ${itemId}`);
  }

  const locations = reverseIndex[itemId];
  const primaryLocation = locations[0];

  if (!primaryLocation) {
    throw new Error(`Primary location not found for item ID: ${itemId}`);
  }

  const text = `${primaryLocation.catId} > ${primaryLocation.subId} > ${primaryLocation.pageIndex + 1}`;

  return {
    text,
    primary: primaryLocation,
    all: locations,
  };
}

// ... 기존 코드 (testIds.forEach)

  console.log("4. Testing getHint...");
  const testIds = ["PAPER_BAG_SMALL", "CAKE_WHOLE_STRAWBERRY_FRESHCREAM"];
  
  testIds.forEach(id => {
    try {
      const hint = getHint(id, data, reverseIndex);
      console.log(`   - Hint for [${id}]: "${hint.text}"`);
    } catch (e) {
      console.log(`   - Hint for []: (Not Found)`);
    }
  });
