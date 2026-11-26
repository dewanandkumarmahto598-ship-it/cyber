import React from 'react';
import { X } from 'lucide-react';
import { Note } from '../types';
import { NoteCard } from './NoteCard';

interface NoteDetailModalProps {
  note: Note;
  currentUserId: string;
  isSaved: boolean;
  isFollowingAuthor?: boolean;
  onLike: (noteId: string) => void;
  onComment: (noteId: string) => void;
  onShare: (noteId: string) => void;
  onSave: (noteId: string) => void;
  onOpenMenu: (noteId: string) => void;
  onViewProfile: (userId: string) => void;
  onToggleFollow?: (authorId: string) => void;
  onClose: () => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  currentUserId,
  isSaved,
  isFollowingAuthor,
  onLike,
  onComment,
  onShare,
  onSave,
  onOpenMenu,
  onViewProfile,
  onToggleFollow,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--ln)]">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[var(--ln)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
          <span className="text-xs font-semibold text-[var(--mu)]">Note detail</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note Card */}
        <div className="overflow-y-auto">
          <NoteCard
            note={note}
            currentUserId={currentUserId}
            isSaved={isSaved}
            isFollowingAuthor={isFollowingAuthor}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onSave={onSave}
            onOpenMenu={onOpenMenu}
            onViewProfile={onViewProfile}
            onToggleFollow={onToggleFollow}
          />
        </div>
      </div>
    </div>
  );
};
