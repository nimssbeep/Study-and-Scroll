import React, { useState } from 'react';
import { BookOpen, Zap, Bell, Settings } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { NotificationsPopover } from './NotificationsPopover';
import type { User, NotificationItem } from '../types';

interface Props {
  user: User;
  notifications: NotificationItem[];
  onOpenSettings: () => void;
  onOpenFriends: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  notifications,
  onOpenSettings,
  onOpenFriends,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
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

        {/* Notifications Popover */}
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

          <NotificationsPopover
            notifications={notifications}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onOpenFriends={onOpenFriends}
          />
        </div>

        {/* User Avatar with Profile Settings Trigger */}
        <div
          onClick={onOpenSettings}
          className="cursor-pointer group relative"
          title="Edit Profile & Settings"
        >
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatar_url}
            size="sm"
            className="ring-2 ring-purple-200"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <Settings className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
