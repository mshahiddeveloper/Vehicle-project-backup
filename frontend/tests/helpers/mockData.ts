import {
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  RegisteredUser,
  getActiveUser,
  setActiveUser,
} from '@/data/userAuth';
import { logAuditEvent } from '@/data/auditLog';

// ==========================================
// FIXTURES
// ==========================================

export const MOCK_CUSTOMER: RegisteredUser = {
  id: 'usr-demo-customer',
  name: 'Hamza Tariq',
  phone: '+92 300 8472910',
  email: 'customer@safarpk.com',
  city: 'Islamabad',
  countryCode: 'PK',
  role: 'CUSTOMER',
  registeredAt: '2026-01-10T10:00:00Z',
  kycStatus: 'VERIFIED',
  metrics: {
    viewCount: 15,
    leadsCount: 3,
    clickCount: 8,
    lastActive: '2026-11-13T10:00:00Z',
  },
  activities: [],
  subscription: {
    status: 'UNSUBSCRIBED',
    quota: 0,
    usedQuota: 0,
  },
};

export const MOCK_LISTER: RegisteredUser = {
  id: 'usr-demo-lister',
  name: 'Muhammad Salman',
  businessName: 'Salman Rent a Car & Tours',
  phone: '+92 300 1234567',
  email: 'salman@salmanrentals.pk',
  city: 'Islamabad',
  countryCode: 'PK',
  role: 'LISTER',
  registeredAt: '2026-01-15T10:00:00Z',
  kycStatus: 'VERIFIED',
  metrics: {
    viewCount: 1420,
    leadsCount: 68,
    clickCount: 310,
    lastActive: '2026-11-13T12:00:00Z',
  },
  activities: [],
  subscription: {
    status: 'ACTIVE',
    planId: 'p-2',
    planName: 'Professional Fleet Hub (15 Vehicles)',
    quota: 15,
    usedQuota: 4,
    amountPaid: 12000,
    currency: 'PKR',
    symbol: 'Rs',
    renewsOn: '10 Dec 2026',
  },
};

export const MOCK_DRIVER: RegisteredUser = {
  id: 'usr-demo-driver',
  name: 'Tariq Mahmood',
  phone: '+92 301 9821045',
  email: 'tariq.driver@safarpk.com',
  city: 'Lahore',
  countryCode: 'PK',
  role: 'DRIVER',
  registeredAt: '2026-02-01T12:00:00Z',
  kycStatus: 'VERIFIED',
  licenseNumber: 'LHR-DL-98210',
  nationalId: '35201-9821045-3',
  metrics: {
    viewCount: 890,
    leadsCount: 42,
    clickCount: 180,
    lastActive: '2026-11-13T11:00:00Z',
  },
  activities: [],
  subscription: {
    status: 'ACTIVE',
    planId: 'p-driver-1',
    planName: 'Verified Chauffeur Pass',
    quota: 1,
    usedQuota: 1,
    amountPaid: 3500,
    currency: 'PKR',
    symbol: 'Rs',
    renewsOn: '15 Dec 2026',
  },
};

// ==========================================
// DOMAIN LOGIC: PLAN DAYS LEFT & MONTH MATH
// ==========================================

/**
 * Calculates remaining days from a renewal date string.
 * Gracefully handles invalid dates, past dates, and month-end dates.
 * Clamps to 0 if expired (never negative or NaN).
 */
