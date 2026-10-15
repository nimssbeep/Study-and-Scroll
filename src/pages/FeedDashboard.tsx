import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Home, Compass, Users, Bookmark, Plus, Zap, Bell, Search,
  Heart, MessageCircle, Send, ShieldCheck, Sparkles, LogOut, CheckCircle2, X,
  Camera, UserPlus, UserCheck, Check, Clock, Share2, Trash2, Archive,
  Settings, GraduationCap, Calendar, Award, Globe, Github, Linkedin, Twitter, Instagram
} from 'lucide-react';
import { apiFetch, setAuthSession } from '../lib/api';
import { cleanInput, validateEducationalFile } from '../lib/sanitize';
import { formatTimeAgo } from '../lib/format';
import { OnboardingModal } from './OnboardingModal';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';
import { UserAvatar } from '../components/UserAvatar';
import type {
  User, FeedPost, StudyMaterialItem, StoryItem, FriendUser, NotificationItem
} from '../types';

function getSocialUrl(type: string, val: string): string {
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const cleanVal = val.replace(/^@/, '');
  switch (type) {
    case 'github': return `https://github.com/${cleanVal}`;
    case 'linkedin': return val.includes('linkedin.com') ? `https://${val}` : `https://linkedin.com/in/${cleanVal}`;
    case 'twitter': return `https://x.com/${cleanVal}`;
    case 'instagram': return `https://instagram.com/${cleanVal}`;
    case 'website': return `https://${val}`;
    default: return `https://${val}`;
  }
}

function formatRemainingTime(expiresAt?: string): string {
  if (!expiresAt) return '24h story';
  try {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired (Archived)';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  } catch {
    return '24h story';
  }
}

