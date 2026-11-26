import React, { useState } from 'react';
import { X, Share2, Copy, Send, Check } from 'lucide-react';
import { Note, Profile } from '../types';

interface ShareSheetProps {
  note: Note;
  profiles: Profile[];
  currentUserId: string;
  onSendToUser: (targetUserId: string) => Promise<void>;
  onClose: () => void;
  onToast: (message: string) => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  note,
  profiles,
  currentUserId,
  onSendToUser,
  onClose,
  onToast,
}) => {
  const [sentUsers, setSentUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Other people to share with
  const otherProfiles = profiles.filter((p) => p.id !== currentUserId);

  const formattedShareText = () => {
    const titlePart = note.title ? `${note.title}\n\n` : '';
    const linkPart = `\n\n— ${note.authorName} on Notes`;
    return `${titlePart}${note.body}${linkPart}`;
  };

  const handleSystemShare = async () => {
    const text = formattedShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title || 'Note on Notes',
          text,
          url: window.location.href,
        });
        onToast('Shared successfully');
      } catch {
        // User cancelled or share failed
      }
    } else {
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareText());
      onToast('Note copied to clipboard');
      onClose();
    } catch {
      onToast('Could not copy note');
    }
  };

  const handleSendToUser = async (userId: string, userName: string) => {
    try {
      setIsSending(true);
      await onSendToUser(userId);
      setSentUsers((prev) => [...prev, userId]);
      onToast(`Sent to ${userName}`);
    } catch {
      onToast('Failed to send share');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--ln)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--ln)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
          <div className="w-6" />
          <h3 className="font-bold text-sm text-[var(--tx)]">Share note</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
            aria-label="Close share sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Options */}
        <div className="p-3 space-y-2 border-b border-[var(--ln)]">
          <button
            onClick={handleSystemShare}
            className="w-full py-3 px-4 rounded-xl bg-[var(--card)] hover:bg-[var(--ln)]/40 transition-colors flex items-center gap-3 text-sm font-semibold text-[var(--tx)]"
          >
            <div className="p-2 rounded-full bg-[var(--ac)]/10 text-[var(--ac)]">
              <Share2 className="w-4 h-4" />
            </div>
            <span>Share via apps…</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl bg-[var(--card)] hover:bg-[var(--ln)]/40 transition-colors flex items-center gap-3 text-sm font-semibold text-[var(--tx)]"
          >
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <Copy className="w-4 h-4" />
            </div>
            <span>Copy note content</span>
          </button>
        </div>

        {/* Send to someone on Notes */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-3">
            Send to a creator on Notes
          </div>

          {otherProfiles.length > 0 ? (
            <div className="space-y-2.5">
              {otherProfiles.map((user) => {
                const isAlreadySent = sentUsers.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--card)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.pic ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-[var(--ln)]"
                      />
                      <div>
                        <div className="font-semibold text-xs text-[var(--tx)]">{user.name}</div>
                        <div className="text-[11px] text-[var(--mu)] truncate max-w-[180px]">
                          {user.bio || 'Writer'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendToUser(user.id, user.name)}
                      disabled={isAlreadySent || isSending}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        isAlreadySent
                          ? 'bg-[var(--card)] text-[var(--mu)] border border-[var(--ln)]'
                          : 'bg-[var(--ac)] text-white hover:opacity-90 active:scale-95'
                      }`}
                    >
                      {isAlreadySent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-[var(--mu)] text-center py-6">
              No other accounts detected yet. You can copy the note text to share anywhere!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
