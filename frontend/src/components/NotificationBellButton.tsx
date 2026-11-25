'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  CalendarCheck,
  PauseCircle,
  Check,
} from 'lucide-react';
import { RegisteredUser } from '@/data/userAuth';
import {
  AppNotification,
  syncDynamicProfileNotifications,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatNotifRelativeTime,
} from '@/data/notifications';

interface NotificationBellButtonProps {
  activeUser: RegisteredUser | null;
}

export function NotificationBellButton({ activeUser }: NotificationBellButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = () => {
    if (!activeUser) {
      setNotifications([]);
      return;
    }
    const localSynced = syncDynamicProfileNotifications(activeUser);
    setNotifications(localSynced);

    // Also fetch server-persisted notifications (already pruned to last 90 days)
    fetch('/api/notifications', { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.notifications)) {
          const dbItems: AppNotification[] = data.notifications.map((n: any) => ({
            id: String(n.id),
            userId: activeUser.id,
            type: n.type || 'SYSTEM',
            title: n.title,
            message: n.message,
            linkUrl: n.link_url || '/',
            isRead: Boolean(n.is_read),
            createdAt: n.created_at || new Date().toISOString(),
          }));
          const merged = [...localSynced];
          const seenKeys = new Set(merged.map((m) => `${m.title}::${m.linkUrl}`));
          for (const item of dbItems) {
            const k = `${item.title}::${item.linkUrl}`;
            if (!seenKeys.has(k)) {
              merged.push(item);
              seenKeys.add(k);
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(merged);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshNotifications();
    const handler = () => refreshNotifications();
    window.addEventListener('safarpk_notifications_updated', handler);
    window.addEventListener('safarpk_chat_updated', handler);
    window.addEventListener('safarpk_auth_state_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('safarpk_notifications_updated', handler);
      window.removeEventListener('safarpk_chat_updated', handler);
      window.removeEventListener('safarpk_auth_state_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, [activeUser?.id, activeUser?.subscription?.status]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = () => {
    if (!activeUser) {
      router.push('/login');
      return;
    }
    if (!open) {
      setNotifications(syncDynamicProfileNotifications(activeUser));
    }
    setOpen((prev) => !prev);
  };

  const handleItemClick = (n: AppNotification) => {
    if (activeUser) {
      markNotificationRead(activeUser.id, n.id);
      setNotifications(getUserNotifications(activeUser.id));
    }
    setOpen(false);
    router.push(n.linkUrl || '/');
  };

  const handleMarkAll = () => {
    if (!activeUser) return;
    markAllNotificationsRead(activeUser.id);
    setNotifications(getUserNotifications(activeUser.id));
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'BOOKING_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'BOOKING_ALERT':
        return <CalendarCheck className="w-4 h-4 text-indigo-600" />;
      case 'SUBSCRIPTION_APPROVED':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'SUBSCRIPTION_EXPIRING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'AD_STATUS':
        return <PauseCircle className="w-4 h-4 text-slate-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={containerRef} style={{ zIndex: 1150 }}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full bg-[#F2F4F7] text-[#101828] flex items-center justify-center transition active:scale-95 hover:bg-slate-200 cursor-pointer"
      >
        <Bell className="w-4.5 h-4.5 stroke-[2] text-slate-700" />
        {activeUser && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#D92D20] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && activeUser && (
        <div
          style={{ zIndex: 1200 }}
          className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900">
                Notifications
              </h3>
              <p className="text-[10px] text-slate-500">
                {activeUser.role} · Auto-cleaned after 3 months
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[11px] font-bold text-[#0B6B4F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition hover:bg-slate-50 cursor-pointer ${
                    !n.isRead ? 'bg-emerald-50/40' : 'bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatNotifRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#0B6B4F] shrink-0 mt-2" />
                  )}
                </button>
              ))
            ) : (
              <div className="py-10 px-4 text-center space-y-2">
                <Bell className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Notifications Yet</p>
                <p className="text-[11px] text-slate-500">
                  Messages, booking updates, and account alerts for the last 3 months will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

