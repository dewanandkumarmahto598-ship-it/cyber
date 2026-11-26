import React, { useState, useRef } from 'react';
import { X, Camera, Check } from 'lucide-react';
import { Profile } from '../types';
import { PRESET_AVATARS } from '../utils/helpers';

interface ProfileEditModalProps {
  currentProfile: Profile;
  onSave: (data: { name: string; bio?: string; pic?: string }) => Promise<void>;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  currentProfile,
  onSave,
  onClose,
  onToast,
}) => {
  const [name, setName] = useState(currentProfile.name || '');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [pic, setPic] = useState(currentProfile.pic || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          ctx.drawImage(
            img,
            (img.width - minDim) / 2,
            (img.height - minDim) / 2,
            minDim,
            minDim,
            0,
            0,
            size,
            size
          );
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPic(compressedDataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('Please enter your name');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        name: name.trim(),
        bio: bio.trim(),
        pic,
      });
      onToast('Profile updated');
      onClose();
    } catch {
      onToast('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--ln)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--ln)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
          <div className="w-6" />
          <h3 className="font-bold text-sm text-[var(--tx)]">Edit profile</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Avatar and Change Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={pic}
                alt="Profile preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--ac)] shadow-sm"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Upload custom photo"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-[var(--ac)] hover:underline"
            >
              Upload custom photo
            </button>

            {/* Quick avatar selection */}
            <div className="w-full pt-1">
              <div className="text-[11px] text-center text-[var(--mu)] mb-2 font-medium">
                Or choose from portraits
              </div>
              <div className="flex justify-center gap-2 overflow-x-auto py-1">
                {PRESET_AVATARS.map((avatarUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPic(avatarUrl)}
                    className={`relative rounded-full transition-transform ${
                      pic === avatarUrl ? 'scale-110 ring-2 ring-[var(--ac)]' : 'hover:scale-105 opacity-75'
                    }`}
                  >
                    <img
                      src={avatarUrl}
                      alt={`Avatar option ${idx + 1}`}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    {pic === avatarUrl && (
                      <span className="absolute -bottom-1 -right-1 bg-[var(--ac)] text-white p-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              required
              className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl px-3.5 py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors"
            />
          </div>

          {currentProfile.username && (
            <div>
              <label className="block text-xs font-semibold text-[var(--mu)] mb-1">Username</label>
              <div className="w-full bg-[var(--card)]/60 text-[var(--mu)] text-xs font-mono rounded-xl px-3.5 py-2.5 border border-[var(--ln)]">
                @{currentProfile.username}
              </div>
            </div>
          )}

          {/* Bio input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Bio / Description
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you or your writing…"
              maxLength={160}
              rows={3}
              className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl p-3 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors resize-none"
            />
            <div className="text-right text-[10px] text-[var(--mu)] mt-0.5">{bio.length}/160</div>
          </div>

          {/* Save button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="w-full py-3 rounded-xl bg-[var(--ac)] text-white text-sm font-bold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving profile...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
