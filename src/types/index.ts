export type EducationLevel = 'High School' | 'University';

export interface User {
  id: number;
  name: string;
  handle: string;
  email: string;
  avatar_url: string;
  education_level: EducationLevel;
  preferences: string[];
  onboarding_completed: boolean;
  streak_days: number;
  cards_learned_this_week: number;
}

export interface AuthResponse {
  access_token: string;
  csrf_token: string;
  user: User;
}

export interface PostComment {
  id: number;
  author_name: string;
  author_handle: string;
  content: string;
  created_at: string;
}

export interface FeedPost {
  id: number;
  persona: string;
  post_type: 'concept' | 'quiz';
  subject: string;
  education_level: string;
  material_title: string;
  hook: string;
  series_tag: string;
  headline: string;
  body: string;
  image_url?: string | null;
  tags: string[];
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  quiz_correct_index?: number | null;
  quiz_explanation?: string | null;
  source_verified: boolean;
  grounding_score: number;
  source_excerpt: string;
  likes_count: number;
  shares_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  comments: PostComment[];
  created_at: string;
}

export interface StudyMaterialItem {
  id: number;
  title: string;
  subject: string;
  education_level: string;
  cards_count: number;
  is_default: boolean;
}

export interface StoryItem {
  id: number;
  user_id: number;
  author_name: string;
  author_handle: string;
  author_avatar: string;
  tag: string;
  title: string;
  subject: string;
  bg_gradient: string;
  created_at: string;
}

export interface FriendUser {
  id: number;
  name: string;
  handle: string;
  avatar_url: string;
  education_level: string;
  preferences: string[];
  is_friend: boolean;
  followers_count?: number;
  following_count?: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  actor_id?: number | null;
  actor_name?: string | null;
  actor_handle?: string | null;
  actor_avatar?: string | null;
  notification_type: 'like' | 'comment' | 'follow' | 'quiz' | 'material' | string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}
