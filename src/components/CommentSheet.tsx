import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  Volume2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Comment, Profile } from '../types';
import { timeAgo } from '../utils/helpers';

interface CommentSheetProps {
  noteId: string;
  comments: Comment[];
  isLoading: boolean;
  currentUser: Profile;
  onAddComment: (data: {
    text?: string;
    voiceUrl?: string;
    voiceDuration?: number;
  }) => Promise<void>;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

// Format seconds into MM:SS or M:SS
const formatDuration = (seconds?: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Generates an in-memory pleasant chime melody audio WAV data URL (for testing/demo fallback)
const generateDemoChimeAudio = (): { dataUrl: string; duration: number } => {
  const sampleRate = 22050;
  const duration = 2.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  // Notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [
    { freq: 523.25, start: 0.0, dur: 0.6 },
    { freq: 659.25, start: 0.5, dur: 0.6 },
    { freq: 783.99, start: 1.0, dur: 0.7 },
    { freq: 1046.5, start: 1.5, dur: 1.0 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of notes) {
      if (t >= note.start && t < note.start + note.dur) {
        const noteT = t - note.start;
        const env = Math.exp(-noteT * 3.5); // decay
        sample += Math.sin(2 * Math.PI * note.freq * noteT) * env * 0.45;
        // add subtle harmonic
        sample += Math.sin(4 * Math.PI * note.freq * noteT) * env * 0.15;
      }
    }
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(sample * 30000)));
  }

  // Create WAV header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + buffer.byteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, buffer.byteLength, true);

  const blob = new Blob([header, buffer], { type: 'audio/wav' });
  return {
    dataUrl: URL.createObjectURL(blob),
    duration: 3,
  };
};

/**
 * Individual Voice Note Player inside comments list
 */
const VoiceCommentPlayer: React.FC<{
  voiceUrl: string;
  duration?: number;
}> = ({ voiceUrl, duration = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voiceUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [voiceUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleSpeedToggle = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="mt-1.5 p-2 rounded-2xl bg-[var(--card)] border border-[var(--ln)] flex items-center gap-2.5 max-w-xs shadow-xs">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[var(--ac)] text-white flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-xs"
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Animated wave bars and seek slider */}
        <div className="relative flex items-center h-4">
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[var(--ac)] h-1.5 rounded-lg cursor-pointer bg-[var(--ln)] appearance-none"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[var(--mu)] font-medium tabular-nums">
          <span>{formatDuration(currentTime)}</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <Mic className="w-2.5 h-2.5 text-[var(--ac)]" />
              <span>{formatDuration(totalDuration)}</span>
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSpeedToggle}
        className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-[var(--mu)] hover:text-[var(--tx)] bg-[var(--ln)]/30 hover:bg-[var(--ln)]/60 transition-colors"
        title="Playback speed"
      >
        {speed}x
      </button>
    </div>
  );
};

