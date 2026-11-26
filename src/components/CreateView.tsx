import React, { useState, useEffect, useRef } from 'react';
import { Note, CreateMode } from '../types';
import { CARD_GRADIENTS, CARD_GRADIENT_NAMES } from '../utils/helpers';
import {
  Sparkles,
  Eye,
  Image as ImageIcon,
  Camera,
  FileText,
  X,
  Upload,
  Check,
  Crop,
  Palette,
  MapPin,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from 'lucide-react';

interface CreateViewProps {
  editingNote?: Note | null;
  initialMode?: CreateMode;
  onSaveNote: (data: { title: string; body: string; c: number; image?: string }) => Promise<void>;
  onCancel: () => void;
  onDeleteNote?: (noteId: string) => void;
  onChangeMode?: (mode: CreateMode) => void;
}

const PRESET_PHOTO_OPTIONS = [
  {
    name: 'Morning Coffee',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900&auto=format&fit=crop&q=80',
    desc: 'Desk & warm morning light',
  },
  {
    name: 'Alpine Mist',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
    desc: 'Mountain lake reflections',
  },
  {
    name: 'Modern Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80',
    desc: 'Clean geometric lines',
  },
  {
    name: 'Linen Journal',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&auto=format&fit=crop&q=80',
    desc: 'Stationery and pen',
  },
  {
    name: 'Golden Coast',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80',
    desc: 'Ocean waves & sand',
  },
  {
    name: 'Urban Night',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=900&auto=format&fit=crop&q=80',
    desc: 'City lights & rainy reflection',
  },
];

type PhotoFilter = 'normal' | 'warm' | 'cool' | 'mono' | 'vintage' | 'vivid';
type AspectRatio = '1:1' | '4:5' | '16:9' | 'auto';

const PHOTO_FILTERS: { id: PhotoFilter; label: string; filterStyle: string }[] = [
  { id: 'normal', label: 'Normal', filterStyle: 'none' },
  { id: 'warm', label: 'Warm', filterStyle: 'sepia(0.25) saturate(1.3) contrast(1.05)' },
  { id: 'cool', label: 'Cool', filterStyle: 'hue-rotate(180deg) saturate(0.85) contrast(1.05)' },
  { id: 'mono', label: 'Noir', filterStyle: 'grayscale(1) contrast(1.2)' },
  { id: 'vintage', label: 'Vintage', filterStyle: 'sepia(0.45) contrast(0.95) brightness(1.05)' },
  { id: 'vivid', label: 'Vivid', filterStyle: 'saturate(1.5) contrast(1.15)' },
];

export const CreateView: React.FC<CreateViewProps> = ({
  editingNote,
  initialMode = 'note',
  onSaveNote,
  onCancel,
  onDeleteNote,
  onChangeMode,
}) => {
  const [mode, setMode] = useState<CreateMode>(() => {
    if (editingNote?.image && !editingNote.title && !editingNote.body) return 'photo';
    return initialMode;
  });

  const [title, setTitle] = useState(editingNote?.title || '');
  const [body, setBody] = useState(editingNote?.body || '');
  const [colorIndex, setColorIndex] = useState(editingNote ? editingNote.c : 1);
  const [rawImage, setRawImage] = useState<string | null>(editingNote?.image || null);
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>('normal');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title || '');
      setBody(editingNote.body || '');
      setColorIndex(editingNote.c);
      setRawImage(editingNote.image || null);
      if (editingNote.image && (!editingNote.body || editingNote.body.length < 50)) {
        setMode('photo');
      }
    } else {
      if (initialMode) setMode(initialMode);
    }
  }, [editingNote, initialMode]);

  const handleModeChange = (newMode: CreateMode) => {
    setMode(newMode);
    onChangeMode?.(newMode);
  };

  const processAndSetImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1200;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        setRawImage(compressed);
      }
    };
    img.src = dataUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processAndSetImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processAndSetImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bake any chosen filter into the final canvas before saving
  const getBakedFinalImage = async (): Promise<string | undefined> => {
    if (!rawImage) return undefined;
    if (selectedFilter === 'normal') return rawImage;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawImage);
          return;
        }

        const filterObj = PHOTO_FILTERS.find((f) => f.id === selectedFilter);
        if (filterObj && filterObj.filterStyle !== 'none') {
          ctx.filter = filterObj.filterStyle;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(rawImage);
      img.src = rawImage;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !rawImage && !title.trim()) return;

    try {
      setIsSubmitting(true);
      const finalImage = await getBakedFinalImage();

      await onSaveNote({
        title: title.trim(),
        body: body.trim(),
        c: colorIndex,
        image: finalImage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGradient = colorIndex > 0 && colorIndex < CARD_GRADIENTS.length;
  const cardBgStyle = isGradient ? { background: CARD_GRADIENTS[colorIndex] } : undefined;

  const currentFilterObj = PHOTO_FILTERS.find((f) => f.id === selectedFilter);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square object-cover';
      case '4:5':
        return 'aspect-[4/5] object-cover';
      case '16:9':
        return 'aspect-[16/9] object-cover';
      default:
        return 'max-h-72 object-cover w-full';
    }
  };

  return (
    <div className="p-4 pb-28 max-w-lg mx-auto">
      {/* Top Segmented Mode Switcher */}
      <div className="flex items-center p-1 bg-[var(--card)] border border-[var(--ln)] rounded-xl mb-4 shadow-xs">
        <button
          type="button"
          onClick={() => handleModeChange('note')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'note'
              ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
              : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Write Note</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('photo')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'photo'
              ? 'bg-[var(--tx)] text-[var(--bg)] shadow-xs'
              : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Post Photo</span>
        </button>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--tx)]">
            {editingNote
              ? 'Edit note'
              : mode === 'photo'
              ? 'Share a Photo'
              : 'New note'}
          </h2>
          <p className="text-xs text-[var(--mu)]">
            {mode === 'photo'
              ? 'Publish photography or visual moments to your profile and feed'
              : 'Write thoughts, reflections, poems or journal entries'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs flex items-center gap-1 text-[var(--mu)] hover:text-[var(--tx)] px-2 py-1 rounded-lg hover:bg-[var(--card)]"
        >
          <Eye className="w-3.5 h-3.5" />
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      {/* Live Preview Card */}
      {showPreview && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--ac)]" />
              Live Preview
            </span>
            {mode === 'photo' && (
              <span className="text-[10px] text-[var(--mu)] lowercase font-normal">
                caption appears below buttons
              </span>
            )}
          </div>

          {mode === 'photo' || rawImage ? (
            /* Photo Post Live Preview */
            <div className="rounded-2xl border border-[var(--ln)] bg-[var(--card)] overflow-hidden shadow-sm">
              {/* Clean Photo Container */}
              <div className="w-full bg-black/10 flex items-center justify-center overflow-hidden">
                {rawImage ? (
                  <img
                    src={rawImage}
                    alt="Live Preview"
                    style={{ filter: currentFilterObj?.filterStyle || 'none' }}
                    className={`w-full transition-all duration-300 ${getAspectClass()}`}
                  />
                ) : (
                  <div className="py-12 px-4 text-center">
                    <Camera className="w-8 h-8 text-[var(--mu)] mx-auto mb-2 opacity-50" />
                    <span className="text-xs text-[var(--mu)] font-medium">
                      Select or take a photo below to preview
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Mock */}
              <div className="flex items-center justify-between px-3 pt-2.5">
                <div className="flex items-center gap-2 text-[var(--tx)]">
                  <Heart className="w-5 h-5 hover:text-[var(--ac)] cursor-pointer" />
                  <MessageCircle className="w-5 h-5 cursor-pointer" />
                  <Send className="w-5 h-5 cursor-pointer" />
                </div>
                <Bookmark className="w-5 h-5 text-[var(--tx)] cursor-pointer" />
              </div>

              {/* Likes & Captions below buttons */}
              <div className="p-3 pt-1.5 space-y-1">
                <div className="text-xs font-bold text-[var(--tx)]">0 likes</div>
                {title && (
                  <div className="font-bold text-sm text-[var(--tx)] leading-tight">
                    {title}
                  </div>
                )}
                {body ? (
                  <div className="text-xs sm:text-sm text-[var(--tx)] whitespace-pre-wrap break-words leading-relaxed">
                    <span className="font-bold mr-1.5">You</span>
                    <span>{body}</span>
                  </div>
                ) : !title && (
                  <p className="text-xs text-[var(--mu)] italic">
                    Caption will appear here below the action buttons
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Note Post Live Preview */
            <div
              style={cardBgStyle}
              className={`min-h-[160px] rounded-2xl flex flex-col justify-center items-center text-center shadow-sm border transition-all overflow-hidden ${
                isGradient
                  ? 'text-white border-transparent'
                  : 'bg-[var(--card)] text-[var(--tx)] border-[var(--ln)]'
              }`}
            >
              <div className="p-4 flex flex-col justify-center items-center w-full">
                {title ? (
                  <h3 className="text-base sm:text-lg font-bold mb-1 leading-tight drop-shadow-sm">
                    {title}
                  </h3>
                ) : null}
                {body ? (
                  <p className="text-sm font-normal whitespace-pre-wrap break-words max-w-xs drop-shadow-sm opacity-95">
                    {body}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--mu)] italic">Write note content to preview</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PHOTO-FIRST MODE: Prominent Photo Picker */}
        {mode === 'photo' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--mu)]">
              Choose or Take Photo
            </label>

            {rawImage ? (
              <div className="space-y-3">
                {/* Active Photo Container */}
                <div className="relative rounded-2xl overflow-hidden border border-[var(--ln)] bg-black/5 group">
                  <img
                    src={rawImage}
                    alt="Uploaded"
                    style={{ filter: currentFilterObj?.filterStyle || 'none' }}
                    className={`w-full ${getAspectClass()}`}
                  />

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      Change photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setRawImage(null)}
                      className="p-1 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors backdrop-blur-sm"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio Buttons */}
                <div>
                  <div className="text-[11px] font-semibold text-[var(--mu)] mb-1 flex items-center gap-1">
                    <Crop className="w-3 h-3 text-[var(--ac)]" />
                    <span>Framing & Aspect Ratio</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['auto', '1:1', '4:5', '16:9'] as AspectRatio[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAspectRatio(r)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          aspectRatio === r
                            ? 'bg-[var(--tx)] text-[var(--bg)] border-[var(--tx)] shadow-xs'
                            : 'bg-[var(--card)] text-[var(--mu)] border-[var(--ln)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {r === 'auto' ? 'Natural' : r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Filter Styles */}
                <div>
                  <div className="text-[11px] font-semibold text-[var(--mu)] mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-[var(--ac)]" />
                    <span>Photo Filter Preset</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {PHOTO_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 flex items-center gap-1 transition-all ${
                          selectedFilter === f.id
                            ? 'bg-[var(--ac)] text-white border-[var(--ac)] shadow-xs'
                            : 'bg-[var(--card)] text-[var(--tx)] border-[var(--ln)] hover:border-[var(--ac)]'
                        }`}
                      >
                        {selectedFilter === f.id && <Check className="w-3 h-3" />}
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-[var(--ac)] bg-[var(--ac)]/10 scale-[0.99]'
                      : 'border-[var(--ln)] bg-[var(--card)] hover:border-[var(--ac)] hover:bg-[var(--ac)]/5'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--ac)]/10 text-[var(--ac)] flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[var(--tx)] block">
                      Click to upload photo
                    </span>
                    <span className="text-xs text-[var(--mu)] block mt-0.5">
                      Or drag and drop photo file here (JPG, PNG, WEBP)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--ac)] underline mt-1">
                    Browse from files or camera
                  </span>
                </div>

                {/* Sample Presets */}
                <div>
                  <div className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider mb-2">
                    Or select an aesthetic sample photo:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_PHOTO_OPTIONS.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRawImage(item.url)}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--ln)] hover:border-[var(--ac)] transition-all text-left"
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-1.5">
                          <span className="text-[11px] font-bold text-white leading-tight line-clamp-1">
                            {item.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Title / Location Input */}
        <div>
          <label htmlFor="note-title" className="block text-xs font-semibold text-[var(--mu)] mb-1">
            {mode === 'photo' ? 'Photo Title or Location (Optional)' : 'Title (Optional)'}
          </label>
          <div className="relative flex items-center">
            {mode === 'photo' && (
              <MapPin className="w-4 h-4 text-[var(--mu)] absolute left-3 pointer-events-none" />
            )}
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === 'photo'
                  ? 'e.g. Sunset in Malibu, Studio Coffee, Paris...'
                  : 'Give your note a title...'
              }
              maxLength={80}
              className={`w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl py-2.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors ${
                mode === 'photo' ? 'pl-9 pr-3.5' : 'px-3.5'
              }`}
            />
          </div>
          <div className="text-right text-[10px] text-[var(--mu)] mt-0.5">{title.length}/80</div>
        </div>

        {/* Caption / Note Content Input */}
        <div>
          <label htmlFor="note-body" className="block text-xs font-semibold text-[var(--mu)] mb-1">
            {mode === 'photo' ? 'Caption' : 'Note Content'}
          </label>
          <textarea
            id="note-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              mode === 'photo'
                ? 'Write a caption, tell the story behind this shot, or add hashtags...'
                : 'Write your reflection, poetry, journal entry or thought…'
            }
            maxLength={2000}
            rows={mode === 'photo' ? 3 : 4}
            required={mode === 'note' && !rawImage}
            className="w-full bg-[var(--card)] text-[var(--tx)] text-sm rounded-xl p-3.5 border border-[var(--ln)] outline-none focus:border-[var(--ac)] transition-colors resize-y min-h-[90px]"
          />
          <div className="text-right text-[10px] text-[var(--mu)] mt-0.5">{body.length}/2000</div>
        </div>

        {/* NOTE MODE: Quick Attachment Section */}
        {mode === 'note' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--mu)] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[var(--ac)]" />
                <span>Attach Picture to Note</span>
              </label>
              {rawImage && (
                <button
                  type="button"
                  onClick={() => setRawImage(null)}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove picture</span>
                </button>
              )}
            </div>

            {rawImage ? (
              <div className="relative rounded-xl overflow-hidden border border-[var(--ln)] group mb-2">
                <img src={rawImage} alt="Selected attachment" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white font-medium text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Change picture
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-[var(--ln)] hover:border-[var(--ac)] bg-[var(--card)] hover:bg-[var(--ac)]/5 text-xs font-semibold text-[var(--tx)] flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-[var(--ac)]" />
                  <span>Choose photo from device</span>
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <span className="text-[10px] text-[var(--mu)] shrink-0 font-medium mr-1">
                    Presets:
                  </span>
                  {PRESET_PHOTO_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRawImage(opt.url)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--ln)] hover:border-[var(--ac)] text-[10px] text-[var(--tx)] shrink-0"
                    >
                      <img src={opt.url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      <span>{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Card Palette Buttons */}
        <div>
          <label className="block text-xs font-semibold text-[var(--mu)] mb-2">
            Card Palette: <span className="text-[var(--tx)] font-medium">{CARD_GRADIENT_NAMES[colorIndex]}</span>
          </label>
          <div className="flex items-center gap-3 py-1">
            {CARD_GRADIENTS.map((grad, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setColorIndex(idx)}
                title={CARD_GRADIENT_NAMES[idx]}
                className={`w-9 h-9 rounded-full transition-transform border-2 relative ${
                  colorIndex === idx
                    ? 'scale-110 border-[var(--tx)] ring-2 ring-[var(--bg)] shadow-md'
                    : 'border-black/10 hover:scale-105'
                }`}
                style={{
                  background: idx === 0 ? 'var(--card)' : grad,
                }}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={(!body.trim() && !rawImage && !title.trim()) || isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-[var(--ac)] hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : editingNote ? (
              <span>Save Changes</span>
            ) : mode === 'photo' ? (
              <>
                <Camera className="w-4 h-4" />
                <span>Publish Photo</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Post Note</span>
              </>
            )}
          </button>

          {editingNote && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--card)] transition-colors"
              >
                Cancel
              </button>

              {onDeleteNote && (
                <button
                  type="button"
                  onClick={() => onDeleteNote(editingNote.id)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Delete note
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};
