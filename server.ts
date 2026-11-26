import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Chess } from 'chess.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(express.json({ limit: '15mb' }));

interface NoteItem {
  id: string;
  u: string;
  authorName: string;
  authorPic?: string;
  title?: string;
  body: string;
  image?: string;
  c: number;
  t: number;
  e?: number;
  likes: string[];
  commentsCount: number;
}

interface CommentItem {
  id: string;
  p: string;
  u: string;
  authorName: string;
  authorPic?: string;
  text?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  t: number;
}

interface ProfileItem {
  id: string;
  name: string;
  username?: string;
  pic?: string;
  bio?: string;
  joinedAt?: number;
}

interface ShareItem {
  id: string;
  nid: string;
  from: string;
  to: string;
  fromName: string;
  t: number;
}

interface UserAccount {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

interface DirectMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderPic?: string;
  receiverId: string;
  text?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  chessGameId?: string;
  t: number;
  isRead: boolean;
}

interface ChessGameItem {
  id: string;
  whiteId: string;
  whiteName: string;
  whitePic?: string;
  blackId: string;
  blackName: string;
  blackPic?: string;
  challengerId: string;
  fen: string;
  status: 'waiting' | 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  turn: 'w' | 'b';
  history: string[];
  winnerId?: string;
  lastMove?: { from: string; to: string };
  createdAt: number;
  updatedAt: number;
}

interface NotificationItem {
  id: string;
  userId: string; // recipient
  actorId: string; // actor who triggered event
  actorName: string;
  actorPic?: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'chess';
  noteId?: string;
  chessGameId?: string;
  previewText?: string;
  noteImage?: string;
  isRead: boolean;
  t: number;
}

interface DatabaseSchema {
  notes: NoteItem[];
  comments: CommentItem[];
  profiles: Record<string, ProfileItem>;
  saved: Record<string, string[]>; // userId -> noteIds[]
  shares: ShareItem[];
  follows: Record<string, string[]>; // followerId -> targetUserIds[]
  accounts: Record<string, UserAccount>; // username -> UserAccount
  notifications: NotificationItem[];
  messages: DirectMessageItem[];
  chessGames: Record<string, ChessGameItem>;
}

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff3d6e"/><stop offset="100%" stop-color="%237b2ff7"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><text x="50" y="60" font-family="sans-serif" font-weight="bold" font-size="38" fill="white" text-anchor="middle">N</text></svg>';

const initialProfiles: Record<string, ProfileItem> = {
  u_maya: {
    id: 'u_maya',
    name: 'Maya Lin',
    pic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Curating quiet thoughts, design patterns & morning essays.',
    joinedAt: Date.now() - 86400000 * 14,
  },
  u_liam: {
    id: 'u_liam',
    name: 'Liam Chen',
    pic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Architecture notes, city walks & poetry.',
    joinedAt: Date.now() - 86400000 * 20,
  },
  u_elena: {
    id: 'u_elena',
    name: 'Elena Vance',
    pic: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Minimalism, tea brewing and contemplative reflections.',
    joinedAt: Date.now() - 86400000 * 30,
  },
  u_sofia: {
    id: 'u_sofia',
    name: 'Sofia Ray',
    pic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Color theory, digital crafts & daily observations.',
    joinedAt: Date.now() - 86400000 * 5,
  },
};

const initialNotes: NoteItem[] = [
  {
    id: 'note_1',
    u: 'u_maya',
    authorName: 'Maya Lin',
    authorPic: initialProfiles.u_maya.pic,
    title: 'A morning realization',
    body: 'The most honest thoughts arrive before the world wakes up. Unedited, quiet, and surprisingly kind to who we are trying to become.',
    c: 1, // Sunset gradient
    t: Date.now() - 1000 * 60 * 18,
    likes: ['u_liam', 'u_elena'],
    commentsCount: 2,
  },
  {
    id: 'note_2',
    u: 'u_liam',
    authorName: 'Liam Chen',
    authorPic: initialProfiles.u_liam.pic,
    title: 'Spaces in between',
    body: 'Architecture is not just the stone or glass you erect. It is the breathing room left untouched inside the frame.',
    c: 2, // Violet sunset
    t: Date.now() - 1000 * 60 * 95,
    likes: ['u_maya', 'u_sofia', 'u_elena'],
    commentsCount: 1,
  },
  {
    id: 'note_3',
    u: 'u_elena',
    authorName: 'Elena Vance',
    authorPic: initialProfiles.u_elena.pic,
    title: 'Pocket wisdom',
    body: 'Stop saving your favorite notebook for someday. Write on the first page today. Wear the scent, use the good pen.',
    c: 4, // Emerald sky
    t: Date.now() - 1000 * 60 * 240,
    likes: ['u_maya'],
    commentsCount: 1,
  },
  {
    id: 'note_4',
    u: 'u_sofia',
    authorName: 'Sofia Ray',
    authorPic: initialProfiles.u_sofia.pic,
    title: 'Creative reminder',
    body: 'Give yourself permission to make something imperfect. The friction of starting is always heavier than the joy of finishing.',
    c: 3, // Ocean blue
    t: Date.now() - 1000 * 60 * 60 * 8,
    likes: ['u_liam', 'u_maya'],
    commentsCount: 0,
  },
  {
    id: 'note_5',
    u: 'u_maya',
    authorName: 'Maya Lin',
    authorPic: initialProfiles.u_maya.pic,
    title: 'Three things',
    body: '1. Drinking warm tea without checking my phone.\n2. The golden slant of light on the wooden floor.\n3. Finishing a paragraph that felt true.',
    c: 5, // Amber warm
    t: Date.now() - 1000 * 60 * 60 * 22,
    likes: ['u_elena', 'u_sofia'],
    commentsCount: 1,
  },
  {
    id: 'note_photo_1',
    u: 'u_maya',
    authorName: 'Maya Lin',
    authorPic: initialProfiles.u_maya.pic,
    title: 'Morning sunlight & black coffee',
    body: 'The sun hitting the desk at just the right angle before the bustle starts.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80',
    c: 0,
    t: Date.now() - 1000 * 60 * 60 * 3,
    likes: ['u_liam', 'u_sofia'],
    commentsCount: 1,
  },
  {
    id: 'note_photo_2',
    u: 'u_liam',
    authorName: 'Liam Chen',
    authorPic: initialProfiles.u_liam.pic,
    title: 'Monolithic arches',
    body: 'Brutalist concrete and soft coastal shadows.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80',
    c: 0,
    t: Date.now() - 1000 * 60 * 60 * 15,
    likes: ['u_maya'],
    commentsCount: 0,
  },
];

