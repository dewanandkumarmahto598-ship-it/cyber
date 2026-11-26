import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, UserPlus, UserCheck } from 'lucide-react';
import { Note, Profile } from '../types';
import { CARD_GRADIENTS, CARD_GRADIENT_NAMES } from '../utils/helpers';

interface ExploreViewProps {
  notes: Note[];
  profiles: Profile[];
  currentUserId: string;
  followingIds: string[];
  onToggleFollow: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onOpenNoteDetail: (noteId: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  notes,
  profiles,
  currentUserId,
  followingIds,
  onToggleFollow,
  onViewProfile,
  onOpenNoteDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<number | null>(null);

  const otherProfiles = profiles.filter((p) => p.id !== currentUserId);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        n.body.toLowerCase().includes(q) ||
        n.authorName.toLowerCase().includes(q);

      const matchesColor = selectedColor === null || n.c === selectedColor;

      return matchesSearch && matchesColor;
    });
  }, [notes, searchQuery, selectedColor]);

  return (
    <div className="pb-24">
      {/* Search Input and Filter */}
      <div className="p-3 sticky top-14 z-20 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--ln)]">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[var(--mu)] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, reflections or authors..."
            className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl pl-9 pr-9 py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors placeholder:text-[var(--mu)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-[var(--mu)] hover:text-[var(--tx)]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Color filter palette */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedColor(null)}
            className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-all border ${
              selectedColor === null
                ? 'bg-[var(--tx)] text-[var(--bg)] border-[var(--tx)] font-semibold'
                : 'bg-[var(--card)] text-[var(--mu)] border-[var(--ln)] hover:text-[var(--tx)]'
            }`}
          >
            All colors
          </button>
          {CARD_GRADIENTS.map((grad, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedColor(selectedColor === idx ? null : idx)}
              title={CARD_GRADIENT_NAMES[idx]}
              className={`w-6 h-6 rounded-full shrink-0 border-2 transition-transform ${
                selectedColor === idx ? 'scale-115 border-[var(--tx)] ring-2 ring-[var(--bg)]' : 'border-black/10'
              }`}
              style={{
                background: idx === 0 ? 'var(--card)' : grad,
              }}
            />
          ))}
        </div>
      </div>

      {/* Discover Creators strip (when not filtering by specific color or active query) */}
      {!searchQuery && selectedColor === null && otherProfiles.length > 0 && (
        <div className="p-3 border-b border-[var(--ln)] bg-[var(--card)]/30">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider">
              Creators to follow
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
            {otherProfiles.map((creator) => {
              const isFollowing = followingIds.includes(creator.id);
              return (
                <div
                  key={creator.id}
                  className="w-32 shrink-0 p-2.5 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex flex-col items-center text-center shadow-xs"
                >
                  <button
                    onClick={() => onViewProfile(creator.id)}
                    className="hover:opacity-85 transition-opacity"
                  >
                    <img
                      src={creator.pic}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full object-cover border border-[var(--ln)] mb-1.5"
                    />
                    <div className="font-semibold text-xs text-[var(--tx)] truncate w-28">
                      {creator.name}
                    </div>
                  </button>
                  <div className="text-[10px] text-[var(--mu)] truncate w-28 mb-2">
                    {creator.bio || 'Writer'}
                  </div>
                  <button
                    onClick={() => onToggleFollow(creator.id)}
                    className={`w-full py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                      isFollowing
                        ? 'border border-[var(--ln)] text-[var(--mu)] hover:text-[var(--tx)]'
                        : 'bg-[var(--ac)] text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3 text-emerald-500" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3-Column Tile Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {filteredNotes.map((note) => {
            const isGrad = note.c > 0 && note.c < CARD_GRADIENTS.length;
            const gradStyle = isGrad ? { background: CARD_GRADIENTS[note.c] } : undefined;

            return (
              <button
                key={note.id}
                onClick={() => onOpenNoteDetail(note.id)}
                style={!note.image && isGrad ? gradStyle : undefined}
                className={`aspect-square p-2.5 flex flex-col items-center justify-center text-center overflow-hidden transition-opacity hover:opacity-90 active:scale-[0.98] select-none relative ${
                  note.image
                    ? 'text-white bg-black/20'
                    : isGrad
                    ? 'text-white'
                    : 'bg-[var(--card)] text-[var(--tx)] border border-[var(--ln)]'
                }`}
              >
                {note.image ? (
                  <img
                    src={note.image}
                    alt={note.title || 'Photo'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <span className="font-bold text-xs line-clamp-2 leading-tight mb-1">
                      {note.title || note.body}
                    </span>
                    {note.title && (
                      <span className="text-[10px] opacity-80 line-clamp-2 leading-snug">
                        {note.body}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-20 px-6 text-center text-[var(--mu)]">
          <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <h4 className="text-base font-semibold text-[var(--tx)] mb-1">No matches found</h4>
          <p className="text-xs max-w-xs mx-auto">
            Try adjusting your search terms or clearing the color filter.
          </p>
        </div>
      )}
    </div>
  );
};
