import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, Send, Tag } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { cleanInput } from '../lib/sanitize';
import type { User, FeedPost } from '../types';

interface Props {
  isOpen: boolean;
  currentUser: User;
  defaultSubject: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const SERIES_PRESETS = [
  'STUDY NOTES',
  'KEY TAKEAWAY',
  'EXAM PREP',
  'BRAIN DUMP',
  'CODING SNIPPET',
  'QUICK SUMMARY',
];

export const CreatePostModal: React.FC<Props> = ({
  isOpen,
  currentUser,
  defaultSubject,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [headline, setHeadline] = useState('');
  const [subject, setSubject] = useState(defaultSubject || currentUser.preferences[0] || 'Computer Science');
  const [body, setBody] = useState('');
  const [hook, setHook] = useState('');
  const [seriesTag, setSeriesTag] = useState('STUDY NOTES');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createPostMutation = useMutation({
    mutationFn: (payload: {
      headline: string;
      subject: string;
      body: string;
      hook?: string;
      series_tag?: string;
      tags?: string[];
      post_type?: string;
    }) =>
      apiFetch<FeedPost>('/api/feed', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      onClose();
      setHeadline('');
      setBody('');
      setHook('');
      setTagsInput('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onSuccess('Study post published to the feed!');
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to publish post.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanHead = cleanInput(headline, 220);
    const cleanSubj = cleanInput(subject, 60);
    const cleanBdy = cleanInput(body, 3000);

    if (cleanHead.length < 2) {
      setError('Please provide a title or headline (minimum 2 characters).');
      return;
    }
    if (cleanBdy.length < 3) {
      setError('Please provide content or notes for your post.');
      return;
    }

    const tagsList = tagsInput
      .split(',')
      .map((t) => cleanInput(t.trim(), 30))
      .filter(Boolean);

    createPostMutation.mutate({
      headline: cleanHead,
      subject: cleanSubj,
      body: cleanBdy,
      hook: hook.trim() ? cleanInput(hook, 280) : undefined,
      series_tag: seriesTag,
      tags: tagsList.length ? tagsList : [cleanSubj],
      post_type: 'concept',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-indigo-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D5CAE] to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Create Study Post
              </h3>
              <p className="text-xs text-slate-400">
                Share what you just learned or summarized with other learners
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Subject & Series Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject / Topic
              </label>
              <input
                type="text"
                required
                list="subject-options"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Calculus, History"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Series Tag
              </label>
              <input
                type="text"
                list="series-presets"
                value={seriesTag}
                onChange={(e) => setSeriesTag(e.target.value)}
                placeholder="STUDY NOTES"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
              />
              <datalist id="series-presets">
                {SERIES_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Headline / Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Headline / Main Takeaway
            </label>
            <input
              type="text"
              required
              maxLength={220}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. The 3 Laws of Thermodynamics Explained Simply"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] font-medium"
            />
          </div>

          {/* Hook / Catchy Question (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quick Hook <span className="text-slate-400 font-normal">(Optional summary)</span>
            </label>
            <input
              type="text"
              maxLength={280}
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="e.g. Ever wonder why heat flows only one way? Here is why:"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
            />
          </div>

          {/* Notes / Body Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Notes &amp; Explanation
              </label>
              <span className="text-[10px] text-slate-400">{body.length}/3000</span>
            </div>
            <textarea
              required
              rows={5}
              maxLength={3000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your study notes, key principles, formulas, definitions, or steps here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Tags <span className="text-slate-400 font-normal">(Comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Physics, Entropy, Thermodynamics"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE]"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isPending || !headline.trim() || !body.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#6D5CAE] text-white font-bold text-xs hover:bg-[#584699] disabled:opacity-50 transition shadow-md shadow-purple-200 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {createPostMutation.isPending ? 'Publishing Post...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