const initialComments: CommentItem[] = [
  {
    id: 'cmt_1',
    p: 'note_1',
    u: 'u_liam',
    authorName: 'Liam Chen',
    authorPic: initialProfiles.u_liam.pic,
    text: 'So deeply true. That first hour has a stillness nothing else matches.',
    t: Date.now() - 1000 * 60 * 12,
  },
  {
    id: 'cmt_2',
    p: 'note_1',
    u: 'u_elena',
    authorName: 'Elena Vance',
    authorPic: initialProfiles.u_elena.pic,
    text: 'Needed this reminder today ✨',
    t: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'cmt_3',
    p: 'note_2',
    u: 'u_sofia',
    authorName: 'Sofia Ray',
    authorPic: initialProfiles.u_sofia.pic,
    text: 'Love the phrasing: "breathing room left untouched".',
    t: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'cmt_4',
    p: 'note_3',
    u: 'u_maya',
    authorName: 'Maya Lin',
    authorPic: initialProfiles.u_maya.pic,
    text: 'Opening my linen journal right now because of this.',
    t: Date.now() - 1000 * 60 * 150,
  },
  {
    id: 'cmt_5',
    p: 'note_5',
    u: 'u_elena',
    authorName: 'Elena Vance',
    authorPic: initialProfiles.u_elena.pic,
    text: 'Number 3 is the best feeling in the world!',
    t: Date.now() - 1000 * 60 * 60 * 20,
  },
];

const initialFollows: Record<string, string[]> = {
  u_maya: ['u_liam', 'u_elena'],
  u_liam: ['u_maya', 'u_sofia'],
  u_elena: ['u_maya'],
  u_sofia: ['u_maya', 'u_liam'],
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_seed_1',
    userId: 'u_maya',
    actorId: 'u_liam',
    actorName: 'Liam Chen',
    actorPic: initialProfiles.u_liam.pic,
    type: 'like',
    noteId: 'note_1',
    previewText: 'A morning realization',
    isRead: false,
    t: Date.now() - 1000 * 60 * 14,
  },
  {
    id: 'notif_seed_2',
    userId: 'u_maya',
    actorId: 'u_elena',
    actorName: 'Elena Vance',
    actorPic: initialProfiles.u_elena.pic,
    type: 'comment',
    noteId: 'note_1',
    previewText: 'Needed this reminder today ✨',
    isRead: false,
    t: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'notif_seed_3',
    userId: 'u_maya',
    actorId: 'u_sofia',
    actorName: 'Sofia Ray',
    actorPic: initialProfiles.u_sofia.pic,
    type: 'follow',
    isRead: true,
    t: Date.now() - 1000 * 60 * 120,
  },
  {
    id: 'notif_seed_4',
    userId: 'u_maya',
    actorId: 'u_liam',
    actorName: 'Liam Chen',
    actorPic: initialProfiles.u_liam.pic,
    type: 'like',
    noteId: 'note_photo_1',
    previewText: 'Morning sunlight & black coffee',
    noteImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80',
    isRead: false,
    t: Date.now() - 1000 * 60 * 180,
  },
];

const initialMessages: DirectMessageItem[] = [
  {
    id: 'msg_seed_1',
    senderId: 'u_maya',
    senderName: 'Maya Lin',
    senderPic: initialProfiles.u_maya.pic,
    receiverId: 'u_liam',
    text: 'Loved your new note on architectural spaces!',
    t: Date.now() - 1000 * 60 * 50,
    isRead: true,
  },
  {
    id: 'msg_seed_2',
    senderId: 'u_liam',
    senderName: 'Liam Chen',
    senderPic: initialProfiles.u_liam.pic,
    receiverId: 'u_maya',
    text: 'Thank you Maya! Up for a quick chess challenge today?',
    t: Date.now() - 1000 * 60 * 30,
    isRead: false,
    chessGameId: 'chess_demo_1',
  },
];

