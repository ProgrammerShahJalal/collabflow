import { create } from 'zustand';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      // Resolve any dialog still pending (rare) as cancelled before opening.
      get().resolve?.(false);
      set({ open: true, options, resolve });
    }),
  handleConfirm: () => {
    get().resolve?.(true);
    set({ open: false, options: null, resolve: null });
  },
  handleCancel: () => {
    get().resolve?.(false);
    set({ open: false, options: null, resolve: null });
  },
}));

/**
 * Imperative confirm that resolves to true/false based on the user's choice.
 * Renders the global <ConfirmDialog /> mounted in main.tsx.
 *
 *   if (!(await confirm({ message: 'Delete this?' }))) return;
 */
export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  useConfirmStore.getState().confirm(options);
