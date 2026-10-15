import React, { useState } from 'react';
import {
  Users, Search, X, UserCheck, UserPlus, GraduationCap, Award,
  Github, Linkedin, Twitter, Instagram, Globe
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getSocialUrl } from '../lib/format';
import type { FriendUser } from '../types';

interface Props {
  friendsList: FriendUser[];
  isLoading: boolean;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  filterTab: 'all' | 'following' | 'followers';
  onChangeFilterTab: (tab: 'all' | 'following' | 'followers') => void;
  onToggleFriend: (targetId: number) => void;
  isToggling: boolean;
}

export const FriendsDirectory: React.FC<Props> = ({
  friendsList,
  isLoading,
  searchQuery,
  onChangeSearch,
  filterTab,
  onChangeFilterTab,
  onToggleFriend,
  isToggling,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Study Community &amp; Friends
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect with classmates, see their study notes, and learn together.
            </p>
          </div>
          <span className="px-3 py-1 bg-purple-50 text-[#534092] rounded-full text-xs font-bold">
            {friendsList.length} {friendsList.length === 1 ? 'Learner' : 'Learners'}
          </span>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search learners by name or handle (e.g. Alex, @learner)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6D5CAE]/20 focus:border-[#6D5CAE] transition"
          />
          {searchQuery && (
            <button
              onClick={() => onChangeSearch('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 rounded-2xl w-fit">
          {[
            { id: 'all', label: 'All Learners' },
            { id: 'following', label: 'Following' },
            { id: 'followers', label: 'Followers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChangeFilterTab(tab.id as typeof filterTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === tab.id
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
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">
          Discovering study peers...
        </div>
      ) : friendsList.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
          <Users className="w-9 h-9 text-[#6D5CAE]/60 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">
            {searchQuery
              ? `No learners found matching "${searchQuery}"`
              : filterTab === 'following'
              ? "You aren't following anyone yet"
              : filterTab === 'followers'
              ? 'No followers yet'
              : 'No other registered learners yet'}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching by a different name or handle.'
              : filterTab === 'following'
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
                  onClick={() => onToggleFriend(peer.id)}
                  disabled={isToggling}
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
  );
};