const initialChessGames: Record<string, ChessGameItem> = {
  chess_demo_1: {
    id: 'chess_demo_1',
    whiteId: 'u_liam',
    whiteName: 'Liam Chen',
    whitePic: initialProfiles.u_liam.pic,
    blackId: 'u_maya',
    blackName: 'Maya Lin',
    blackPic: initialProfiles.u_maya.pic,
    challengerId: 'u_liam',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    status: 'in_progress',
    turn: 'w',
    history: ['e4', 'e5'],
    lastMove: { from: 'e7', to: 'e5' },
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 25,
  },
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_notes_salt_2026').digest('hex');
}

const initialAccounts: Record<string, UserAccount> = {
  maya: {
    id: 'u_maya',
    username: 'maya',
    name: 'Maya Lin',
    passwordHash: hashPassword('maya123'),
    createdAt: Date.now() - 86400000 * 14,
  },
  liam: {
    id: 'u_liam',
    username: 'liam',
    name: 'Liam Chen',
    passwordHash: hashPassword('liam123'),
    createdAt: Date.now() - 86400000 * 20,
  },
  elena: {
    id: 'u_elena',
    username: 'elena',
    name: 'Elena Vance',
    passwordHash: hashPassword('elena123'),
    createdAt: Date.now() - 86400000 * 30,
  },
  sofia: {
    id: 'u_sofia',
    username: 'sofia',
    name: 'Sofia Ray',
    passwordHash: hashPassword('sofia123'),
    createdAt: Date.now() - 86400000 * 5,
  },
};

let db: DatabaseSchema = {
  notes: initialNotes,
  comments: initialComments,
  profiles: initialProfiles,
  saved: {
    u_maya: ['note_2', 'note_3'],
    u_liam: ['note_1'],
  },
  shares: [],
  follows: initialFollows,
  accounts: initialAccounts,
  notifications: initialNotifications,
  messages: initialMessages,
  chessGames: initialChessGames,
};

// Persistence helpers
function loadDatabase() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.notes) && parsed.notes.length > 0) {
        // Ensure photo notes exist if missing from prior seeds
        const hasPhotos = parsed.notes.some((n: any) => Boolean(n.image));
        const finalNotes = hasPhotos
          ? parsed.notes
          : [
              ...parsed.notes,
              {
                id: 'note_photo_1',
                u: 'u_maya',
                authorName: 'Maya Lin',
                authorPic: initialProfiles.u_maya.pic,
                title: 'Morning sunlight & black coffee',
                body: 'The sun hitting the desk at just the right angle before the bustle starts.',
                image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80',
                c: 0,
                t: Date.now() - 1000 * 60 * 60 * 3,
                likes: ['u_liam', 'u_sofia'],
                commentsCount: 1,
              },
              {
                id: 'note_photo_2',
                u: 'u_liam',
                authorName: 'Liam Chen',
                authorPic: initialProfiles.u_liam.pic,
                title: 'Monolithic arches',
                body: 'Brutalist concrete and soft coastal shadows.',
                image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80',
                c: 0,
                t: Date.now() - 1000 * 60 * 60 * 15,
                likes: ['u_maya'],
                commentsCount: 0,
              },
            ];

        db = {
          notes: finalNotes,
          comments: parsed.comments || [],
          profiles: { ...initialProfiles, ...(parsed.profiles || {}) },
          saved: parsed.saved || {},
          shares: parsed.shares || [],
          follows: parsed.follows || initialFollows,
          accounts: parsed.accounts || initialAccounts,
          notifications: Array.isArray(parsed.notifications) && parsed.notifications.length > 0
            ? parsed.notifications
            : [...initialNotifications],
          messages: Array.isArray(parsed.messages) ? parsed.messages : [...initialMessages],
          chessGames: parsed.chessGames && typeof parsed.chessGames === 'object' ? parsed.chessGames : { ...initialChessGames },
        };
        saveDatabase();
      } else {
        saveDatabase();
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
}

function saveDatabase() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

loadDatabase();

// --- REST API ROUTES ---

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), notesCount: db.notes.length });
});

// GET all notes
app.get('/api/notes', (_req, res) => {
  // Sort newest first
  const sorted = [...db.notes].sort((a, b) => b.t - a.t);
  res.json(sorted);
});

