'use client';

import { SubscriptionPlan } from './promoCodes';

export type UserRole = 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PROVIDER';
export type ProviderSubtype = 'PICK_AND_DROP' | 'COMMERCIAL_CARGO';
export type SubscriptionStatus = 'UNSUBSCRIBED' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED';

export interface UserSubscription {
  status: SubscriptionStatus;
  planId?: string;
  planName?: string;
  targetRole?: string;
  amountPaid?: number;
  currency?: string;
  symbol?: string;
  wasPrice?: number;
  nowPrice?: number;
  discountAmount?: number;
  promoCodeApplied?: string;
  paymentRef?: string;
  paymentProofUrl?: string;
  requestedAt?: string;
  approvedAt?: string;
  quota: number; // Max listings allowed
  usedQuota: number;
  renewsOn?: string;
  rejectionReason?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  businessName?: string;
  phone: string;
  email?: string;
  city: string;
  countryCode: string;
  role: UserRole;
  providerSubtype?: ProviderSubtype;
  registeredAt: string;
  subscription: UserSubscription;
  bio?: string;
  licenseNumber?: string;
  nationalId?: string;
}

export const DEMO_USERS: RegisteredUser[] = [
  {
    id: 'usr-demo-lister',
    name: 'Muhammad Salman',
    businessName: 'Salman Rent a Car & Tours',
    phone: '+92 300 1234567',
    city: 'Islamabad',
    countryCode: 'PK',
    role: 'LISTER',
    registeredAt: '2026-01-15T10:00:00Z',
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
  },
  {
    id: 'usr-demo-driver',
    name: 'Tariq Mahmood',
    phone: '+92 301 9821045',
    city: 'Lahore',
    countryCode: 'PK',
    role: 'DRIVER',
    registeredAt: '2026-02-01T12:00:00Z',
    bio: '12+ years VIP chauffeur experience in Lahore, Islamabad, and Motorway travel.',
    licenseNumber: 'LHR-DL-98210',
    nationalId: '35201-9821045-3',
    subscription: {
      status: 'ACTIVE',
      planId: 'p-4',
      planName: 'Independent Chauffeur Pass',
      quota: 1,
      usedQuota: 1,
      amountPaid: 2000,
      currency: 'PKR',
      symbol: 'Rs',
      renewsOn: '15 Dec 2026',
    },
  },
  {
    id: 'usr-demo-provider-pnd',
    name: 'Kashif Nazir',
    businessName: 'Metro Commute Services',
    phone: '+92 321 8472910',
    city: 'Lahore',
    countryCode: 'PK',
    role: 'PROVIDER',
    providerSubtype: 'PICK_AND_DROP',
    registeredAt: '2026-02-10T14:00:00Z',
    subscription: {
      status: 'ACTIVE',
      planId: 'p-5',
      planName: 'Pick & Drop Shuttle Pass',
      quota: 8,
      usedQuota: 3,
      amountPaid: 6000,
      currency: 'PKR',
      symbol: 'Rs',
      renewsOn: '20 Dec 2026',
    },
  },
  {
    id: 'usr-demo-provider-cargo',
    name: 'Haji Riaz Ahmed',
    businessName: 'Al-Makkah Shifting Transport',
    phone: '+92 333 5599182',
    city: 'Rawalpindi',
    countryCode: 'PK',
    role: 'PROVIDER',
    providerSubtype: 'COMMERCIAL_CARGO',
    registeredAt: '2026-02-15T09:00:00Z',
    subscription: {
      status: 'ACTIVE',
      planId: 'p-6',
      planName: 'Home Shifting & Cargo Pass',
      quota: 10,
      usedQuota: 2,
      amountPaid: 5000,
      currency: 'PKR',
      symbol: 'Rs',
      renewsOn: '25 Dec 2026',
    },
  },
];

const STORAGE_USERS_KEY = 'safarpk_registered_users_v2';
const STORAGE_ACTIVE_SESSION_KEY = 'safarpk_active_auth_session_v2';

/**
 * Get all registered users from storage or seed defaults
 */
