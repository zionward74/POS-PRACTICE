// scripts/prepare-data.ts
import fs from "fs";
import path from "path";
import { loadData } from "../src/data/loadData";

console.log("Generating data for browser...");

try {
  const data = loadData();
  const outputDir = path.join(process.cwd(), "public");
  const outputPath = path.join(outputDir, "pos-data.json");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Data successfully generated at: ${outputPath}`);
} catch (error) {
  console.error("❌ Failed to generate data:");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