// POST new note
app.post('/api/notes', (req, res) => {
  const { u, authorName, authorPic, title, body, c, image } = req.body;
  if (!body || !body.trim()) {
    res.status(400).json({ error: 'Note body is required' });
    return;
  }

  const userId = u || 'user_guest';
  const name = authorName || (db.profiles[userId]?.name || 'Writer');
  const pic = authorPic || (db.profiles[userId]?.pic || DEFAULT_AVATAR);

  // Auto-record profile if new
  if (!db.profiles[userId]) {
    db.profiles[userId] = {
      id: userId,
      name,
      pic,
      joinedAt: Date.now(),
    };
  }

  const newNote: NoteItem = {
    id: 'n_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    u: userId,
    authorName: name,
    authorPic: pic,
    title: (title || '').trim(),
    body: body.trim(),
    image: image ? String(image).trim() : undefined,
    c: typeof c === 'number' ? c : 1,
    t: Date.now(),
    likes: [],
    commentsCount: 0,
  };

  db.notes.unshift(newNote);
  saveDatabase();

  res.status(201).json(newNote);
});

// PUT update note
app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { title, body, c, image } = req.body;

  const noteIndex = db.notes.findIndex((n) => n.id === id);
  if (noteIndex === -1) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  const note = db.notes[noteIndex];
  if (title !== undefined) note.title = title.trim();
  if (body !== undefined) note.body = body.trim();
  if (typeof c === 'number') note.c = c;
  if (image !== undefined) note.image = image ? String(image).trim() : undefined;
  note.e = 1;

  saveDatabase();
  res.json(note);
});

// DELETE note
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const prevLen = db.notes.length;
  db.notes = db.notes.filter((n) => n.id !== id);

  if (db.notes.length === prevLen) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  // Also remove associated comments
  db.comments = db.comments.filter((c) => c.p !== id);

  // Remove from saved
  for (const userId in db.saved) {
    db.saved[userId] = db.saved[userId].filter((nid) => nid !== id);
  }

  // Remove shares
  db.shares = db.shares.filter((s) => s.nid !== id);

  saveDatabase();
  res.json({ success: true, id });
});

// POST toggle like
app.post('/api/notes/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const note = db.notes.find((n) => n.id === id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  const idx = note.likes.indexOf(userId);
  let liked = false;
  if (idx >= 0) {
    note.likes.splice(idx, 1);
    liked = false;
  } else {
    note.likes.push(userId);
    liked = true;

    // Trigger notification if liking someone else's post
    if (note.u !== userId) {
      const actor = db.profiles[userId];
      const notif: NotificationItem = {
        id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        userId: note.u,
        actorId: userId,
        actorName: actor?.name || 'Someone',
        actorPic: actor?.pic || DEFAULT_AVATAR,
        type: 'like',
        noteId: note.id,
        previewText: note.title || (note.body ? note.body.slice(0, 50) : (note.image ? 'Photo' : 'Note')),
        noteImage: note.image,
        isRead: false,
        t: Date.now(),
      };
      if (!Array.isArray(db.notifications)) db.notifications = [];
      db.notifications.unshift(notif);
    }
  }

  saveDatabase();
  res.json({ liked, likes: note.likes, count: note.likes.length });
});

// GET comments for note
app.get('/api/notes/:id/comments', (req, res) => {
  const { id } = req.params;
  const noteComments = db.comments
    .filter((c) => c.p === id)
    .sort((a, b) => a.t - b.t);
  res.json(noteComments);
});