export function getAllRegisteredUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return DEMO_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_USERS;
  } catch (e) {
    return DEMO_USERS;
  }
}

/**
 * Save users list to storage
 */
export function saveAllRegisteredUsers(users: RegisteredUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('safarpk_users_updated'));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

/**
 * Get currently logged-in user session
 */
export function getActiveUser(): RegisteredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Set active user session
 */
export function setActiveUser(user: RegisteredUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(user));
    // Also update this user in the registered users list
    const all = getAllRegisteredUsers();
    const idx = all.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      all[idx] = user;
    } else {
      all.unshift(user);
    }
    saveAllRegisteredUsers(all);
    window.dispatchEvent(new CustomEvent('safarpk_auth_state_changed', { detail: user }));
  } catch (e) {
    console.error('Failed to set active user:', e);
  }
}

/**
 * Register a brand new user dynamically
 */
export function registerNewUser(params: {
  name: string;
  businessName?: string;
  phone: string;
  email?: string;
  city: string;
  countryCode: string;
  role: UserRole;
  providerSubtype?: ProviderSubtype;
}): RegisteredUser {
  const cleanPhone = params.phone.trim();
  const cleanName = params.name.trim();
  const cleanCity = params.city.trim() || 'Lahore';
  const cleanBusiness = params.businessName?.trim() || (params.role === 'LISTER' ? `${cleanName} Fleet` : undefined);

  const newUser: RegisteredUser = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name: cleanName,
    businessName: cleanBusiness,
    phone: cleanPhone,
    email: params.email?.trim(),
    city: cleanCity,
    countryCode: params.countryCode || 'PK',
    role: params.role,
    providerSubtype: params.providerSubtype,
    registeredAt: new Date().toISOString(),
    subscription: {
      status: 'UNSUBSCRIBED',
      quota: 0,
      usedQuota: 0,
    },
  };

  const all = getAllRegisteredUsers();
  all.unshift(newUser);
  saveAllRegisteredUsers(all);
  setActiveUser(newUser);

  return newUser;
}

/**
 * Submit subscription purchase for review
 */
export function submitSubscriptionPayment(
  userId: string,
  plan: SubscriptionPlan,
  finalAmount: number,
  currency: string,
  symbol: string,
  paymentRef: string,
  paymentProofUrl?: string,
  promoCode?: string
): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  user.subscription = {
    status: 'PENDING_APPROVAL',
    planId: plan.id,
    planName: plan.name,
    targetRole: plan.targetRole,
    amountPaid: finalAmount,
    currency,
    symbol,
    wasPrice: plan.wasPrice,
    nowPrice: plan.price,
    quota: plan.maxListings,
    usedQuota: user.subscription.usedQuota || 0,
    paymentRef,
    paymentProofUrl: paymentProofUrl || '/bank-slip-sample.jpg',
    promoCodeApplied: promoCode,
    requestedAt: new Date().toISOString(),
  };

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  return user;
}

/**
 * Super Admin approves a subscription
 */
export function approveSubscriptionByAdmin(userId: string): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  // 30 days from now
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  const renewsOnStr = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  user.subscription.status = 'ACTIVE';
  user.subscription.approvedAt = new Date().toISOString();
  user.subscription.renewsOn = renewsOnStr;

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  return user;
}

/**
 * Super Admin rejects a subscription
 */
export function rejectSubscriptionByAdmin(userId: string, reason: string = 'Payment receipt could not be verified'): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  user.subscription.status = 'REJECTED';
  user.subscription.rejectionReason = reason;

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  return user;
}

/**
 * User logout
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    window.dispatchEvent(new Event('safarpk_auth_state_changed'));
  } catch (e) {}
}

/**
 * Switch or Login as a Demo User
 */
export function loginAsDemoUser(role: UserRole, subtype?: ProviderSubtype): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const target = all.find((u) => {
    if (u.role !== role) return false;
    if (role === 'PROVIDER' && subtype && u.providerSubtype !== subtype) return false;
    return true;
  });

  if (target) {
    setActiveUser(target);
    return target;
  }
  return null;
}
