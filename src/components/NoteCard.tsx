import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Note } from '../types';
import { timeAgo, CARD_GRADIENTS } from '../utils/helpers';

interface NoteCardProps {
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
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  currentUserId,
  isSaved,
  isFollowingAuthor = false,
  onLike,
  onComment,
  onShare,
  onSave,
  onOpenMenu,
  onViewProfile,
  onToggleFollow,
}) => {
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef<number>(0);

  const isLiked = note.likes.includes(currentUserId);
  const isAuthor = note.u === currentUserId;
  const isGradient = note.c > 0 && note.c < CARD_GRADIENTS.length;
  const gradientStyle = isGradient ? { background: CARD_GRADIENTS[note.c] } : undefined;

  const handleCardClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger like if not already liked
      if (!isLiked) {
        onLike(note.id);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 750);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <article className="border-b border-[var(--ln)] pb-3 bg-[var(--bg)] transition-colors">
      {/* Author Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProfile(note.u)}
            className="flex items-center gap-2.5 hover:opacity-85 text-left transition-opacity"
          >
            <img
              src={
                note.authorPic ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={note.authorName}
              className="w-9 h-9 rounded-full object-cover border border-[var(--ln)]"
            />
            <div>
              <div className="font-semibold text-sm text-[var(--tx)] leading-tight flex items-center gap-1.5">
                {note.authorName}
                {isAuthor && (
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[var(--ln)] text-[var(--mu)]">
                    You
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--mu)]">{timeAgo(note.t)}</div>
            </div>
          </button>

          {!isAuthor && onToggleFollow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow(note.u);
              }}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                isFollowingAuthor
                  ? 'text-[var(--mu)] hover:text-[var(--tx)] bg-[var(--ln)]/40 hover:bg-[var(--ln)]/70'
                  : 'text-[var(--ac)] hover:bg-[var(--ac)]/10 font-bold'
              }`}
            >
              {isFollowingAuthor ? 'Following' : '+ Follow'}
            </button>
          )}
        </div>

        <button
          onClick={() => onOpenMenu(note.id)}
          className="p-1.5 text-[var(--mu)] hover:text-[var(--tx)] rounded-full hover:bg-[var(--card)] transition-colors"
          aria-label="Note options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Note Visual Card Content */}
      {note.image ? (
        /* Photo Post: Only the clean photo is displayed */
        <div
          onClick={handleCardClick}
          className="relative w-full bg-black/5 cursor-pointer select-none overflow-hidden border-y border-[var(--ln)] flex items-center justify-center"
        >
          <img
            src={note.image}
            alt={note.title || 'Photo post'}
            className="w-full max-h-[560px] object-cover block"
            loading="lazy"
          />

          {/* Heart Pop Animation */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] animate-heart-pop" />
            </div>
          )}

          <div className="absolute bottom-2.5 right-3 text-[11px] text-white/80 drop-shadow-sm font-medium">
            Double tap to ♡
          </div>
        </div>
      ) : (
        /* Text/Thought Note: Colorful visual card with title & body */
        <div
          onClick={handleCardClick}
          style={gradientStyle}
          className={`relative min-h-[260px] sm:min-h-[290px] flex flex-col justify-center items-center text-center cursor-pointer select-none overflow-hidden transition-all duration-200 border-y ${
            isGradient
              ? 'text-white border-transparent shadow-inner'
              : 'bg-[var(--card)] text-[var(--tx)] border-[var(--ln)]'
          }`}
        >
          {/* Heart Pop Animation */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-heart-pop" />
            </div>
          )}

          {/* Text Container for text notes */}
          <div className="w-full flex flex-col items-center justify-center px-6 py-8">
            {note.title && (
              <h3 className="text-xl sm:text-2xl font-bold mb-2.5 tracking-tight max-w-sm leading-snug drop-shadow-sm">
                {note.title}
              </h3>
            )}

            {note.body && (
              <p className="text-base sm:text-lg font-normal whitespace-pre-wrap break-words max-w-sm leading-relaxed drop-shadow-sm opacity-95">
                {note.body}
              </p>
            )}
          </div>

          <div className="absolute bottom-2.5 right-3 text-[11px] opacity-75 font-medium">
            {isGradient ? 'Double tap to ♡' : ''}
          </div>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLike(note.id)}
            className={`p-2 rounded-full transition-all active:scale-80 hover:bg-[var(--card)] ${
              isLiked ? 'text-[var(--ac)]' : 'text-[var(--tx)]'
            }`}
            aria-label="Like note"
          >
            <Heart className={`w-6 h-6 transition-transform ${isLiked ? 'fill-current scale-105' : ''}`} />
          </button>

          <button
            onClick={() => onComment(note.id)}
            className="p-2 rounded-full text-[var(--tx)] hover:bg-[var(--card)] transition-colors active:scale-90"
            aria-label="Comments"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          <button
            onClick={() => onShare(note.id)}
            className="p-2 rounded-full text-[var(--tx)] hover:bg-[var(--card)] transition-colors active:scale-90"
            aria-label="Share note"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => onSave(note.id)}
          className={`p-2 rounded-full transition-all active:scale-90 hover:bg-[var(--card)] ${
            isSaved ? 'text-[var(--ac)]' : 'text-[var(--tx)]'
          }`}
          aria-label="Bookmark note"
        >
          <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Likes and Captions/Title below the Like, Comment, and Share button */}
      <div className="px-3.5 pt-1 space-y-1.5">
        <div className="font-bold text-sm text-[var(--tx)]">
          {note.likes.length} {note.likes.length === 1 ? 'like' : 'likes'}
        </div>

        {/* In photo posts: title and captions are shown below the like, comment and share button */}
        {note.image && (note.title || note.body) && (
          <div className="text-sm text-[var(--tx)] leading-relaxed space-y-1 pt-0.5">
            {note.title && (
              <h4 className="font-bold text-sm text-[var(--tx)] leading-snug">
                {note.title}
              </h4>
            )}
            {note.body && (
              <div className="text-sm text-[var(--tx)] whitespace-pre-wrap break-words leading-relaxed">
                <button
                  onClick={() => onViewProfile(note.u)}
                  className="font-bold mr-1.5 hover:underline inline text-left text-[var(--tx)]"
                >
                  {note.authorName}
                </button>
                <span>{note.body}</span>
              </div>
            )}
          </div>
        )}

        {note.commentsCount > 0 ? (
          <button
            onClick={() => onComment(note.id)}
            className="text-xs text-[var(--mu)] hover:text-[var(--tx)] transition-colors block text-left pt-0.5"
          >
            {note.commentsCount === 1 ? 'View 1 comment' : `View all ${note.commentsCount} comments`}
          </button>
        ) : (
          <button
            onClick={() => onComment(note.id)}
            className="text-xs text-[var(--mu)]/80 hover:text-[var(--tx)] transition-colors block text-left pt-0.5"
          >
            Add a comment...
          </button>
        )}

        <div className="text-[11px] text-[var(--mu)] font-medium pt-0.5">
          {timeAgo(note.t)}
          {note.e === 1 && ' · edited'}
        </div>
      </div>
    </article>
  );
};
