import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Archive, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cleanInput } from '../lib/sanitize';
import { formatTimeAgo, formatRemainingTime } from '../lib/format';
import { UserAvatar } from './UserAvatar';
import type { StoryItem, User } from '../types';

interface CreateStoryModalProps {
  isOpen: boolean;
  defaultSubject: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  defaultSubject,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [storyTitle, setStoryTitle] = useState('');
  const [storySubject, setStorySubject] = useState(defaultSubject);

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
      onClose();
      setStoryTitle('');
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      onSuccess('Story published! Live for 24 hours.');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900">Share a Study Story</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
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
              placeholder="e.g., Finally mastered Eigenvalues &amp; Eigenvectors!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] resize-none"
              rows={3}
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
            />
          </div>
          <button
            type="submit"
            disabled={createStoryMutation.isPending}
            className="w-full py-3 rounded-xl bg-[#6D5CAE] text-white text-xs font-bold hover:bg-[#584699] disabled:opacity-50 transition shadow-sm"
          >
            {createStoryMutation.isPending ? 'Publishing Story...' : 'Publish Story'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface ViewStoryModalProps {
  story: StoryItem | null;
  currentUser: User;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ViewStoryModal: React.FC<ViewStoryModalProps> = ({
  story,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: number) =>
      apiFetch(`/api/social/stories/${storyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      onSuccess('Story deleted.');
    },
  });

  const archiveStoryMutation = useMutation({
    mutationFn: (storyId: number) =>
      apiFetch(`/api/social/stories/${storyId}/archive`, { method: 'POST' }),
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      onSuccess('Story moved to your archive.');
    },
  });

  if (!story) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-w-sm w-full rounded-3xl p-8 bg-gradient-to-br ${story.bg_gradient} shadow-2xl min-h-[440px] flex flex-col justify-between relative`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              name={story.author_name}
              avatarUrl={story.author_avatar}
              size="sm"
              className="ring-2 ring-white"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">{story.author_name}</p>
              <p className="text-[10px] text-slate-600">{story.author_handle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {story.user_id === currentUser.id && (
              <>
                {!story.is_archived && (
                  <button
                    type="button"
                    onClick={() => archiveStoryMutation.mutate(story.id)}
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
                    if (window.confirm('Are you sure you want to delete this story?')) {
                      deleteStoryMutation.mutate(story.id);
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
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="my-auto py-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {story.tag} • {story.subject}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2 leading-tight">
            {story.title}
          </h2>
        </div>

        <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[11px] text-slate-700">
          <span>{formatTimeAgo(story.created_at)}</span>
          <span className="font-bold px-2.5 py-0.5 rounded-full bg-white/70 shadow-sm text-slate-800">
            {story.is_archived ? 'Archived Story' : formatRemainingTime(story.expires_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface StoryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (st: StoryItem) => void;
  onSuccess: (msg: string) => void;
}

export const StoryArchiveModal: React.FC<StoryArchiveModalProps> = ({
  isOpen,
  onClose,
  onSelectStory,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const { data: storyArchive = [], isLoading } = useQueryClient().getQueryData<StoryItem[]>([
    'story_archive',
  ])
    ? { data: queryClient.getQueryData<StoryItem[]>(['story_archive']) || [], isLoading: false }
    : { data: [], isLoading: false };

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: number) =>
      apiFetch(`/api/social/stories/${storyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['story_archive'] });
      onSuccess('Story deleted from archive.');
    },
  });

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading your archived stories...
            </div>
          ) : storyArchive.length === 0 ? (
            <div className="py-12 text-center px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No archived stories yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                When your study stories reach their 24-hour limit, they are saved here so you never
                lose your study history.
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
                        if (window.confirm('Permanently delete this archived story?')) {
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
                    onClick={() => {
                      onSelectStory(st);
                      onClose();
                    }}
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