export function calculatePlanDaysLeft(renewsOn?: string | null): number {
  if (!renewsOn || typeof renewsOn !== 'string') return 0;
  const trimmed = renewsOn.trim();
  if (!trimmed || trimmed === 'invalid-date-string') return 0;

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return 0;

  const now = new Date();
  const diffMs = parsed.getTime() - now.getTime();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Advances a Date by a given number of calendar months,
 * clamping month-end days (e.g. Jan 31 + 1 month -> Feb 28/29).
 */
export function addCalendarMonths(startDate: Date, months: number): Date {
  const result = new Date(startDate.getTime());
  const originalDay = result.getDate();

  // Set to day 1 to avoid overflow when changing month
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  // Find max days in the target month
  const targetYear = result.getFullYear();
  const targetMonth = result.getMonth();
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // Clamp original day
  result.setDate(Math.min(originalDay, daysInTargetMonth));
  return result;
}

/**
 * Extends a user's subscription by additional calendar months.
 * If currently expired (renewsOn < today), calculates new end date starting from TODAY.
 * If currently active, calculates new end date from existing renewsOn.
 * Records audit diff and dispatches 'safarpk_subscription_updated'.
 */
export function extendUserSubscription(
  userId: string,
  additionalMonths: number,
  reason: string,
  actor: { id: string; name: string; role: 'SUPER_ADMIN' | 'STAFF_AGENT' }
): boolean {
  if (typeof window === 'undefined') return false;

  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return false;

  const now = new Date();
  const existingRenews = user.subscription?.renewsOn
    ? new Date(user.subscription.renewsOn)
    : null;

  // If expired or missing, start extension from TODAY; otherwise add to existing end date
  const isExpired = !existingRenews || isNaN(existingRenews.getTime()) || existingRenews.getTime() < now.getTime();
  const baseDate = isExpired ? now : existingRenews;

  const newDate = addCalendarMonths(baseDate, additionalMonths);
  const newRenewsOnStr = newDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const prevRenews = user.subscription.renewsOn || 'None';
  const prevStatus = user.subscription.status;

  user.subscription.status = 'ACTIVE';
  user.subscription.renewsOn = newRenewsOnStr;

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  // Record Audit Entry
  logAuditEvent({
    actor,
    action: 'SUBSCRIPTION_EXTENDED',
    targetType: 'SUBSCRIPTION',
    targetId: userId,
    diff: [
      { field: 'subscription.status', before: prevStatus, after: 'ACTIVE' },
      { field: 'subscription.renewsOn', before: prevRenews, after: newRenewsOnStr },
    ],
    reason,
  });

  // Cross-portal notification
  window.dispatchEvent(
    new CustomEvent('safarpk_subscription_updated', {
      detail: { userId, renewsOn: newRenewsOnStr, status: 'ACTIVE' },
    })
  );

  return true;
}

/**
 * Updates a user's KYC verification status with audit logging.
 */
export function updateUserKycStatus(
  userId: string,
  status: 'UNVERIFIED' | 'PENDING_APPROVAL' | 'VERIFIED',
  actor: { id: string; name: string; role: 'SUPER_ADMIN' | 'STAFF_AGENT' }
): boolean {
  if (typeof window === 'undefined') return false;

  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return false;

  const prevStatus = user.kycStatus || 'UNVERIFIED';
  user.kycStatus = status;

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  logAuditEvent({
    actor,
    action: status === 'VERIFIED' ? 'KYC_VERIFICATION_APPROVED' : 'KYC_STATUS_UPDATED',
    targetType: 'USER',
    targetId: userId,
    diff: [{ field: 'kycStatus', before: prevStatus, after: status }],
    reason: `KYC updated to ${status} by ${actor.name}`,
  });

  window.dispatchEvent(
    new CustomEvent('safarpk_user_kyc_updated', {
      detail: { userId, status },
    })
  );

  return true;
}

// ==========================================
// DOMAIN LOGIC: VEHICLE PUBLISHING DOUBLE-GATE
// ==========================================

export interface VehiclePublishValidation {
  canPublish: boolean;
  error?: string;
}

export function validateVehiclePublishing(
  user: RegisteredUser,
  vehicle: { registrationDocId?: string | null }
): VehiclePublishValidation {
  // 1. Mandatory Vehicle Registration Smart Card / OCR Document
  if (!vehicle.registrationDocId || !vehicle.registrationDocId.trim()) {
    return {
      canPublish: false,
      error: 'Vehicle registration smart card is mandatory.',
    };
  }

  // 2. Active Subscription Plan
  if (user.subscription.status !== 'ACTIVE') {
    return {
      canPublish: false,
      error: 'Choose a plan to publish or Save as draft.',
    };
  }

  // 3. Plan Expiration Check
  if (user.subscription.renewsOn) {
    const daysLeft = calculatePlanDaysLeft(user.subscription.renewsOn);
    if (daysLeft <= 0) {
      return {
        canPublish: false,
        error: 'Subscription plan has expired. Please renew.',
      };
    }
  }

  // 4. Listing Quota Check
  if (user.subscription.quota <= 0) {
    return {
      canPublish: false,
      error: 'Account quota is 0. Please subscribe to a fleet plan.',
    };
  }

  if (user.subscription.usedQuota >= user.subscription.quota) {
    return {
      canPublish: false,
      error: `Listing quota exceeded. Maximum quota of ${user.subscription.quota} vehicles reached.`,
    };
  }

  return { canPublish: true };
}

/**
 * Publishes a vehicle listing adhering strictly to the double gate.
 */
export function publishVehicle(
  userId: string,
  vehicle: { id: string; title: string; registrationDocId?: string | null }
): { success: boolean; error?: string; vehicle?: any } {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return { success: false, error: 'User not found.' };

  const validation = validateVehiclePublishing(user, vehicle);
  if (!validation.canPublish) {
    return { success: false, error: validation.error };
  }

  // Increment used quota
  user.subscription.usedQuota = (user.subscription.usedQuota || 0) + 1;
  saveAllRegisteredUsers(all);

  const published = {
    ...vehicle,
    status: 'LIVE',
    publishedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('safarpk_vehicle_published', {
        detail: { userId, vehicleId: vehicle.id },
      })
    );
  }

  return { success: true, vehicle: published };
}

/**
 * Restores quota slot upon deleting an active listing.
 */
export function restoreQuotaOnListingDelete(userId: string): boolean {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return false;

  user.subscription.usedQuota = Math.max(0, (user.subscription.usedQuota || 1) - 1);
  saveAllRegisteredUsers(all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('safarpk_quota_restored', {
        detail: { userId, usedQuota: user.subscription.usedQuota },
      })
    );
  }

  return true;
}
