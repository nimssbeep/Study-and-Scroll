import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Home, Compass, Users, Bookmark, Plus, Zap, Bell, Search,
  Heart, MessageCircle, Send, ShieldCheck, Sparkles, LogOut, CheckCircle2, X
} from 'lucide-react';
import { apiFetch, setAuthSession } from '../lib/api';
import { cleanInput, validateEducationalFile } from '../lib/sanitize';
import { OnboardingModal } from './OnboardingModal';
import type {
  User, FeedPost, StudyMaterialItem, StoryItem, FriendUser
} from '../types';

const PERSONAS = ['All personas', 'The Memer', 'Thread Architect', 'Storyteller', 'Quizmaster'];

export const FeedDashboard: React.FC<{ user: User }> = ({ user }) => {
  const queryClient = useQueryClient();

  const [activeNav, setActiveNav] = useState<'home' | 'explore' | 'friends' | 'saved'>('home');
  const [feedTab, setFeedTab] = useState<'for_you' | 'following'>('for_you');
  const [selectedPersona, setSelectedPersona] = useState('All personas');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(!user.onboarding_completed);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  // Quiz answer state: { [postId]: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  // Comment inputs: { [postId]: text }
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState(user.preferences[0] || 'Biology');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Story form state
  const [storyTitle, setStoryTitle] = useState('');
  const [storySubject, setStorySubject] = useState('Biology');

  // Queries via TanStack Query
  const effectiveTab = activeNav === 'saved' ? 'saved' : feedTab;

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['feed', effectiveTab, selectedPersona, selectedSubject, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams({ tab: effectiveTab });
      if (selectedPersona !== 'All personas') params.set('persona', selectedPersona);
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

  const { data: friendsList = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => apiFetch<FriendUser[]>('/api/social/friends'),
  });

  // Mutations
  const likeMutation = useMutation({
    mutationFn: (postId: number) => apiFetch(`/api/feed/${postId}/like`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const saveMutation = useMutation({
    mutationFn: (postId: number) => apiFetch(`/api/feed/${postId}/save`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const shareMutation = useMutation({
    mutationFn: (postId: number) => apiFetch(`/api/feed/${postId}/share`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      apiFetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: cleanInput(content, 400) }),
      }),
    onSuccess: (_, variables) => {
      setCommentInputs((prev) => ({ ...prev, [variables.postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: (postId: number) =>
      apiFetch<FeedPost>(`/api/feed/${postId}/generate-quiz`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const toggleFriendMutation = useMutation({
    mutationFn: (targetId: number) =>
      apiFetch(`/api/social/friends/${targetId}/toggle`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
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
    },
  });

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthSession(null, null);
    queryClient.clear();
    window.location.href = '/auth';
  };

  const acceptedFriendsCount = friendsList.filter((f) => f.is_friend).length;

  return (
    <div className="min-h-screen bg-[#FAF9FE] text-slate-900">
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onOpenUpload={() => setShowUploadModal(true)}
        />
      )}

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
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
            <Bell className="w-4 h-4" />
          </button>
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-200"
          />
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 py-6">
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 text-center">
            <div className="relative inline-block">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-purple-100"
              />
              <span className="absolute -left-2 top-1 w-7 h-7 rounded-full bg-purple-100 text-[#6D5CAE] flex items-center justify-center text-xs">
                ✦
              </span>
            </div>
            <h3 className="font-bold text-slate-900 mt-3">{user.name}</h3>
            <p className="text-xs text-slate-400">{user.handle}</p>
            <span className="mt-2 inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {user.education_level}
            </span>

            <nav className="mt-6 space-y-1.5 text-left">
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
              onClick={() => setShowOnboarding(true)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ⚙️ Preferences
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

          {/* Instagram-Style Stories Row */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setShowStoryModal(true)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400">
                <img
                  src={user.avatar_url}
                  alt="Your story"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white"
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
                  <img
                    src={st.author_avatar}
                    alt={st.author_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white"
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
            <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4">
              <h2 className="text-lg font-extrabold">Study Peers &amp; Friends</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friendsList.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={peer.avatar_url}
                        alt={peer.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{peer.name}</p>
                        <p className="text-[11px] text-slate-400">{peer.handle}</p>
                        <p className="text-[10px] text-[#6D5CAE] mt-0.5">
                          {peer.preferences.join(' • ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFriendMutation.mutate(peer.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                        peer.is_friend
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-[#1C1B22] text-white'
                      }`}
                    >
                      {peer.is_friend ? 'Friends ✓' : 'Add Friend'}
                    </button>
                  </div>
                ))}
              </div>
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
                {PERSONAS.map((persona) => (
                  <button
                    key={persona}
                    onClick={() => setSelectedPersona(persona)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition ${
                      selectedPersona === persona
                        ? 'bg-[#EFEAFF] text-[#534092] border-purple-200'
                        : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {persona}
                  </button>
                ))}
              </div>

              {/* Feed Posts List */}
              {loadingPosts ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Loading verified study cards...
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => {
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
                          <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white p-6 min-h-[260px] flex flex-col justify-between">
                            {post.image_url && (
                              <img
                                src={post.image_url}
                                alt={post.headline}
                                className="absolute inset-0 w-full h-full object-cover opacity-45"
                              />
                            )}
                            <div className="relative z-10">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                                • {post.series_tag}
                              </span>
                            </div>
                            <div className="relative z-10 mt-16">
                              <p className="text-[10px] uppercase tracking-widest text-slate-300">
                                A LITTLE PERSPECTIVE
                              </p>
                              <h2 className="text-3xl font-serif leading-tight mt-1">
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
                              onClick={() => shareMutation.mutate(post.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold hover:text-slate-900"
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
          {/* Study Stories Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Study stories</h3>
              <button
                onClick={() => setShowStoryModal(true)}
                className="text-[11px] font-semibold text-[#6D5CAE]"
              >
                + Add story
              </button>
            </div>
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
                    <img
                      src={st.author_avatar}
                      alt={st.author_name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[10px] font-semibold text-slate-700 truncate">
                      {st.author_name.split(' ')[0]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Friends ("Your kind of curious") */}
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

            <div className="space-y-3">
              {friendsList.slice(0, 3).map((peer) => (
                <div key={peer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={peer.avatar_url}
                      alt={peer.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
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
          </div>

          {/* A Little Rabbit Hole (Topic Filters) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">A little rabbit hole</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {['Biology', 'Psychology', 'Mathematics', 'Computer Science'].map((topic) => (
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

          {/* Learning Pulse Card */}
          <div className="bg-[#F3EEFF] rounded-3xl p-5 border border-purple-200/60">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#6D5CAE]">
              YOUR LEARNING PULSE
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">Look at you grow.</h3>
            <p className="text-[11px] text-slate-500">Small moments. Real progress.</p>
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-extrabold text-slate-900">
                  {user.cards_learned_this_week}
                </span>
                <span className="text-xs text-slate-600 ml-1">cards learned this week</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-[#534092]">
                ↗ 18%
              </span>
            </div>
          </div>

          {/* On Your Bookshelf (Uploaded Materials) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">On your bookshelf</h3>
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
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                >
                  {['Biology', 'Mathematics', 'Computer Science', 'Psychology', 'Physics', 'Chemistry', 'History'].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
                </select>
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
                  value={storySubject}
                  onChange={(e) => setStorySubject(e.target.value)}
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
            className={`max-w-sm w-full rounded-3xl p-8 bg-gradient-to-br ${activeStory.bg_gradient} shadow-2xl min-h-[420px] flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStory.author_avatar}
                  alt={activeStory.author_name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{activeStory.author_name}</p>
                  <p className="text-[10px] text-slate-600">{activeStory.author_handle}</p>
                </div>
              </div>
              <button onClick={() => setActiveStory(null)}>
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <div className="my-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {activeStory.tag} • {activeStory.subject}
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2 leading-tight">
                {activeStory.title}
              </h2>
            </div>

            <p className="text-[11px] text-slate-600">Skrulla Study Story • 24h</p>
          </div>
        </div>
      )}
    </div>
  );
};
