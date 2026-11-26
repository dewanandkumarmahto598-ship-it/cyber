import React from 'react';
import { Edit2, Trash2, Copy, Send, X } from 'lucide-react';

interface NoteMenuModalProps {
  noteId: string;
  isAuthor: boolean;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onCopy: (noteId: string) => void;
  onShare: (noteId: string) => void;
  onClose: () => void;
}

export const NoteMenuModal: React.FC<NoteMenuModalProps> = ({
  noteId,
  isAuthor,
  onEdit,
  onDelete,
  onCopy,
  onShare,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-[var(--ln)]">
        <div className="p-2 divide-y divide-[var(--ln)]">
          {isAuthor && (
            <>
              <button
                onClick={() => onEdit(noteId)}
                className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--tx)] hover:bg-[var(--card)] rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4 text-[var(--mu)]" />
                <span>Edit note</span>
              </button>

              <button
                onClick={() => onDelete(noteId)}
                className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete note</span>
              </button>
            </>
          )}

          <button
            onClick={() => onCopy(noteId)}
            className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--tx)] hover:bg-[var(--card)] rounded-xl transition-colors"
          >
            <Copy className="w-4 h-4 text-[var(--mu)]" />
            <span>Copy text</span>
          </button>

          <button
            onClick={() => onShare(noteId)}
            className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--tx)] hover:bg-[var(--card)] rounded-xl transition-colors"
          >
            <Send className="w-4 h-4 text-[var(--mu)]" />
            <span>Share note</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-medium text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
