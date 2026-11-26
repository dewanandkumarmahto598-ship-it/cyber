export interface Note {
  id: string;
  u: string; // author userId
  authorName: string;
  authorPic?: string;
  title?: string;
  body: string;
  image?: string; // photo attached to note
  c: number; // color theme index 0 to 5
  t: number; // created timestamp
  e?: number; // edited flag (1 if edited)
  likes: string[]; // array of userIds who liked
  commentsCount: number;
}

export interface Comment {
  id: string;
  p: string; // note parent id
  u: string; // commenter userId
  authorName: string;
  authorPic?: string;
  text: string;
  voiceUrl?: string; // voice note audio base64 or url
  voiceDuration?: number; // duration in seconds
  t: number;
}

export interface Profile {
  id: string; // userId
  name: string;
  username?: string;
  pic?: string;
  bio?: string;
  joinedAt?: number;
}

export interface Share {
  id: string;
  nid: string; // note id
  from: string; // from userId
  to: string; // to userId
  fromName: string;
  t: number;
}

export interface FollowNetwork {
  following: string[]; // array of user IDs followed by this user
  followers: string[]; // array of user IDs following this user
}

export interface AppNotification {
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

export interface DirectMessage {
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

export type ChessGameStatus =
  | 'waiting'
  | 'in_progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned';

export interface ChessGame {
  id: string;
  whiteId: string;
  whiteName: string;
  whitePic?: string;
  blackId: string;
  blackName: string;
  blackPic?: string;
  challengerId: string;
  fen: string;
  status: ChessGameStatus;
  turn: 'w' | 'b';
  history: string[];
  winnerId?: string;
  lastMove?: { from: string; to: string };
  createdAt: number;
  updatedAt: number;
}

export type TabType = 'home' | 'explore' | 'create' | 'profile';
export type ProfileTab = 'notes' | 'photos' | 'saved' | 'shared';
export type FeedFilter = 'all' | 'following';
export type NetworkListType = 'followers' | 'following';
export type CreateMode = 'note' | 'photo';


