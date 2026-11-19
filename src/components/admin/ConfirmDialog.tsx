import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = true,
  isBusy = false,
  onCancel,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-[#FAF9F6] dark:bg-[#171614] border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                destructive
                  ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                  : 'bg-[#9A6B42]/10 border-[#9A6B42]/20 text-[#9A6B42] dark:text-[#C89B6E]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-xl font-medium text-stone-900 dark:text-stone-100">
                {title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation"
            className="p-1 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md hover:border-stone-500 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
              destructive
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900'
            }`}
          >
            {isBusy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
