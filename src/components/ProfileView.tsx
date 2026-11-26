import React from 'react';
import { Profile, Note, Share, ProfileTab, NetworkListType } from '../types';
import { CARD_GRADIENTS } from '../utils/helpers';
import { Edit3, Bookmark, Send, FileText, UserPlus, UserCheck, Image as ImageIcon, Camera, Plus, MessageCircle, Swords } from 'lucide-react';

interface ProfileViewProps {
  profile: Profile;
  isOwnProfile: boolean;
  notes: Note[];
  savedNotes: Note[];
  sharedNotes: Note[];
  shares: Share[];
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  activeSubTab: ProfileTab;
  onChangeSubTab: (tab: ProfileTab) => void;
  onEditProfile: () => void;
  onToggleFollow: (targetUserId: string) => void;
  onOpenNetwork: (type: NetworkListType) => void;
  onOpenNoteDetail: (noteId: string) => void;
  onOpenAuth: () => void;
  onGoToPostPhoto?: () => void;
  onBackToMyProfile?: () => void;
  onOpenMessagesWithUser?: (userId: string) => void;
  onChallengeChessWithUser?: (userId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  isOwnProfile,
  notes,
  savedNotes,
  sharedNotes,
  shares,
  followersCount,
  followingCount,
  isFollowing,
  activeSubTab,
  onChangeSubTab,
  onEditProfile,
  onToggleFollow,
  onOpenNetwork,
  onOpenNoteDetail,
  onOpenAuth,
  onGoToPostPhoto,
  onBackToMyProfile,
  onOpenMessagesWithUser,
  onChallengeChessWithUser,
}) => {
  // Photos attached to this author's notes vs purely text/thought notes
  const photoNotes = notes.filter((n) => Boolean(n.image));
  const textNotes = notes.filter((n) => !n.image);

  // List to display according to sub-tab
  const displayNotes =
    activeSubTab === 'notes'
      ? textNotes
      : activeSubTab === 'photos'
      ? photoNotes
      : activeSubTab === 'saved'
      ? savedNotes
      : sharedNotes;

  return (
    <div className="pb-24">
      {/* Return to My Profile bar if viewing another creator */}
      {!isOwnProfile && onBackToMyProfile && (
        <div className="px-4 py-2 border-b border-[var(--ln)] bg-[var(--card)]/50 flex items-center justify-between">
          <span className="text-xs text-[var(--mu)]">Viewing creator profile</span>
          <button
            onClick={onBackToMyProfile}
            className="text-xs font-semibold text-[var(--ac)] hover:underline"
          >
            ← Back to my profile
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="p-4 flex items-center gap-4">
        <div className="relative group shrink-0">
          <img
            src={
              profile.pic ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={profile.name}
            className="w-18 h-18 rounded-full object-cover border-2 border-[var(--ln)] shadow-sm"
          />
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Change profile picture"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => onChangeSubTab('notes')}
            className="hover:opacity-75 transition-opacity text-center cursor-pointer"
          >
            <div className="text-base sm:text-lg font-bold text-[var(--tx)] tabular-nums">
              {textNotes.length}
            </div>
            <div className="text-[11px] text-[var(--mu)]">notes</div>
          </button>

          <button
            onClick={() => onChangeSubTab('photos')}
            className="hover:opacity-75 transition-opacity text-center cursor-pointer"
          >
            <div className="text-base sm:text-lg font-bold text-[var(--tx)] tabular-nums">
              {photoNotes.length}
            </div>
            <div className="text-[11px] text-[var(--mu)]">photos</div>
          </button>

          <button
            onClick={() => onOpenNetwork('followers')}
            className="hover:opacity-75 transition-opacity text-center cursor-pointer"
          >
            <div className="text-base sm:text-lg font-bold text-[var(--tx)] tabular-nums">
              {followersCount}
            </div>
            <div className="text-[11px] text-[var(--mu)]">followers</div>
          </button>

          <button
            onClick={() => onOpenNetwork('following')}
            className="hover:opacity-75 transition-opacity text-center cursor-pointer"
          >
            <div className="text-base sm:text-lg font-bold text-[var(--tx)] tabular-nums">
              {followingCount}
            </div>
            <div className="text-[11px] text-[var(--mu)]">following</div>
          </button>
        </div>
      </div>

      {/* Name, Bio, and Action Buttons */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base text-[var(--tx)]">{profile.name}</h2>
          {profile.username && (
            <span className="text-xs text-[var(--mu)] font-medium">@{profile.username}</span>
          )}
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="p-1 rounded-md text-[var(--ac)] hover:bg-[var(--ac)]/10 transition-colors"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="text-xs text-[var(--mu)] mt-1 whitespace-pre-line leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Action Buttons: Follow, Message, Challenge to Chess if viewing someone else */}
        {!isOwnProfile ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onToggleFollow(profile.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isFollowing
                  ? 'border border-[var(--ln)] bg-[var(--card)] text-[var(--tx)] hover:bg-[var(--ln)]/30'
                  : 'bg-[var(--ac)] text-white hover:opacity-90 active:scale-98'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </>
              )}
            </button>

            {onOpenMessagesWithUser && (
              <button
                onClick={() => onOpenMessagesWithUser(profile.id)}
                className="py-2 px-3 rounded-xl border border-[var(--ln)] text-xs font-semibold text-[var(--tx)] bg-[var(--card)] hover:bg-[var(--ln)]/20 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                title="Message creator"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[var(--ac)]" />
                <span>Message</span>
              </button>
            )}

            {onChallengeChessWithUser && (
              <button
                onClick={() => onChallengeChessWithUser(profile.id)}
                className="py-2 px-3 rounded-xl border border-amber-500/30 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                title="Challenge to Chess match"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Play Chess</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={onEditProfile}
              className="flex-1 py-2 px-3 rounded-xl border border-[var(--ln)] text-xs font-semibold text-[var(--tx)] bg-[var(--card)] hover:bg-[var(--ln)]/20 transition-colors"
            >
              Edit profile & photo
            </button>
            <button
              onClick={onOpenAuth}
              className="py-2 px-3 rounded-xl border border-[var(--ln)] text-xs font-semibold text-[var(--ac)] bg-[var(--card)] hover:bg-[var(--ac)]/10 transition-colors"
            >
              Accounts & Sign In
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs (Notes / Photos / Saved / Shared) */}
      <div className="border-t border-[var(--ln)] flex">
        <button
          onClick={() => onChangeSubTab('notes')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeSubTab === 'notes'
              ? 'border-[var(--tx)] text-[var(--tx)]'
              : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notes{textNotes.length > 0 ? ` (${textNotes.length})` : ''}</span>
        </button>

        <button
          onClick={() => onChangeSubTab('photos')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeSubTab === 'photos'
              ? 'border-[var(--tx)] text-[var(--tx)]'
              : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photos{photoNotes.length > 0 ? ` (${photoNotes.length})` : ''}</span>
        </button>

        {isOwnProfile && (
          <>
            <button
              onClick={() => onChangeSubTab('saved')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeSubTab === 'saved'
                  ? 'border-[var(--tx)] text-[var(--tx)]'
                  : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved ({savedNotes.length})</span>
            </button>

            <button
              onClick={() => onChangeSubTab('shared')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeSubTab === 'shared'
                  ? 'border-[var(--tx)] text-[var(--tx)]'
                  : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Shared ({shares.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Photos sub-tab header action bar */}
      {activeSubTab === 'photos' && isOwnProfile && (
        <div className="px-3.5 py-2.5 bg-[var(--card)]/60 border-b border-[var(--ln)] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[var(--mu)] font-medium">
            <Camera className="w-3.5 h-3.5 text-[var(--ac)]" />
            <span>Photography Gallery ({photoNotes.length})</span>
          </div>
          {onGoToPostPhoto && (
            <button
              onClick={onGoToPostPhoto}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--ac)] text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Photo</span>
            </button>
          )}
        </div>
      )}

      {/* 3-Column Square Grid */}
      {displayNotes.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {displayNotes.map((note) => {
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
        <div className="py-16 px-6 text-center text-[var(--mu)]">
          {activeSubTab === 'photos' && (
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex items-center justify-center text-[var(--ac)]">
              <Camera className="w-6 h-6" />
            </div>
          )}
          <p className="text-sm font-semibold text-[var(--tx)] mb-1">
            {activeSubTab === 'photos'
              ? 'No photos posted yet'
              : activeSubTab === 'saved'
              ? 'No saved notes yet'
              : activeSubTab === 'shared'
              ? 'No shared notes yet'
              : 'No notes posted yet'}
          </p>
          <p className="text-xs max-w-xs mx-auto">
            {activeSubTab === 'photos'
              ? isOwnProfile
                ? 'Share your photography, daily snapshots, and visual moments with your profile.'
                : 'This author has not posted any photos yet.'
              : activeSubTab === 'saved'
              ? 'Tap the bookmark icon on any note to save it for easy access.'
              : activeSubTab === 'shared'
              ? 'Notes that others send to you will show up here.'
              : 'Notes created by this author will appear in this grid.'}
          </p>
          {activeSubTab === 'photos' && isOwnProfile && onGoToPostPhoto && (
            <button
              onClick={onGoToPostPhoto}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--ac)] text-white hover:opacity-90 active:scale-95 transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Post your first photo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
