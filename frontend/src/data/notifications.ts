/**
 * Central Role-Aware Notification Engine (90-day / 3-month auto-retention)
 * Generates & syncs notifications per logged-in profile:
 * - Customers: Unread messages (links to /inbox?conv=...), Booking confirmed/pending, etc.
 * - Listers / Drivers / Providers: New booking alerts, unread messages, subscription approved,
 *   ad paused/live updates, and daily 7-day subscription expiry countdowns linking to /subscription.
 */

import { RegisteredUser, getUserDashboardPath } from './userAuth';
import { getUserConversations } from './chatEngine';

export type NotificationCategory =
  | 'MESSAGE'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_ALERT'
  | 'SUBSCRIPTION_APPROVED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'AD_STATUS'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  dedupeKey?: string;
  type: NotificationCategory;
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function getStorageKey(userId: string): string {
  return `safarpk_notifications_${userId}`;
}

/**
 * Load user notifications and automatically prune anything older than 3 months (90 days).
 */
export function getUserNotifications(userId: string): AppNotification[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed: AppNotification[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - NINETY_DAYS_MS;
    const fresh = parsed.filter((n) => {
      const ts = new Date(n.createdAt).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    });
    if (fresh.length !== parsed.length) {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(fresh));
    }
    return fresh.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveUserNotifications(userId: string, items: AppNotification[]): void {
  if (typeof window === 'undefined' || !userId) return;
  const cutoff = Date.now() - NINETY_DAYS_MS;
  const pruned = items
    .filter((n) => new Date(n.createdAt).getTime() >= cutoff)
    .slice(0, 60);
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(pruned));
    window.dispatchEvent(
      new CustomEvent('safarpk_notifications_updated', { detail: { userId } })
    );
  } catch {}
}

/**
 * Push a new notification for a specific user (dedupes by dedupeKey if provided).
 */
export function pushUserNotification({
  userId,
  dedupeKey,
  type,
  title,
  message,
  linkUrl,
  syncToServer = false,
}: {
  userId: string;
  dedupeKey?: string;
  type: NotificationCategory;
  title: string;
  message: string;
  linkUrl: string;
  syncToServer?: boolean;
}): AppNotification | null {
  if (typeof window === 'undefined' || !userId) return null;
  const existing = getUserNotifications(userId);
  if (dedupeKey && existing.some((n) => n.dedupeKey === dedupeKey)) {
    return null;
  }

  const notif: AppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    dedupeKey,
    type,
    title,
    message,
    linkUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  saveUserNotifications(userId, [notif, ...existing]);

  if (syncToServer) {
    fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: userId,
        type,
        title,
        message,
        linkUrl,
      }),
    }).catch(() => {});
  }

  return notif;
}

export function markNotificationRead(userId: string, notificationId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const existing = getUserNotifications(userId);
  const updated = existing.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  saveUserNotifications(userId, updated);

  fetch('/api/notifications', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId }),
  }).catch(() => {});
}

export function markAllNotificationsRead(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const existing = getUserNotifications(userId);
  const updated = existing.map((n) => ({ ...n, isRead: true }));
  saveUserNotifications(userId, updated);

  fetch('/api/notifications', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAllAsRead: true }),
  }).catch(() => {});
}

/**
 * Synchronize role-specific dynamic notifications for the currently logged-in profile.
 */
