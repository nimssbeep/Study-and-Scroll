import React from 'react';
import {
  Home, Compass, Users, Bookmark, Plus, Settings, LogOut,
  GraduationCap, Calendar, Award, Camera, Globe, Github, Linkedin, Twitter, Instagram
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getSocialUrl } from '../lib/format';
import type { User } from '../types';

interface Props {
  user: User;
  activeNav: 'home' | 'explore' | 'friends' | 'saved';
  friendsCount: number;
  onNavigate: (nav: 'home' | 'explore' | 'friends' | 'saved') => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
  onLogout: () => void;
}

export const SidebarLeft: React.FC<Props> = ({
  user,
  activeNav,
  friendsCount,
  onNavigate,
  onOpenUpload,
  onOpenSettings,
  onOpenOnboarding,
  onLogout,
}) => {
  return (
    <aside className="lg:col-span-3 space-y-6">
      <div className="bg-white rounded-3xl p-5 border border-slate-100 text-center">
        {/* Interactive Profile Picture with Settings Trigger */}
        <div
          className="relative inline-block group cursor-pointer"
          onClick={onOpenSettings}
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
              onOpenSettings();
            }}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#6D5CAE] text-white hover:bg-[#59469B] shadow-md ring-2 ring-white transition"
            title="Profile Settings"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-bold text-slate-900 mt-2">{user.name}</h3>
        <p className="text-xs text-slate-400">@{user.handle.replace(/^@/, '')}</p>

        {/* Education Level & School */}
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

        {/* Birthday */}
        {user.birthday && (
          <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1 mt-1.5">
            <Calendar className="w-3 h-3 text-[#6D5CAE]" />
            <span>Born {user.birthday}</span>
          </p>
        )}

        {/* Bio */}
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
          onClick={onOpenSettings}
          className="mt-3.5 w-full py-2 px-3 rounded-2xl border border-purple-200 hover:border-[#6D5CAE] bg-purple-50/50 hover:bg-purple-100/70 text-[#534092] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <Settings className="w-3.5 h-3.5 text-[#6D5CAE]" /> Edit Profile &amp; Settings
        </button>

        {/* Navigation items */}
        <nav className="mt-5 space-y-1.5 text-left">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'explore', label: 'Explore', icon: Compass },
            { id: 'friends', label: 'Friends', icon: Users, badge: friendsCount },
            { id: 'saved', label: 'Saved', icon: Bookmark },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as typeof activeNav)}
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
          onClick={onOpenUpload}
          className="mt-5 w-full py-3 px-4 rounded-2xl bg-[#EFEaff] hover:bg-[#e3dbfc] text-[#534092] font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Upload materials
        </button>
      </div>

      {/* Inspirational Card */}
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

      {/* Footer controls */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 flex items-center justify-between">
        <button
          onClick={onOpenSettings}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5 text-[#6D5CAE]" /> Settings
        </button>
        <button
          onClick={onOpenOnboarding}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Topics
        </button>
        <button
          onClick={onLogout}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </aside>
  );
};
