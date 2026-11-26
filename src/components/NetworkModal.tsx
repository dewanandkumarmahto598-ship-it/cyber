import React, { useState } from 'react';
import { X, UserPlus, UserCheck, Users } from 'lucide-react';
import { Profile, NetworkListType } from '../types';

interface NetworkModalProps {
  initialType: NetworkListType;
  profileName: string;
  followerProfiles: Profile[];
  followingProfiles: Profile[];
  currentUserId: string;
  myFollowingIds: string[];
  onToggleFollow: (targetUserId: string) => void;
  onViewProfile: (userId: string) => void;
  onClose: () => void;
}

export const NetworkModal: React.FC<NetworkModalProps> = ({
  initialType,
  profileName,
  followerProfiles,
  followingProfiles,
  currentUserId,
  myFollowingIds,
  onToggleFollow,
  onViewProfile,
  onClose,
}) => {
  const [activeType, setActiveType] = useState<NetworkListType>(initialType);

  const activeList = activeType === 'followers' ? followerProfiles : followingProfiles;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--ln)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--ln)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--mu)]" />
            <h3 className="font-bold text-sm text-[var(--tx)]">{profileName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[var(--ln)] bg-[var(--card)]/50">
          <button
            onClick={() => setActiveType('followers')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
              activeType === 'followers'
                ? 'border-[var(--ac)] text-[var(--tx)]'
                : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Followers ({followerProfiles.length})
          </button>
          <button
            onClick={() => setActiveType('following')}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
              activeType === 'following'
                ? 'border-[var(--ac)] text-[var(--tx)]'
                : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Following ({followingProfiles.length})
          </button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
          {activeList.length > 0 ? (
            activeList.map((user) => {
              const isMe = user.id === currentUserId;
              const isFollowing = myFollowingIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--card)] transition-colors group"
                >
                  <button
                    onClick={() => {
                      onViewProfile(user.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 pr-2"
                  >
                    <img
                      src={
                        user.pic ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--ln)] shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-xs text-[var(--tx)] truncate group-hover:underline flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[var(--ln)] text-[var(--mu)]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--mu)] truncate">
                        {user.bio || 'Writer'}
                      </div>
                    </div>
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => onToggleFollow(user.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all ${
                        isFollowing
                          ? 'border border-[var(--ln)] text-[var(--tx)] hover:bg-[var(--ln)]/30'
                          : 'bg-[var(--ac)] text-white hover:opacity-90 active:scale-95'
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
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-14 text-center text-[var(--mu)] text-xs">
              {activeType === 'followers'
                ? 'No followers yet.'
                : 'Not following anyone yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
