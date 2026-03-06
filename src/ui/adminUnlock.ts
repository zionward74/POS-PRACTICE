const SESSION_KEY = "pos_edit_unlocked";

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function unlock(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
  console.log("Admin mode unlocked.");
}

export function lock(): void {
  sessionStorage.removeItem(SESSION_KEY);
  console.log("Admin mode locked.");
}

export function requestUnlock(): boolean {
  const code = import.meta.env.VITE_ADMIN_CODE ?? "1234"; // TODO: change before release
  const input = prompt("ADMIN CODE?");
  if (input === code) {
    unlock();
    return true;
  }
  return false;
}