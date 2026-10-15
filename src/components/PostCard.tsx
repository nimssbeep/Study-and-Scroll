import React, { useState } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark, ShieldCheck, CheckCircle2
} from 'lucide-react';
import type { FeedPost } from '../types';

interface Props {
  post: FeedPost;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onShare: (post: FeedPost) => void;
  onGenerateQuiz: (postId: number) => void;
  isGeneratingQuiz: boolean;
  onAddComment: (postId: number, content: string) => void;
}

export const PostCard: React.FC<Props> = ({
  post,
  onLike,
  onSave,
  onShare,
  onGenerateQuiz,
  isGeneratingQuiz,
  onAddComment,
}) => {
  const isQuiz = post.post_type === 'quiz';
  const [selectedOption, setSelectedOption] = useState<number | undefined>(undefined);
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <article
      className={`rounded-3xl p-6 border transition shadow-sm ${
        isQuiz ? 'bg-[#FFF9EB] border-amber-200/70' : 'bg-[#EEF2FF]/60 border-indigo-100'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              isQuiz ? 'bg-amber-200/70 text-amber-900' : 'bg-indigo-100 text-[#534092]'
            }`}
          >
            {isQuiz ? '✦' : '📖'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{post.persona}</span>
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
            onClick={() => onGenerateQuiz(post.id)}
            disabled={isGeneratingQuiz}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-[#534092] border border-purple-200 transition disabled:opacity-50"
          >
            {isGeneratingQuiz ? 'Generating...' : '+ Generate Quiz'}
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
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{post.headline}</h3>
          <p className="text-sm text-slate-700 mt-2 font-medium">{post.quiz_question}</p>

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
                  onClick={() => setSelectedOption(idx)}
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
            <p className="text-[10px] uppercase tracking-widest text-slate-400">KEY TAKEAWAY</p>
            <h2 className="text-2xl font-serif leading-tight mt-1">{post.headline}</h2>
          </div>
        </div>
      )}

      {/* Social Action Bar (Like, Comment, Share, Save) */}
      <div className="mt-4 flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments.length}</span>
          </div>
          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-slate-900 transition"
            title="Share this study card"
          >
            <Send className="w-5 h-5" />
            <span>{post.shares_count}</span>
          </button>
        </div>

        <button
          onClick={() => onSave(post.id)}
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

        <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a study comment..."
            className="flex-1 bg-white/90 px-3 py-1.5 rounded-xl text-xs border border-slate-200 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#1C1B22] text-white text-xs font-semibold disabled:opacity-50"
          >
            Post
          </button>
        </form>
      </div>
    </article>
  );
};
