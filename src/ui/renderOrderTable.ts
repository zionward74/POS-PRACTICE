import { orderStore } from "../store/orderStore";

export function renderOrderTable(lines: { itemId: string; name: string; price: number; qty: number }[], selectedIndex: number): void {
  const tbody = document.getElementById("order-table-body");
  if (!tbody) {
    console.warn("Order table body not found.");
    return;
  }

  tbody.innerHTML = "";

  lines.forEach((line, index) => {
    const row = document.createElement("tr");
    row.className = "table-row";
    if (index === selectedIndex) {
      row.classList.add("selected-row");
    }

    row.innerHTML = `
      <td class="text-left px-2">${line.name}</td>
      <td>${line.qty}</td>
      <td>${line.price}</td>
      <td>0</td>
      <td>${line.price * line.qty}</td>
      <td></td>
    `;

    row.addEventListener("click", () => {
      orderStore.getState().selectIndex(index);
    });

    tbody.appendChild(row);
  });
}