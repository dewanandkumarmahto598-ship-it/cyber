import React from 'react';
import { Note, Profile, FeedFilter } from '../types';
import { NoteCard } from './NoteCard';
import { Sparkles, PlusCircle, Users, UserPlus, Camera } from 'lucide-react';

interface FeedViewProps {
  notes: Note[];
  currentUserId: string;
  savedIds: string[];
  followingIds: string[];
  suggestedProfiles: Profile[];
  sharedCount: number;
  feedFilter: FeedFilter;
  onChangeFeedFilter: (filter: FeedFilter) => void;
  onOpenShared: () => void;
  onLike: (noteId: string) => void;
  onComment: (noteId: string) => void;
  onShare: (noteId: string) => void;
  onSave: (noteId: string) => void;
  onOpenMenu: (noteId: string) => void;
  onViewProfile: (userId: string) => void;
  onToggleFollow: (authorId: string) => void;
  onGoToCreate: () => void;
  onGoToPostPhoto?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  notes,
  currentUserId,
  savedIds,
  followingIds,
  suggestedProfiles,
  sharedCount,
  feedFilter,
  onChangeFeedFilter,
  onOpenShared,
  onLike,
  onComment,
  onShare,
  onSave,
  onOpenMenu,
  onViewProfile,
  onToggleFollow,
  onGoToCreate,
  onGoToPostPhoto,
}) => {
  // Filter notes based on active feed segment
  const displayedNotes =
    feedFilter === 'following'
      ? notes.filter((n) => followingIds.includes(n.u) || n.u === currentUserId)
      : notes;

  return (
    <div className="pb-20">
      {/* Feed Filter Segmented Bar */}
      <div className="sticky top-14 z-20 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--ln)] px-4 py-2 flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 bg-[var(--card)] border border-[var(--ln)] rounded-xl w-full max-w-xs shadow-xs">
          <button
            onClick={() => onChangeFeedFilter('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              feedFilter === 'all'
                ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            For you
          </button>
          <button
            onClick={() => onChangeFeedFilter('following')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              feedFilter === 'following'
                ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            <span>Following</span>
            {followingIds.length > 0 && (
              <span
                className={`text-[10px] px-1 rounded ${
                  feedFilter === 'following'
                    ? 'bg-[var(--bg)]/20 text-[var(--bg)]'
                    : 'bg-[var(--ln)] text-[var(--mu)]'
                }`}
              >
                {followingIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Post Prompt Bar */}
      <div className="p-3 border-b border-[var(--ln)] bg-[var(--card)]/30 flex items-center gap-2">
        <button
          onClick={onGoToCreate}
          className="flex-1 text-left px-3.5 py-2 rounded-xl bg-[var(--card)] border border-[var(--ln)] hover:border-[var(--ac)] text-xs text-[var(--mu)] hover:text-[var(--tx)] transition-all shadow-xs"
        >
          Share a reflection or journal thought...
        </button>
        {onGoToPostPhoto && (
          <button
            onClick={onGoToPostPhoto}
            className="px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--ln)] hover:border-[var(--ac)] text-[var(--ac)] transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-xs active:scale-95"
            title="Post a photo"
          >
            <Camera className="w-4 h-4" />
            <span>Photo</span>
          </button>
        )}
      </div>

      {/* Shared alert banner */}
      {sharedCount > 0 && (
        <div className="p-3">
          <button
            onClick={onOpenShared}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--ac)]/40 bg-[var(--ac)]/10 text-[var(--tx)] hover:bg-[var(--ac)]/15 transition-all text-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[var(--ac)] shrink-0" />
              <div className="text-left">
                <span className="font-bold text-[var(--ac)]">{sharedCount} new</span>{' '}
                note{sharedCount === 1 ? '' : 's'} shared directly with you
              </div>
            </div>
            <span className="text-xs font-semibold text-[var(--ac)] group-hover:translate-x-0.5 transition-transform">
              View →
            </span>
          </button>
        </div>
      )}

      {/* Feed Notes */}
      {displayedNotes.length > 0 ? (
        <div className="divide-y divide-transparent">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              currentUserId={currentUserId}
              isSaved={savedIds.includes(note.id)}
              isFollowingAuthor={followingIds.includes(note.u)}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onSave={onSave}
              onOpenMenu={onOpenMenu}
              onViewProfile={onViewProfile}
              onToggleFollow={onToggleFollow}
            />
          ))}
        </div>
      ) : feedFilter === 'following' ? (
        <div className="py-14 px-6 text-center text-[var(--mu)]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex items-center justify-center text-[var(--tx)]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--tx)] mb-1">
            No notes from followed creators yet
          </h3>
          <p className="text-xs max-w-xs mx-auto mb-6 text-[var(--mu)]">
            Follow other creative thinkers and writers to see their latest thoughts here.
          </p>

          {/* Quick recommendations */}
          {suggestedProfiles.length > 0 && (
            <div className="text-left max-w-xs mx-auto bg-[var(--card)] p-3 rounded-2xl border border-[var(--ln)]">
              <div className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider mb-2.5">
                Suggested Writers
              </div>
              <div className="space-y-2.5">
                {suggestedProfiles.slice(0, 3).map((writer) => (
                  <div key={writer.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewProfile(writer.id)}
                      className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85"
                    >
                      <img
                        src={writer.pic}
                        alt={writer.name}
                        className="w-8 h-8 rounded-full object-cover border border-[var(--ln)] shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-xs text-[var(--tx)] truncate">
                          {writer.name}
                        </div>
                        <div className="text-[10px] text-[var(--mu)] truncate">
                          {writer.bio || 'Writer'}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => onToggleFollow(writer.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--ac)] text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 px-6 text-center text-[var(--mu)]">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex items-center justify-center text-[var(--tx)]">
            <PlusCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[var(--tx)] mb-1">No notes yet</h3>
          <p className="text-sm max-w-xs mx-auto mb-5 text-[var(--mu)]">
            Be the first to share an inspiring thought, reflection or note on the feed.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onGoToCreate}
              className="px-4 py-2.5 rounded-xl bg-[var(--ac)] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              Write a note
            </button>
            {onGoToPostPhoto && (
              <button
                onClick={onGoToPostPhoto}
                className="px-4 py-2.5 rounded-xl border border-[var(--ln)] bg-[var(--card)] text-[var(--tx)] text-xs font-semibold hover:border-[var(--ac)] active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-[var(--ac)]" />
                <span>Post a photo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
