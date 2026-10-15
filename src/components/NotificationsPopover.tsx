import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Heart, MessageCircle, UserPlus, Sparkles, BookOpen, Check } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatTimeAgo } from '../lib/format';
import { UserAvatar } from './UserAvatar';
import type { NotificationItem } from '../types';

interface Props {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenFriends: () => void;
}

export const NotificationsPopover: React.FC<Props> = ({
  notifications,
  isOpen,
  onClose,
  onOpenFriends,
}) => {
  const queryClient = useQueryClient();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/social/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/social/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-slate-900">Notifications</h4>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 text-[#6D5CAE] rounded-full text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-[11px] font-semibold text-[#6D5CAE] hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No notifications yet.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Activity from your peers, likes, and quizzes will appear here!
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              let Icon = Bell;
              let iconBg = 'bg-slate-100 text-slate-600';
              if (n.notification_type === 'like') {
                Icon = Heart;
                iconBg = 'bg-rose-50 text-rose-500';
              } else if (n.notification_type === 'comment') {
                Icon = MessageCircle;
                iconBg = 'bg-blue-50 text-blue-500';
              } else if (n.notification_type === 'follow') {
                Icon = UserPlus;
                iconBg = 'bg-purple-50 text-[#6D5CAE]';
              } else if (n.notification_type === 'quiz') {
                Icon = Sparkles;
                iconBg = 'bg-amber-50 text-amber-600';
              } else if (n.notification_type === 'material') {
                Icon = BookOpen;
                iconBg = 'bg-emerald-50 text-emerald-600';
              }

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markReadMutation.mutate(n.id);
                    if (n.notification_type === 'follow') {
                      onOpenFriends();
                      onClose();
                    }
                  }}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                    !n.is_read ? 'bg-purple-50/40' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={n.actor_name || 'Study Friend'}
                      avatarUrl={n.actor_avatar || ''}
                      size="sm"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${iconBg} flex items-center justify-center ring-2 ring-white`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#6D5CAE] shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
