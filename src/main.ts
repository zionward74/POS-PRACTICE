import { bindPosUI } from "./ui/bindPosUI";
import { requestUnlock, lock } from "./ui/adminUnlock";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await bindPosUI();
  } catch (error) {
    console.error("Failed to initialize POS UI:", error);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.altKey) {
    if (event.key === "e" || event.key === "E") {
      requestUnlock();
    } else if (event.key === "l" || event.key === "L") {
      lock();
    }
  }
});