export const FeedDashboard: React.FC<{ user: User }> = ({ user }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeNav, setActiveNav] = useState<'home' | 'explore' | 'friends' | 'saved'>('home');
  const [feedTab, setFeedTab] = useState<'for_you' | 'following'>('for_you');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications Popover & Friends Directory States
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendFilterTab, setFriendFilterTab] = useState<'all' | 'following' | 'followers'>('all');

  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3200);
  };

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(!user.onboarding_completed);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  // Quiz answer state: { [postId]: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  // Comment inputs: { [postId]: text }
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState(user.preferences[0] ?? '');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Story form state
  const [storyTitle, setStoryTitle] = useState('');
  const [storySubject, setStorySubject] = useState(user.preferences[0] ?? '');

  // Queries via TanStack Query
  const effectiveTab = activeNav === 'saved' ? 'saved' : feedTab;

  // Persona filtering happens client-side so the filter chips can be built from the fetched posts.
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

  const { data: storyArchive = [], isLoading: loadingArchive } = useQuery<StoryItem[]>({
    queryKey: ['story_archive'],
    queryFn: () => apiFetch<StoryItem[]>('/api/social/stories/archive'),
    enabled: showArchiveModal,
  });

  // Notifications Query (polls every 8s for live real-time feel)
  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationItem[]>('/api/social/notifications'),
    refetchInterval: 8000,
  });
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Following summary for sidebar badge
  const { data: followingSummary = [] } = useQuery<FriendUser[]>({
    queryKey: ['following_summary'],
    queryFn: () => apiFetch<FriendUser[]>('/api/social/friends?filter_type=following'),
  });

  // Dynamic Friends Directory query (with live search and tab filtering)
  const { data: friendsList = [], isLoading: loadingFriends } = useQuery<FriendUser[]>({
    queryKey: ['friends', friendSearchQuery, friendFilterTab],
    queryFn: () => {
      const params = new URLSearchParams();
      if (friendSearchQuery.trim()) params.set('search', cleanInput(friendSearchQuery, 80));
      if (friendFilterTab !== 'all') params.set('filter_type', friendFilterTab);
      return apiFetch<FriendUser[]>(`/api/social/friends?${params.toString()}`);
    },
  });

  // User Profile Picture Upload Mutations
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch<User>('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => apiFetch<User>('/api/auth/avatar', { method: 'DELETE' }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  // Feed Mutations
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
    const postUrl = `${window.location.origin}/feed?post=${post.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
        triggerToast(`Link copied to clipboard! Share it with your peers.`);
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
    onSuccess: (_, variables) => {
      setCommentInputs((prev) => ({ ...prev, [variables.postId]: '' }));
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

  const markNotificationReadMutation = useMutation({
    mutationFn: (notifId: number) =>
      apiFetch(`/api/social/notifications/${notifId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/social/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('Please choose a study file (.pdf, .txt, .md)');
      const validationError = validateEducationalFile(uploadFile, 10);
      if (validationError) throw new Error(validationError);

      const formData = new FormData();
      formData.append('title', cleanInput(uploadTitle, 100));
      formData.append('subject', cleanInput(uploadSubject, 60));
      formData.append('file', uploadFile);

      return apiFetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadFile(null);
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => setUploadError(err.message),
  });

  const createStoryMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/social/stories', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'IN MY STUDY ERA',
          title: cleanInput(storyTitle, 140),
          subject: cleanInput(storySubject, 60),
          bg_gradient: 'from-purple-100 via-indigo-100 to-pink-100',
        }),
      }),
    onSuccess: () => {
      setShowStoryModal(false);
      setStoryTitle('');
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      triggerToast('Story published! Live for 24 hours.');
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: number) =>
      apiFetch(`/api/social/stories/${storyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      setActiveStory(null);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      triggerToast('Story deleted.');
    },
  });

  const archiveStoryMutation = useMutation({
    mutationFn: (storyId: number) =>
      apiFetch(`/api/social/stories/${storyId}/archive`, { method: 'POST' }),
    onSuccess: () => {
      setActiveStory(null);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      triggerToast('Story moved to your archive.');
    },
  });

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthSession(null, null);
    queryClient.clear();
    window.location.href = '/auth';
  };

  const acceptedFriendsCount = followingSummary.length;

  // Filter options come from API data rather than fixed lists.
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

      <datalist id="subject-options">
        {subjectOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Hidden file input for uploading profile picture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            avatarMutation.mutate(file);
          }
        }}
      />

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#6D5CAE]" />
              <span className="font-bold text-lg tracking-tight">
                study<span className="font-serif italic font-normal text-[#6D5CAE]">&amp;</span>scroll.
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-purple-100 text-[#6D5CAE] rounded-full">
                Skrulla
              </span>
            </div>
            <p className="text-[9px] tracking-[0.18em] uppercase text-slate-400">
              YOUR DAILY DOSE OF DISCOVERY
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>Your space to grow</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">The feed</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{user.streak_days} day streak</span>
          </div>
          {/* Interactive Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-[#6D5CAE] rounded-full text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsReadMutation.mutate()}
                        disabled={markAllNotificationsReadMutation.isPending}
                        className="text-[11px] font-semibold text-[#6D5CAE] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#6D5CAE] flex items-center justify-center mx-auto mb-2 font-bold">
                          ✦
                        </div>
                        <p className="text-xs font-bold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          When classmates like your notes, comment, or follow you, updates will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        let Icon = Sparkles;
                        let iconBg = 'bg-purple-100 text-[#6D5CAE]';
                        if (n.notification_type === 'like') {
                          Icon = Heart;
                          iconBg = 'bg-rose-100 text-rose-600';
                        } else if (n.notification_type === 'comment') {
                          Icon = MessageCircle;
                          iconBg = 'bg-blue-100 text-blue-600';
                        } else if (n.notification_type === 'follow') {
                          Icon = Users;
                          iconBg = 'bg-emerald-100 text-emerald-600';
                        } else if (n.notification_type === 'material') {
                          Icon = BookOpen;
                          iconBg = 'bg-amber-100 text-amber-700';
                        }

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markNotificationReadMutation.mutate(n.id);
                              if (n.notification_type === 'follow') {
                                setActiveNav('friends');
                                setShowNotifications(false);
                              }
                            }}
                            className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                              !n.is_read ? 'bg-purple-50/40' : ''
                            }`}
                          >
                            <div className="relative shrink-0">
                              <UserAvatar
                                name={n.actor_name || 'Study Friend'}
                                avatarUrl={n.actor_avatar || ''}
                                size="sm"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${iconBg} flex items-center justify-center ring-2 ring-white`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {formatTimeAgo(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            </div>

                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#6D5CAE] shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div
            onClick={() => setShowProfileSettings(true)}
            className="cursor-pointer group relative"
            title="Edit Profile & Settings"
          >
            <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" className="ring-2 ring-purple-200" />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Settings className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 py-6">
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 text-center">
            {/* Interactive Profile Picture with Settings Trigger */}
            <div
              className="relative inline-block group cursor-pointer"
              onClick={() => setShowProfileSettings(true)}
              title="Click to edit profile or change avatar"
            >
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                size="xl"
                className="mx-auto ring-4 ring-purple-100"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileSettings(true);
                }}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#6D5CAE] text-white hover:bg-[#59469B] shadow-md ring-2 ring-white transition"
                title="Profile Settings"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <h3 className="font-bold text-slate-900 mt-2">{user.name}</h3>
            <p className="text-xs text-slate-400">@{user.handle.replace(/^@/, '')}</p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {user.education_level}
              </span>
              {user.school && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#534092] border border-purple-200/60 max-w-[170px] truncate">
                  <GraduationCap className="w-3 h-3 shrink-0 text-[#6D5CAE]" />
                  <span className="truncate">{user.school}</span>
                </span>
              )}
            </div>

            {user.birthday && (
              <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1 mt-1.5">
                <Calendar className="w-3 h-3 text-[#6D5CAE]" />
                <span>Born {user.birthday}</span>
              </p>
            )}

            {user.bio && (
              <p className="text-[11px] text-slate-600 italic mt-2.5 line-clamp-2 px-1">
                "{user.bio}"
              </p>
            )}

            {/* User Certifications Badges */}
            {user.certifications && user.certifications.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5">
                {user.certifications.slice(0, 3).map((cert, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1"
                    title={cert}
                  >
                    <Award className="w-2.5 h-2.5 text-amber-600" />
                    <span className="truncate max-w-[110px]">{cert}</span>
                  </span>
                ))}
                {user.certifications.length > 3 && (
                  <span className="text-[9px] text-slate-400 font-bold">
                    +{user.certifications.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Social Media Links */}
            {user.social_links && Object.keys(user.social_links).some((k) => !!user.social_links?.[k]) && (
              <div className="flex items-center justify-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                {user.social_links.github && (
                  <a
                    href={getSocialUrl('github', user.social_links.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                {user.social_links.linkedin && (
                  <a
                    href={getSocialUrl('linkedin', user.social_links.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {user.social_links.twitter && (
                  <a
                    href={getSocialUrl('twitter', user.social_links.twitter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 transition"
                    title="Twitter / X"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </a>
                )}
                {user.social_links.instagram && (
                  <a
                    href={getSocialUrl('instagram', user.social_links.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {user.social_links.website && (
                  <a
                    href={getSocialUrl('website', user.social_links.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                    title="Portfolio / Website"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Quick Profile Settings Action */}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="mt-3.5 w-full py-2 px-3 rounded-2xl border border-purple-200 hover:border-[#6D5CAE] bg-purple-50/50 hover:bg-purple-100/70 text-[#534092] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-[#6D5CAE]" /> Edit Profile &amp; Settings
            </button>

            <nav className="mt-5 space-y-1.5 text-left">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'explore', label: 'Explore', icon: Compass },
                { id: 'friends', label: 'Friends', icon: Users, badge: acceptedFriendsCount },
                { id: 'saved', label: 'Saved', icon: Bookmark },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id as typeof activeNav)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                      active
                        ? 'bg-[#1C1B22] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-5 w-full py-3 px-4 rounded-2xl bg-[#EFEaff] hover:bg-[#e3dbfc] text-[#534092] font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Upload materials
            </button>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 text-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-200 via-pink-100 to-amber-100 mx-auto flex items-center justify-center text-[#6D5CAE] font-bold">
              ✦
            </div>
            <p className="text-xs font-bold text-slate-800 mt-3">
              A little scroll.
              <br />A lot of possibility.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Make your feed a little smarter.</p>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setShowProfileSettings(true)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-[#6D5CAE]" /> Settings
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Topics
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </aside>

        {/* CENTER FEED COLUMN */}
        <main className="lg:col-span-6 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B7BB8]">
              • A LITTLE BETTER, EVERY DAY
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">
              Doomscroll. <span className="text-[#8B7BB8]">For Knowledge</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your notes, reimagined. A feed that feeds your mind.
            </p>
          </div>

          {/* Real User Stories Row */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setShowStoryModal(true)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400">
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatar_url}
                  size="lg"
                  className="border-2 border-white"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#6D5CAE] text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                  +
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-600">Your story</span>
            </button>

            {stories.map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveStory(st)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#6D5CAE] via-purple-400 to-amber-300">
                  <UserAvatar
                    name={st.author_name}
                    avatarUrl={st.author_avatar}
                    size="lg"
                    className="border-2 border-white"
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-600">
                  {st.author_name.split(' ')[0]}
                </span>
              </button>
            ))}

            <button
              onClick={() => setActiveNav('friends')}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-[#6D5CAE]">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-600">Find friends</span>
            </button>
          </div>

          {/* Friends Directory View if 'friends' nav is active */}
          {activeNav === 'friends' ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-slate-900">Study Peers &amp; Social Circle</h2>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-[#534092]">
                    {friendsList.length} {friendsList.length === 1 ? 'Learner' : 'Learners'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Connect with real classmates, follow curious minds, and build your study community.
                </p>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    placeholder="Search learners by name or @handle..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                  />
                  {friendSearchQuery && (
                    <button
                      onClick={() => setFriendSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
                  {(
                    [
                      { id: 'all', label: 'All Learners' },
                      { id: 'following', label: 'Following' },
                      { id: 'followers', label: 'Followers' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFriendFilterTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        friendFilterTab === tab.id
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Peers Grid */}
              {loadingFriends ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Discovering study peers...
                </div>
              ) : friendsList.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
                  <Users className="w-9 h-9 text-[#6D5CAE]/60 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">
                    {friendSearchQuery
                      ? `No learners found matching "${friendSearchQuery}"`
                      : friendFilterTab === 'following'
                      ? "You aren't following anyone yet"
                      : friendFilterTab === 'followers'
                      ? 'No followers yet'
                      : 'No other registered learners yet'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {friendSearchQuery
                      ? 'Try searching by a different name or handle.'
                      : friendFilterTab === 'following'
                      ? "Explore 'All Learners' above to follow classmates and see their notes in your Following feed!"
                      : 'Invite friends to register, or create another account to build your study network.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {friendsList.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-4 rounded-3xl border border-slate-100 bg-white hover:border-purple-200/80 hover:shadow-sm transition flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            name={peer.name}
                            avatarUrl={peer.avatar_url}
                            size="md"
                            className="ring-2 ring-purple-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {peer.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              @{peer.handle.replace(/^@/, '')}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {peer.education_level}
                              </span>
                              {peer.school && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#534092] border border-purple-200/60 max-w-[130px] truncate">
                                  <GraduationCap className="w-3 h-3 text-[#6D5CAE] shrink-0" />
                                  <span className="truncate">{peer.school}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Follow / Unfollow Button */}
                        <button
                          onClick={() => toggleFriendMutation.mutate(peer.id)}
                          disabled={toggleFriendMutation.isPending}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition group ${
                            peer.is_friend
                              ? 'bg-purple-50 text-[#534092] hover:bg-rose-50 hover:text-rose-600 border border-purple-200'
                              : 'bg-[#1C1B22] text-white hover:bg-slate-800'
                          }`}
                        >
                          {peer.is_friend ? (
                            <>
                              <span className="group-hover:hidden flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5" /> Following
                              </span>
                              <span className="hidden group-hover:inline">Unfollow</span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UserPlus className="w-3.5 h-3.5" /> Follow
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Peer Bio (if provided) */}
                      {peer.bio && (
                        <p className="text-[11px] text-slate-600 italic line-clamp-2 px-0.5">
                          "{peer.bio}"
                        </p>
                      )}

                      {/* Peer Certifications */}
                      {peer.certifications && peer.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {peer.certifications.slice(0, 2).map((cert, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1"
                              title={cert}
                            >
                              <Award className="w-2.5 h-2.5 text-amber-600" />
                              <span className="truncate max-w-[120px]">{cert}</span>
                            </span>
                          ))}
                          {peer.certifications.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              +{peer.certifications.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Footer: Social links & Followers count */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {peer.social_links?.github && (
                            <a
                              href={getSocialUrl('github', peer.social_links.github)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="GitHub"
                            >
                              <Github className="w-3 h-3" />
                            </a>
                          )}
                          {peer.social_links?.linkedin && (
                            <a
                              href={getSocialUrl('linkedin', peer.social_links.linkedin)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 transition"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-3 h-3" />
                            </a>
                          )}
                          {peer.social_links?.twitter && (
                            <a
                              href={getSocialUrl('twitter', peer.social_links.twitter)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-900 transition"
                              title="Twitter / X"
                            >
                              <Twitter className="w-3 h-3" />
                            </a>
                          )}
                          {peer.social_links?.instagram && (
                            <a
                              href={getSocialUrl('instagram', peer.social_links.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              title="Instagram"
                            >
                              <Instagram className="w-3 h-3" />
                            </a>
                          )}
                          {peer.social_links?.website && (
                            <a
                              href={getSocialUrl('website', peer.social_links.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              title="Website"
                            >
                              <Globe className="w-3 h-3" />
                            </a>
                          )}

                          {(peer.preferences || []).slice(0, 1).map((pref) => (
                            <span
                              key={pref}
                              className="px-2 py-0.5 rounded-md bg-purple-50 text-[#6D5CAE] font-medium text-[10px]"
                            >
                              {pref}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {peer.followers_count || 0} {peer.followers_count === 1 ? 'follower' : 'followers'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Search & For You / Following Bar */}
              <div className="bg-white rounded-2xl p-2 border border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFeedTab('for_you')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      feedTab === 'for_you'
                        ? 'bg-purple-50 text-[#534092]'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    For you <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFeedTab('following')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      feedTab === 'following'
                        ? 'bg-purple-50 text-[#534092]'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Following
                  </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes, topics..."
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 rounded-xl focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                </div>
              </div>

              {/* AI Persona Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[null, ...personaOptions].map((persona) => (
                  <button
                    key={persona ?? 'all-personas'}
                    onClick={() => setSelectedPersona(persona)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition ${
                      selectedPersona === persona
                        ? 'bg-[#EFEAFF] text-[#534092] border-purple-200'
                        : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {persona ?? 'All personas'}
                  </button>
                ))}
              </div>

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
                    Upload your study notes (.pdf, .txt, .md) to generate personalized, grounded study cards.
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#1C1B22] text-white text-xs font-semibold"
                  >
                    Upload My First Notes
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {visiblePosts.map((post) => {
                    const isQuiz = post.post_type === 'quiz';
                    const selectedOption = quizAnswers[post.id];

                    return (
                      <article
                        key={post.id}
                        className={`rounded-3xl p-6 border transition shadow-sm ${
                          isQuiz
                            ? 'bg-[#FFF9EB] border-amber-200/70'
                            : 'bg-[#EEF2FF]/60 border-indigo-100'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                isQuiz
                                  ? 'bg-amber-200/70 text-amber-900'
                                  : 'bg-indigo-100 text-[#534092]'
                              }`}
                            >
                              {isQuiz ? '✦' : '📖'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {post.persona}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-slate-600">
                                  AI
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                From your {post.material_title} notes • {post.education_level}
                              </p>
                            </div>
                          </div>

                          {!isQuiz && (
                            <button
                              onClick={() => generateQuizMutation.mutate(post.id)}
                              disabled={generateQuizMutation.isPending}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-[#534092] border border-purple-200 transition"
                            >
                              + Generate Quiz
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 mb-3">{post.hook}</p>

                        {/* Concept Visual Banner OR Quiz Interactive Block */}
                        {isQuiz ? (
                          <div className="mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                              {post.series_tag}
                            </p>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                              {post.headline}
                            </h3>
                            <p className="text-sm text-slate-700 mt-2 font-medium">
                              {post.quiz_question}
                            </p>

                            <div className="mt-4 space-y-2.5">
                              {(post.quiz_options || []).map((opt, idx) => {
                                const answered = selectedOption !== undefined;
                                const isCorrect = idx === post.quiz_correct_index;
                                const isChosen = selectedOption === idx;

                                let btnStyle = 'bg-white/90 border-amber-200 text-slate-800 hover:bg-white';
                                if (answered) {
                                  if (isCorrect) {
                                    btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                                  } else if (isChosen) {
                                    btnStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                                  }
                                }

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() =>
                                      setQuizAnswers((prev) => ({ ...prev, [post.id]: idx }))
                                    }
                                    className={`w-full text-left px-4 py-3 rounded-2xl border text-xs flex items-center justify-between transition ${btnStyle}`}
                                  >
                                    <span>
                                      <strong className="mr-3 text-slate-400">
                                        {String.fromCharCode(65 + idx)}
                                      </strong>
                                      {opt}
                                    </span>
                                    {answered && isCorrect && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {selectedOption !== undefined && post.quiz_explanation && (
                              <div className="mt-4 p-3.5 rounded-2xl bg-white/80 border border-amber-200 text-xs text-slate-700">
                                <strong>Grounded Explanation:</strong> {post.quiz_explanation}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-6 min-h-[220px] flex flex-col justify-between shadow-sm">
                            <div className="relative z-10">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                • {post.series_tag}
                              </span>
                            </div>
                            <div className="relative z-10 mt-10">
                              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                KEY TAKEAWAY
                              </p>
                              <h2 className="text-2xl font-serif leading-tight mt-1">
                                {post.headline}
                              </h2>
                            </div>
                          </div>
                        )}

                        {/* Social Action Bar (Like, Comment, Share, Save) */}
                        <div className="mt-4 flex items-center justify-between text-slate-600">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => likeMutation.mutate(post.id)}
                              className={`flex items-center gap-1.5 text-xs font-semibold ${
                                post.liked_by_me ? 'text-rose-600' : 'hover:text-slate-900'
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  post.liked_by_me ? 'fill-rose-600 text-rose-600' : ''
                                }`}
                              />
                              <span>{post.likes_count}</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-slate-900">
                              <MessageCircle className="w-5 h-5" />
                              <span>{post.comments.length}</span>
                            </button>
                            <button
                              onClick={() => handleShare(post)}
                              className="flex items-center gap-1.5 text-xs font-semibold hover:text-slate-900 transition"
                              title="Share this study card"
                            >
                              <Send className="w-5 h-5" />
                              <span>{post.shares_count}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => saveMutation.mutate(post.id)}
                            className={post.saved_by_me ? 'text-[#6D5CAE]' : 'hover:text-slate-900'}
                          >
                            <Bookmark
                              className={`w-5 h-5 ${
                                post.saved_by_me ? 'fill-[#6D5CAE] text-[#6D5CAE]' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {!isQuiz && (
                          <p className="mt-3 text-xs text-slate-700 leading-relaxed">
                            <strong className="text-slate-900">{post.headline}</strong> — {post.body}
                          </p>
                        )}

                        {/* Tags + Hallucination Shield Badge */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/80 text-slate-600"
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {post.source_verified && (
                            <div
                              title={`Grounded Excerpt: "${post.source_excerpt}"`}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>
                                Source verified ({Math.round(post.grounding_score * 100)}%) →
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Comments List & Input */}
                        <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                          {post.comments.map((c) => (
                            <div key={c.id} className="text-xs">
                              <strong className="text-slate-900 mr-1.5">{c.author_handle}</strong>
                              <span className="text-slate-700">{c.content}</span>
                            </div>
                          ))}

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const text = commentInputs[post.id];
                              if (text?.trim()) {
                                commentMutation.mutate({ postId: post.id, content: text });
                              }
                            }}
                            className="flex gap-2 pt-1"
                          >
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Add a study comment..."
                              className="flex-1 bg-white/90 px-3 py-1.5 rounded-xl text-xs border border-slate-200 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-xl bg-[#1C1B22] text-white text-xs font-semibold"
                            >
                              Post
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Study Stories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Study stories</h3>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                  title="View your archived stories (24h+)"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button
                  type="button"
                  onClick={() => setShowStoryModal(true)}
                  className="text-[11px] font-semibold text-[#6D5CAE] hover:underline"
                >
                  + Add story
                </button>
              </div>
            </div>
            {stories.length === 0 ? (
              <div className="p-4 rounded-3xl bg-purple-50/60 border border-purple-100 text-center">
                <Sparkles className="w-5 h-5 text-[#6D5CAE] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800">Share your study era</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Inspire others with what you are learning.</p>
                <button
                  onClick={() => setShowStoryModal(true)}
                  className="mt-2 text-xs font-bold text-[#6D5CAE] hover:underline"
                >
                  + Add story
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {stories.slice(0, 2).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setActiveStory(st)}
                    className={`p-4 rounded-3xl bg-gradient-to-br ${st.bg_gradient} text-left flex flex-col justify-between min-h-[170px] shadow-sm`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      {st.tag}
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 leading-snug my-2">
                      {st.title}
                    </p>
                    <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded-full">
                      <UserAvatar name={st.author_name} avatarUrl={st.author_avatar} size="xs" />
                      <span className="text-[10px] font-semibold text-slate-700 truncate">
                        {st.author_name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Peers ("Your kind of curious") */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Your kind of curious</h3>
              <button
                onClick={() => setActiveNav('friends')}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                See all
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Good minds think together.</p>

            {friendsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No other users online yet. Invite classmates to study together!</p>
            ) : (
              <div className="space-y-3">
                {friendsList.slice(0, 3).map((peer) => (
                  <div key={peer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={peer.name} avatarUrl={peer.avatar_url} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{peer.name}</p>
                        <p className="text-[10px] text-slate-400">{peer.handle}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFriendMutation.mutate(peer.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                        peer.is_friend
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-[#1C1B22] text-white'
                      }`}
                    >
                      {peer.is_friend ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* A Little Rabbit Hole (Topic Filters) */}
          {subjectOptions.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3">A little rabbit hole</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {subjectOptions.map((topic) => (
                  <button
                    key={topic}
                    onClick={() =>
                      setSelectedSubject(selectedSubject === topic ? null : topic)
                    }
                    className={`p-3 rounded-2xl text-xs font-bold border transition ${
                      selectedSubject === topic
                        ? 'bg-[#6D5CAE] text-white border-[#6D5CAE]'
                        : 'bg-purple-50/60 text-slate-700 border-purple-100 hover:bg-purple-100/60'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learning Pulse Card */}
          <div className="bg-[#F3EEFF] rounded-3xl p-5 border border-purple-200/60">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#6D5CAE]">
              YOUR LEARNING PULSE
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">Look at you grow.</h3>
            <p className="text-[11px] text-slate-500">Small moments. Real progress.</p>
            <div className="mt-4">
              <span className="text-2xl font-extrabold text-slate-900">
                {user.cards_learned_this_week}
              </span>
              <span className="text-xs text-slate-600 ml-1">cards learned this week</span>
            </div>
          </div>

          {/* On Your Bookshelf (Uploaded Materials) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">On your bookshelf</h3>
            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No notes uploaded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {materials.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedSubject(m.subject)}
                    className="p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {m.cards_count} bite-sized ideas • {m.subject}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">→</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-3 w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1 border-t border-slate-100 pt-3"
            >
              <Plus className="w-3.5 h-3.5" /> Add something new
            </button>
          </div>

          <div className="px-2 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#6D5CAE] shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-700">Big ideas. Real sources.</strong> Every AI card is
              grounded in your materials. Less guessing. More knowing.
            </p>
          </div>
        </aside>
      </div>

      {/* UPLOAD STUDY MATERIAL MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">Upload Study Material</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Strictly educational files (.pdf, .txt, .md up to 10 MB). Our Hallucination Shield
              verifies every generated card against your source text.
            </p>
            {uploadError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 text-xs text-rose-700">
                {uploadError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course / Note Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Organic Chemistry Lecture 4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  list="subject-options"
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  placeholder="e.g., Chemistry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  File (.pdf, .txt, .md — Max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="w-full py-3 rounded-xl bg-[#1C1B22] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {uploadMutation.isPending
                  ? 'Sanitizing & Generating Grounded Cards...'
                  : 'Upload & Generate Feed Cards'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STORY MODAL */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">Share a Study Story</h3>
              <button onClick={() => setShowStoryModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createStoryMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What are you studying right now?
                </label>
                <textarea
                  required
                  maxLength={140}
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="e.g., Finally mastered Eigenvalues & Eigenvectors!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  list="subject-options"
                  value={storySubject}
                  onChange={(e) => setStorySubject(e.target.value)}
                  placeholder="e.g., Linear Algebra"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#6D5CAE] text-white text-xs font-bold"
              >
                Publish Story
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STORY MODAL */}
      {activeStory && (
        <div
          onClick={() => setActiveStory(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-w-sm w-full rounded-3xl p-8 bg-gradient-to-br ${activeStory.bg_gradient} shadow-2xl min-h-[440px] flex flex-col justify-between relative`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  name={activeStory.author_name}
                  avatarUrl={activeStory.author_avatar}
                  size="sm"
                  className="ring-2 ring-white"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{activeStory.author_name}</p>
                  <p className="text-[10px] text-slate-600">{activeStory.author_handle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {activeStory.user_id === user.id && (
                  <>
                    {!activeStory.is_archived && (
                      <button
                        type="button"
                        onClick={() => archiveStoryMutation.mutate(activeStory.id)}
                        disabled={archiveStoryMutation.isPending}
                        className="p-1.5 rounded-full bg-white/70 hover:bg-white text-slate-700 transition shadow-sm"
                        title="Move to your archive early"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this story?")) {
                          deleteStoryMutation.mutate(activeStory.id);
                        }
                      }}
                      disabled={deleteStoryMutation.isPending}
                      className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition shadow-sm"
                      title="Delete story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveStory(null)}
                  className="p-1.5 rounded-full hover:bg-black/10 text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="my-auto py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {activeStory.tag} • {activeStory.subject}
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2 leading-tight">
                {activeStory.title}
              </h2>
            </div>

            <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[11px] text-slate-700">
              <span>{formatTimeAgo(activeStory.created_at)}</span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-white/70 shadow-sm text-slate-800">
                {activeStory.is_archived ? 'Archived Story' : formatRemainingTime(activeStory.expires_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STORY ARCHIVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#6D5CAE] flex items-center justify-center font-bold">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Your Story Archive</h3>
                  <p className="text-[11px] text-slate-400">
                    Stories automatically move here after 24 hours.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {loadingArchive ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading your archived stories...
                </div>
              ) : storyArchive.length === 0 ? (
                <div className="py-12 text-center px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No archived stories yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                    When your study stories reach their 24-hour limit, they are saved here so you never lose your study history.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {storyArchive.map((st) => (
                    <div
                      key={st.id}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${st.bg_gradient} flex flex-col justify-between min-h-[160px] shadow-sm relative group`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">
                          {st.tag}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Permanently delete this archived story?")) {
                              deleteStoryMutation.mutate(st.id);
                            }
                          }}
                          className="p-1.5 rounded-full bg-white/70 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition shadow-sm"
                          title="Permanently delete from archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div
                        onClick={() => setActiveStory(st)}
                        className="cursor-pointer my-2 flex-1"
                      >
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-3">
                          {st.title}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-600">
                        <span>{st.subject}</span>
                        <span>{formatTimeAgo(st.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{storyArchive.length} total saved moments</span>
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1B22] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
