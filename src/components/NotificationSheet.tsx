import React, { useState } from 'react';
import { AppNotification } from '../types';
import { timeAgo } from '../utils/helpers';
import {
  X,
  Heart,
  MessageSquare,
  UserPlus,
  CheckCheck,
  Bell,
  Sparkles,
  UserCheck,
  ExternalLink,
  Swords,
  MessageCircle,
} from 'lucide-react';

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenNoteDetail?: (noteId: string) => void;
  onOpenProfile?: (userId: string) => void;
  onToggleFollow?: (targetUserId: string) => void;
  onOpenMessagesWithUser?: (userId: string) => void;
  onOpenChessGame?: (gameId: string) => void;
  myFollowingIds?: string[];
  onSimulateActivity?: () => void;
}

export const NotificationSheet: React.FC<NotificationSheetProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onOpenNoteDetail,
  onOpenProfile,
  onToggleFollow,
  onOpenMessagesWithUser,
  onOpenChessGame,
  myFollowingIds = [],
  onSimulateActivity,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      onMarkRead(notif.id);
    }
    if (notif.chessGameId && onOpenChessGame) {
      onOpenChessGame(notif.chessGameId);
      onClose();
    } else if (notif.type === 'message' && onOpenMessagesWithUser) {
      onOpenMessagesWithUser(notif.actorId);
      onClose();
    } else if (notif.noteId && onOpenNoteDetail) {
      onOpenNoteDetail(notif.noteId);
      onClose();
    } else if (notif.actorId && onOpenProfile) {
      onOpenProfile(notif.actorId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--ln)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden z-10 transition-colors animate-in slide-in-from-bottom duration-200">
        {/* Drag handle for mobile */}
        <div className="w-12 h-1 bg-[var(--ln)] rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Sheet Header */}
        <div className="p-4 border-b border-[var(--ln)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--ac)]/10 text-[var(--ac)] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--tx)]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--ac)] text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--mu)]">Likes, comments, and new followers</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--ac)] hover:bg-[var(--ac)]/10 transition-colors flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar & Quick action */}
        <div className="px-4 py-2 border-b border-[var(--ln)] bg-[var(--card)]/40 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
                  : 'text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {onSimulateActivity && (
            <button
              onClick={onSimulateActivity}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--ac)] bg-[var(--ac)]/10 hover:bg-[var(--ac)]/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              title="Trigger a test interaction (like, comment, or follow)"
            >
              <Sparkles className="w-3 h-3" />
              <span>Simulate Activity</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--ln)]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const isFollowingActor = myFollowingIds.includes(notif.actorId);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-center gap-3 transition-colors hover:bg-[var(--card)]/60 cursor-pointer ${
                    !notif.isRead ? 'bg-[var(--ac)]/5' : ''
                  }`}
                >
                  {/* Actor Avatar with Icon Badge */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        notif.actorPic ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={notif.actorName}
                      className="w-11 h-11 rounded-full object-cover border border-[var(--ln)] shadow-xs"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white ring-2 ring-[var(--bg)] shadow-xs ${
                        notif.type === 'like'
                          ? 'bg-gradient-to-tr from-[#ff3d6e] to-[#ff9d2e]'
                          : notif.type === 'comment'
                          ? 'bg-gradient-to-tr from-[#0ea5e9] to-[#7b2ff7]'
                          : 'bg-gradient-to-tr from-[#7b2ff7] to-[#10b981]'
                      }`}
                    >
                      {notif.type === 'like' ? (
                        <Heart className="w-2.5 h-2.5 fill-white" />
                      ) : notif.type === 'comment' ? (
                        <MessageSquare className="w-2.5 h-2.5 fill-white" />
                      ) : (
                        <UserPlus className="w-2.5 h-2.5" />
                      )}
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="text-xs text-[var(--tx)] leading-snug">
                      <span className="font-bold hover:underline">{notif.actorName}</span>{' '}
                      {notif.type === 'like' ? (
                        <span>
                          liked your {notif.noteImage ? 'photo' : 'note'}
                        </span>
                      ) : notif.type === 'comment' ? (
                        <span>commented on your {notif.noteImage ? 'photo' : 'note'}</span>
                      ) : (
                        <span>started following you</span>
                      )}
                    </div>

                    {/* Preview snippet or comment text */}
                    {notif.previewText && (
                      <p className="text-[11px] text-[var(--mu)] truncate mt-0.5 italic">
                        {notif.type === 'comment' ? `"${notif.previewText}"` : notif.previewText}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--mu)] font-medium">
                        {timeAgo(notif.t)}
                      </span>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ac)]" />
                      )}
                    </div>
                  </div>

                  {/* Action/Preview column */}
                  <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {notif.type === 'follow' && onToggleFollow && (
                      <button
                        onClick={() => onToggleFollow(notif.actorId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer ${
                          isFollowingActor
                            ? 'border border-[var(--ln)] bg-[var(--card)] text-[var(--tx)] hover:bg-[var(--ln)]/30'
                            : 'bg-[var(--ac)] text-white hover:opacity-90 active:scale-95'
                        }`}
                      >
                        {isFollowingActor ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow back</span>
                          </>
                        )}
                      </button>
                    )}

                    {(notif.type === 'like' || notif.type === 'comment') && notif.noteId && (
                      <button
                        onClick={() => handleItemClick(notif)}
                        className="w-11 h-11 rounded-lg border border-[var(--ln)] overflow-hidden bg-[var(--card)] flex items-center justify-center relative group hover:border-[var(--ac)] transition-colors cursor-pointer"
                        title="View post"
                      >
                        {notif.noteImage ? (
                          <img
                            src={notif.noteImage}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-1 text-[9px] text-[var(--mu)] line-clamp-3 text-left leading-tight group-hover:text-[var(--tx)]">
                            {notif.previewText || 'Note'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 px-6 text-center text-[var(--mu)]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex items-center justify-center text-[var(--mu)]">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold text-[var(--tx)] mb-1">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs max-w-xs mx-auto mb-4">
                {filter === 'unread'
                  ? 'All caught up! Check back when creators like or comment on your notes.'
                  : 'When others like or comment on your notes and photos, or follow you, updates will appear here.'}
              </p>
              {onSimulateActivity && (
                <button
                  onClick={onSimulateActivity}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--ac)] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate test notification</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
