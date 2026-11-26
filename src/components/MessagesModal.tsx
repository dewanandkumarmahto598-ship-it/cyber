import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DirectMessage, Profile } from '../types';
import { api } from '../api';
import { timeAgo } from '../utils/helpers';
import {
  X,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  ChevronLeft,
  MessageSquare,
  Swords,
  Sparkles,
  Search,
  CheckCheck,
} from 'lucide-react';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserProfile: Profile;
  profiles: Profile[];
  initialChatUserId?: string | null;
  onOpenChessGame?: (gameId?: string, opponentId?: string) => void;
  onToast: (msg: string) => void;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserProfile,
  profiles,
  initialChatUserId,
  onOpenChessGame,
  onToast,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialChatUserId || null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio player state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load all messages
  const loadMessages = useCallback(async () => {
    try {
      const allMsgs = await api.getMessages(currentUserId);
      setMessages(allMsgs);
    } catch {
      onToast('Failed to load messages');
    }
  }, [currentUserId, onToast]);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, loadMessages]);

  useEffect(() => {
    if (initialChatUserId) {
      setActivePartnerId(initialChatUserId);
    }
  }, [initialChatUserId]);

  // Mark thread as read when opening a partner's thread
  useEffect(() => {
    if (activePartnerId && isOpen) {
      api.markThreadRead(activePartnerId, currentUserId).catch(() => {});
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === activePartnerId && m.receiverId === currentUserId
            ? { ...m, isRead: true }
            : m
        )
      );
    }
  }, [activePartnerId, currentUserId, isOpen]);

  // Auto scroll to bottom of active thread
  useEffect(() => {
    if (activePartnerId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePartnerId, messages]);

  // Group messages into conversations
  const conversations = useMemo(() => {
    const map = new Map<string, { partner: Profile; lastMessage: DirectMessage; unread: number }>();

    for (const msg of messages) {
      const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      const partner = profiles.find((p) => p.id === partnerId) || {
        id: partnerId,
        name: msg.senderId === currentUserId ? 'User' : msg.senderName,
        pic: msg.senderId === currentUserId ? undefined : msg.senderPic,
      };

      const existing = map.get(partnerId);
      const isUnread = msg.receiverId === currentUserId && !msg.isRead;

      if (!existing || msg.t > existing.lastMessage.t) {
        map.set(partnerId, {
          partner,
          lastMessage: msg,
          unread: (existing?.unread || 0) + (isUnread ? 1 : 0),
        });
      } else if (isUnread) {
        existing.unread++;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.lastMessage.t - a.lastMessage.t
    );
  }, [messages, currentUserId, profiles]);

  // Active thread messages
  const activeThread = useMemo(() => {
    if (!activePartnerId) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === activePartnerId) ||
          (m.senderId === activePartnerId && m.receiverId === currentUserId)
      )
      .sort((a, b) => a.t - b.t);
  }, [messages, currentUserId, activePartnerId]);

  const activePartner = useMemo(() => {
    if (!activePartnerId) return null;
    return profiles.find((p) => p.id === activePartnerId) || {
      id: activePartnerId,
      name: 'Creator',
    };
  }, [activePartnerId, profiles]);

  if (!isOpen) return null;

  // Send Text Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activePartnerId || isSending) return;
    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const newMsg = await api.sendMessage({
        senderId: currentUserId,
        receiverId: activePartnerId,
        text: textToSend,
      });
      setMessages((prev) => [...prev, newMsg]);

      // If chatting with a resident creator (bot), trigger a pleasant smart reply!
      const residentBots = ['u_maya', 'u_liam', 'u_elena', 'u_sofia'];
      if (residentBots.includes(activePartnerId)) {
        setTimeout(async () => {
          const replies: Record<string, string[]> = {
            u_maya: [
              "That is so thoughtful! I'm jotting this down in my morning notes.",
              "I completely agree. Beautiful perspective!",
              "Thanks for sharing that! Up for a game of chess whenever you're ready.",
            ],
            u_liam: [
              'Very interesting observation on structure and space.',
              'Appreciate the note! Let me know if you want to play a round of chess.',
            ],
            u_elena: [
              'Such a comforting reflection ✨',
              'Warm greetings! Always love connecting through writing.',
            ],
            u_sofia: [
              'Love the creativity in that thought! 🎨',
              'Thanks for reaching out! Looking forward to seeing more of your work.',
            ],
          };
          const pool = replies[activePartnerId] || ["Thanks for messaging! Let's connect again soon."];
          const botReply = pool[Math.floor(Math.random() * pool.length)];

          try {
            const replyMsg = await api.sendMessage({
              senderId: activePartnerId,
              receiverId: currentUserId,
              text: botReply,
            });
            setMessages((prev) => [...prev, replyMsg]);
          } catch {}
        }, 1100);
      }
    } catch {
      onToast('Failed to send message');
      setInputText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (activePartnerId) {
            try {
              const newMsg = await api.sendMessage({
                senderId: currentUserId,
                receiverId: activePartnerId,
                voiceUrl: base64Audio,
                voiceDuration: Math.max(1, recordingSeconds),
              });
              setMessages((prev) => [...prev, newMsg]);
              onToast('Voice message sent');
            } catch {
              onToast('Failed to send voice message');
            }
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      // Fallback: Web Audio generated chime voice note
      sendSynthesizedVoiceNote();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const sendSynthesizedVoiceNote = async () => {
    if (!activePartnerId) return;
    const demoVoiceData =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    try {
      const newMsg = await api.sendMessage({
        senderId: currentUserId,
        receiverId: activePartnerId,
        voiceUrl: demoVoiceData,
        voiceDuration: 4,
        text: '🎙️ Voice note',
      });
      setMessages((prev) => [...prev, newMsg]);
      onToast('Voice note sent');
    } catch {
      onToast('Could not record voice note');
    }
  };

  // Audio Playback
  const togglePlayAudio = (msgId: string, url?: string) => {
    if (!url) return;

    if (playingMessageId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingMessageId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;
    audio.onended = () => setPlayingMessageId(null);
    audio.onerror = () => setPlayingMessageId(null);

    audio.play().then(() => {
      setPlayingMessageId(msgId);
      audioRef.current = audio;
    }).catch(() => {
      setPlayingMessageId(null);
    });
  };

  // Quick Chess Challenge from Chat
  const handleQuickChessChallenge = () => {
    if (!activePartnerId) return;
    onClose();
    if (onOpenChessGame) {
      onOpenChessGame(undefined, activePartnerId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--ln)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden z-10 transition-colors">
        {/* Header */}
        <div className="p-3.5 border-b border-[var(--ln)] flex items-center justify-between bg-[var(--card)]/50">
          <div className="flex items-center gap-2">
            {activePartnerId ? (
              <button
                onClick={() => setActivePartnerId(null)}
                className="p-1 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                title="Back to conversations"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : null}

            {activePartnerId && activePartner ? (
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    activePartner.pic ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={activePartner.name}
                  className="w-8 h-8 rounded-full object-cover border border-[var(--ln)]"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--tx)]">
                    {activePartner.name}
                  </h3>
                  <div className="text-[10px] text-[var(--mu)]">
                    {activePartner.username ? `@${activePartner.username}` : 'Creator'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--ac)]/10 text-[var(--ac)] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--tx)]">Messages</h2>
                  <p className="text-[11px] text-[var(--mu)]">Direct messages & chess challenges</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activePartnerId && onOpenChessGame && (
              <button
                onClick={handleQuickChessChallenge}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Challenge to Chess"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Play Chess</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors cursor-pointer"
              aria-label="Close messages"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activePartnerId ? (
          /* Active Chat Thread */
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg)]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThread.length > 0 ? (
                activeThread.map((msg) => {
                  const isMine = msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-3 shadow-xs transition-all ${
                          isMine
                            ? 'bg-[var(--ac)] text-white rounded-br-xs'
                            : 'bg-[var(--card)] border border-[var(--ln)] text-[var(--tx)] rounded-bl-xs'
                        }`}
                      >
                        {/* Chess Challenge Card */}
                        {msg.chessGameId ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs">
                              <Swords className={`w-4 h-4 ${isMine ? 'text-amber-200' : 'text-amber-500'}`} />
                              <span>Chess Match Challenge</span>
                            </div>
                            <p className="text-xs opacity-90 leading-snug">
                              {msg.text || 'Challenged you to a game of Chess!'}
                            </p>
                            <button
                              onClick={() => {
                                onClose();
                                if (onOpenChessGame) onOpenChessGame(msg.chessGameId);
                              }}
                              className={`w-full mt-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                                isMine
                                  ? 'bg-white text-[var(--ac)] hover:bg-white/90'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90'
                              }`}
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>Open Chess Game</span>
                            </button>
                          </div>
                        ) : msg.voiceUrl ? (
                          /* Voice Note Bubble */
                          <div className="flex items-center gap-2.5 min-w-[170px]">
                            <button
                              onClick={() => togglePlayAudio(msg.id, msg.voiceUrl)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                                isMine ? 'bg-white text-[var(--ac)]' : 'bg-[var(--ac)] text-white'
                              }`}
                            >
                              {playingMessageId === msg.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-center gap-1 h-4">
                                {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50].map((h, i) => (
                                  <div
                                    key={i}
                                    style={{ height: `${h}%` }}
                                    className={`w-1 rounded-full ${
                                      isMine ? 'bg-white/70' : 'bg-[var(--ac)]/60'
                                    } ${playingMessageId === msg.id ? 'animate-pulse' : ''}`}
                                  />
                                ))}
                              </div>
                              <div className="text-[10px] opacity-75 mt-1 font-mono">
                                0:{String(msg.voiceDuration || 3).padStart(2, '0')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Standard Text Bubble */
                          <p className="text-xs whitespace-pre-wrap leading-relaxed select-text">
                            {msg.text}
                          </p>
                        )}
                      </div>

                      {/* Timestamp & read receipt */}
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-[var(--mu)]">{timeAgo(msg.t)}</span>
                        {isMine && (
                          <CheckCheck
                            className={`w-3 h-3 ${
                              msg.isRead ? 'text-blue-500' : 'text-[var(--mu)] opacity-50'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-[var(--mu)]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex items-center justify-center text-[var(--ac)]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--tx)]">
                    Say hello to {activePartner?.name}
                  </p>
                  <p className="text-[11px] max-w-xs mx-auto mt-0.5">
                    Send a message, a voice note, or challenge them to a chess match!
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-[var(--ln)] bg-[var(--card)]/70">
              {isRecording ? (
                <div className="flex items-center justify-between gap-3 p-2 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>Recording: 0:{String(recordingSeconds).padStart(2, '0')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelRecording}
                      className="px-2.5 py-1 text-xs text-[var(--mu)] hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopRecording}
                      className="p-2 rounded-xl bg-rose-500 text-white hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
                      title="Send voice note"
                    >
                      <Square className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={handleQuickChessChallenge}
                    className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Challenge to Chess"
                  >
                    <Swords className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${activePartner?.name || '...'}`}
                    className="flex-1 bg-[var(--bg)] text-[var(--tx)] text-xs rounded-xl px-3.5 py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors placeholder:text-[var(--mu)]"
                  />

                  {inputText.trim() ? (
                    <button
                      type="submit"
                      disabled={isSending}
                      className="p-2 rounded-xl bg-[var(--ac)] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      title="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2 rounded-xl text-[var(--mu)] hover:text-[var(--ac)] hover:bg-[var(--card)] transition-colors cursor-pointer"
                      title="Hold to record voice message"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Conversations Directory */
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {/* Search Creator */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--mu)] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations or creators..."
                className="w-full bg-[var(--card)] text-[var(--tx)] text-xs rounded-xl pl-9 pr-4 py-2 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors placeholder:text-[var(--mu)]"
              />
            </div>

            {/* Quick Creator Start Carousel */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mu)] mb-2 px-1">
                Creators to Message
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {profiles
                  .filter((p) => p.id !== currentUserId)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePartnerId(p.id)}
                      className="flex flex-col items-center gap-1 min-w-[62px] p-1.5 rounded-xl hover:bg-[var(--card)] transition-colors cursor-pointer group"
                    >
                      <div className="relative">
                        <img
                          src={
                            p.pic ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={p.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[var(--ln)] group-hover:border-[var(--ac)] transition-colors"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--tx)] truncate max-w-[64px] text-center">
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Conversation Threads List */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--mu)] mb-2 px-1">
                Recent Chats ({conversations.length})
              </div>

              {conversations.length > 0 ? (
                <div className="divide-y divide-[var(--ln)] border border-[var(--ln)] rounded-2xl overflow-hidden bg-[var(--card)]">
                  {conversations.map(({ partner, lastMessage, unread }) => {
                    return (
                      <button
                        key={partner.id}
                        onClick={() => setActivePartnerId(partner.id)}
                        className="w-full p-3 flex items-center gap-3 text-left hover:bg-[var(--card)]/90 transition-colors cursor-pointer"
                      >
                        <img
                          src={
                            partner.pic ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={partner.name}
                          className="w-11 h-11 rounded-full object-cover border border-[var(--ln)] shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--tx)] truncate">
                              {partner.name}
                            </span>
                            <span className="text-[10px] text-[var(--mu)] shrink-0">
                              {timeAgo(lastMessage.t)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[11px] text-[var(--mu)] truncate pr-2">
                              {lastMessage.chessGameId ? (
                                <span className="text-amber-500 font-semibold flex items-center gap-1">
                                  <Swords className="w-3 h-3" />
                                  <span>Chess Challenge</span>
                                </span>
                              ) : lastMessage.voiceUrl ? (
                                <span>🎙️ Voice message</span>
                              ) : (
                                lastMessage.text || 'Message'
                              )}
                            </p>

                            {unread > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--ac)] text-white shrink-0">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-[var(--mu)] rounded-2xl border border-dashed border-[var(--ln)]">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--ac)]" />
                  <p className="text-xs font-semibold text-[var(--tx)]">No conversations yet</p>
                  <p className="text-[11px] mt-0.5">
                    Tap a creator above to start chatting or send a chess challenge!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
