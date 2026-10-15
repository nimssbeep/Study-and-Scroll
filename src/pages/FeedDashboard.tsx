import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus } from 'lucide-react';
import { apiFetch, setAuthSession } from '../lib/api';
import { cleanInput } from '../lib/sanitize';
import { testGeminiApiKey } from '../lib/aiPersonaEngine';
import { Navbar } from '../components/Navbar';
import { SidebarLeft } from '../components/SidebarLeft';
import { SidebarRight } from '../components/SidebarRight';
import { FeedFilters } from '../components/FeedFilters';
import { PostCard } from '../components/PostCard';
import { FriendsDirectory } from '../components/FriendsDirectory';
import { UploadMaterialModal } from '../components/UploadMaterialModal';
import { CreateStoryModal, ViewStoryModal, StoryArchiveModal } from '../components/StoryModals';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { UserAvatar } from '../components/UserAvatar';
import { OnboardingModal } from './OnboardingModal';
import { Toast } from '../components/Toast';
import type {
  User, FeedPost, StudyMaterialItem, StoryItem, FriendUser, NotificationItem
} from '../types';

export const FeedDashboard: React.FC<{ user: User }> = ({ user }) => {
  const queryClient = useQueryClient();

  // Auto-ping Gemini 3 Flash as soon as the user logs in / loads dashboard
  useEffect(() => {
    testGeminiApiKey()
      .then((res) => {
        if (res.success) {
          console.log(`[Skrulla AI] Gemini 3 Flash auto-verified on login (${res.latencyMs}ms)`);
        }
      })
      .catch(() => {});
  }, []);

  // Navigation & Filtering
  const [activeNav, setActiveNav] = useState<'home' | 'explore' | 'friends' | 'saved'>('home');
  const [feedTab, setFeedTab] = useState<'for_you' | 'following'>('for_you');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Friends Directory States
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendFilterTab, setFriendFilterTab] = useState<'all' | 'following' | 'followers'>('all');

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(!user.onboarding_completed);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  // Floating Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3200);
  };

  // Queries
  const effectiveTab = activeNav === 'saved' ? 'saved' : feedTab;

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['feed', effectiveTab, selectedSubject, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams({ tab: effectiveTab });
      if (selectedSubject) params.set('subject', selectedSubject);
      if (searchQuery.trim()) params.set('search', cleanInput(searchQuery, 80));
      return apiFetch<FeedPost[]>(`/api/feed?${params.toString()}`);
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<StudyMaterialItem[]>('/api/materials'),
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: () => apiFetch<StoryItem[]>('/api/social/stories'),
  });

  useQuery<StoryItem[]>({
    queryKey: ['story_archive'],
    queryFn: () => apiFetch<StoryItem[]>('/api/social/stories/archive'),
    enabled: showArchiveModal,
  });

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationItem[]>('/api/social/notifications'),
    refetchInterval: 8000,
  });

  const { data: followingSummary = [] } = useQuery<FriendUser[]>({
    queryKey: ['following_summary'],
    queryFn: () => apiFetch<FriendUser[]>('/api/social/friends?filter_type=following'),
  });

  const { data: friendsList = [], isLoading: loadingFriends } = useQuery<FriendUser[]>({
    queryKey: ['friends', friendSearchQuery, friendFilterTab],
    queryFn: () => {
      const params = new URLSearchParams();
      if (friendSearchQuery.trim()) params.set('search', cleanInput(friendSearchQuery, 80));
      if (friendFilterTab !== 'all') params.set('filter_type', friendFilterTab);
      return apiFetch<FriendUser[]>(`/api/social/friends?${params.toString()}`);
    },
  });

  // Mutations
  const likeMutation = useMutation({
    mutationFn: (postId: number) => apiFetch(`/api/feed/${postId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (postId: number) => apiFetch(`/api/feed/${postId}/save`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const shareMutation = useMutation({
    mutationFn: (postId: number) => apiFetch(`/api/feed/${postId}/share`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const handleShare = async (post: FeedPost) => {
    shareMutation.mutate(post.id);
    const shareUrl = `${window.location.origin}/feed#post-${post.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        triggerToast(`Link copied: "${post.headline}"`);
      } else {
        triggerToast(`Post shared!`);
      }
    } catch {
      triggerToast(`Post shared!`);
    }
  };

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      apiFetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: cleanInput(content, 400) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: (postId: number) =>
      apiFetch<FeedPost>(`/api/feed/${postId}/generate-quiz`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const toggleFriendMutation = useMutation({
    mutationFn: (targetId: number) =>
      apiFetch<{ is_friend: boolean; followers_count: number }>(
        `/api/social/friends/${targetId}/toggle`,
        { method: 'POST' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['following_summary'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) =>
      apiFetch(`/api/feed/${postId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      triggerToast('Post deleted successfully.');
    },
    onError: (err: Error) => {
      triggerToast(err.message || 'Failed to delete post.');
    },
  });

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthSession(null, null);
    queryClient.clear();
    window.location.href = '/auth';
  };

  // Persona & Subject Options
  const personaOptions = [...new Set(posts.map((p) => p.persona))];
  if (selectedPersona && !personaOptions.includes(selectedPersona)) {
    personaOptions.push(selectedPersona);
  }
  const visiblePosts = selectedPersona
    ? posts.filter((p) => p.persona === selectedPersona)
    : posts;
  const subjectOptions = [...new Set([...user.preferences, ...materials.map((m) => m.subject)])];

  return (
    <div className="min-h-screen bg-[#FAF9FE] text-slate-900">
      {/* Onboarding & Profile Settings Modals */}
      {showOnboarding && (
        <OnboardingModal
          user={user}
          subjectOptions={subjectOptions}
          onClose={() => setShowOnboarding(false)}
          onOpenUpload={() => setShowUploadModal(true)}
        />
      )}

      {showProfileSettings && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setShowProfileSettings(false)}
          onSuccessToast={triggerToast}
        />
      )}

      {/* Global Subject Datalist for Inputs */}
      <datalist id="subject-options">
        {subjectOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Modular Top Navigation */}
      <Navbar
        user={user}
        notifications={notifications}
        onOpenSettings={() => setShowProfileSettings(true)}
        onOpenFriends={() => setActiveNav('friends')}
      />

      {/* Main 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 py-6">
        {/* Modular Left Sidebar */}
        <SidebarLeft
          user={user}
          activeNav={activeNav}
          friendsCount={followingSummary.length}
          onNavigate={(nav) => setActiveNav(nav)}
          onOpenUpload={() => setShowUploadModal(true)}
          onOpenSettings={() => setShowProfileSettings(true)}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onLogout={handleLogout}
        />

        {/* Center Content Column */}
        <main className="lg:col-span-6 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B7BB8]">
              • A LITTLE BETTER, EVERY DAY
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">
              Doomscroll. <span className="text-[#8B7BB8]">For Knowledge</span>
            </h1>
          </div>

          {activeNav === 'friends' ? (
            <FriendsDirectory
              friendsList={friendsList}
              isLoading={loadingFriends}
              searchQuery={friendSearchQuery}
              onChangeSearch={setFriendSearchQuery}
              filterTab={friendFilterTab}
              onChangeFilterTab={setFriendFilterTab}
              onToggleFriend={(targetId) => toggleFriendMutation.mutate(targetId)}
              isToggling={toggleFriendMutation.isPending}
            />
          ) : (
            <>
              {/* Create Study Post Prompt Bar */}
              <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-100 flex items-center gap-3 shadow-sm hover:border-purple-200 transition">
                <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" className="shrink-0 ring-2 ring-purple-100" />
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-400 hover:text-slate-600 transition font-medium"
                >
                  Share a study note, formula, or takeaway with peers...
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-[#6D5CAE] hover:bg-[#584699] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Post
                </button>
              </div>

              {/* Filter Tabs, Search & AI Personas */}
              <FeedFilters
                feedTab={feedTab}
                onChangeTab={setFeedTab}
                searchQuery={searchQuery}
                onChangeSearch={setSearchQuery}
                personaOptions={personaOptions}
                selectedPersona={selectedPersona}
                onSelectPersona={setSelectedPersona}
              />

              {/* Feed Posts List */}
              {loadingPosts ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Loading verified study cards...
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center">
                  <BookOpen className="w-8 h-8 text-[#6D5CAE] mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">Your feed is waiting for notes</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Upload your study notes (.pdf, .txt, .md) or click "Post" to share your first study card.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={() => setShowCreatePostModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#6D5CAE] text-white text-xs font-semibold hover:bg-[#584699] transition"
                    >
                      + Create Post
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 rounded-xl bg-[#1C1B22] text-white text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      Upload Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {visiblePosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user.id}
                      onLike={(postId) => likeMutation.mutate(postId)}
                      onSave={(postId) => saveMutation.mutate(postId)}
                      onShare={handleShare}
                      onGenerateQuiz={(postId) => generateQuizMutation.mutate(postId)}
                      isGeneratingQuiz={generateQuizMutation.isPending}
                      onAddComment={(postId, content) =>
                        commentMutation.mutate({ postId, content })
                      }
                      onDelete={(postId) => deletePostMutation.mutate(postId)}
                      isDeleting={deletePostMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Modular Right Sidebar */}
        <SidebarRight
          user={user}
          stories={stories}
          friendsList={friendsList}
          subjectOptions={subjectOptions}
          selectedSubject={selectedSubject}
          materials={materials}
          onOpenStoryModal={() => setShowStoryModal(true)}
          onOpenArchiveModal={() => setShowArchiveModal(true)}
          onSelectStory={(st) => setActiveStory(st)}
          onOpenFriends={() => setActiveNav('friends')}
          onToggleFriend={(targetId) => toggleFriendMutation.mutate(targetId)}
          onSelectSubject={setSelectedSubject}
          onOpenUpload={() => setShowUploadModal(true)}
        />
      </div>

      {/* Modular Modals */}
      <UploadMaterialModal
        isOpen={showUploadModal}
        defaultSubject={user.preferences[0] ?? ''}
        onClose={() => setShowUploadModal(false)}
        onSuccess={triggerToast}
      />

      <CreateStoryModal
        isOpen={showStoryModal}
        defaultSubject={user.preferences[0] ?? ''}
        onClose={() => setShowStoryModal(false)}
        onSuccess={triggerToast}
      />

      <ViewStoryModal
        story={activeStory}
        currentUser={user}
        onClose={() => setActiveStory(null)}
        onSuccess={triggerToast}
      />

      <StoryArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onSelectStory={(st) => setActiveStory(st)}
        onSuccess={triggerToast}
      />

      <CreatePostModal
        isOpen={showCreatePostModal}
        currentUser={user}
        defaultSubject={user.preferences[0] ?? ''}
        onClose={() => setShowCreatePostModal(false)}
        onSuccess={triggerToast}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
};

