import { loadData } from "./data/loadData";
import { validateData } from "./data/validateData";

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
} catch (error) {
  console.error("\n❌ Validation Failed!");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}