// POST new comment
// POST new comment (text and/or voice note)
app.post('/api/notes/:id/comments', (req, res) => {
  const { id } = req.params;
  const { u, authorName, authorPic, text, voiceUrl, voiceDuration } = req.body;

  const hasText = Boolean(text && text.trim());
  const hasVoice = Boolean(voiceUrl);

  if (!hasText && !hasVoice) {
    res.status(400).json({ error: 'Comment text or voice note is required' });
    return;
  }

  const note = db.notes.find((n) => n.id === id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  const userId = u || 'guest_user';
  const name = authorName || (db.profiles[userId]?.name || 'Reader');
  const pic = authorPic || (db.profiles[userId]?.pic || DEFAULT_AVATAR);

  const comment: CommentItem = {
    id: 'cmt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    p: id,
    u: userId,
    authorName: name,
    authorPic: pic,
    text: (text || '').trim(),
    voiceUrl: voiceUrl || undefined,
    voiceDuration: voiceDuration ? Number(voiceDuration) : undefined,
    t: Date.now(),
  };

  db.comments.push(comment);
  note.commentsCount = db.comments.filter((c) => c.p === id).length;

  // Trigger notification if commenter is not post author
  if (note.u !== userId) {
    const preview =
      hasVoice && !hasText
        ? '🎙️ Sent a voice note'
        : hasVoice && hasText
        ? `🎙️ ${text.trim().slice(0, 50)}`
        : text.trim().slice(0, 60);

    const notif: NotificationItem = {
      id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: note.u,
      actorId: userId,
      actorName: name,
      actorPic: pic,
      type: 'comment',
      noteId: note.id,
      previewText: preview,
      noteImage: note.image,
      isRead: false,
      t: Date.now(),
    };
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.unshift(notif);
  }

  saveDatabase();
  res.status(201).json(comment);
});

// GET all profiles
app.get('/api/profiles', (_req, res) => {
  res.json(Object.values(db.profiles));
});

// GET specific profile
app.get('/api/profiles/:id', (req, res) => {
  const { id } = req.params;
  const profile = db.profiles[id];
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json(profile);
});

// POST update profile
app.post('/api/profiles', (req, res) => {
  const { id, name, pic, bio } = req.body;
  if (!id || !name || !name.trim()) {
    res.status(400).json({ error: 'id and name are required' });
    return;
  }

  const existing = db.profiles[id] || { id, joinedAt: Date.now() };
  const updated: ProfileItem = {
    ...existing,
    name: name.trim(),
    pic: pic || existing.pic || DEFAULT_AVATAR,
    bio: bio !== undefined ? bio.trim() : existing.bio,
  };

  db.profiles[id] = updated;

  // Also sync existing authorName / authorPic across their notes and comments
  for (const n of db.notes) {
    if (n.u === id) {
      n.authorName = updated.name;
      if (updated.pic) n.authorPic = updated.pic;
    }
  }
  for (const c of db.comments) {
    if (c.u === id) {
      c.authorName = updated.name;
      if (updated.pic) c.authorPic = updated.pic;
    }
  }

  saveDatabase();
  res.json(updated);
});

// GET saved note IDs for user
app.get('/api/saved/:userId', (req, res) => {
  const { userId } = req.params;
  const saved = db.saved[userId] || [];
  res.json(saved);
});

// POST toggle saved
app.post('/api/saved', (req, res) => {
  const { userId, noteId } = req.body;
  if (!userId || !noteId) {
    res.status(400).json({ error: 'userId and noteId are required' });
    return;
  }

  if (!db.saved[userId]) {
    db.saved[userId] = [];
  }

  const idx = db.saved[userId].indexOf(noteId);
  let saved = false;
  if (idx >= 0) {
    db.saved[userId].splice(idx, 1);
    saved = false;
  } else {
    db.saved[userId].unshift(noteId);
    saved = true;
  }

  saveDatabase();
  res.json({ saved, savedIds: db.saved[userId] });
});

// GET shares for user
app.get('/api/shares/:userId', (req, res) => {
  const { userId } = req.params;
  const shares = db.shares
    .filter((s) => s.to === userId)
    .sort((a, b) => b.t - a.t);
  res.json(shares);
});

// POST create share
app.post('/api/shares', (req, res) => {
  const { nid, from, to, fromName } = req.body;
  if (!nid || !from || !to) {
    res.status(400).json({ error: 'nid, from and to are required' });
    return;
  }

  const newShare: ShareItem = {
    id: 'sh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    nid,
    from,
    to,
    fromName: fromName || db.profiles[from]?.name || 'Someone',
    t: Date.now(),
  };

  db.shares.unshift(newShare);
  saveDatabase();

  res.status(201).json(newShare);
});

// GET follow lists for user
app.get('/api/follows/:userId', (req, res) => {
  const { userId } = req.params;
  const following = db.follows[userId] || [];
  const followers = Object.keys(db.follows).filter((id) =>
    (db.follows[id] || []).includes(userId)
  );
  res.json({ following, followers });
});

// POST toggle follow
app.post('/api/follows', (req, res) => {
  const { followerId, targetUserId } = req.body;
  if (!followerId || !targetUserId) {
    res.status(400).json({ error: 'followerId and targetUserId are required' });
    return;
  }
  if (followerId === targetUserId) {
    res.status(400).json({ error: 'Cannot follow yourself' });
    return;
  }

  if (!db.follows[followerId]) {
    db.follows[followerId] = [];
  }

  const idx = db.follows[followerId].indexOf(targetUserId);
  let isFollowing = false;
  if (idx >= 0) {
    db.follows[followerId].splice(idx, 1);
    isFollowing = false;
  } else {
    db.follows[followerId].push(targetUserId);
    isFollowing = true;

    // Trigger notification
    const followerProfile = db.profiles[followerId];
    const notif: NotificationItem = {
      id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: targetUserId,
      actorId: followerId,
      actorName: followerProfile?.name || 'Someone',
      actorPic: followerProfile?.pic || DEFAULT_AVATAR,
      type: 'follow',
      isRead: false,
      t: Date.now(),
    };
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.unshift(notif);
  }

  saveDatabase();

  const following = db.follows[followerId] || [];
  const targetFollowers = Object.keys(db.follows).filter((id) =>
    (db.follows[id] || []).includes(targetUserId)
  );

  res.json({ isFollowing, following, targetFollowers });
});

// GET user network (full profile objects for followers and following)
app.get('/api/network/:userId', (req, res) => {
  const { userId } = req.params;
  const followingIds = db.follows[userId] || [];
  const followerIds = Object.keys(db.follows).filter((id) =>
    (db.follows[id] || []).includes(userId)
  );

  const followingProfiles = followingIds
    .map((id) => db.profiles[id])
    .filter(Boolean);
  const followerProfiles = followerIds
    .map((id) => db.profiles[id])
    .filter(Boolean);

  res.json({ followingProfiles, followerProfiles });
});

// POST auth register (create account with password)
app.post('/api/auth/register', (req, res) => {
  const { username, name, password, pic, bio } = req.body;
  if (!username || !username.trim()) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (!password || password.length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters long' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
  if (!cleanUsername) {
    res.status(400).json({ error: 'Invalid username format (letters, numbers, _ only)' });
    return;
  }

  if (db.accounts[cleanUsername]) {
    res.status(409).json({ error: 'Username is already taken' });
    return;
  }

  const userId = 'u_' + cleanUsername + '_' + Math.random().toString(36).substring(2, 6);
  const newAccount: UserAccount = {
    id: userId,
    username: cleanUsername,
    name: name.trim(),
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };

  const newProfile: ProfileItem = {
    id: userId,
    name: name.trim(),
    username: cleanUsername,
    pic: pic || DEFAULT_AVATAR,
    bio: (bio || '').trim(),
    joinedAt: Date.now(),
  };

  db.accounts[cleanUsername] = newAccount;
  db.profiles[userId] = newProfile;
  if (!db.follows[userId]) db.follows[userId] = [];

  saveDatabase();

  res.status(201).json({
    user: newProfile,
    token: userId,
  });
});

// POST auth login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const account = db.accounts[cleanUsername];
  if (!account) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const inputHash = hashPassword(password);
  if (account.passwordHash !== inputHash) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const profile = db.profiles[account.id] || {
    id: account.id,
    name: account.name,
    username: account.username,
    pic: DEFAULT_AVATAR,
  };

  res.json({
    user: profile,
    token: account.id,
  });
});

