import { create } from "zustand";

export type ToastTone = "neutral" | "success" | "danger";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** e.g. { label: "Undo", onAction: () => restore() } */
  action?: { label: string; onAction: () => void };
  durationMs?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastState = {
  toasts: ToastItem[];
  add: (toast: ToastInput) => number;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Show a toast from anywhere (components, mutation callbacks). Returns its id. */
export function toast(input: ToastInput) {
  return useToastStore.getState().add(input);
}