export function syncDynamicProfileNotifications(user: RegisteredUser | null): AppNotification[] {
  if (typeof window === 'undefined' || !user) return [];

  const isPartner = ['LISTER', 'DRIVER', 'PROVIDER'].includes(user.role);
  const dashboardPath = getUserDashboardPath(user);
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Unread Inbox Messages -> Direct link to exact chat thread (/inbox?conv=...)
  const convs = getUserConversations(user);
  for (const conv of convs) {
    const unread = conv.unreadCountFor?.[user.id] || 0;
    if (unread > 0) {
      const pId = conv.participantIds.find((id) => id !== user.id) || '';
      const pName = conv.participantNames?.[pId] || 'Partner';
      pushUserNotification({
        userId: user.id,
        dedupeKey: `unread-msg-${conv.id}-${conv.lastMessageTimestamp}`,
        type: 'MESSAGE',
        title: `New message from ${pName}`,
        message: `You have ${unread} unread message${unread > 1 ? 's' : ''} about ${conv.about || 'your inquiry'}. Tap to open chat.`,
        linkUrl: `/inbox?conv=${conv.id}`,
      });
    }
  }

  // 2. Customer-specific notifications
  if (user.role === 'CUSTOMER') {
    for (const conv of convs) {
      if (conv.bookingStatus === 'Confirmed') {
        pushUserNotification({
          userId: user.id,
          dedupeKey: `cust-confirmed-${conv.id}`,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed! ✅',
          message: `${conv.bookingMetadata?.itemName || conv.about} (${conv.bookingRef || 'SafarPK'}) has been confirmed by the provider.`,
          linkUrl: `/inbox?conv=${conv.id}`,
        });
      }
    }
  }

  // 3. Partner / Lister / Driver / Provider notifications
  if (isPartner) {
    // 3a. Pending booking requests in Inbox
    for (const conv of convs) {
      if (conv.bookingStatus === 'Waiting for owner' || conv.bookingStatus === 'Pending') {
        const custId = conv.participantIds.find((id) => id !== user.id) || '';
        const custName = conv.participantNames?.[custId] || 'Customer';
        pushUserNotification({
          userId: user.id,
          dedupeKey: `partner-booking-${conv.id}`,
          type: 'BOOKING_ALERT',
          title: `New Booking Request from ${custName}`,
          message: `Inquiry for ${conv.bookingMetadata?.itemName || conv.about}. Tap to review and confirm.`,
          linkUrl: `/inbox?conv=${conv.id}`,
        });
      }
    }

    // 3b. Subscription Approved
    const subStatus = user.subscription?.status;
    if (subStatus === 'ACTIVE') {
      pushUserNotification({
        userId: user.id,
        dedupeKey: `sub-active-${user.id}-${user.subscription?.planId || 'active'}`,
        type: 'SUBSCRIPTION_APPROVED',
        title: 'Subscription Active 🎉',
        message: `Your ${user.subscription?.planName || 'Partner'} subscription is approved. Your fleet & services can be published LIVE.`,
        linkUrl: `${dashboardPath}?tab=overview`,
      });
    } else if (subStatus === 'EXPIRED' || subStatus === 'UNSUBSCRIBED') {
      pushUserNotification({
        userId: user.id,
        dedupeKey: `sub-inactive-${user.id}-${todayStr}`,
        type: 'SUBSCRIPTION_EXPIRING',
        title: 'Ads Hidden — Subscription Required 🔒',
        message: 'Your listings are currently hidden from customers. Renew your subscription now to go LIVE.',
        linkUrl: '/subscription',
      });
    }

    // 3c. Daily 7-Day Expiry Countdown Warning (1 notification per day in the final 7 days)
    const expiryIso = user.subscription?.expiresAt || user.subscription?.endDate;
    if (subStatus === 'ACTIVE' && expiryIso) {
      const expiryMs = new Date(expiryIso).getTime();
      if (!Number.isNaN(expiryMs)) {
        const diffDays = Math.ceil((expiryMs - Date.now()) / (24 * 60 * 60 * 1000));
        if (diffDays >= 0 && diffDays <= 7) {
          pushUserNotification({
            userId: user.id,
            dedupeKey: `sub-expiry-warn-${user.id}-${todayStr}`,
            type: 'SUBSCRIPTION_EXPIRING',
            title:
              diffDays === 0
                ? 'Subscription Expires Today! ⚠️'
                : `Subscription Expiring in ${diffDays} Day${diffDays === 1 ? '' : 's'} ⚠️`,
            message: `Your subscription will expire in ${diffDays} day${diffDays === 1 ? '' : 's'} and your ads will be hidden from customers. Tap to renew now.`,
            linkUrl: '/subscription',
          });
        }
      }
    }

    // 3d. Paused / Live Ad Status (for Lister fleet)
    try {
      const fleetRaw = localStorage.getItem(`safarpk_fleet_${user.id}`);
      if (fleetRaw) {
        const fleet = JSON.parse(fleetRaw);
        if (Array.isArray(fleet)) {
          for (const v of fleet) {
            if (v.isPaused || v.status === 'PAUSED') {
              pushUserNotification({
                userId: user.id,
                dedupeKey: `ad-paused-${v.id}`,
                type: 'AD_STATUS',
                title: `Ad Paused: ${v.title || 'Vehicle Listing'}`,
                message: v.pauseReason || 'This listing is currently paused and hidden from customers.',
                linkUrl: '/lister?tab=fleet',
              });
            } else if (v.status === 'LIVE' || v.status === 'APPROVED') {
              pushUserNotification({
                userId: user.id,
                dedupeKey: `ad-live-${v.id}`,
                type: 'AD_STATUS',
                title: `Ad is LIVE: ${v.title || 'Vehicle Listing'} 🟢`,
                message: 'Your listing is live and visible to customers across SafarPK.',
                linkUrl: '/lister?tab=fleet',
              });
            }
          }
        }
      }
    } catch {}
  }

  return getUserNotifications(user.id);
}

export function formatNotifRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 'Recent';
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