// GET registered accounts for quick demonstration
app.get('/api/auth/accounts', (_req, res) => {
  const list = Object.values(db.accounts).map((acc) => ({
    id: acc.id,
    username: acc.username,
    name: acc.name,
    pic: db.profiles[acc.id]?.pic || DEFAULT_AVATAR,
  }));
  res.json(list);
});

// GET notifications for user
app.get('/api/notifications', (req, res) => {
  const userId = (req.query.u as string) || '';
  if (!userId) {
    res.json([]);
    return;
  }
  let userNotifs = (db.notifications || [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.t - a.t);

  // If user has zero notifications, seed a welcome follow notification from Maya Lin
  if (userNotifs.length === 0) {
    const welcomeNotif: NotificationItem = {
      id: 'notif_welcome_' + Date.now().toString(36),
      userId,
      actorId: 'u_maya',
      actorName: 'Maya Lin',
      actorPic: initialProfiles.u_maya.pic,
      type: 'follow',
      isRead: false,
      t: Date.now() - 1000 * 60 * 5,
    };
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.unshift(welcomeNotif);
    saveDatabase();
    userNotifs = [welcomeNotif];
  }

  res.json(userNotifs);
});

// PATCH mark notification as read
app.patch('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = (db.notifications || []).find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    saveDatabase();
    res.json(notif);
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// POST mark all notifications as read for user
app.post('/api/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  let count = 0;
  for (const n of db.notifications || []) {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      count++;
    }
  }
  saveDatabase();
  res.json({ success: true, count });
});

// POST simulate notification (helpful for interactive testing)
app.post('/api/notifications/simulate', (req, res) => {
  const { userId, type } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const sampleActors = [
    initialProfiles.u_liam,
    initialProfiles.u_elena,
    initialProfiles.u_sofia,
  ];
  const actor = sampleActors[Math.floor(Math.random() * sampleActors.length)];
  const userNotes = (db.notes || []).filter((n) => n.u === userId);
  const targetNote = userNotes[0] || db.notes[0];
  const selectedType = type || (['like', 'comment', 'follow'] as const)[Math.floor(Math.random() * 3)];

  const notif: NotificationItem = {
    id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    userId,
    actorId: actor.id,
    actorName: actor.name,
    actorPic: actor.pic,
    type: selectedType,
    noteId: selectedType !== 'follow' ? targetNote?.id : undefined,
    previewText:
      selectedType === 'like'
        ? targetNote?.title || 'your recent post'
        : selectedType === 'comment'
        ? 'Loved this thought so much! ✨'
        : undefined,
    noteImage: selectedType !== 'follow' ? targetNote?.image : undefined,
    isRead: false,
    t: Date.now(),
  };

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(notif);
  saveDatabase();
  res.status(201).json(notif);
});

// ==========================================
// DIRECT MESSAGES ENDPOINTS
// ==========================================

