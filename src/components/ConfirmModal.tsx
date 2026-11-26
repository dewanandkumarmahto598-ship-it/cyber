import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-[var(--ln)]">
        <div className="p-4 border-b border-[var(--ln)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--tx)]">
            <AlertCircle className={`w-5 h-5 ${isDestructive ? 'text-red-500' : 'text-amber-500'}`} />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs sm:text-sm text-[var(--mu)] leading-relaxed">{message}</p>
        </div>

        <div className="p-3 bg-[var(--card)] border-t border-[var(--ln)] flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all ${
              isDestructive
                ? 'bg-red-500 hover:bg-red-600 active:scale-98'
                : 'bg-[var(--ac)] hover:opacity-90 active:scale-98'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--bg)] transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
