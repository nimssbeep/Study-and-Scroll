import React from 'react';
import { Sparkles, Archive, Plus, ShieldCheck } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import type { User, StoryItem, FriendUser, StudyMaterialItem } from '../types';

interface Props {
  user: User;
  stories: StoryItem[];
  friendsList: FriendUser[];
  subjectOptions: string[];
  selectedSubject: string | null;
  materials: StudyMaterialItem[];
  onOpenStoryModal: () => void;
  onOpenArchiveModal: () => void;
  onSelectStory: (st: StoryItem) => void;
  onOpenFriends: () => void;
  onToggleFriend: (targetId: number) => void;
  onSelectSubject: (subj: string | null) => void;
  onOpenUpload: () => void;
}

export const SidebarRight: React.FC<Props> = ({
  user,
  stories,
  friendsList,
  subjectOptions,
  selectedSubject,
  materials,
  onOpenStoryModal,
  onOpenArchiveModal,
  onSelectStory,
  onOpenFriends,
  onToggleFriend,
  onSelectSubject,
  onOpenUpload,
}) => {
  return (
    <aside className="lg:col-span-3 space-y-6">
      {/* Study Stories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900">Study stories</h3>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenArchiveModal}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
              title="View your archived stories (24h+)"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
            <button
              type="button"
              onClick={onOpenStoryModal}
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
              onClick={onOpenStoryModal}
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
                onClick={() => onSelectStory(st)}
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
            onClick={onOpenFriends}
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
                    <p className="text-[10px] text-slate-400">@{peer.handle.replace(/^@/, '')}</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleFriend(peer.id)}
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
                  onSelectSubject(selectedSubject === topic ? null : topic)
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
                onClick={() => onSelectSubject(m.subject)}
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
          onClick={onOpenUpload}
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
  );
};
