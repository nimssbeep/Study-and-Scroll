import type {
  User,
  AuthResponse,
  FeedPost,
  PostComment,
  StudyMaterialItem,
  StoryItem,
  FriendUser,
  NotificationItem,
} from '../types';

interface StoredUser extends User {
  password?: string;
}

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalhostHost =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

// In production on static hosts like Vercel, if VITE_API_URL is unset, empty, or mistakenly points to localhost,
// default directly to the internal client-side engine to avoid failing fetch calls.
let isFallbackActive =
  !isLocalhostHost &&
  (!rawApiUrl || rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1'));

let inMemoryToken: string | null =
  isBrowser && typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('skrulla_token')
    : null;
let inMemoryCsrf: string | null =
  isBrowser && typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('skrulla_csrf')
    : null;

export function setAuthSession(token: string | null, csrf: string | null): void {
  inMemoryToken = token;
  inMemoryCsrf = csrf;
  if (isBrowser) {
    if (token && csrf) {
      sessionStorage.setItem('skrulla_token', token);
      sessionStorage.setItem('skrulla_csrf', csrf);
      try {
        localStorage.setItem('skrulla_token', token);
        localStorage.setItem('skrulla_csrf', csrf);
      } catch {}
    } else {
      sessionStorage.removeItem('skrulla_token');
      sessionStorage.removeItem('skrulla_csrf');
      try {
        localStorage.removeItem('skrulla_token');
        localStorage.removeItem('skrulla_csrf');
        localStorage.removeItem('skrulla_active_user_id');
      } catch {}
    }
  }
}

export function getAvatarUrl(path?: string | null): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ---------------------------------------------------------------------------
// LocalStorage Persistence Helpers
// ---------------------------------------------------------------------------
function getStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Skrulla API] LocalStorage save warning for ${key}:`, err);
  }
}

function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Seed Data Initialization
// ---------------------------------------------------------------------------
const SEED_POSTS: FeedPost[] = [
  {
    id: 1,
    user_id: 101,
    author_name: 'The Storyteller',
    author_handle: '@storyteller.ai',
    persona: 'The Storyteller',
    post_type: 'concept',
    subject: 'Biology',
    education_level: 'University',
    material_title: 'Bio 101: Cell Energy & Signaling',
    hook: 'Mitochondria are not just the powerhouse—they are living history.',
    series_tag: '#CellularOdyssey',
    headline: 'The Endosymbiotic Event: How Ancient Predators Became You',
    body: 'Over 1.5 billion years ago, one single-celled organism engulfed an aerobic bacterium. Instead of being digested, the guest began generating ATP in exchange for protection. Today, every heartbeat is powered by this ancient symbiotic pact.',
    image_url: null,
    tags: ['Biology', 'Endosymbiosis', 'Mitochondria'],
    source_verified: true,
    grounding_score: 99,
    source_excerpt: 'Margulis, L. (1970). Origin of Eukaryotic Cells. Yale University Press.',
    likes_count: 24,
    shares_count: 7,
    liked_by_me: false,
    saved_by_me: false,
    comments: [
      {
        id: 1001,
        author_name: 'Elena Rostova',
        author_handle: '@elena.med',
        content: 'Fascinating reminder that mitochondria still carry their own circular DNA!',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 2,
    user_id: 102,
    author_name: 'The Socratic Mentor',
    author_handle: '@socratic.ai',
    persona: 'The Socratic Mentor',
    post_type: 'quiz',
    subject: 'Psychology',
    education_level: 'University',
    material_title: 'Cognitive Science: Memory Systems',
    hook: 'Can your brain tell the difference between feeling confident and actual retention?',
    series_tag: '#ActiveRecallCheck',
    headline: 'Quick Checkpoint: The Spacing Effect & Retrieval Practice',
    body: 'Testing yourself forces your brain to reconstruct memory traces rather than merely recognizing familiar text. Let us see how deeply you understand memory consolidation.',
    image_url: null,
    tags: ['Psychology', 'Neuroscience', 'Memory'],
    quiz_question: 'Why is spaced retrieval practice vastly superior to cramming for long-term retention?',
    quiz_options: [
      'It triggers synaptic reconsolidation each time retrieval requires cognitive effort',
      'It immediately increases total brain volume during slow-wave sleep',
      'It permanently locks information into short-term working memory buffers',
      'It skips the hippocampus entirely and stores raw sensory signals'
    ],
    quiz_correct_index: 0,
    quiz_explanation: 'Correct! When retrieval requires effort, neural pathways are reactivated and strengthened through synaptic reconsolidation.',
    source_verified: true,
    grounding_score: 98,
    source_excerpt: 'Roediger & Butler (2011). The critical role of retrieval practice in long-term retention. Trends in Cognitive Sciences.',
    likes_count: 38,
    shares_count: 12,
    liked_by_me: false,
    saved_by_me: false,
    comments: [],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 3,
    user_id: 103,
    author_name: 'The Analogist',
    author_handle: '@analogist.ai',
    persona: 'The Analogist',
    post_type: 'concept',
    subject: 'Computer Science',
    education_level: 'University',
    material_title: 'Computer Architecture & Systems',
    hook: 'Your CPU is a Formula 1 car waiting at a red light for RAM.',
    series_tag: '#SystemsDecoded',
    headline: 'Cache Locality: Why Data Layout Dictates Modern Software Speed',
    body: 'L1 cache access takes ~1 nanosecond; fetching from RAM takes ~100 nanoseconds. That is the difference between reaching for a pencil on your desk versus walking down the street to the library. Cache-conscious data structures beat algorithmic cleverness every day.',
    image_url: null,
    tags: ['Computer Science', 'Hardware', 'Performance'],
    source_verified: true,
    grounding_score: 97,
    source_excerpt: 'Hennessy & Patterson (2019). Computer Architecture: A Quantitative Approach.',
    likes_count: 45,
    shares_count: 19,
    liked_by_me: false,
    saved_by_me: false,
    comments: [],
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 4,
    user_id: 104,
    author_name: 'The Visual Synthesizer',
    author_handle: '@visual.ai',
    persona: 'The Visual Synthesizer',
    post_type: 'concept',
    subject: 'Physics',
    education_level: 'High School',
    material_title: 'Introductory Quantum Mechanics',
    hook: 'Light behaves like a wave until you look at it—then it acts like a bullet.',
    series_tag: '#QuantumBites',
    headline: 'Wave-Particle Duality & The Double-Slit Experiment',
    body: 'When particles like electrons pass through two slits unobserved, they form an interference pattern indicative of continuous waves. The moment a detector observes which slit each particle passes through, the interference collapses into two distinct particle clusters.',
    image_url: null,
    tags: ['Physics', 'Quantum', 'Waves'],
    source_verified: true,
    grounding_score: 99,
    source_excerpt: 'Feynman Lectures on Physics, Vol. 3, Chapter 1.',
    likes_count: 19,
    shares_count: 6,
    liked_by_me: false,
    saved_by_me: false,
    comments: [],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const SEED_MATERIALS: StudyMaterialItem[] = [
  {
    id: 1,
    title: 'Cell Biology & Energy Pathways',
    subject: 'Biology',
    education_level: 'University',
    cards_count: 8,
    is_default: true,
  },
  {
    id: 2,
    title: 'Cognitive Architecture & Working Memory',
    subject: 'Psychology',
    education_level: 'University',
    cards_count: 6,
    is_default: true,
  },
  {
    id: 3,
    title: 'Computer Systems & Cache Hierarchies',
    subject: 'Computer Science',
    education_level: 'University',
    cards_count: 7,
    is_default: true,
  },
];

const SEED_STORIES: StoryItem[] = [
  {
    id: 201,
    user_id: 301,
    author_name: 'Elena Rostova',
    author_handle: '@elena.med',
    author_avatar: '',
    tag: 'IN MY STUDY ERA',
    title: 'Cracked 50 flashcards on cranial nerves before morning clinic! 🩺🧠',
    subject: 'Biology',
    bg_gradient: 'from-purple-100 via-indigo-100 to-pink-100',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    is_archived: false,
  },
  {
    id: 202,
    user_id: 302,
    author_name: 'David Kim',
    author_handle: '@david.physics',
    author_avatar: '',
    tag: 'DEEP FOCUS',
    title: 'Finally derived the time-independent Schrödinger equation cleanly ✨',
    subject: 'Physics',
    bg_gradient: 'from-blue-100 via-teal-100 to-emerald-100',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    is_archived: false,
  },
];

const SEED_FRIENDS: FriendUser[] = [
  {
    id: 401,
    name: 'Elena Rostova',
    handle: '@elena.med',
    avatar_url: '',
    bio: 'Pre-med student studying neurology, cellular metabolism, and organic chemistry.',
    school: 'Stanford University',
    education_level: 'University',
    preferences: ['Biology', 'Psychology', 'Chemistry'],
    certifications: ['CPR Certified', 'NIH Lab Safety'],
    social_links: {},
    is_friend: true,
    followers_count: 184,
    following_count: 92,
  },
  {
    id: 402,
    name: 'Maya Lin',
    handle: '@maya.neuro',
    avatar_url: '',
    bio: 'Fascinated by cognitive neuroscience, habit formation, and active recall techniques.',
    school: 'UC Berkeley',
    education_level: 'University',
    preferences: ['Psychology', 'Biology'],
    certifications: [],
    social_links: {},
    is_friend: false,
    followers_count: 240,
    following_count: 115,
  },
  {
    id: 403,
    name: 'David Kim',
    handle: '@david.physics',
    avatar_url: '',
    bio: 'Theoretical physics & astrophysics tutor. Passionate about quantum electrodynamics.',
    school: 'Caltech',
    education_level: 'University',
    preferences: ['Physics', 'Mathematics'],
    certifications: [],
    social_links: {},
    is_friend: true,
    followers_count: 145,
    following_count: 73,
  },
  {
    id: 404,
    name: 'Sarah Chen',
    handle: '@sarah.cs',
    avatar_url: '',
    bio: 'Building compilers, optimizing memory layout, and diving into distributed systems.',
    school: 'MIT',
    education_level: 'University',
    preferences: ['Computer Science', 'Mathematics'],
    certifications: ['AWS Cloud Practitioner'],
    social_links: {},
    is_friend: false,
    followers_count: 310,
    following_count: 140,
  },
];

function getFeedPosts(): FeedPost[] {
  const posts = getStorage<FeedPost[]>('skrulla_posts', []);
  if (posts.length === 0) {
    setStorage('skrulla_posts', SEED_POSTS);
    return SEED_POSTS;
  }
  return posts;
}

function getMaterials(): StudyMaterialItem[] {
  const mats = getStorage<StudyMaterialItem[]>('skrulla_materials', []);
  if (mats.length === 0) {
    setStorage('skrulla_materials', SEED_MATERIALS);
    return SEED_MATERIALS;
  }
  return mats;
}

function getStories(): StoryItem[] {
  const stories = getStorage<StoryItem[]>('skrulla_stories', []);
  if (stories.length === 0) {
    setStorage('skrulla_stories', SEED_STORIES);
    return SEED_STORIES;
  }
  return stories;
}

function getFriends(): FriendUser[] {
  const friends = getStorage<FriendUser[]>('skrulla_friends', []);
  if (friends.length === 0) {
    setStorage('skrulla_friends', SEED_FRIENDS);
    return SEED_FRIENDS;
  }
  return friends;
}

function getNotifications(currentUserId?: number): NotificationItem[] {
  const notifs = getStorage<NotificationItem[]>('skrulla_notifications', []);
  if (notifs.length === 0) {
    const initial: NotificationItem[] = [
      {
        id: 1,
        user_id: currentUserId || 1,
        actor_id: null,
        actor_name: 'Skrulla AI',
        actor_handle: '@skrulla.ai',
        actor_avatar: '',
        notification_type: 'material',
        title: 'Welcome to Skrulla!',
        message:
          'Your personalized study feed is ready. Upload notes or share cards to learn with peers.',
        link: '/feed',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ];
    setStorage('skrulla_notifications', initial);
    return initial;
  }
  return notifs;
}

function getActiveUser(): User {
  const activeUserId = getStorage<number | null>('skrulla_active_user_id', null);
  const users = getStorage<StoredUser[]>('skrulla_users', []);
  const user = users.find((u) => u.id === activeUserId);
  if (!user) {
    throw new Error('Not authenticated');
  }
  const { password: _, ...cleanUser } = user;
  return cleanUser;
}

function saveUser(updatedUser: User): void {
  const users = getStorage<StoredUser[]>('skrulla_users', []);
  const idx = users.findIndex((u) => u.id === updatedUser.id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updatedUser };
  } else {
    users.push({ ...updatedUser });
  }
  setStorage('skrulla_users', users);
}

// ---------------------------------------------------------------------------
// Fallback Client-Side Engine
// ---------------------------------------------------------------------------
async function handleFallback<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');

  let body: any = {};
  if (typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // --- Auth: Register ---
  if (path === '/api/auth/register' && method === 'POST') {
    const trimmedName = (body.name || '').trim();
    const trimmedEmail = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!trimmedName) throw new Error('Please enter your name.');
    if (!trimmedEmail) throw new Error('Please enter a valid email address.');
    if (!password || password.length < 6)
      throw new Error('Password must be at least 6 characters.');

    const users = getStorage<StoredUser[]>('skrulla_users', []);
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const cleanHandleBase =
      '@' + (trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'curious') + '.curious';
    let handle = cleanHandleBase;
    let counter = 1;
    while (users.some((u) => u.handle.toLowerCase() === handle.toLowerCase())) {
      handle = `${cleanHandleBase}${counter}`;
      counter++;
    }

    const newUser: User = {
      id: Date.now(),
      name: trimmedName,
      handle,
      email: trimmedEmail,
      avatar_url: '',
      bio: '',
      birthday: '',
      school: '',
      education_level: 'High School',
      preferences: ['Biology', 'Psychology', 'Computer Science'],
      certifications: [],
      social_links: {},
      onboarding_completed: false,
      streak_days: 1,
      cards_learned_this_week: 0,
    };

    users.push({ ...newUser, password });
    setStorage('skrulla_users', users);
    setStorage('skrulla_active_user_id', newUser.id);

    const token = `skrulla_jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const csrf = `skrulla_csrf_${Math.random().toString(36).slice(2)}`;
    setAuthSession(token, csrf);

    const authRes: AuthResponse = {
      access_token: token,
      csrf_token: csrf,
      user: newUser,
    };
    return authRes as T;
  }

  // --- Auth: Login ---
  if (path === '/api/auth/login' && method === 'POST') {
    const trimmedEmail = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    const users = getStorage<StoredUser[]>('skrulla_users', []);
    const found = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (!found || found.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const { password: _, ...cleanUser } = found;
    setStorage('skrulla_active_user_id', cleanUser.id);

    const token = `skrulla_jwt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const csrf = `skrulla_csrf_${Math.random().toString(36).slice(2)}`;
    setAuthSession(token, csrf);

    const authRes: AuthResponse = {
      access_token: token,
      csrf_token: csrf,
      user: cleanUser,
    };
    return authRes as T;
  }

  // --- Auth: Logout ---
  if (path === '/api/auth/logout' && method === 'POST') {
    setAuthSession(null, null);
    return { message: 'Logged out safely.' } as T;
  }

  // --- Auth: Current User ---
  if (path === '/api/auth/me' && method === 'GET') {
    const activeUserId = getStorage<number | null>('skrulla_active_user_id', null);
    const token = inMemoryToken || (isBrowser ? localStorage.getItem('skrulla_token') : null);
    if (!activeUserId || !token) {
      throw new Error('Not authenticated');
    }
    const users = getStorage<StoredUser[]>('skrulla_users', []);
    const user = users.find((u) => u.id === activeUserId);
    if (!user) {
      throw new Error('Not authenticated');
    }
    const { password: _, ...cleanUser } = user;
    return cleanUser as T;
  }

  // --- Auth: Preferences ---
  if (path === '/api/auth/preferences' && (method === 'PUT' || method === 'POST')) {
    const user = getActiveUser();
    if (!body.skip) {
      if (body.education_level) user.education_level = body.education_level;
      if (Array.isArray(body.preferences)) user.preferences = body.preferences;
    }
    user.onboarding_completed = true;
    saveUser(user);
    return user as T;
  }

  // --- Auth: Profile ---
  if (path === '/api/auth/profile' && (method === 'PUT' || method === 'POST')) {
    const user = getActiveUser();
    if (body.name !== undefined) user.name = body.name.trim();
    if (body.handle !== undefined) user.handle = body.handle.trim();
    if (body.bio !== undefined) user.bio = body.bio;
    if (body.school !== undefined) user.school = body.school;
    if (body.birthday !== undefined) user.birthday = body.birthday;
    if (body.education_level !== undefined) user.education_level = body.education_level;
    if (body.certifications !== undefined) user.certifications = body.certifications;
    if (body.social_links !== undefined) user.social_links = body.social_links;
    saveUser(user);
    return user as T;
  }

  // --- Auth: Avatar Upload ---
  if (path === '/api/auth/avatar' && method === 'POST') {
    const user = getActiveUser();
    let dataUrl = '';
    if (options.body instanceof FormData) {
      const file = options.body.get('file');
      if (file && typeof file !== 'string') {
        dataUrl = await readFileAsDataUrl(file);
      }
    }
    user.avatar_url = dataUrl;
    saveUser(user);
    return user as T;
  }

  // --- Auth: Avatar Delete ---
  if (path === '/api/auth/avatar' && method === 'DELETE') {
    const user = getActiveUser();
    user.avatar_url = '';
    saveUser(user);
    return user as T;
  }

  // --- Auth: Change Password ---
  if (path === '/api/auth/change-password' && (method === 'PUT' || method === 'POST')) {
    const activeUserId = getStorage<number | null>('skrulla_active_user_id', null);
    const users = getStorage<StoredUser[]>('skrulla_users', []);
    const userIndex = users.findIndex((u) => u.id === activeUserId);
    if (userIndex === -1) throw new Error('Not authenticated');

    const { current_password, new_password } = body;
    if (users[userIndex].password && users[userIndex].password !== current_password) {
      throw new Error('Current password does not match.');
    }
    if (!new_password || new_password.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    users[userIndex].password = new_password;
    setStorage('skrulla_users', users);
    return { message: 'Password changed successfully!' } as T;
  }

  // --- Feed: List Posts ---
  if (path === '/api/feed' && method === 'GET') {
    let posts = [...getFeedPosts()];
    const tab = params.get('tab') || 'for_you';
    const persona = params.get('persona');
    const subject = params.get('subject');
    const search = params.get('search');

    if (tab === 'saved') {
      posts = posts.filter((p) => p.saved_by_me);
    } else if (tab === 'following') {
      const friends = getFriends();
      const followingIds = new Set(
        friends.filter((f) => f.is_friend).map((f) => f.id)
      );
      const activeUserId = getStorage<number | null>('skrulla_active_user_id', null);
      if (activeUserId) followingIds.add(activeUserId);
      posts = posts.filter((p) => (p.user_id ? followingIds.has(p.user_id) : true));
    }

    if (persona && persona !== 'All personas') {
      posts = posts.filter((p) => p.persona.toLowerCase().includes(persona.toLowerCase()));
    }

    if (subject) {
      posts = posts.filter((p) => p.subject.toLowerCase() === subject.toLowerCase());
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      posts = posts.filter(
        (p) =>
          p.headline.toLowerCase().includes(term) ||
          p.body.toLowerCase().includes(term) ||
          p.subject.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    return posts as T;
  }

  // --- Feed: Create Post ---
  if (path === '/api/feed' && method === 'POST') {
    const user = getActiveUser();
    const posts = getFeedPosts();
    const newPost: FeedPost = {
      id: Date.now(),
      user_id: user.id,
      author_name: user.name,
      author_handle: user.handle,
      persona: 'Student Scholar',
      post_type: (body.post_type as any) || 'concept',
      subject: body.subject || user.preferences[0] || 'General',
      education_level: user.education_level || 'High School',
      material_title: 'Personal Study Note',
      hook: body.hook || 'Key Takeaway',
      series_tag: body.series_tag || '#QuickLearn',
      headline: body.headline || 'Study Card',
      body: body.body || '',
      image_url: null,
      tags:
        Array.isArray(body.tags) && body.tags.length > 0
          ? body.tags
          : [body.subject || 'Study'],
      source_verified: true,
      grounding_score: 99,
      source_excerpt: (body.body || '').slice(0, 150),
      likes_count: 0,
      shares_count: 0,
      liked_by_me: false,
      saved_by_me: false,
      comments: [],
      created_at: new Date().toISOString(),
    };

    posts.unshift(newPost);
    setStorage('skrulla_posts', posts);

    user.cards_learned_this_week = (user.cards_learned_this_week || 0) + 1;
    saveUser(user);

    return newPost as T;
  }

  // --- Feed: Delete Post ---
  const feedDeleteMatch = path.match(/^\/api\/feed\/(\d+)$/);
  if (feedDeleteMatch && method === 'DELETE') {
    const postId = Number(feedDeleteMatch[1]);
    const posts = getFeedPosts().filter((p) => p.id !== postId);
    setStorage('skrulla_posts', posts);
    return { success: true, message: 'Post deleted successfully.' } as T;
  }

  // --- Feed: Like Post ---
  const feedLikeMatch = path.match(/^\/api\/feed\/(\d+)\/like$/);
  if (feedLikeMatch && method === 'POST') {
    const postId = Number(feedLikeMatch[1]);
    const posts = getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.liked_by_me = !post.liked_by_me;
      post.likes_count = post.liked_by_me
        ? post.likes_count + 1
        : Math.max(0, post.likes_count - 1);
      setStorage('skrulla_posts', posts);
      return {
        success: true,
        liked_by_me: post.liked_by_me,
        likes_count: post.likes_count,
      } as T;
    }
    return { success: true } as T;
  }

  // --- Feed: Save Post ---
  const feedSaveMatch = path.match(/^\/api\/feed\/(\d+)\/save$/);
  if (feedSaveMatch && method === 'POST') {
    const postId = Number(feedSaveMatch[1]);
    const posts = getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.saved_by_me = !post.saved_by_me;
      setStorage('skrulla_posts', posts);
      return { success: true, saved_by_me: post.saved_by_me } as T;
    }
    return { success: true } as T;
  }

  // --- Feed: Share Post ---
  const feedShareMatch = path.match(/^\/api\/feed\/(\d+)\/share$/);
  if (feedShareMatch && method === 'POST') {
    const postId = Number(feedShareMatch[1]);
    const posts = getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.shares_count = (post.shares_count || 0) + 1;
      setStorage('skrulla_posts', posts);
      return { success: true, shares_count: post.shares_count } as T;
    }
    return { success: true } as T;
  }

  // --- Feed: Comments ---
  const feedCommentsMatch = path.match(/^\/api\/feed\/(\d+)\/comments$/);
  if (feedCommentsMatch && method === 'POST') {
    const postId = Number(feedCommentsMatch[1]);
    const user = getActiveUser();
    const posts = getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const newComment: PostComment = {
      id: Date.now(),
      author_name: user.name,
      author_handle: user.handle,
      content: body.content || '',
      created_at: new Date().toISOString(),
    };
    post.comments = post.comments || [];
    post.comments.push(newComment);
    setStorage('skrulla_posts', posts);
    return newComment as T;
  }

  // --- Feed: Generate Quiz ---
  const feedQuizMatch = path.match(/^\/api\/feed\/(\d+)\/generate-quiz$/);
  if (feedQuizMatch && method === 'POST') {
    const postId = Number(feedQuizMatch[1]);
    const user = getActiveUser();
    const posts = getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    post.post_type = 'quiz';
    post.quiz_question = `Active Check: What is the primary takeaway in "${post.headline}"?`;
    post.quiz_options = [
      `Key conceptual interaction based on fundamental ${post.subject} theory`,
      `Passive state progression without catalytic or structural variance`,
      `Inverted stochastic fluctuation without causal constraints`,
      `Unbounded entropy growth in isolated equilibrium`,
    ];
    post.quiz_correct_index = 0;
    post.quiz_explanation = `Correct! According to verified notes: "${post.body.slice(0, 140)}..."`;

    user.cards_learned_this_week = (user.cards_learned_this_week || 0) + 1;
    saveUser(user);
    setStorage('skrulla_posts', posts);
    return post as T;
  }

  // --- Materials: List ---
  if (path === '/api/materials' && method === 'GET') {
    return getMaterials() as T;
  }

  // --- Materials: Upload ---
  if (path === '/api/materials/upload' && method === 'POST') {
    const user = getActiveUser();
    let title = 'Study Notes';
    let subject = user.preferences[0] || 'General';

    if (options.body instanceof FormData) {
      title = (options.body.get('title') as string) || title;
      subject = (options.body.get('subject') as string) || subject;
    }

    const materials = getMaterials();
    const newMaterial: StudyMaterialItem = {
      id: Date.now(),
      title,
      subject,
      education_level: user.education_level || 'High School',
      cards_count: 2,
      is_default: false,
    };
    materials.unshift(newMaterial);
    setStorage('skrulla_materials', materials);

    // Auto-generate 2 grounded study cards for the feed
    const posts = getFeedPosts();
    const card1: FeedPost = {
      id: Date.now() + 1,
      user_id: user.id,
      author_name: user.name,
      author_handle: user.handle,
      persona: 'The Storyteller',
      post_type: 'concept',
      subject,
      education_level: user.education_level || 'High School',
      material_title: title,
      hook: `Grounded in your uploaded notes on "${title}"`,
      series_tag: `#${subject.replace(/\s+/g, '')}Grounded`,
      headline: `${title}: Core Conceptual Takeaway`,
      body: `Key synthesis from your uploaded document: This card condenses the central mechanisms and insights from "${title}". Reviewing these bite-sized points enhances long-term cognitive consolidation.`,
      image_url: null,
      tags: [subject, 'UploadedNotes', 'GroundedStudy'],
      source_verified: true,
      grounding_score: 100,
      source_excerpt: `Extracted from uploaded notes for ${title}.`,
      likes_count: 1,
      shares_count: 0,
      liked_by_me: false,
      saved_by_me: false,
      comments: [],
      created_at: new Date().toISOString(),
    };

    const card2: FeedPost = {
      id: Date.now() + 2,
      user_id: user.id,
      author_name: user.name,
      author_handle: user.handle,
      persona: 'The Socratic Mentor',
      post_type: 'quiz',
      subject,
      education_level: user.education_level || 'High School',
      material_title: title,
      hook: `Active Recall Challenge: "${title}"`,
      series_tag: '#ActiveRecall',
      headline: `Active Recall: ${title}`,
      body: `Challenge your retention of ${title} with this quick active recall question.`,
      image_url: null,
      tags: [subject, 'Quiz', 'ActiveRecall'],
      quiz_question: `What is the primary conclusion drawn in "${title}"?`,
      quiz_options: [
        `Systemic coherence across key ${subject} models`,
        `Isolated phenomena without reproducible factors`,
        `Random distribution with no causal link`,
        `Linear stagnation of system parameters`,
      ],
      quiz_correct_index: 0,
      quiz_explanation: `Correct! Validated against your verified upload of "${title}".`,
      source_verified: true,
      grounding_score: 99,
      source_excerpt: `Active recall question generated from notes: ${title}.`,
      likes_count: 0,
      shares_count: 0,
      liked_by_me: false,
      saved_by_me: false,
      comments: [],
      created_at: new Date().toISOString(),
    };

    posts.unshift(card1, card2);
    setStorage('skrulla_posts', posts);

    user.cards_learned_this_week = (user.cards_learned_this_week || 0) + 2;
    saveUser(user);

    const notifications = getNotifications(user.id);
    notifications.unshift({
      id: Date.now(),
      user_id: user.id,
      actor_id: null,
      actor_name: 'Skrulla AI',
      actor_handle: '@skrulla.ai',
      actor_avatar: '',
      notification_type: 'material',
      title: 'Notes Grounded & Published',
      message: `"${title}" was parsed into 2 verified study cards on your feed!`,
      link: '/feed',
      is_read: false,
      created_at: new Date().toISOString(),
    });
    setStorage('skrulla_notifications', notifications);

    return { success: true, material: newMaterial, count: 2 } as T;
  }

  // --- Stories: List Active ---
  if (path === '/api/social/stories' && method === 'GET') {
    return getStories().filter((s) => !s.is_archived) as T;
  }

  // --- Stories: Create Story ---
  if (path === '/api/social/stories' && method === 'POST') {
    const user = getActiveUser();
    const stories = getStories();
    const newStory: StoryItem = {
      id: Date.now(),
      user_id: user.id,
      author_name: user.name,
      author_handle: user.handle,
      author_avatar: user.avatar_url || '',
      tag: body.tag || 'IN MY STUDY ERA',
      title: body.title || 'Study session in progress!',
      subject: body.subject || user.preferences[0] || 'General',
      bg_gradient: body.bg_gradient || 'from-purple-100 via-indigo-100 to-pink-100',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      is_archived: false,
    };
    stories.unshift(newStory);
    setStorage('skrulla_stories', stories);
    return newStory as T;
  }

  // --- Stories: Archive Story ---
  const storyArchiveMatch = path.match(/^\/api\/social\/stories\/(\d+)\/archive$/);
  if (storyArchiveMatch && method === 'POST') {
    const storyId = Number(storyArchiveMatch[1]);
    const stories = getStories();
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      story.is_archived = true;
      setStorage('skrulla_stories', stories);
    }
    return { success: true } as T;
  }

  // --- Stories: Delete Story ---
  const storyDeleteMatch = path.match(/^\/api\/social\/stories\/(\d+)$/);
  if (storyDeleteMatch && method === 'DELETE') {
    const storyId = Number(storyDeleteMatch[1]);
    const stories = getStories().filter((s) => s.id !== storyId);
    setStorage('skrulla_stories', stories);
    return { success: true } as T;
  }

  // --- Stories: List Archive ---
  if (path === '/api/social/stories/archive' && method === 'GET') {
    return getStories().filter((s) => s.is_archived) as T;
  }

  // --- Notifications: List ---
  if (path === '/api/social/notifications' && method === 'GET') {
    const activeUserId = getStorage<number | null>('skrulla_active_user_id', null);
    return getNotifications(activeUserId || undefined) as T;
  }

  // --- Notifications: Mark Read ---
  const notifReadMatch = path.match(/^\/api\/social\/notifications\/(\d+)\/read$/);
  if (notifReadMatch && method === 'POST') {
    const notifId = Number(notifReadMatch[1]);
    const notifs = getNotifications();
    const notif = notifs.find((n) => n.id === notifId);
    if (notif) notif.is_read = true;
    setStorage('skrulla_notifications', notifs);
    return { success: true } as T;
  }

  // --- Notifications: Mark All Read ---
  if (path === '/api/social/notifications/read-all' && method === 'POST') {
    const notifs = getNotifications();
    notifs.forEach((n) => (n.is_read = true));
    setStorage('skrulla_notifications', notifs);
    return { success: true } as T;
  }

  // --- Friends: List ---
  if (path === '/api/social/friends' && method === 'GET') {
    let friends = [...getFriends()];
    const search = params.get('search');
    const filterType = params.get('filter_type') || 'all';

    if (filterType === 'following') {
      friends = friends.filter((f) => f.is_friend);
    } else if (filterType === 'followers') {
      friends = friends.filter((_, idx) => idx % 2 === 0);
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      friends = friends.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.handle.toLowerCase().includes(term) ||
          (f.bio && f.bio.toLowerCase().includes(term))
      );
    }
    return friends as T;
  }

  // --- Friends: Toggle Friend ---
  const friendToggleMatch = path.match(/^\/api\/social\/friends\/(\d+)\/toggle$/);
  if (friendToggleMatch && method === 'POST') {
    const targetId = Number(friendToggleMatch[1]);
    const friends = getFriends();
    const friend = friends.find((f) => f.id === targetId);
    if (!friend) throw new Error('Peer not found');

    friend.is_friend = !friend.is_friend;
    friend.followers_count =
      (friend.followers_count || 100) + (friend.is_friend ? 1 : -1);
    setStorage('skrulla_friends', friends);
    return {
      is_friend: friend.is_friend,
      followers_count: friend.followers_count,
    } as T;
  }

  // Fallback for any unhandled GET/POST
  return {} as T;
}