export const CommentSheet: React.FC<CommentSheetProps> = ({
  comments,
  isLoading,
  currentUser,
  onAddComment,
  onClose,
  onViewProfile,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceDraftUrl, setVoiceDraftUrl] = useState<string | null>(null);
  const [voiceDraftDuration, setVoiceDraftDuration] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  // Clean up recording and timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Start live microphone recording
  const startRecording = async () => {
    setMicError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Audio recording is not supported in this browser. Try the sample note below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const duration = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        // Convert blob to base64 Data URL so it can be sent to backend
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setVoiceDraftUrl(reader.result);
            setVoiceDraftDuration(duration);
          }
        };
        reader.readAsDataURL(blob);

        setIsRecording(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };

      recorder.start(150); // Slice data every 150ms
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.warn('Microphone error:', err);
      setMicError('Microphone permission denied or device unavailable.');
      setIsRecording(false);
    }
  };

  // Stop recording and finalize draft
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Cancel recording and discard chunks
  const cancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Discard recorded draft
  const discardDraft = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setVoiceDraftUrl(null);
    setVoiceDraftDuration(0);
    setIsPreviewPlaying(false);
  };

  // Toggle preview play/pause of recorded draft
  const togglePreviewPlay = () => {
    if (!voiceDraftUrl) return;
    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(voiceDraftUrl);
        previewAudioRef.current.onended = () => setIsPreviewPlaying(false);
      }
      previewAudioRef.current.play().catch(() => setIsPreviewPlaying(false));
      setIsPreviewPlaying(true);
    }
  };

  // Insert a quick demo voice note
  const handleUseDemoVoiceNote = () => {
    const demo = generateDemoChimeAudio();
    setVoiceDraftUrl(demo.dataUrl);
    setVoiceDraftDuration(demo.duration);
    setMicError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = Boolean(commentText.trim());
    const hasVoice = Boolean(voiceDraftUrl);

    if ((!hasText && !hasVoice) || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddComment({
        text: commentText.trim(),
        voiceUrl: voiceDraftUrl || undefined,
        voiceDuration: voiceDraftUrl ? voiceDraftDuration : undefined,
      });

      // Clear input and draft
      setCommentText('');
      discardDraft();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--ln)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--ln)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
          <div className="w-6" />
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-[var(--tx)]">Comments</h3>
            <span className="text-xs text-[var(--mu)]">({comments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
            aria-label="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[180px]">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-[var(--mu)]">Loading conversation...</div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <button
                  onClick={() => onViewProfile(c.u)}
                  className="shrink-0 hover:opacity-85 transition-opacity pt-0.5"
                >
                  <img
                    src={
                      c.authorPic ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={c.authorName}
                    className="w-8 h-8 rounded-full object-cover border border-[var(--ln)]"
                  />
                </button>
                <div className="flex-1 text-sm min-w-0">
                  <div className="flex items-baseline gap-2">
                    <button
                      onClick={() => onViewProfile(c.u)}
                      className="font-bold text-xs text-[var(--tx)] hover:underline truncate"
                    >
                      {c.authorName}
                    </button>
                    <span className="text-[10px] text-[var(--mu)] shrink-0">{timeAgo(c.t)}</span>
                  </div>

                  {/* Comment Text if present */}
                  {c.text && (
                    <p className="text-xs sm:text-sm text-[var(--tx)] mt-0.5 break-words whitespace-pre-wrap leading-relaxed">
                      {c.text}
                    </p>
                  )}

                  {/* Voice Note Player if comment contains voice */}
                  {c.voiceUrl && (
                    <VoiceCommentPlayer voiceUrl={c.voiceUrl} duration={c.voiceDuration} />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-[var(--mu)]">
              <p className="text-sm font-semibold text-[var(--tx)] mb-1">No comments yet</p>
              <p className="text-xs">Share your perspective or leave a quick voice note.</p>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Mic Error / Fallback banner if microphone is unavailable */}
        {micError && (
          <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between gap-2">
            <span className="truncate">{micError}</span>
            <button
              type="button"
              onClick={handleUseDemoVoiceNote}
              className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-semibold text-[11px] shrink-0 hover:opacity-90"
            >
              Use Sample Voice Note
            </button>
          </div>
        )}

        {/* Input & Voice Recording Area */}
        <div className="border-t border-[var(--ln)] bg-[var(--card)] p-3 space-y-2">
          {/* Active Voice Draft Preview Bar */}
          {voiceDraftUrl && !isRecording && (
            <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--ac)]/40 flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="w-7 h-7 rounded-full bg-[var(--ac)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                  aria-label={isPreviewPlaying ? 'Pause draft' : 'Play draft'}
                >
                  {isPreviewPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[var(--ac)]" />
                  <span className="text-xs font-semibold text-[var(--tx)]">
                    Voice Note Ready
                  </span>
                  <span className="text-[11px] text-[var(--mu)]">
                    ({formatDuration(voiceDraftDuration)})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discardDraft}
                  className="p-1 rounded-md text-[var(--mu)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Discard voice note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* If Live Recording is Active */}
          {isRecording ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg)] border border-red-500/50 shadow-inner">
              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div className="text-xs font-bold text-red-500 flex items-center gap-1.5 tabular-nums">
                  <span>Recording...</span>
                  <span>{formatDuration(recordingSeconds)}</span>
                </div>

                {/* Animated sound equalizer bars */}
                <div className="flex items-end gap-0.5 h-4 ml-2">
                  {[40, 80, 55, 95, 65, 40].map((height, i) => (
                    <span
                      key={i}
                      style={{
                        height: `${height}%`,
                        animationDuration: `${0.4 + i * 0.1}s`,
                      }}
                      className="w-1 bg-red-500 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--mu)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Input Bar with Mic button & Send button */
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <img
                src={currentUser.pic}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-[var(--ln)] shrink-0"
              />

              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  voiceDraftUrl
                    ? 'Add an optional text caption…'
                    : 'Add a comment or record voice note…'
                }
                maxLength={300}
                className="flex-1 bg-[var(--bg)] text-[var(--tx)] text-xs sm:text-sm rounded-xl px-3 py-2 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors"
              />

              {/* Mic Button to record voice note */}
              <button
                type="button"
                onClick={startRecording}
                className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  voiceDraftUrl
                    ? 'text-[var(--ac)] hover:bg-[var(--ac)]/10'
                    : 'text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--ln)]/40 active:scale-95'
                }`}
                title="Record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Post Button */}
              <button
                type="submit"
                disabled={(!commentText.trim() && !voiceDraftUrl) || isSubmitting}
                className="px-3 py-2 rounded-xl bg-[var(--ac)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0"
              >
                <span>Post</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
