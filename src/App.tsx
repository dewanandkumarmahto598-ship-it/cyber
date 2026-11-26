import React, { useState, useEffect, useCallback } from 'react';
import { Note, Comment, Profile, Share, TabType, ProfileTab, FeedFilter, NetworkListType, CreateMode, AppNotification } from './types';
import { api } from './api';
import { getLocalUserId, PRESET_AVATARS } from './utils/helpers';
import { Header } from './components/Header';
import { NavBar } from './components/NavBar';
import { FeedView } from './components/FeedView';
import { ExploreView } from './components/ExploreView';
import { CreateView } from './components/CreateView';
import { ProfileView } from './components/ProfileView';
import { CommentSheet } from './components/CommentSheet';
import { ShareSheet } from './components/ShareSheet';
import { NotificationSheet } from './components/NotificationSheet';
import { ProfileEditModal } from './components/ProfileEditModal';
import { NoteMenuModal } from './components/NoteMenuModal';
import { ConfirmModal } from './components/ConfirmModal';
import { NoteDetailModal } from './components/NoteDetailModal';
import { NetworkModal } from './components/NetworkModal';
import { AuthModal } from './components/AuthModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [currentUserId, setCurrentUserId] = useState<string>(() => getLocalUserId());

  // Application Data States
  const [notes, setNotes] = useState<Note[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [myFollowingIds, setMyFollowingIds] = useState<string[]>([]);
  const [myFollowersIds, setMyFollowersIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  const [currentProfile, setCurrentProfile] = useState<Profile>({
    id: currentUserId,
    name: 'You',
    pic: PRESET_AVATARS[0],
    bio: 'Micro-journaling daily thoughts & quotes.',
  });

  // UI States
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [profileSubTab, setProfileSubTab] = useState<ProfileTab>('notes');
  const [createMode, setCreateMode] = useState<CreateMode>('note');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Modals
  const [activeCommentNoteId, setActiveCommentNoteId] = useState<string | null>(null);
  const [noteComments, setNoteComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [activeShareNoteId, setActiveShareNoteId] = useState<string | null>(null);
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const [deleteTargetNoteId, setDeleteTargetNoteId] = useState<string | null>(null);
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Followers/Following Network Modal
  const [networkModal, setNetworkModal] = useState<{
    isOpen: boolean;
    type: NetworkListType;
    userId: string;
    userName: string;
    followerProfiles: Profile[];
    followingProfiles: Profile[];
  } | null>(null);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2400);
  }, []);

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('n_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('n_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('n_theme', 'light');
    }
  }, [darkMode]);

  // Initial Fetch & Sync
  const loadAllData = useCallback(async () => {
    try {
      const [fetchedNotes, fetchedProfiles, fetchedSaved, fetchedShares, fetchedFollows, fetchedNotifs] =
        await Promise.all([
          api.getNotes(),
          api.getProfiles(),
          api.getSaved(currentUserId),
          api.getShares(currentUserId),
          api.getFollows(currentUserId),
          api.getNotifications(currentUserId),
        ]);

      setNotes(fetchedNotes);
      setProfiles(fetchedProfiles);
      setSavedIds(fetchedSaved);
      setShares(fetchedShares);
      setMyFollowingIds(fetchedFollows.following);
      setMyFollowersIds(fetchedFollows.followers);
      setNotifications(fetchedNotifs);

      // Find or set current user profile
      const myProfile = fetchedProfiles.find((p) => p.id === currentUserId);
      if (myProfile) {
        setCurrentProfile(myProfile);
      } else {
        const initial = {
          id: currentUserId,
          name: 'You',
          pic: PRESET_AVATARS[0],
          bio: 'Writing micro-notes & thoughts.',
        };
        api.saveProfile(initial).then((res) => {
          setCurrentProfile(res);
          setProfiles((prev) => [...prev, res]);
        });
      }

      // Check URL hash for direct note view (#note_1)
      const hash = window.location.hash.replace('#', '');
      if (hash && fetchedNotes.some((n) => n.id === hash)) {
        setDetailNoteId(hash);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Authentication Success (Sign up / Login)
  const handleAuthSuccess = (user: Profile) => {
    setCurrentUserId(user.id);
    setCurrentProfile(user);
    localStorage.setItem('n_current_user_id', user.id);

    // Refresh data for the newly active user
    api.getFollows(user.id).then((f) => {
      setMyFollowingIds(f.following);
      setMyFollowersIds(f.followers);
    });
    api.getSaved(user.id).then(setSavedIds);
    api.getShares(user.id).then(setShares);
    api.getProfiles().then(setProfiles);
    api.getNotes().then(setNotes);
    api.getNotifications(user.id).then(setNotifications);
  };

  // Load comments when comment modal opens
  useEffect(() => {
    if (activeCommentNoteId) {
      setIsLoadingComments(true);
      api
        .getComments(activeCommentNoteId)
        .then((cmts) => setNoteComments(cmts))
        .catch(() => showToast('Failed to load comments'))
        .finally(() => setIsLoadingComments(false));
    } else {
      setNoteComments([]);
    }
  }, [activeCommentNoteId, showToast]);

  // Toggle Follow Handler
  const handleToggleFollow = async (targetUserId: string) => {
    const targetProfile = profiles.find((p) => p.id === targetUserId);
    const targetName = targetProfile?.name || 'Creator';
    const isCurrentlyFollowing = myFollowingIds.includes(targetUserId);

    // Optimistic update
    setMyFollowingIds((prev) =>
      isCurrentlyFollowing
        ? prev.filter((id) => id !== targetUserId)
        : [...prev, targetUserId]
    );

    showToast(isCurrentlyFollowing ? `Unfollowed ${targetName}` : `Now following ${targetName}`);

    try {
      const res = await api.toggleFollow(currentUserId, targetUserId);
      setMyFollowingIds(res.following);

      // Refresh network modal if open
      if (networkModal?.isOpen) {
        const net = await api.getNetwork(networkModal.userId);
        setNetworkModal((prev) =>
          prev
            ? {
                ...prev,
                followerProfiles: net.followerProfiles,
                followingProfiles: net.followingProfiles,
              }
            : null
        );
      }
    } catch {
      showToast('Failed to update follow status');
      api.getFollows(currentUserId).then((f) => setMyFollowingIds(f.following));
    }
  };

  // Open Network Modal
  const handleOpenNetwork = async (type: NetworkListType, targetUserId: string) => {
    const targetProfile = profiles.find((p) => p.id === targetUserId) || currentProfile;
    try {
      const net = await api.getNetwork(targetUserId);
      setNetworkModal({
        isOpen: true,
        type,
        userId: targetUserId,
        userName: targetProfile.name,
        followerProfiles: net.followerProfiles,
        followingProfiles: net.followingProfiles,
      });
    } catch {
      showToast('Could not load network list');
    }
  };

  // Actions
  const handleLike = async (noteId: string) => {
    try {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          const isLiked = n.likes.includes(currentUserId);
          const newLikes = isLiked
            ? n.likes.filter((id) => id !== currentUserId)
            : [...n.likes, currentUserId];
          return { ...n, likes: newLikes };
        })
      );

      const res = await api.toggleLike(noteId, currentUserId);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, likes: res.likes } : n))
      );
    } catch {
      showToast('Error liking note');
      loadAllData();
    }
  };

  const handleSaveToggle = async (noteId: string) => {
    try {
      const isCurrentlySaved = savedIds.includes(noteId);
      setSavedIds((prev) =>
        isCurrentlySaved ? prev.filter((id) => id !== noteId) : [noteId, ...prev]
      );

      showToast(isCurrentlySaved ? 'Removed from saved' : 'Note saved to bookmarks');
      const res = await api.toggleSaved(currentUserId, noteId);
      setSavedIds(res.savedIds);
    } catch {
      showToast('Error saving note');
    }
  };

  const handleAddComment = async (data: {
    text?: string;
    voiceUrl?: string;
    voiceDuration?: number;
  }) => {
    if (!activeCommentNoteId) return;
    try {
      const newComment = await api.addComment(activeCommentNoteId, {
        u: currentUserId,
        authorName: currentProfile.name,
        authorPic: currentProfile.pic,
        text: data.text || '',
        voiceUrl: data.voiceUrl,
        voiceDuration: data.voiceDuration,
      });
      setNoteComments((prev) => [...prev, newComment]);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === activeCommentNoteId
            ? { ...n, commentsCount: (n.commentsCount || 0) + 1 }
            : n
        )
      );
      showToast(data.voiceUrl ? 'Voice note comment posted' : 'Comment posted');
    } catch {
      showToast('Error posting comment');
    }
  };

  const handleCreateOrUpdateNote = async (data: {
    title: string;
    body: string;
    c: number;
    image?: string;
  }) => {
    try {
      if (editingNote) {
        const updated = await api.updateNote(editingNote.id, data);
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
        setEditingNote(null);
        showToast(data.image ? 'Photo post updated' : 'Note updated');
      } else {
        const created = await api.createNote({
          u: currentUserId,
          authorName: currentProfile.name,
          authorPic: currentProfile.pic,
          title: data.title,
          body: data.body,
          image: data.image,
          c: data.c,
        });
        setNotes((prev) => [created, ...prev]);
        showToast(data.image ? 'Photo posted to gallery & feed' : 'Note posted to feed');
      }
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      showToast('Error saving note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setSavedIds((prev) => prev.filter((id) => id !== noteId));
      setDeleteTargetNoteId(null);
      setActiveMenuNoteId(null);
      setDetailNoteId(null);
      if (editingNote?.id === noteId) {
        setEditingNote(null);
        setActiveTab('home');
      }
      showToast('Note deleted');
    } catch {
      showToast('Error deleting note');
    }
  };

  const handleSendShare = async (targetUserId: string) => {
    if (!activeShareNoteId) return;
    await api.sendShare({
      nid: activeShareNoteId,
      from: currentUserId,
      to: targetUserId,
      fromName: currentProfile.name,
    });
  };

  const handleSaveProfile = async (data: {
    name: string;
    bio?: string;
    pic?: string;
  }) => {
    const updated = await api.saveProfile({
      id: currentUserId,
      ...data,
    });
    setCurrentProfile(updated);
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentUserId ? updated : p))
    );
    api.getNotes().then(setNotes);
  };

  // Navigations
  const handleViewProfile = (userId: string) => {
    setViewingProfileId(userId);
    setProfileSubTab('notes');
    setActiveTab('profile');
    setActiveCommentNoteId(null);
    setDetailNoteId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditNoteFromMenu = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    setEditingNote(note);
    setActiveMenuNoteId(null);
    setDetailNoteId(null);
    setActiveTab('create');
  };

  const handleGoToPostPhoto = () => {
    setEditingNote(null);
    setCreateMode('photo');
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToCreate = (mode: CreateMode = 'note') => {
    setEditingNote(null);
    setCreateMode(mode);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Computed data for Profile View
  const targetProfile = viewingProfileId
    ? profiles.find((p) => p.id === viewingProfileId) || {
        id: viewingProfileId,
        name: 'Creator',
        pic: PRESET_AVATARS[0],
      }
    : currentProfile;

  const targetUserNotes = notes.filter((n) => n.u === targetProfile.id);
  const targetSavedNotes = notes.filter((n) => savedIds.includes(n.id));
  const targetSharedNotes = notes.filter((n) =>
    shares.some((s) => s.nid === n.id)
  );

  // Dynamic follow counts for profile
  const [profileFollowCounts, setProfileFollowCounts] = useState({
    followers: 0,
    following: 0,
  });

  useEffect(() => {
    if (targetProfile.id === currentUserId) {
      setProfileFollowCounts({
        followers: myFollowersIds.length,
        following: myFollowingIds.length,
      });
    } else {
      api.getFollows(targetProfile.id).then((f) => {
        setProfileFollowCounts({
          followers: f.followers.length,
          following: f.following.length,
        });
      }).catch(() => {});
    }
  }, [targetProfile.id, currentUserId, myFollowingIds, myFollowersIds]);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleSimulateNotification = async () => {
    try {
      const newNotif = await api.simulateNotification(currentUserId);
      setNotifications((prev) => [newNotif, ...prev]);
      const actionDesc =
        newNotif.type === 'like'
          ? 'liked your post ❤️'
          : newNotif.type === 'comment'
          ? 'commented on your post 💬'
          : 'started following you 👤';
      showToast(`${newNotif.actorName} ${actionDesc}`);
    } catch {
      showToast('Could not simulate notification');
    }
  };

  const activeNoteForModal = detailNoteId
    ? notes.find((n) => n.id === detailNoteId)
    : null;

  const suggestedProfiles = profiles.filter(
    (p) => p.id !== currentUserId && !myFollowingIds.includes(p.id)
  );

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--tx)] flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen flex flex-col relative bg-[var(--bg)] shadow-xs">
        {/* Top Header */}
        <Header
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          sharedCount={shares.length}
          onOpenShared={() => {
            setViewingProfileId(null);
            setProfileSubTab('shared');
            setActiveTab('profile');
          }}
          unreadNotificationCount={unreadNotificationCount}
          onOpenNotifications={() => setIsNotificationSheetOpen(true)}
          currentProfile={currentProfile}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center text-[var(--mu)] gap-3">
              <Sparkles className="w-8 h-8 animate-pulse text-[var(--ac)]" />
              <div className="text-sm font-medium">Opening your journal...</div>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <FeedView
                  notes={notes}
                  currentUserId={currentUserId}
                  savedIds={savedIds}
                  followingIds={myFollowingIds}
                  suggestedProfiles={suggestedProfiles}
                  sharedCount={shares.length}
                  feedFilter={feedFilter}
                  onChangeFeedFilter={setFeedFilter}
                  onOpenShared={() => {
                    setViewingProfileId(null);
                    setProfileSubTab('shared');
                    setActiveTab('profile');
                  }}
                  onLike={handleLike}
                  onComment={(id) => setActiveCommentNoteId(id)}
                  onShare={(id) => setActiveShareNoteId(id)}
                  onSave={handleSaveToggle}
                  onOpenMenu={(id) => setActiveMenuNoteId(id)}
                  onViewProfile={handleViewProfile}
                  onToggleFollow={handleToggleFollow}
                  onGoToCreate={() => handleGoToCreate('note')}
                  onGoToPostPhoto={handleGoToPostPhoto}
                />
              )}

              {activeTab === 'explore' && (
                <ExploreView
                  notes={notes}
                  profiles={profiles}
                  currentUserId={currentUserId}
                  followingIds={myFollowingIds}
                  onToggleFollow={handleToggleFollow}
                  onViewProfile={handleViewProfile}
                  onOpenNoteDetail={(id) => setDetailNoteId(id)}
                />
              )}

              {activeTab === 'create' && (
                <CreateView
                  editingNote={editingNote}
                  initialMode={createMode}
                  onChangeMode={setCreateMode}
                  onSaveNote={handleCreateOrUpdateNote}
                  onCancel={() => {
                    setEditingNote(null);
                    setActiveTab('home');
                  }}
                  onDeleteNote={(id) => setDeleteTargetNoteId(id)}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  profile={targetProfile}
                  isOwnProfile={targetProfile.id === currentUserId}
                  notes={targetUserNotes}
                  savedNotes={targetSavedNotes}
                  sharedNotes={targetSharedNotes}
                  shares={shares}
                  followersCount={profileFollowCounts.followers}
                  followingCount={profileFollowCounts.following}
                  isFollowing={myFollowingIds.includes(targetProfile.id)}
                  activeSubTab={profileSubTab}
                  onChangeSubTab={setProfileSubTab}
                  onEditProfile={() => setIsProfileModalOpen(true)}
                  onToggleFollow={handleToggleFollow}
                  onOpenNetwork={(type) => handleOpenNetwork(type, targetProfile.id)}
                  onOpenNoteDetail={(id) => setDetailNoteId(id)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onGoToPostPhoto={handleGoToPostPhoto}
                  onBackToMyProfile={
                    viewingProfileId ? () => setViewingProfileId(null) : undefined
                  }
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <NavBar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            if (tab === 'profile') setViewingProfileId(null);
            if (tab !== 'create' && editingNote) setEditingNote(null);
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentProfile={currentProfile}
          sharedCount={shares.length}
        />

        {/* Comment Sheet Modal */}
        {activeCommentNoteId && (
          <CommentSheet
            noteId={activeCommentNoteId}
            comments={noteComments}
            isLoading={isLoadingComments}
            currentUser={currentProfile}
            onAddComment={handleAddComment}
            onClose={() => setActiveCommentNoteId(null)}
            onViewProfile={handleViewProfile}
          />
        )}

        {/* Share Sheet Modal */}
        {activeShareNoteId && (
          <ShareSheet
            note={notes.find((n) => n.id === activeShareNoteId)!}
            profiles={profiles}
            currentUserId={currentUserId}
            onSendToUser={handleSendShare}
            onClose={() => setActiveShareNoteId(null)}
            onToast={showToast}
          />
        )}

        {/* Note Action Menu Modal */}
        {activeMenuNoteId && (
          <NoteMenuModal
            noteId={activeMenuNoteId}
            isAuthor={
              notes.find((n) => n.id === activeMenuNoteId)?.u === currentUserId
            }
            onEdit={handleEditNoteFromMenu}
            onDelete={(id) => {
              setActiveMenuNoteId(null);
              setDeleteTargetNoteId(id);
            }}
            onCopy={async (id) => {
              const n = notes.find((item) => item.id === id);
              if (n) {
                await navigator.clipboard.writeText(
                  `${n.title ? n.title + '\n\n' : ''}${n.body}`
                );
                showToast('Note copied to clipboard');
              }
              setActiveMenuNoteId(null);
            }}
            onShare={(id) => {
              setActiveMenuNoteId(null);
              setActiveShareNoteId(id);
            }}
            onClose={() => setActiveMenuNoteId(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteTargetNoteId && (
          <ConfirmModal
            title="Delete this note?"
            message="This note will be permanently removed for everyone and cannot be recovered."
            confirmLabel="Delete Note"
            onConfirm={() => handleDeleteNote(deleteTargetNoteId)}
            onCancel={() => setDeleteTargetNoteId(null)}
          />
        )}

        {/* Note Detail Modal */}
        {activeNoteForModal && (
          <NoteDetailModal
            note={activeNoteForModal}
            currentUserId={currentUserId}
            isSaved={savedIds.includes(activeNoteForModal.id)}
            isFollowingAuthor={myFollowingIds.includes(activeNoteForModal.u)}
            onLike={handleLike}
            onComment={(id) => setActiveCommentNoteId(id)}
            onShare={(id) => setActiveShareNoteId(id)}
            onSave={handleSaveToggle}
            onOpenMenu={(id) => setActiveMenuNoteId(id)}
            onViewProfile={handleViewProfile}
            onToggleFollow={handleToggleFollow}
            onClose={() => setDetailNoteId(null)}
          />
        )}

        {/* Edit Profile Modal */}
        {isProfileModalOpen && (
          <ProfileEditModal
            currentProfile={currentProfile}
            onSave={handleSaveProfile}
            onClose={() => setIsProfileModalOpen(false)}
            onToast={showToast}
          />
        )}

        {/* Followers / Following Network Modal */}
        {networkModal && networkModal.isOpen && (
          <NetworkModal
            initialType={networkModal.type}
            profileName={networkModal.userName}
            followerProfiles={networkModal.followerProfiles}
            followingProfiles={networkModal.followingProfiles}
            currentUserId={currentUserId}
            myFollowingIds={myFollowingIds}
            onToggleFollow={handleToggleFollow}
            onViewProfile={handleViewProfile}
            onClose={() => setNetworkModal(null)}
          />
        )}

        {/* Account Sign Up & Login Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          onToast={showToast}
        />

        {/* Notifications Sheet */}
        <NotificationSheet
          isOpen={isNotificationSheetOpen}
          onClose={() => setIsNotificationSheetOpen(false)}
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onOpenNoteDetail={(id) => setDetailNoteId(id)}
          onOpenProfile={(id) => handleViewProfile(id)}
          onToggleFollow={handleToggleFollow}
          myFollowingIds={myFollowingIds}
          onSimulateActivity={handleSimulateNotification}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-[var(--tx)] text-[var(--bg)] px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
              {toastMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
