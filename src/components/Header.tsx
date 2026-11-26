import React from 'react';
import { Sun, Moon, Sparkles, UserCheck, LogIn, Bell, MessageCircle, Swords } from 'lucide-react';
import { Profile } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sharedCount: number;
  onOpenShared: () => void;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
  unreadMessageCount?: number;
  onOpenMessages: () => void;
  activeChessCount?: number;
  onOpenChess: () => void;
  currentProfile: Profile;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  sharedCount,
  onOpenShared,
  unreadNotificationCount,
  onOpenNotifications,
  unreadMessageCount = 0,
  onOpenMessages,
  activeChessCount = 0,
  onOpenChess,
  currentProfile,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full max-w-lg mx-auto bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--ln)] px-3.5 h-14 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <span className="logo-serif italic font-bold text-2xl tracking-tight bg-gradient-to-r from-[#ff3d6e] via-[#ff9d2e] to-[#7b2ff7] bg-clip-text text-transparent select-none cursor-pointer">
          Notes
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {sharedCount > 0 && (
          <button
            onClick={onOpenShared}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--ac)] text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            title="Shared notes with you"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{sharedCount}</span>
          </button>
        )}

        {/* Chess Arena Button */}
        <button
          onClick={onOpenChess}
          className="relative p-2 rounded-full text-[var(--mu)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
          aria-label="Play Chess Arena"
          title="Play Chess Arena"
        >
          <Swords className="w-5 h-5" />
          {activeChessCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[var(--bg)]">
              {activeChessCount}
            </span>
          )}
        </button>

        {/* Direct Messages Button */}
        <button
          onClick={onOpenMessages}
          className="relative p-2 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
          aria-label="Direct Messages"
          title="Messages"
        >
          <MessageCircle className="w-5 h-5" />
          {unreadMessageCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--ac)] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[var(--bg)] animate-pulse">
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </span>
          )}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--ac)] text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-[var(--bg)] animate-pulse">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Account Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border border-[var(--ln)] bg-[var(--card)] hover:border-[var(--ac)] text-[var(--tx)] transition-all cursor-pointer"
          title="Account & Sign In"
        >
          {currentProfile.username ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="max-w-[65px] truncate font-semibold">@{currentProfile.username}</span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 text-[var(--ac)]" />
              <span>Sign In</span>
            </>
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