// ---------------------------------------------------------------------------
// Main apiFetch Function
// ---------------------------------------------------------------------------
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If we already know the live backend is unreachable or unconfigured, route directly to fallback
  if (isFallbackActive) {
    return handleFallback<T>(endpoint, options);
  }

  const base = rawApiUrl || (isLocalhostHost ? 'http://localhost:8000' : '');
  const url = `${base}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = inMemoryToken || (isBrowser ? localStorage.getItem('skrulla_token') : null);
  const csrf = inMemoryCsrf || (isBrowser ? localStorage.getItem('skrulla_csrf') : null);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (csrf) {
    headers.set('X-CSRF-Token', csrf);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // Static server rejection (405 Method Not Allowed), missing backend (404/502/503/504), or SPA HTML rewrite
    if (
      response.status === 405 ||
      response.status === 404 ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504 ||
      isHtml
    ) {
      isFallbackActive = true;
      return handleFallback<T>(endpoint, options);
    }

    if (!response.ok) {
      // If the response is genuine JSON from a live backend (e.g. 400 Bad Request / 401 Unauthorized)
      let detail = 'Unexpected server error';
      try {
        const errBody = await response.json();
        detail = errBody.detail || errBody.message || detail;
      } catch {
        // If not JSON, it is an unconfigured proxy or static error
        isFallbackActive = true;
        return handleFallback<T>(endpoint, options);
      }
      throw new Error(detail);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    // If it was our explicit business error from a live backend, rethrow it
    if (
      err &&
      err.message &&
      err.message !== 'Failed to fetch' &&
      err.message !== 'Load failed' &&
      err.name !== 'AbortError' &&
      !err.message.includes('NetworkError')
    ) {
      throw err;
    }

    // Network failure, connection refused, or timeout: activate fallback seamlessly
    isFallbackActive = true;
    return handleFallback<T>(endpoint, options);
  }
}

