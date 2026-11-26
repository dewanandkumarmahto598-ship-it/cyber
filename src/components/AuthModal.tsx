import React, { useState, useRef } from 'react';
import { X, Camera, Lock, User, AtSign, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Profile } from '../types';
import { api } from '../api';
import { PRESET_AVATARS } from '../utils/helpers';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: Profile) => void;
  onToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onToast,
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [pic, setPic] = useState(PRESET_AVATARS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name');
          return;
        }
        if (!username.trim()) {
          setError('Please enter a username');
          return;
        }
        if (!password || password.length < 4) {
          setError('Password must be at least 4 characters');
          return;
        }

        const res = await api.register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          pic,
          bio: bio.trim(),
        });

        onAuthSuccess(res.user);
        onToast(`Welcome to Notes, ${res.user.name}!`);
        onClose();
      } else {
        if (!username.trim() || !password) {
          setError('Please enter your username and password');
          return;
        }

        const res = await api.login({
          username: username.trim().toLowerCase(),
          password,
        });

        onAuthSuccess(res.user);
        onToast(`Signed in as ${res.user.name}`);
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUsername: string, demoPass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.login({
        username: demoUsername,
        password: demoPass,
      });
      onAuthSuccess(res.user);
      onToast(`Switched to ${res.user.name}`);
      onClose();
    } catch {
      setError(`Could not sign in to ${demoUsername}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--bg)] rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--ln)]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--ln)] flex items-center justify-between sticky top-0 bg-[var(--bg)] z-10">
          <div>
            <h3 className="font-bold text-base text-[var(--tx)]">
              {mode === 'signup' ? 'Create an account' : 'Sign in to Notes'}
            </h3>
            <p className="text-xs text-[var(--mu)]">
              {mode === 'signup'
                ? 'Choose your username and password'
                : 'Welcome back to your micro-journal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[var(--ln)] bg-[var(--card)]/40 p-1 mx-4 mt-3 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5">
          {mode === 'signup' && (
            <>
              {/* Profile Picture Upload & Presets */}
              <div className="flex flex-col items-center gap-2 pb-1">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={pic}
                    alt="Profile preview"
                    className="w-18 h-18 rounded-full object-cover border-2 border-[var(--ac)] shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-[var(--ac)] hover:underline"
                  >
                    Upload photo
                  </button>
                  <span className="text-[var(--mu)] text-xs">·</span>
                  <span className="text-xs text-[var(--mu)]">or choose avatar</span>
                </div>

                {/* Avatar presets */}
                <div className="flex gap-2 py-0.5 overflow-x-auto no-scrollbar">
                  {PRESET_AVATARS.slice(0, 5).map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPic(av)}
                      className={`w-7 h-7 rounded-full overflow-hidden transition-all ${
                        pic === av ? 'ring-2 ring-[var(--ac)] scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[var(--mu)] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Rivera"
                    maxLength={40}
                    required
                    className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl pl-9 pr-3 py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Username
            </label>
            <div className="relative flex items-center">
              <AtSign className="w-4 h-4 text-[var(--mu)] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. jordan_r"
                maxLength={30}
                required
                className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl pl-9 pr-3 py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[var(--mu)] absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password (min 4 chars)' : 'Enter your password'}
                maxLength={50}
                required
                className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl pl-9 pr-10 py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-[var(--mu)] hover:text-[var(--tx)] absolute right-2.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
                Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A line about your thoughts, hobbies or perspective…"
                maxLength={120}
                rows={2}
                className="w-full bg-[var(--card)] text-[var(--tx)] text-xs sm:text-sm rounded-xl p-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors resize-none"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[var(--ac)] text-white text-sm font-bold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
            >
              {isLoading
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create My Account'
                : 'Sign In'}
            </button>
          </div>

          {/* Demo account quick login helper */}
          <div className="pt-2 border-t border-[var(--ln)]">
            <div className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--ac)]" />
              Quick demo writer accounts
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { u: 'maya', p: 'maya123', label: 'Maya Lin' },
                { u: 'liam', p: 'liam123', label: 'Liam Chen' },
                { u: 'elena', p: 'elena123', label: 'Elena Vance' },
                { u: 'sofia', p: 'sofia123', label: 'Sofia Ray' },
              ].map((acc) => (
                <button
                  key={acc.u}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.u, acc.p)}
                  className="py-1.5 px-2 rounded-lg bg-[var(--card)] border border-[var(--ln)] hover:border-[var(--ac)] text-left text-[11px] transition-colors"
                >
                  <span className="font-semibold text-[var(--tx)] block">{acc.label}</span>
                  <span className="text-[var(--mu)] text-[10px]">@{acc.u}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
