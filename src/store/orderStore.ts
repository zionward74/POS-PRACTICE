import { createStore } from "zustand/vanilla";

interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

interface OrderState {
  lines: OrderLine[];
  selectedIndex: number;
  addItem: (item: { id: string; name: string; price: number }) => void;
  selectIndex: (index: number) => void;
  incSelected: () => void;
  decSelected: () => void;
  removeSelected: () => void;
  clear: () => void;
  totalQty: () => number;
  totalSales: () => number;
  totalDiscount: () => number;
  totalDue: () => number;
  totalReceived: number;
  totalChange: number;
  setPayment: ({ received }: { received: number }) => void;
}

export const orderStore = createStore<OrderState>((set) => ({
  lines: [],
  selectedIndex: -1,

  addItem: ({ id, name, price }) => {
    set((state) => {
      const existingIndex = state.lines.findIndex((line) => line.itemId === id);
      if (existingIndex !== -1) {
        const updatedLines = [...state.lines];
        updatedLines[existingIndex].qty += 1;
        return { lines: updatedLines };
      }
      return { lines: [...state.lines, { itemId: id, name, price, qty: 1 }] };
    });
  },

  selectIndex: (index) => set({ selectedIndex: index }),

  incSelected: () => {
    const { selectedIndex, lines } = orderStore.getState();
    if (selectedIndex === -1) return;
    const updatedLines = [...lines];
    updatedLines[selectedIndex].qty += 1;
    set({ lines: updatedLines });
  },

  decSelected: () => {
    const { selectedIndex, lines } = orderStore.getState();
    if (selectedIndex === -1) return;
    const updatedLines = [...lines];
    const selectedLine = updatedLines[selectedIndex];
    if (selectedLine.qty > 1) {
      selectedLine.qty -= 1;
    } else {
      updatedLines.splice(selectedIndex, 1);
      set({ selectedIndex: -1 });
    }
    set({ lines: updatedLines });
  },

  removeSelected: () => {
    const { selectedIndex, lines } = orderStore.getState();
    if (selectedIndex === -1) return;
    const updatedLines = [...lines];
    updatedLines.splice(selectedIndex, 1);
    set({ lines: updatedLines, selectedIndex: -1 });
  },

  clear: () => set({ lines: [], selectedIndex: -1 }),

  totalQty: () => orderStore.getState().lines.reduce((sum, line) => sum + line.qty, 0),

  totalSales: () => orderStore.getState().lines.reduce((sum, line) => sum + line.price * line.qty, 0),

  totalDiscount: () => 0,

  totalDue: () => orderStore.getState().totalSales(),

  totalReceived: 0,

  totalChange: 0,

  setPayment: ({ received }: { received: number }) => {
    set((state) => {
      const totalDue = state.totalDue();
      const change = received - totalDue;
      return {
        totalReceived: received,
        totalChange: change > 0 ? change : 0,
      };
    });
  },
}));