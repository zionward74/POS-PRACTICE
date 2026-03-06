import { orderStore } from "../store/orderStore";

export function renderSummary(): void {
  const setText = (el: HTMLElement | null, value: string) => {
    if (el) el.textContent = value;
  };

  const totalQtyEl = document.getElementById("total-qty");
  const totalSalesEl = document.getElementById("total-sales");
  const totalDiscountEl = document.getElementById("total-discount");
  const totalDueEl = document.getElementById("total-due");
  const totalReceivedEl = document.getElementById("total-received");
  const totalChangeEl = document.getElementById("total-change");

  const state = orderStore.getState();

  if (state.lines.length === 0) {
    setText(totalQtyEl, "");
    setText(totalSalesEl, "");
    setText(totalDiscountEl, "");
    setText(totalDueEl, "");
    setText(totalReceivedEl, "");
    setText(totalChangeEl, "");
    return;
  }

  setText(totalQtyEl, state.totalQty().toString());
  setText(totalSalesEl, state.totalSales().toLocaleString("ko-KR") + "원");
  setText(totalDiscountEl, state.totalDiscount().toLocaleString("ko-KR") + "원");
  setText(totalDueEl, state.totalDue().toLocaleString("ko-KR") + "원");
  setText(totalReceivedEl, ""); // Placeholder for payment logic
  setText(totalChangeEl, ""); // Placeholder for payment logic
}