// GET all messages involving userId
app.get('/api/messages', (req, res) => {
  const userId = (req.query.userId as string) || '';
  if (!userId) {
    res.json([]);
    return;
  }
  const userMessages = (db.messages || []).filter(
    (m) => m.senderId === userId || m.receiverId === userId
  );

  // If user has zero messages with Maya, seed a welcoming message + chess challenge from Maya Lin!
  if (userMessages.length === 0 && userId !== 'u_maya') {
    const welcomeGameId = 'chess_' + Date.now().toString(36);
    const welcomeGame: ChessGameItem = {
      id: welcomeGameId,
      whiteId: 'u_maya',
      whiteName: 'Maya Lin',
      whitePic: initialProfiles.u_maya.pic,
      blackId: userId,
      blackName: db.profiles[userId]?.name || 'You',
      blackPic: db.profiles[userId]?.pic || DEFAULT_AVATAR,
      challengerId: 'u_maya',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      status: 'in_progress',
      turn: 'w',
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (!db.chessGames) db.chessGames = {};
    db.chessGames[welcomeGameId] = welcomeGame;

    const welcomeMsg: DirectMessageItem = {
      id: 'msg_' + Date.now().toString(36),
      senderId: 'u_maya',
      senderName: 'Maya Lin',
      senderPic: initialProfiles.u_maya.pic,
      receiverId: userId,
      text: 'Hey! Loved your micro-reflections. Would you like to play a chess match with me?',
      chessGameId: welcomeGameId,
      t: Date.now(),
      isRead: false,
    };
    if (!Array.isArray(db.messages)) db.messages = [];
    db.messages.push(welcomeMsg);
    saveDatabase();
    userMessages.push(welcomeMsg);
  }

  res.json(userMessages.sort((a, b) => a.t - b.t));
});

// GET thread between user1 and user2
app.get('/api/messages/thread', (req, res) => {
  const user1 = (req.query.user1 as string) || '';
  const user2 = (req.query.user2 as string) || '';
  if (!user1 || !user2) {
    res.json([]);
    return;
  }
  const thread = (db.messages || []).filter(
    (m) =>
      (m.senderId === user1 && m.receiverId === user2) ||
      (m.senderId === user2 && m.receiverId === user1)
  );
  res.json(thread.sort((a, b) => a.t - b.t));
});

// POST send message
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, text, voiceUrl, voiceDuration, chessGameId } = req.body;
  if (!senderId || !receiverId) {
    res.status(400).json({ error: 'senderId and receiverId are required' });
    return;
  }
  if (!text && !voiceUrl && !chessGameId) {
    res.status(400).json({ error: 'Message content is required' });
    return;
  }

  const sender = db.profiles[senderId];
  const newMsg: DirectMessageItem = {
    id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    senderId,
    senderName: sender?.name || 'Someone',
    senderPic: sender?.pic || DEFAULT_AVATAR,
    receiverId,
    text: text ? text.trim() : undefined,
    voiceUrl: voiceUrl || undefined,
    voiceDuration: voiceDuration ? Number(voiceDuration) : undefined,
    chessGameId: chessGameId || undefined,
    t: Date.now(),
    isRead: false,
  };

  if (!Array.isArray(db.messages)) db.messages = [];
  db.messages.push(newMsg);

  // Trigger notification for recipient
  const notif: NotificationItem = {
    id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    userId: receiverId,
    actorId: senderId,
    actorName: sender?.name || 'Someone',
    actorPic: sender?.pic || DEFAULT_AVATAR,
    type: chessGameId ? 'chess' : 'message',
    chessGameId: chessGameId || undefined,
    previewText:
      chessGameId
        ? 'Challenged you to a game of Chess! ♟️'
        : voiceUrl
        ? 'Sent a voice message 🎙️'
        : text
        ? text.slice(0, 60)
        : 'Sent you a message',
    isRead: false,
    t: Date.now(),
  };

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(notif);

  saveDatabase();
  res.status(201).json(newMsg);
});

// POST mark thread as read
app.post('/api/messages/read', (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    res.status(400).json({ error: 'senderId and receiverId are required' });
    return;
  }

  let count = 0;
  for (const m of db.messages || []) {
    if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
      m.isRead = true;
      count++;
    }
  }

  saveDatabase();
  res.json({ success: true, count });
});

// ==========================================
// CHESS GAME ENDPOINTS
// ==========================================

// GET all chess games for user
app.get('/api/chess/games', (req, res) => {
  const userId = (req.query.userId as string) || '';
  if (!userId) {
    res.json(Object.values(db.chessGames || {}));
    return;
  }
  const games = Object.values(db.chessGames || {}).filter(
    (g) => g.whiteId === userId || g.blackId === userId
  );
  res.json(games.sort((a, b) => b.updatedAt - a.updatedAt));
});

// GET specific chess game
app.get('/api/chess/games/:id', (req, res) => {
  const { id } = req.params;
  const game = (db.chessGames || {})[id];
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json(game);
});

// POST create chess game / challenge
app.post('/api/chess/games', (req, res) => {
  const { challengerId, opponentId, colorPreference } = req.body;
  if (!challengerId || !opponentId) {
    res.status(400).json({ error: 'challengerId and opponentId are required' });
    return;
  }

  const challenger = db.profiles[challengerId];
  const opponent = db.profiles[opponentId];
  if (!challenger || !opponent) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  let isChallengerWhite = true;
  if (colorPreference === 'b') {
    isChallengerWhite = false;
  } else if (colorPreference === 'random') {
    isChallengerWhite = Math.random() >= 0.5;
  }

  const white = isChallengerWhite ? challenger : opponent;
  const black = isChallengerWhite ? opponent : challenger;

  const gameId = 'chess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const newGame: ChessGameItem = {
    id: gameId,
    whiteId: white.id,
    whiteName: white.name,
    whitePic: white.pic,
    blackId: black.id,
    blackName: black.name,
    blackPic: black.pic,
    challengerId,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    status: 'in_progress',
    turn: 'w',
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (!db.chessGames) db.chessGames = {};
  db.chessGames[gameId] = newGame;

  // Post message in chat thread
  const msg: DirectMessageItem = {
    id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    senderId: challengerId,
    senderName: challenger.name,
    senderPic: challenger.pic,
    receiverId: opponentId,
    text: `♟️ Challenged you to Chess! You play as ${isChallengerWhite ? 'Black' : 'White'}.`,
    chessGameId: gameId,
    t: Date.now(),
    isRead: false,
  };
  if (!Array.isArray(db.messages)) db.messages = [];
  db.messages.push(msg);

  // Trigger notification
  const notif: NotificationItem = {
    id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    userId: opponentId,
    actorId: challengerId,
    actorName: challenger.name,
    actorPic: challenger.pic,
    type: 'chess',
    chessGameId: gameId,
    previewText: `Challenged you to Chess! You play as ${isChallengerWhite ? 'Black' : 'White'}.`,
    isRead: false,
    t: Date.now(),
  };
  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(notif);

  saveDatabase();
  res.status(201).json(newGame);
});

