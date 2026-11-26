import { Note, Comment, Profile, Share, AppNotification, DirectMessage, ChessGame } from './types';

export const api = {
  async getNotes(): Promise<Note[]> {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  async createNote(data: {
    u: string;
    authorName: string;
    authorPic?: string;
    title?: string;
    body: string;
    image?: string;
    c: number;
  }): Promise<Note> {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },

  async updateNote(
    id: string,
    updates: { title?: string; body?: string; c?: number; image?: string }
  ): Promise<Note> {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },

  async deleteNote(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  },

  async toggleLike(
    id: string,
    userId: string
  ): Promise<{ liked: boolean; likes: string[]; count: number }> {
    const res = await fetch(`/api/notes/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to toggle like');
    return res.json();
  },

  async getComments(noteId: string): Promise<Comment[]> {
    const res = await fetch(`/api/notes/${noteId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async addComment(
    noteId: string,
    data: {
      u: string;
      authorName: string;
      authorPic?: string;
      text?: string;
      voiceUrl?: string;
      voiceDuration?: number;
    }
  ): Promise<Comment> {
    const res = await fetch(`/api/notes/${noteId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async getProfiles(): Promise<Profile[]> {
    const res = await fetch('/api/profiles');
    if (!res.ok) throw new Error('Failed to fetch profiles');
    return res.json();
  },

  async getProfile(id: string): Promise<Profile> {
    const res = await fetch(`/api/profiles/${id}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async saveProfile(data: {
    id: string;
    name: string;
    pic?: string;
    bio?: string;
  }): Promise<Profile> {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  async getSaved(userId: string): Promise<string[]> {
    const res = await fetch(`/api/saved/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch saved notes');
    return res.json();
  },

  async toggleSaved(
    userId: string,
    noteId: string
  ): Promise<{ saved: boolean; savedIds: string[] }> {
    const res = await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, noteId }),
    });
    if (!res.ok) throw new Error('Failed to toggle saved');
    return res.json();
  },

  async getShares(userId: string): Promise<Share[]> {
    const res = await fetch(`/api/shares/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch shares');
    return res.json();
  },

  async sendShare(data: {
    nid: string;
    from: string;
    to: string;
    fromName: string;
  }): Promise<Share> {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send share');
    return res.json();
  },

  async getFollows(userId: string): Promise<{ following: string[]; followers: string[] }> {
    const res = await fetch(`/api/follows/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch follows');
    return res.json();
  },

  async toggleFollow(
    followerId: string,
    targetUserId: string
  ): Promise<{ isFollowing: boolean; following: string[]; targetFollowers: string[] }> {
    const res = await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId, targetUserId }),
    });
    if (!res.ok) throw new Error('Failed to toggle follow');
    return res.json();
  },

  async getNetwork(
    userId: string
  ): Promise<{ followingProfiles: Profile[]; followerProfiles: Profile[] }> {
    const res = await fetch(`/api/network/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch network');
    return res.json();
  },

  async register(data: {
    username: string;
    name: string;
    password: string;
    pic?: string;
    bio?: string;
  }): Promise<{ user: Profile; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register account');
    }
    return res.json();
  },

  async login(data: {
    username: string;
    password: string;
  }): Promise<{ user: Profile; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid username or password');
    }
    return res.json();
  },

  async getDemoAccounts(): Promise<{ id: string; username: string; name: string; pic: string }[]> {
    const res = await fetch('/api/auth/accounts');
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  async seedData(): Promise<{ success: boolean; notes: number }> {
    const res = await fetch('/api/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed data');
    return res.json();
  },

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const res = await fetch(`/api/notifications?u=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<AppNotification> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async simulateNotification(
    userId: string,
    type?: 'like' | 'comment' | 'follow'
  ): Promise<AppNotification> {
    const res = await fetch('/api/notifications/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    if (!res.ok) throw new Error('Failed to simulate notification');
    return res.json();
  },

  // Direct Messages
  async getMessages(userId: string): Promise<DirectMessage[]> {
    const res = await fetch(`/api/messages?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async getMessageThread(user1: string, user2: string): Promise<DirectMessage[]> {
    const res = await fetch(
      `/api/messages/thread?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
    );
    if (!res.ok) throw new Error('Failed to fetch message thread');
    return res.json();
  },

  async sendMessage(data: {
    senderId: string;
    receiverId: string;
    text?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    chessGameId?: string;
  }): Promise<DirectMessage> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async markThreadRead(
    senderId: string,
    receiverId: string
  ): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId }),
    });
    if (!res.ok) throw new Error('Failed to mark thread as read');
    return res.json();
  },

  // Chess Games
  async getChessGames(userId?: string): Promise<ChessGame[]> {
    const url = userId
      ? `/api/chess/games?userId=${encodeURIComponent(userId)}`
      : '/api/chess/games';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch chess games');
    return res.json();
  },

  async getChessGame(id: string): Promise<ChessGame> {
    const res = await fetch(`/api/chess/games/${id}`);
    if (!res.ok) throw new Error('Failed to fetch chess game');
    return res.json();
  },

  async createChessGame(data: {
    challengerId: string;
    opponentId: string;
    colorPreference?: 'w' | 'b' | 'random';
  }): Promise<ChessGame> {
    const res = await fetch('/api/chess/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create chess game');
    return res.json();
  },

  async makeChessMove(
    gameId: string,
    data: {
      from: string;
      to: string;
      promotion?: string;
      userId: string;
    }
  ): Promise<ChessGame> {
    const res = await fetch(`/api/chess/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to make move');
    }
    return res.json();
  },

  async resignChessGame(gameId: string, userId: string): Promise<ChessGame> {
    const res = await fetch(`/api/chess/games/${gameId}/resign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to resign game');
    return res.json();
  },
};