// POST make a chess move
app.post('/api/chess/games/:id/move', (req, res) => {
  const { id } = req.params;
  const { from, to, promotion, userId } = req.body;

  const game = (db.chessGames || {})[id];
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  if (game.status !== 'in_progress') {
    res.status(400).json({ error: 'Game is already finished' });
    return;
  }

  const chess = new Chess(game.fen);
  const currentTurn = chess.turn();

  // Validate user turn
  const userColor = game.whiteId === userId ? 'w' : game.blackId === userId ? 'b' : null;
  if (!userColor) {
    res.status(403).json({ error: 'You are not a player in this game' });
    return;
  }
  if (userColor !== currentTurn) {
    res.status(400).json({ error: 'It is not your turn' });
    return;
  }

  try {
    const move = chess.move({
      from,
      to,
      promotion: promotion || 'q',
    });

    if (!move) {
      res.status(400).json({ error: 'Illegal move' });
      return;
    }

    game.fen = chess.fen();
    game.turn = chess.turn();
    game.history.push(move.san);
    game.lastMove = { from, to };
    game.updatedAt = Date.now();

    // Check game over
    if (chess.isCheckmate()) {
      game.status = 'checkmate';
      game.winnerId = userId;
    } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      game.status = chess.isStalemate() ? 'stalemate' : 'draw';
      game.winnerId = undefined;
    } else {
      // Check if opponent is one of the resident bots
      const opponentId = userColor === 'w' ? game.blackId : game.whiteId;
      const residentBots = ['u_maya', 'u_liam', 'u_elena', 'u_sofia'];

      if (residentBots.includes(opponentId) && !chess.isGameOver()) {
        const legalMoves = chess.moves({ verbose: true });
        if (legalMoves.length > 0) {
          const tacticalMoves = legalMoves.filter((m) => m.captured || m.san.includes('+'));
          const selectedMove =
            tacticalMoves.length > 0 && Math.random() > 0.35
              ? tacticalMoves[Math.floor(Math.random() * tacticalMoves.length)]
              : legalMoves[Math.floor(Math.random() * legalMoves.length)];

          const botMoveRes = chess.move({
            from: selectedMove.from,
            to: selectedMove.to,
            promotion: selectedMove.promotion || 'q',
          });

          if (botMoveRes) {
            game.fen = chess.fen();
            game.turn = chess.turn();
            game.history.push(botMoveRes.san);
            game.lastMove = { from: selectedMove.from, to: selectedMove.to };
            game.updatedAt = Date.now();

            if (chess.isCheckmate()) {
              game.status = 'checkmate';
              game.winnerId = opponentId;
            } else if (chess.isDraw() || chess.isStalemate()) {
              game.status = chess.isStalemate() ? 'stalemate' : 'draw';
            }
          }
        }
      }
    }

    saveDatabase();
    res.json(game);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid move' });
  }
});

// POST resign game
app.post('/api/chess/games/:id/resign', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const game = (db.chessGames || {})[id];
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  if (game.whiteId !== userId && game.blackId !== userId) {
    res.status(403).json({ error: 'You are not playing this game' });
    return;
  }

  game.status = 'resigned';
  game.winnerId = game.whiteId === userId ? game.blackId : game.whiteId;
  game.updatedAt = Date.now();

  saveDatabase();
  res.json(game);
});

// POST reset / seed database
app.post('/api/seed', (_req, res) => {
  db = {
    notes: [...initialNotes],
    comments: [...initialComments],
    profiles: { ...initialProfiles },
    saved: {
      u_maya: ['note_2', 'note_3'],
      u_liam: ['note_1'],
    },
    shares: [],
    follows: { ...initialFollows },
    accounts: { ...initialAccounts },
    notifications: [...initialNotifications],
    messages: [...initialMessages],
    chessGames: { ...initialChessGames },
  };
  saveDatabase();
  res.json({ success: true, notes: db.notes.length });
});

// Start Express server and mount Vite in development or static dist in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev server middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mode active for dev');
  } else {
    // In production, serve built frontend
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('Serving static files from', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Notes full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
