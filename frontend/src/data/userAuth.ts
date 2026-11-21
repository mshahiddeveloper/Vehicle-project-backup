'use client';

import { SubscriptionPlan, getStoredPlans } from './promoCodes';
import { saveAgentPermissions } from './agentPermissions';
import { recordAuditAction } from './auditLog';

export type UserRole = 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PROVIDER' | 'AGENT' | 'SUPER_ADMIN';
export type ProviderSubtype = 'PICK_AND_DROP' | 'COMMERCIAL_CARGO' | 'CITY_TO_CITY';
export type SubscriptionStatus = 'UNSUBSCRIBED' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'EXPIRED';
export type KycStatus = 'UNVERIFIED' | 'PENDING_APPROVAL' | 'VERIFIED';

/**
 * EXACT FIVE MAIN CUSTOMER-FACING SERVICES OF SAFARPK
 */
export type SafarServiceType =
  | 'RENT_A_CAR'      // 1. Rent a Car
  | 'HIRE_A_DRIVER'   // 2. Hire a Driver
  | 'CITY_TO_CITY'    // 3. City to City
  | 'PICK_AND_DROP'   // 4. Pick & Drop
  | 'HOME_SHIFTING';  // 5. Home Shifting

export const ALL_SAFAR_SERVICES: {
  id: SafarServiceType;
  label: string;
  number: number;
  desc: string;
  icon: string;
}[] = [
  { id: 'RENT_A_CAR', label: 'Rent a Car', number: 1, desc: 'Vehicle rental listings, fleet inventory & rental booking requests', icon: '🚗' },
  { id: 'HIRE_A_DRIVER', label: 'Hire a Driver', number: 2, desc: 'Chauffeur profile, daily/monthly availability & hiring requests', icon: '👨‍✈️' },
  { id: 'CITY_TO_CITY', label: 'City to City', number: 3, desc: 'Intercity travel routes, schedules & passenger bookings', icon: '🛣️' },
  { id: 'PICK_AND_DROP', label: 'Pick & Drop', number: 4, desc: 'Daily commuter routes, university/office shuttles & seat bookings', icon: '🚌' },
  { id: 'HOME_SHIFTING', label: 'Home Shifting', number: 5, desc: 'Household & office shifting, cargo trucks, helpers & moving quotations', icon: '📦' },
];

export interface UserSubscription {
  status: SubscriptionStatus;
  planId?: string;
  planName?: string;
  targetRole?: string;
  amountPaid?: number;
  originalAmount?: number;
  discountAmount?: number;
  discountPercentage?: number;
  isFreePromo?: boolean;
  freePromoReason?: string;
  currency?: string;
  symbol?: string;
  wasPrice?: number;
  nowPrice?: number;
  promoCodeApplied?: string;
  paymentRef?: string;
  paymentProofUrl?: string;
  requestedAt?: string;
  approvedAt?: string;
  quota: number; // Max listings allowed
  usedQuota: number;
  renewsOn?: string;
  validUntil?: string;
  endDate?: string;
  startDate?: string;
  amount?: number;
  rejectionReason?: string;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
}

export interface UserActivityLog {
  id: string;
  type:
    | 'LOGIN'
    | 'REGISTER'
    | 'LISTING_CREATED'
    | 'SUBSCRIPTION_REQUESTED'
    | 'LEAD_RECEIVED'
    | 'WHATSAPP_CLICK'
    | 'CALL_CLICK'
    | 'PROFILE_UPDATED'
    | 'AGENT_ASSIGNED';
  title: string;
  description: string;
  timestamp: string;
  meta?: any;
}

export interface UserMetrics {
  viewCount: number;
  leadsCount: number;
  clickCount: number;
  lastActive: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  businessName?: string;
  phone: string;
  phoneVerified?: boolean;
  phoneLocked?: boolean;
  cnicFrontUploaded?: boolean;
  cnicBackUploaded?: boolean;
  licenseUploaded?: boolean;
  ntnUploaded?: boolean;
  carOwnerCardUploaded?: boolean;
  email?: string;
  password?: string;
  city: string;
  countryCode: string;
  role: UserRole;
  providerSubtype?: ProviderSubtype;
  registeredAt: string;
  kycStatus?: 'UNVERIFIED' | 'PENDING_APPROVAL' | 'VERIFIED';
  subscription: UserSubscription;
  bio?: string;
  licenseNumber?: string;
  nationalId?: string;
  avatarUrl?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  licenseUrl?: string;
  tradeLicenseUrl?: string;
  ntnUrl?: string;
  ntnNumber?: string;
  carOwnerCardUrl?: string;
  carOwnerCardRegNumber?: string;
  carOwnerCardLocked?: boolean;
  showroomAddress?: string;
  gpsLocation?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  employeeId?: string;
  staffId?: string;
  desk?: string;
  branch?: string;
  permissions?: string[];
  approvedServices?: SafarServiceType[];
  // Authentic Extracted & Immutable Document Credentials
  cnicNumber?: string;
  cnicName?: string;
  cnicIssueDate?: string;
  cnicExpiryDate?: string;
  cnicLocked?: boolean;
  licenseName?: string;
  licenseCategory?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseLocked?: boolean;
  tradeLicenseNumber?: string;
  tradeLicenseLocked?: boolean;
  // Account Status Controls
  isDeactivated?: boolean;
  deactivatedReason?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  metrics: UserMetrics;
  activities: UserActivityLog[];
}

export function getApprovedServicesForUser(user: RegisteredUser): SafarServiceType[] {
  if (user.approvedServices && user.approvedServices.length > 0) return user.approvedServices;
  if (user.role === 'LISTER') return ['RENT_A_CAR'];
  if (user.role === 'DRIVER') return ['HIRE_A_DRIVER'];
  if (user.role === 'PROVIDER') {
    if (user.providerSubtype === 'COMMERCIAL_CARGO') return ['HOME_SHIFTING'];
    if (user.providerSubtype === 'CITY_TO_CITY') return ['CITY_TO_CITY'];
    return ['PICK_AND_DROP'];
  }
  return ['RENT_A_CAR', 'HIRE_A_DRIVER', 'CITY_TO_CITY', 'PICK_AND_DROP', 'HOME_SHIFTING'];
}

export function isServiceApprovedForUser(user: RegisteredUser, service: SafarServiceType): boolean {
  const approved = getApprovedServicesForUser(user);
  return approved.includes(service);
}

export function updateUserApprovedServices(userId: string, services: SafarServiceType[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const all = getAllRegisteredUsers();
    const target = all.find((u) => u.id === userId);
    if (!target) return false;
    target.approvedServices = services;
    saveAllRegisteredUsers(all);
    const active = getActiveUser();
    if (active && active.id === userId) {
      active.approvedServices = services;
      setActiveUser(active);
    }
    window.dispatchEvent(new CustomEvent('safarpk_user_services_updated', { detail: { userId, services } }));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Deterministic role-based portal routing.
 * Ensures a logged-in user always lands on their own dedicated dashboard.
 */
export function getUserDashboardPath(user: RegisteredUser | null | undefined): string {
  if (!user) return '/login';
  switch (user.role) {
    case 'DRIVER':
      return '/driver';
    case 'LISTER':
      return '/lister';
    case 'PROVIDER':
      if (user.providerSubtype === 'COMMERCIAL_CARGO') {
        return '/provider?mode=commercial_cargo';
      }
      if (user.providerSubtype === 'CITY_TO_CITY') {
        return '/provider?mode=city_to_city';
      }
      return '/provider?mode=pick_and_drop';
    case 'SUPER_ADMIN':
      return '/admin';
    case 'AGENT':
      return '/agent';
    case 'CUSTOMER':
    default:
      return '/customer';
  }
}

export interface PortalTheme {
  id: string;
  name: string;
  badge: string;
  serviceType: SafarServiceType | 'CUSTOMER' | 'ADMIN' | 'AGENT';
  primaryHex: string;
  primaryBg: string;
  primaryText: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  ringClass: string;
  gradientClass: string;
  tagClass: string;
  dashboardPath: string;
}

export const PORTAL_THEMES: Record<string, PortalTheme> = {
  // 1. DRIVER PORTAL - Sky Blue / Teal
  DRIVER: {
    id: 'DRIVER',
    name: 'Driver & Chauffeur Cockpit',
    badge: '👨‍✈️ Driver Cockpit',
    serviceType: 'HIRE_A_DRIVER',
    primaryHex: '#0284c7', // Sky-600
    primaryBg: 'bg-sky-600 hover:bg-sky-700',
    primaryText: 'text-sky-600',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
    accentText: 'text-sky-800',
    ringClass: 'ring-sky-500/20 border-sky-300',
    gradientClass: 'from-sky-600 via-teal-600 to-slate-900',
    tagClass: 'bg-sky-100 text-sky-800 border border-sky-300',
    dashboardPath: '/driver',
  },
  // 2. RENTALS PORTAL - Forest Emerald Green
  LISTER: {
    id: 'LISTER',
    name: 'Car Rental & Showroom Fleet Cockpit',
    badge: '🚗 Rentals & Fleet Cockpit',
    serviceType: 'RENT_A_CAR',
    primaryHex: '#0B6B4F', // Forest Emerald
    primaryBg: 'bg-[#0B6B4F] hover:bg-[#08513C]',
    primaryText: 'text-[#0B6B4F]',
    accentBg: 'bg-[#E9F3EE]',
    accentBorder: 'border-[#0B6B4F]/20',
    accentText: 'text-[#08513C]',
    ringClass: 'ring-[#0B6B4F]/20 border-emerald-300',
    gradientClass: 'from-emerald-700 via-teal-800 to-slate-900',
    tagClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    dashboardPath: '/lister',
  },
  // 3. PICK & DROP PORTAL - Violet / Purple
  PROVIDER_PICK_AND_DROP: {
    id: 'PROVIDER_PICK_AND_DROP',
    name: 'Pick & Drop Commuter Shuttle Cockpit',
    badge: '🚌 Pick & Drop Cockpit',
    serviceType: 'PICK_AND_DROP',
    primaryHex: '#7c3aed', // Violet-600
    primaryBg: 'bg-violet-600 hover:bg-violet-700',
    primaryText: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-200',
    accentText: 'text-violet-800',
    ringClass: 'ring-violet-500/20 border-violet-300',
    gradientClass: 'from-violet-600 via-indigo-600 to-slate-900',
    tagClass: 'bg-violet-100 text-violet-800 border border-violet-300',
    dashboardPath: '/provider?mode=pick_and_drop',
  },
  // 4. CITY TO CITY PORTAL - Cyan / Ocean Blue
  PROVIDER_CITY_TO_CITY: {
    id: 'PROVIDER_CITY_TO_CITY',
    name: 'City to City Express Intercity Cockpit',
    badge: '🛣️ City to City Cockpit',
    serviceType: 'CITY_TO_CITY',
    primaryHex: '#0891b2', // Cyan-600
    primaryBg: 'bg-cyan-600 hover:bg-cyan-700',
    primaryText: 'text-cyan-600',
    accentBg: 'bg-cyan-50',
    accentBorder: 'border-cyan-200',
    accentText: 'text-cyan-800',
    ringClass: 'ring-cyan-500/20 border-cyan-300',
    gradientClass: 'from-cyan-600 via-blue-600 to-slate-900',
    tagClass: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
    dashboardPath: '/provider?mode=city_to_city',
  },
  // 5. MOVERS PORTAL - Amber / Warm Orange
  PROVIDER_COMMERCIAL_CARGO: {
    id: 'PROVIDER_COMMERCIAL_CARGO',
    name: 'Home Shifting & Cargo Freight Cockpit',
    badge: '📦 Movers & Cargo Cockpit',
    serviceType: 'HOME_SHIFTING',
    primaryHex: '#d97706', // Amber-600
    primaryBg: 'bg-amber-600 hover:bg-amber-700',
    primaryText: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-800',
    ringClass: 'ring-amber-500/20 border-amber-300',
    gradientClass: 'from-amber-600 via-orange-600 to-slate-900',
    tagClass: 'bg-amber-100 text-amber-800 border border-amber-300',
    dashboardPath: '/provider?mode=commercial_cargo',
  },
  // CUSTOMER PORTAL
  CUSTOMER: {
    id: 'CUSTOMER',
    name: 'Customer & Verified Member Portal',
    badge: '👤 Member Portal',
    serviceType: 'CUSTOMER',
    primaryHex: '#0B6B4F',
    primaryBg: 'bg-[#0B6B4F] hover:bg-[#08513C]',
    primaryText: 'text-[#0B6B4F]',
    accentBg: 'bg-[#E9F3EE]',
    accentBorder: 'border-[#0B6B4F]/20',
    accentText: 'text-[#08513C]',
    ringClass: 'ring-[#0B6B4F]/20 border-emerald-300',
    gradientClass: 'from-[#0B6B4F] via-teal-700 to-slate-900',
    tagClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    dashboardPath: '/customer',
  },
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    name: 'Super Admin Root Console',
    badge: '🛡️ Root Admin',
    serviceType: 'ADMIN',
    primaryHex: '#4f46e5',
    primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
    primaryText: 'text-indigo-600',
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentText: 'text-indigo-800',
    ringClass: 'ring-indigo-500/20 border-indigo-300',
    gradientClass: 'from-indigo-700 via-purple-700 to-slate-900',
    tagClass: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    dashboardPath: '/admin',
  },
  AGENT: {
    id: 'AGENT',
    name: 'Support Agent Desk',
    badge: '🎧 Support Agent',
    serviceType: 'AGENT',
    primaryHex: '#2563eb',
    primaryBg: 'bg-blue-600 hover:bg-blue-700',
    primaryText: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-800',
    ringClass: 'ring-blue-500/20 border-blue-300',
    gradientClass: 'from-blue-600 via-sky-600 to-slate-900',
    tagClass: 'bg-blue-100 text-blue-800 border border-blue-300',
    dashboardPath: '/agent',
  },
};

export function getPortalThemeForUser(user: RegisteredUser | null | undefined): PortalTheme {
  if (!user) return PORTAL_THEMES.CUSTOMER;
  if (user.role === 'DRIVER') return PORTAL_THEMES.DRIVER;
  if (user.role === 'LISTER' || (user.role as string) === 'OWNER') return PORTAL_THEMES.LISTER;
  if (user.role === 'PROVIDER') {
    if (user.providerSubtype === 'COMMERCIAL_CARGO') return PORTAL_THEMES.PROVIDER_COMMERCIAL_CARGO;
    if (user.providerSubtype === 'CITY_TO_CITY') return PORTAL_THEMES.PROVIDER_CITY_TO_CITY;
    return PORTAL_THEMES.PROVIDER_PICK_AND_DROP;
  }
  if (user.role === 'SUPER_ADMIN') return PORTAL_THEMES.SUPER_ADMIN;
  if (user.role === 'AGENT') return PORTAL_THEMES.AGENT;
  return PORTAL_THEMES.CUSTOMER;
}

export const DEMO_USERS: RegisteredUser[] = [
  {
    id: 'usr-super-admin',
    name: 'Super Admin (Operations Director)',
    businessName: 'SafarPK Central Operations Command',
    phone: '+92 300 0000001',
    phoneVerified: true,
    phoneLocked: true,
    email: 'admin@safarpk.com',
    password: 'password123',
    city: 'Islamabad',
    countryCode: 'PK',
    role: 'SUPER_ADMIN',
    registeredAt: '2026-01-01T00:00:00Z',
    nationalId: '37405-0000001-1',
    cnicNumber: '37405-0000001-1',
    cnicName: 'Super Admin',
    cnicLocked: true,
    metrics: {
      viewCount: 18450,
      leadsCount: 1420,
      clickCount: 8900,
      lastActive: '2026-11-21T12:00:00Z',
    },
    activities: [
      {
        id: 'act-admin-01',
        type: 'LOGIN',
        title: 'Super Admin Session Started',
        description: 'Operations Director logged into SafarPK Central Command',
        timestamp: '2026-01-01T00:00:00Z',
      },
    ],
    subscription: {
      status: 'ACTIVE',
      planName: 'Enterprise Super Admin Lifetime',
      quota: 999999,
      usedQuota: 0,
      amountPaid: 0,
      currency: 'PKR',
      symbol: 'Rs',
    },
    approvedServices: ['RENT_A_CAR', 'HIRE_A_DRIVER', 'CITY_TO_CITY', 'PICK_AND_DROP', 'HOME_SHIFTING'],
  },
  {
    id: 'usr-demo-lister',
    name: 'Muhammad Salman',
    businessName: 'Salman Rent a Car & Tours',
    phone: '+92 300 1234567',
    email: 'salman@salmanrentals.pk',
    password: 'password123',
    city: 'Islamabad',
    countryCode: 'PK',
    role: 'LISTER',
    registeredAt: '2026-01-15T10:00:00Z',
    nationalId: '37405-1284910-1',
    cnicNumber: '37405-1284910-1',
    cnicName: 'Muhammad Salman',
    cnicIssueDate: '2018-08-10',
    cnicExpiryDate: '2028-08-09',
    cnicLocked: true,
    licenseNumber: 'ISB-DL-41029',
    licenseName: 'Muhammad Salman',
    licenseCategory: 'LTV / Motorcar',
    licenseIssueDate: '2019-03-12',
    licenseExpiryDate: '2029-03-11',
    licenseLocked: true,
    assignedAgentId: 'ag-1',
    assignedAgentName: 'Kashif Raza',
    metrics: {
      viewCount: 1420,
      leadsCount: 68,
      clickCount: 310,
      lastActive: '2026-11-11T12:00:00Z',
    },
    activities: [
      {
        id: 'act-101',
        type: 'REGISTER',
        title: 'Account Registered',
        description: 'Registered as Vehicle Owner & Private Fleet (Lister) in Islamabad',
        timestamp: '2026-01-15T10:00:00Z',
      },
      {
        id: 'act-102',
        type: 'LISTING_CREATED',
        title: 'Vehicle Listed',
        description: 'Published Honda Civic Oriel Turbo 2024 to marketplace',
        timestamp: '2026-01-16T11:20:00Z',
      },
      {
        id: 'act-103',
        type: 'LEAD_RECEIVED',
        title: 'Direct WhatsApp Lead Received',
        description: 'Customer inquiry from +92 321 9988771 for 3-day wedding booking',
        timestamp: '2026-11-10T14:30:00Z',
      },
    ],
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
    email: 'tariq.driver@safarpk.com',
    password: 'password123',
    city: 'Lahore',
    countryCode: 'PK',
    role: 'DRIVER',
    registeredAt: '2026-02-01T12:00:00Z',
    bio: '12+ years VIP chauffeur experience in Lahore, Islamabad, and Motorway travel.',
    licenseNumber: 'LHR-DL-98210',
    nationalId: '35201-9821045-3',
    cnicNumber: '35201-9821045-3',
    cnicName: 'Tariq Mahmood',
    cnicIssueDate: '2020-05-14',
    cnicExpiryDate: '2030-05-13',
    cnicLocked: true,
    licenseName: 'Tariq Mahmood',
    licenseCategory: 'LTV / Motorcar',
    licenseIssueDate: '2019-01-10',
    licenseExpiryDate: '2029-01-09',
    licenseLocked: true,
    assignedAgentId: 'ag-1',
    assignedAgentName: 'Kashif Raza',
    metrics: {
      viewCount: 890,
      leadsCount: 42,
      clickCount: 195,
      lastActive: '2026-11-11T13:45:00Z',
    },
    activities: [
      {
        id: 'act-201',
        type: 'REGISTER',
        title: 'Driver Account Registered',
        description: 'Independent Chauffeur profile registered in Lahore',
        timestamp: '2026-02-01T12:00:00Z',
      },
      {
        id: 'act-202',
        type: 'CALL_CLICK',
        title: 'Customer Direct Call Received',
        description: 'Passenger dialed phone number for Lahore ➔ Islamabad trip',
        timestamp: '2026-11-09T09:15:00Z',
      },
    ],
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
    name: 'Subhan Ahmed',
    businessName: 'Subhan Commuter Shuttles',
    phone: '+92 321 8472910',
    email: 'subhan.shuttles@safarpk.com',
    password: 'password123',
    city: 'Lahore',
    countryCode: 'PK',
    role: 'PROVIDER',
    providerSubtype: 'PICK_AND_DROP',
    registeredAt: '2026-02-10T14:00:00Z',
    assignedAgentId: 'ag-2',
    assignedAgentName: 'Bilal Ahmed',
    metrics: {
      viewCount: 650,
      leadsCount: 31,
      clickCount: 140,
      lastActive: '2026-11-11T10:15:00Z',
    },
    activities: [
      {
        id: 'act-301',
        type: 'REGISTER',
        title: 'Pick & Drop Provider Registered',
        description: 'Daily commuter van shuttle service registered in Lahore',
        timestamp: '2026-02-10T14:00:00Z',
      },
    ],
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
    email: 'almakkah.cargo@safarpk.com',
    password: 'password123',
    city: 'Islamabad',
    countryCode: 'PK',
    role: 'PROVIDER',
    providerSubtype: 'COMMERCIAL_CARGO',
    registeredAt: '2026-02-15T09:00:00Z',
    assignedAgentId: 'ag-3',
    assignedAgentName: 'Ayesha Khan',
    metrics: {
      viewCount: 480,
      leadsCount: 22,
      clickCount: 110,
      lastActive: '2026-11-10T18:00:00Z',
    },
    activities: [
      {
        id: 'act-401',
        type: 'REGISTER',
        title: 'Shifting & Cargo Operator Registered',
        description: 'Commercial home shifting truck fleet registered in Islamabad',
        timestamp: '2026-02-15T09:00:00Z',
      },
    ],
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
  {
    id: 'usr-demo-intercity',
    name: 'Farhan Ahmed',
    businessName: 'Farhan Executive Carpool & Highway Fleet',
    phone: '+92 312 9988776',
    email: 'farhan.intercity@safarpk.com',
    password: 'password123',
    city: 'Karachi',
    countryCode: 'PK',
    role: 'PROVIDER',
    providerSubtype: 'CITY_TO_CITY',
    registeredAt: '2026-02-12T10:00:00Z',
    assignedAgentId: 'ag-1',
    assignedAgentName: 'Kashif Raza',
    metrics: {
      viewCount: 1420,
      leadsCount: 68,
      clickCount: 290,
      lastActive: '2026-11-17T14:30:00Z',
    },
    activities: [
      {
        id: 'act-501',
        type: 'REGISTER',
        title: 'City to City Operator Registered',
        description: 'Karachi ➔ Hyderabad daily carpool & private car service registered',
        timestamp: '2026-02-12T10:00:00Z',
      },
    ],
    subscription: {
      status: 'ACTIVE',
      planId: 'p-intercity-1',
      planName: 'Intercity Route Operator Pass',
      quota: 10,
      usedQuota: 2,
      amountPaid: 8000,
      currency: 'PKR',
      symbol: 'Rs',
      renewsOn: '18 Dec 2026',
    },
  },
  {
    id: 'usr-demo-customer',
    name: 'Farhan Zaidi',
    phone: '+92 345 8899201',
    email: 'farhan.customer@gmail.com',
    password: 'password123',
    city: 'Karachi',
    countryCode: 'PK',
    role: 'CUSTOMER',
    registeredAt: '2026-03-01T15:00:00Z',
    metrics: {
      viewCount: 85,
      leadsCount: 6,
      clickCount: 28,
      lastActive: '2026-11-11T14:00:00Z',
    },
    activities: [
      {
        id: 'act-501',
        type: 'REGISTER',
        title: 'Customer Profile Created',
        description: 'Customer account created with verified phone',
        timestamp: '2026-03-01T15:00:00Z',
      },
    ],
    subscription: {
      status: 'ACTIVE',
      quota: 0,
      usedQuota: 0,
    },
  },
];

const STORAGE_USERS_KEY = 'safarpk_registered_users_v2';
const STORAGE_ACTIVE_SESSION_KEY = 'safarpk_active_auth_session_v2';

/**
 * Sanitizes and normalizes Pakistani phone numbers:
 * - Default country prefix: +92 (Pakistan)
 * - Automatically removes leading zeroes: e.g. 03331286257 -> 3331286257
 * - Handles prefixes: +923331286257, 923331286257, 03331286257, or 3331286257
 * - Enforces strictly max 10 digits starting with 3 (e.g. 333 1286257)
 * - Returns clean display digits, standardized storage string (+92 333 1286257),
 *   and canonical database lookup key (923331286257).
 */
export function sanitizePakistaniPhone(raw: string): {
  rawDigits: string;
  display: string;
  standard: string;
  key: string;
  isValid: boolean;
} {
  if (!raw) {
    return { rawDigits: '', display: '', standard: '', key: '', isValid: false };
  }
  let digits = raw.replace(/\D/g, '');
  // If user entered +92... or 92...
  if (digits.startsWith('92')) {
    digits = digits.slice(2);
  }
  // Strip any leading zeroes (e.g. '0333...' -> '333...')
  digits = digits.replace(/^0+/, '');
  // Limit to 10 digits (all Pakistani mobile numbers are 10 digits starting with 3)
  digits = digits.slice(0, 10);

  const display = digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
  const standard = digits ? `+92 ${display}` : '';
  const key = digits ? `92${digits}` : '';
  const isValid = digits.length === 10 && digits.startsWith('3');

  return { rawDigits: digits, display, standard, key, isValid };
}

/**
 * Normalizes phone numbers (removes spaces, dashes, formatting, resolves to canonical lookup key)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const sanitized = sanitizePakistaniPhone(phone);
  if (sanitized.key) return sanitized.key;
  return phone.replace(/[\s\-\(\)\.]/g, '').trim();
}

export interface WhatsAppOtpResult {
  success: boolean;
  code: string;
  phoneStandard: string;
  waLink: string;
  expiresAt: number;
  message: string;
}

/**
 * Dispatch a 6-digit WhatsApp verification OTP for free authentic phone authentication
 */
export function sendWhatsAppVerificationOtp(phone: string): WhatsAppOtpResult {
  const sanitized = sanitizePakistaniPhone(phone);
  // Generate authentic 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  if (typeof window !== 'undefined') {
    try {
      const payload = { code, phone: sanitized.standard, key: sanitized.key, expiresAt };
      localStorage.setItem(`safarpk_wa_otp_${sanitized.key}`, JSON.stringify(payload));
    } catch (e) {}
  }

  const waText = encodeURIComponent(
    `*SafarPK Verification Code*\nYour secure authentication code is: *${code}*\nValid for 10 minutes. Enter this code on SafarPK to verify your WhatsApp number.`
  );
  const waLink = `https://wa.me/?text=${waText}`;

  return {
    success: true,
    code,
    phoneStandard: sanitized.standard || phone,
    waLink,
    expiresAt,
    message: `Verification code sent to WhatsApp: ${sanitized.standard || phone}`,
  };
}

/**
 * Verify WhatsApp OTP code
 */
export function verifyWhatsAppOtpCode(phone: string, inputCode: string): { success: boolean; error?: string } {
  const sanitized = sanitizePakistaniPhone(phone);
  if (!sanitized.key) {
    return { success: false, error: 'Invalid phone number.' };
  }
  const cleanInput = inputCode.replace(/\D/g, '').trim();
  if (cleanInput.length !== 6) {
    return { success: false, error: 'Please enter the complete 6-digit verification code.' };
  }

  if (typeof window === 'undefined') {
    return { success: true };
  }

  try {
    const raw = localStorage.getItem(`safarpk_wa_otp_${sanitized.key}`);
    if (!raw) {
      // Allow valid 6-digit code entered from simulated dispatch
      return { success: true };
    }
    const data = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }
    if (data.code !== cleanInput) {
      return { success: false, error: 'Incorrect verification code. Please check and try again.' };
    }
    // Clean up
    localStorage.removeItem(`safarpk_wa_otp_${sanitized.key}`);
    return { success: true };
  } catch (e) {
    return { success: true };
  }
}

/**
 * Mark a user's phone permanently verified and locked in profile
 */
export function markUserPhoneVerified(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const all = getAllRegisteredUsers();
    const user = all.find((u) => u.id === userId);
    if (user) {
      user.phoneVerified = true;
      user.phoneLocked = true;
      saveAllRegisteredUsers(all);
      const active = getActiveUser();
      if (active && (active.id === userId || active.phone === user.phone)) {
        active.phoneVerified = true;
        active.phoneLocked = true;
        setActiveUser(active);
      }
      window.dispatchEvent(new CustomEvent('safarpk_auth_state_changed', { detail: user }));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

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
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    // Ensure all users have metrics and activities initialized
    let mutated = false;
    const sanitized = parsed.map((u: any) => {
      let changed = false;
      if (!u.metrics) {
        u.metrics = { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: u.registeredAt || new Date().toISOString() };
        changed = true;
      }
      if (!u.activities || !Array.isArray(u.activities)) {
        u.activities = [
          {
            id: `act-${Date.now()}`,
            type: 'REGISTER',
            title: 'Account Registered',
            description: `Registered as ${u.role}`,
            timestamp: u.registeredAt || new Date().toISOString(),
          },
        ];
        changed = true;
      }
      if (changed) mutated = true;
      return u as RegisteredUser;
    });

    // Ensure all demo accounts (like Subhan Shuttles and Farhan Intercity) are present and updated in storage
    for (const demo of DEMO_USERS) {
      const idx = sanitized.findIndex((u: any) => u.id === demo.id);
      if (idx === -1) {
        sanitized.push(demo);
        mutated = true;
      } else if (
        sanitized[idx].email !== demo.email ||
        sanitized[idx].name !== demo.name ||
        sanitized[idx].city !== demo.city
      ) {
        sanitized[idx] = {
          ...sanitized[idx],
          email: demo.email,
          name: demo.name,
          businessName: demo.businessName,
          providerSubtype: demo.providerSubtype,
          city: demo.city,
        };
        mutated = true;
      }
    }

    if (mutated) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
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
 * Purge all demo/dummy accounts so the portal operates with 100% REAL users,
 * preserving only the Super Admin authority account.
 */
export function purgeDemoData(): void {
  if (typeof window === 'undefined') return;
  try {
    const adminOnly = DEMO_USERS.filter((u) => u.role === 'SUPER_ADMIN');
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(adminOnly));
    window.dispatchEvent(new Event('safarpk_users_updated'));
  } catch (e) {
    console.error('Failed to purge demo data:', e);
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
    // Update lastActive
    user.metrics = user.metrics || { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() };
    user.metrics.lastActive = new Date().toISOString();

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
 * Authenticate existing user by Phone or Email and Password
 */
export function authenticateUser(
  identifier: string,
  password?: string
): { success: boolean; user?: RegisteredUser; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const normPhone = normalizePhone(cleanId);
  const all = getAllRegisteredUsers();

  const found = all.find((u) => {
    const userPhoneNorm = normalizePhone(u.phone);
    const matchesPhone = userPhoneNorm === normPhone || userPhoneNorm.endsWith(normPhone) || normPhone.endsWith(userPhoneNorm);
    const matchesEmail = u.email && u.email.trim().toLowerCase() === cleanId;
    return matchesPhone || matchesEmail;
  });

  if (!found) {
    return {
      success: false,
      error: 'No account registered with this phone number or email address.',
    };
  }

  // If user has a password set and password is provided, verify it
  if (found.password && password && found.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please check and try again.',
    };
  }

  // Record login activity
  logUserActivity(found.id, {
    type: 'LOGIN',
    title: 'User Signed In',
    description: `Signed into ${found.role} dashboard`,
  });

  setActiveUser(found);
  return {
    success: true,
    user: found,
  };
}

/**
 * Register a brand new user dynamically with phone, optional email & password
 */
export function registerNewUser(params: {
  name: string;
  businessName?: string;
  phone: string;
  phoneVerified?: boolean;
  phoneLocked?: boolean;
  cnicFrontUploaded?: boolean;
  cnicBackUploaded?: boolean;
  licenseUploaded?: boolean;
  email?: string;
  password?: string;
  city: string;
  countryCode: string;
  role: UserRole;
  providerSubtype?: ProviderSubtype;
}): { success: boolean; user: RegisteredUser; error?: string; alreadyExists?: boolean } {
  const sanitizedPhone = sanitizePakistaniPhone(params.phone);
  const cleanPhone = sanitizedPhone.standard || params.phone.trim();
  const normPhone = normalizePhone(cleanPhone);
  const cleanEmail = params.email?.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanCity = params.city.trim() || 'Lahore';
  const cleanBusiness = params.businessName?.trim() || (params.role === 'LISTER' ? `${cleanName} Fleet` : undefined);

  const all = getAllRegisteredUsers();

  // Check if phone or email already registered
  const existing = all.find((u) => {
    const uPhoneNorm = normalizePhone(u.phone);
    const matchesPhone = uPhoneNorm === normPhone;
    const matchesEmail = cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail;
    return matchesPhone || matchesEmail;
  });

  if (existing) {
    // If password matches existing account, auto-login into that account
    if (params.password && existing.password === params.password) {
      logUserActivity(existing.id, {
        type: 'LOGIN',
        title: 'Account Accessed',
        description: `Existing account opened via matching credentials`,
      });
      setActiveUser(existing);
      return {
        success: true,
        user: existing,
        alreadyExists: true,
      };
    }

    return {
      success: false,
      user: existing,
      alreadyExists: true,
      error: `An account with this ${normPhone ? 'phone number' : 'email'} is already registered. Please enter your existing password to log in.`,
    };
  }

  const nowIso = new Date().toISOString();
  const newUser: RegisteredUser = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name: cleanName,
    businessName: cleanBusiness,
    phone: cleanPhone,
    phoneVerified: Boolean(params.phoneVerified),
    phoneLocked: Boolean(params.phoneLocked),
    cnicFrontUploaded: Boolean(params.cnicFrontUploaded),
    cnicBackUploaded: Boolean(params.cnicBackUploaded),
    licenseUploaded: Boolean(params.licenseUploaded),
    cnicLocked: false,
    licenseLocked: false,
    kycStatus: 'UNVERIFIED',
    email: cleanEmail || undefined,
    password: params.password,
    city: cleanCity,
    countryCode: params.countryCode || 'PK',
    role: params.role,
    providerSubtype: params.providerSubtype,
    registeredAt: nowIso,
    metrics: {
      viewCount: 0,
      leadsCount: 0,
      clickCount: 0,
      lastActive: nowIso,
    },
    activities: [
      {
        id: `act-${Date.now()}`,
        type: 'REGISTER',
        title: 'Account Created',
        description: `New ${params.role} account registered in ${cleanCity}`,
        timestamp: nowIso,
      },
    ],
    subscription: (() => {
      const promoPolicy = isCategoryFreePromoActive(params.role, params.providerSubtype);
      if (promoPolicy && promoPolicy.isFreePromoActive) {
        const duration = promoPolicy.freeDurationDays || 30;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + duration);
        const expiryIso = expiry.toISOString();
        const expiryDisplay = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const quota = promoPolicy.quota !== undefined ? promoPolicy.quota : (params.role === 'DRIVER' ? 1 : 15);

        return {
          status: 'ACTIVE' as SubscriptionStatus,
          planId: promoPolicy.planId || `${params.role.toLowerCase()}-free-promo`,
          planName: promoPolicy.planName,
          amountPaid: 0,
          originalAmount: promoPolicy.displayOriginalPrice,
          discountAmount: promoPolicy.displayOriginalPrice,
          discountPercentage: 100,
          isFreePromo: true,
          freePromoReason: promoPolicy.reason,
          currency: promoPolicy.currency || 'PKR',
          symbol: promoPolicy.symbol || 'Rs',
          billingCycle: promoPolicy.billingCycle || (duration >= 300 ? 'ANNUAL' : 'MONTHLY'),
          startDate: nowIso.slice(0, 10),
          endDate: expiryIso,
          validUntil: expiryIso,
          renewsOn: expiryDisplay,
          quota,
          usedQuota: 0,
          approvedAt: nowIso,
          paymentRef: `PROMO-FREE-${Date.now().toString().slice(-6)}`,
        };
      }
      return {
        status: 'UNSUBSCRIBED' as SubscriptionStatus,
        quota: 0,
        usedQuota: 0,
      };
    })(),
  };

  // If auto-granted promotional free subscription, record into billing history ledger
  if (newUser.subscription.isFreePromo) {
    try {
      recordSubscriptionPayment({
        userId: newUser.id,
        userName: newUser.name,
        businessName: newUser.businessName,
        phone: newUser.phone,
        role: newUser.role,
        providerSubtype: newUser.providerSubtype,
        planId: newUser.subscription.planId || 'free-promo',
        planName: newUser.subscription.planName || 'Promotional Free Listing Pass',
        amountPaid: 0,
        originalAmount: newUser.subscription.originalAmount || 2500,
        discountAmount: newUser.subscription.originalAmount || 2500,
        discountPercentage: 100,
        isFreePromo: true,
        currency: newUser.subscription.currency || 'PKR',
        symbol: newUser.subscription.symbol || 'Rs',
        paymentMode: '100% Promo Waiver / Free Trial',
        paymentRef: newUser.subscription.paymentRef || `PROMO-${Date.now().toString().slice(-6)}`,
        status: 'CONFIRMED',
        recordedBy: 'Category Promo Policy (Super Admin)',
        notes: newUser.subscription.freePromoReason || '100% Free Promotional Trial (0 PKR paid)',
      });
    } catch (e) {}
  }

  all.unshift(newUser);
  saveAllRegisteredUsers(all);
  setActiveUser(newUser);

  return {
    success: true,
    user: newUser,
  };
}

/**
 * Log a user activity event
 */
export function logUserActivity(
  userId: string,
  activity: Omit<UserActivityLog, 'id' | 'timestamp'>
): void {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return;

  user.activities = user.activities || [];
  user.activities.unshift({
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...activity,
    timestamp: new Date().toISOString(),
  });

  // Limit activity logs per user to 50
  if (user.activities.length > 50) {
    user.activities = user.activities.slice(0, 50);
  }

  user.metrics = user.metrics || { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() };
  user.metrics.lastActive = new Date().toISOString();

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }
}

/**
 * Increment metrics (viewCount, leadsCount, clickCount) for a user
 */
export function incrementUserMetrics(
  userId: string,
  metric: 'viewCount' | 'leadsCount' | 'clickCount'
): void {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return;

  user.metrics = user.metrics || { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() };
  user.metrics[metric] = (user.metrics[metric] || 0) + 1;
  user.metrics.lastActive = new Date().toISOString();

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }
}

/**
 * Super Admin assigns a user to a specific staff agent
 */
export function assignUserToAgent(
  userId: string,
  agentId: string,
  agentName: string
): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  user.assignedAgentId = agentId;
  user.assignedAgentName = agentName;

  logUserActivity(userId, {
    type: 'AGENT_ASSIGNED',
    title: 'Staff Agent Assigned',
    description: `Assigned to ${agentName} (${agentId}) for onboarding and support`,
  });

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  return user;
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

  logUserActivity(userId, {
    type: 'SUBSCRIPTION_REQUESTED',
    title: 'Subscription Payment Submitted',
    description: `Submitted receipt for ${plan.name} (${currency} ${finalAmount}) - Ref: ${paymentRef}`,
  });

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

  logUserActivity(userId, {
    type: 'SUBSCRIPTION_REQUESTED',
    title: 'Subscription Approved by Admin',
    description: `Plan "${user.subscription.planName}" approved. Quota of ${user.subscription.quota} listings unlocked.`,
  });

  saveAllRegisteredUsers(all);

  // Record into financial ledger if amount paid
  if (user.subscription.amountPaid && user.subscription.amountPaid > 0) {
    recordSubscriptionPayment({
      userId: user.id,
      userName: user.name,
      businessName: user.businessName,
      phone: user.phone,
      role: user.role,
      providerSubtype: user.providerSubtype,
      planId: user.subscription.planId || 'standard-pass',
      planName: user.subscription.planName || 'Monthly Subscription Pass',
      amountPaid: user.subscription.amountPaid,
      currency: user.subscription.currency || 'PKR',
      symbol: user.subscription.symbol || 'Rs',
      paymentMode: 'Bank / Mobile Wallet Deposit',
      paymentRef: user.subscription.paymentRef || `REF-${Date.now().toString().slice(-6)}`,
      status: 'CONFIRMED',
      recordedBy: 'Super Admin',
      notes: 'Approved via Super Admin approvals queue',
    });
  }

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  return user;
}

/**
 * Super Admin rejects a subscription
 */
export function rejectSubscriptionByAdmin(
  userId: string,
  reason: string = 'Payment receipt could not be verified'
): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  user.subscription.status = 'REJECTED';
  user.subscription.rejectionReason = reason;

  logUserActivity(userId, {
    type: 'SUBSCRIPTION_REQUESTED',
    title: 'Subscription Rejected by Admin',
    description: `Subscription rejected: ${reason}`,
  });

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(user);
  }

  return user;
}

/**
 * Super Admin or Agent extends a lister's subscription
 * If current subscription has expired, new time starts from today.
 */
export function extendUserSubscription(
  userId: string,
  addedDays: number,
  reason: string = 'Administrative Plan Extension',
  by: string = 'Super Admin'
): RegisteredUser | null {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === userId);
  if (!user) return null;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let baseDate = now;
  const currentEndStr = user.subscription?.validUntil || user.subscription?.endDate || user.subscription?.renewsOn;
  if (currentEndStr) {
    const existingEnd = new Date(currentEndStr.includes('T') ? currentEndStr : currentEndStr + 'T00:00:00');
    if (!isNaN(existingEnd.getTime()) && existingEnd > now) {
      baseDate = existingEnd;
    }
  }

  const newEnd = new Date(baseDate);
  newEnd.setDate(newEnd.getDate() + addedDays);
  const newEndStr = newEnd.toISOString().slice(0, 10);

  if (!user.subscription) {
    user.subscription = {
      planId: 'pro',
      planName: 'Professional Fleet Hub',
      status: 'ACTIVE',
      startDate: todayStr,
      endDate: newEndStr,
      validUntil: newEndStr,
      renewsOn: newEndStr,
      quota: 10,
      usedQuota: 0,
      amountPaid: 12000,
    };
  } else {
    user.subscription.status = 'ACTIVE';
    user.subscription.endDate = newEndStr;
    user.subscription.validUntil = newEndStr;
    user.subscription.renewsOn = newEndStr;
  }

  logUserActivity(userId, {
    type: 'SUBSCRIPTION_REQUESTED',
    title: `Plan Extended by ${addedDays} Days`,
    description: `Plan extended until ${newEndStr}. Reason: ${reason} (by ${by})`,
  });

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

export const logoutActiveUser = logoutUser;

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

/**
 * =========================================================================
 * SUBSCRIPTION FINANCIAL LEDGER & MANUAL ONBOARDING
 * =========================================================================
 */

export interface SubscriptionPaymentRecord {
  id: string;
  userId: string;
  userName: string;
  businessName?: string;
  phone: string;
  role: UserRole;
  providerSubtype?: ProviderSubtype;
  planId: string;
  planName: string;
  amountPaid: number;
  originalAmount?: number;
  discountAmount?: number;
  discountPercentage?: number;
  isFreePromo?: boolean;
  currency: string;
  symbol: string;
  paymentMode: string; // 'Cash (Office)' | 'Bank Transfer / Raast' | 'JazzCash / Easypaisa' | 'Card' | 'Cheque'
  paymentRef: string;
  date: string; // ISO date
  status: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  recordedBy: string; // 'Super Admin' | 'Online Gateway' | 'Staff Agent' | 'Vendor Self-Renewal'
  slipUrl?: string; // Uploaded payment slip / receipt image data URL or path
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

const STORAGE_SUBSCRIPTION_LEDGER_KEY = 'safarpk_subscription_ledger';

const DEFAULT_SUBSCRIPTION_LEDGER: SubscriptionPaymentRecord[] = [
  {
    id: 'pay-seed-101',
    userId: 'usr-demo-lister',
    userName: 'Muhammad Salman',
    businessName: 'Salman Rent a Car & Tours',
    phone: '+92 300 1234567',
    role: 'LISTER',
    planId: 'p-2',
    planName: 'Professional Fleet Hub (15 Vehicles)',
    amountPaid: 12000,
    currency: 'PKR',
    symbol: 'Rs',
    paymentMode: 'Bank Transfer / Raast',
    paymentRef: 'RAAST-8829104',
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: 'CONFIRMED',
    recordedBy: 'Super Admin',
    notes: 'Paid via Meezan Bank Raast transfer',
  },
  {
    id: 'pay-seed-102',
    userId: 'usr-demo-driver',
    userName: 'Tariq Mahmood',
    phone: '+92 301 9821045',
    role: 'DRIVER',
    planId: 'p-drv1',
    planName: 'Independent Chauffeur Pass',
    amountPaid: 2000,
    currency: 'PKR',
    symbol: 'Rs',
    paymentMode: 'JazzCash / Easypaisa',
    paymentRef: 'JC-992104',
    date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    status: 'CONFIRMED',
    recordedBy: 'Super Admin',
    notes: 'JazzCash direct mobile transfer',
  },
  {
    id: 'pay-seed-103',
    userId: 'usr-demo-provider-pnd',
    userName: 'Subhan Ahmed',
    businessName: 'Subhan Commuter Shuttles',
    phone: '+92 300 9876543',
    role: 'PROVIDER',
    providerSubtype: 'PICK_AND_DROP',
    planId: 'p-prov2',
    planName: 'Commuter Route Shuttle Pass',
    amountPaid: 4800,
    currency: 'PKR',
    symbol: 'Rs',
    paymentMode: 'Cash (Office)',
    paymentRef: 'CASH-OFF-101',
    date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    status: 'CONFIRMED',
    recordedBy: 'Super Admin',
    notes: 'Cash received at Lahore regional desk',
  },
  {
    id: 'pay-seed-104',
    userId: 'usr-demo-provider-cargo',
    userName: 'Haji Riaz Ahmed',
    businessName: 'Al-Makkah Shifting Transport',
    phone: '+92 333 5599182',
    role: 'PROVIDER',
    providerSubtype: 'COMMERCIAL_CARGO',
    planId: 'p-prov1',
    planName: 'Cargo & Shifting Mover Pass',
    amountPaid: 5500,
    currency: 'PKR',
    symbol: 'Rs',
    paymentMode: 'Bank Transfer / Raast',
    paymentRef: 'MEZN-55102',
    date: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    status: 'CONFIRMED',
    recordedBy: 'Super Admin',
    notes: 'Annual cargo logistics membership deposit',
  },
];

export function getAllSubscriptionPayments(): SubscriptionPaymentRecord[] {
  if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION_LEDGER;
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTION_LEDGER_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_SUBSCRIPTION_LEDGER_KEY, JSON.stringify(DEFAULT_SUBSCRIPTION_LEDGER));
      return DEFAULT_SUBSCRIPTION_LEDGER;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_SUBSCRIPTION_LEDGER;
  }
}

export function recordSubscriptionPayment(record: Omit<SubscriptionPaymentRecord, 'id' | 'date'>): SubscriptionPaymentRecord {
  const current = getAllSubscriptionPayments();
  const newRecord: SubscriptionPaymentRecord = {
    ...record,
    id: `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString(),
  };

  const updated = [newRecord, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUBSCRIPTION_LEDGER_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('safarpk_ledger_updated'));
  }
  return newRecord;
}

export function updateSubscriptionPaymentRecord(
  paymentId: string,
  updates: Partial<SubscriptionPaymentRecord>
): boolean {
  const current = getAllSubscriptionPayments();
  const idx = current.findIndex((p) => p.id === paymentId);
  if (idx === -1) return false;

  current[idx] = {
    ...current[idx],
    ...updates,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUBSCRIPTION_LEDGER_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('safarpk_ledger_updated'));
  }
  return true;
}

/**
 * Approve a pending subscription payment.
 * Updates ledger status to CONFIRMED, activates the user's subscription,
 * sets KYC to VERIFIED, and logs an activity.
 */
export function approveSubscriptionPayment(
  paymentId: string,
  approvedBy = 'Super Admin'
): { success: boolean; payment?: SubscriptionPaymentRecord } {
  const current = getAllSubscriptionPayments();
  const payment = current.find((p) => p.id === paymentId);
  if (!payment) return { success: false };

  const nowIso = new Date().toISOString();
  payment.status = 'CONFIRMED';
  payment.approvedAt = nowIso;
  payment.approvedBy = approvedBy;
  payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Verified & Approved by ${approvedBy} on ${new Date().toLocaleDateString('en-GB')}`;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUBSCRIPTION_LEDGER_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('safarpk_ledger_updated'));
  }

  // Also update corresponding user's subscription to ACTIVE
  const allUsers = getAllRegisteredUsers();
  const user = allUsers.find(
    (u) =>
      u.id === payment.userId ||
      (payment.phone && u.phone === payment.phone) ||
      (payment.businessName && u.businessName === payment.businessName)
  );

  if (user) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const renewsOnStr = expiry.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (!user.subscription) {
      user.subscription = {
        status: 'ACTIVE',
        planId: payment.planId,
        planName: payment.planName,
        targetRole: user.role,
        amountPaid: payment.amountPaid,
        currency: payment.currency,
        symbol: payment.symbol,
        paymentRef: payment.paymentRef,
        requestedAt: payment.date,
        approvedAt: nowIso,
        quota: user.role === 'DRIVER' ? 1 : 15,
        usedQuota: 0,
        renewsOn: renewsOnStr,
      };
    } else {
      user.subscription.status = 'ACTIVE';
      user.subscription.approvedAt = nowIso;
      user.subscription.amountPaid = payment.amountPaid;
      user.subscription.paymentRef = payment.paymentRef;
      user.subscription.renewsOn = renewsOnStr;
    }

    user.kycStatus = 'VERIFIED';
    logUserActivity(user.id, {
      type: 'SUBSCRIPTION_REQUESTED',
      title: 'Payment Confirmed & Plan Activated',
      description: `Payment of ${payment.symbol} ${payment.amountPaid.toLocaleString()} verified by ${approvedBy}. Subscription "${payment.planName}" is now fully LIVE!`,
    });

    saveAllRegisteredUsers(allUsers);

    // Sync active session if it's the currently logged in user
    const active = getActiveUser();
    if (active && (active.id === user.id || active.phone === user.phone)) {
      setActiveUser(user);
    }
  }

  return { success: true, payment };
}

/**
 * Reject a pending subscription payment.
 * Sets status to FAILED with reason, updates user's subscription status to FAILED,
 * and leaves the failed transaction in history so the user can pay again.
 */
export function rejectSubscriptionPayment(
  paymentId: string,
  rejectedBy = 'Super Admin',
  reason = 'Payment slip or reference could not be verified'
): { success: boolean } {
  const current = getAllSubscriptionPayments();
  const payment = current.find((p) => p.id === paymentId);
  if (!payment) return { success: false };

  payment.status = 'FAILED';
  payment.rejectionReason = reason;
  payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Rejected by ${rejectedBy}: ${reason}`;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUBSCRIPTION_LEDGER_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('safarpk_ledger_updated'));
  }

  // Update user subscription to FAILED
  const allUsers = getAllRegisteredUsers();
  const user = allUsers.find(
    (u) =>
      u.id === payment.userId ||
      (payment.phone && u.phone === payment.phone) ||
      (payment.businessName && u.businessName === payment.businessName)
  );

  if (user && user.subscription) {
    user.subscription.status = 'FAILED' as any;
    logUserActivity(user.id, {
      type: 'SUBSCRIPTION_REQUESTED',
      title: 'Payment Verification Failed',
      description: `Payment attempt of ${payment.symbol} ${payment.amountPaid.toLocaleString()} was marked failed by ${rejectedBy}. Reason: ${reason}`,
    });

    saveAllRegisteredUsers(allUsers);

    const active = getActiveUser();
    if (active && (active.id === user.id || active.phone === user.phone)) {
      setActiveUser(user);
    }
  }

  return { success: true };
}

/**
 * Super Admin manually registers a vendor and activates subscription with payment recorded
 */
export function createManualVendorWithSubscription(params: {
  name: string;
  businessName?: string;
  phone: string;
  phoneVerified?: boolean;
  phoneLocked?: boolean;
  cnicFrontUploaded?: boolean;
  cnicBackUploaded?: boolean;
  licenseUploaded?: boolean;
  email?: string;
  password?: string;
  city: string;
  countryCode?: string;
  role: UserRole;
  providerSubtype?: ProviderSubtype;
  planId: string;
  planName: string;
  quota: number;
  amountPaid: number;
  paymentMode: string;
  paymentRef: string;
  adminNotes?: string;
}): { success: boolean; user: RegisteredUser; payment: SubscriptionPaymentRecord } {
  const cleanPhone = params.phone.trim();
  const cleanName = params.name.trim();
  const cleanCity = params.city.trim() || 'Lahore';
  const cleanBusiness = params.businessName?.trim() || `${cleanName} Fleet`;
  const plainPassword = params.password?.trim() || 'Safar@2026';

  const all = getAllRegisteredUsers();
  const nowIso = new Date().toISOString();

  // 1 calendar month expiry
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);
  const renewsOnStr = expiry.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const newUser: RegisteredUser = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name: cleanName,
    businessName: cleanBusiness,
    phone: cleanPhone,
    email: params.email?.trim() || undefined,
    password: plainPassword,
    city: cleanCity,
    countryCode: params.countryCode || 'PK',
    role: params.role,
    providerSubtype: params.providerSubtype,
    kycStatus: 'VERIFIED',
    registeredAt: nowIso,
    metrics: {
      viewCount: 0,
      leadsCount: 0,
      clickCount: 0,
      lastActive: nowIso,
    },
    activities: [
      {
        id: `act-${Date.now()}`,
        type: 'REGISTER',
        title: 'Vendor Created by Super Admin',
        description: `Manual registration with activated ${params.planName}`,
        timestamp: nowIso,
      },
      {
        id: `act-${Date.now() + 1}`,
        type: 'SUBSCRIPTION_REQUESTED',
        title: 'Subscription Activated by Admin',
        description: `Plan "${params.planName}" activated. Quota of ${params.quota} listings unlocked.`,
        timestamp: nowIso,
      },
    ],
    subscription: {
      status: 'ACTIVE',
      planId: params.planId,
      planName: params.planName,
      targetRole: params.role,
      amountPaid: params.amountPaid,
      currency: 'PKR',
      symbol: 'Rs',
      paymentRef: params.paymentRef,
      requestedAt: nowIso,
      approvedAt: nowIso,
      quota: params.quota,
      usedQuota: 0,
      renewsOn: renewsOnStr,
    },
  };

  // Add to user storage
  all.unshift(newUser);
  saveAllRegisteredUsers(all);

  // Record payment in financial ledger
  const paymentRecord = recordSubscriptionPayment({
    userId: newUser.id,
    userName: newUser.name,
    businessName: newUser.businessName,
    phone: newUser.phone,
    role: newUser.role,
    providerSubtype: newUser.providerSubtype,
    planId: params.planId,
    planName: params.planName,
    amountPaid: params.amountPaid,
    currency: 'PKR',
    symbol: 'Rs',
    paymentMode: params.paymentMode,
    paymentRef: params.paymentRef || `MANUAL-${Date.now().toString().slice(-6)}`,
    status: 'CONFIRMED',
    recordedBy: 'Super Admin',
    notes: params.adminNotes || 'Manually created and activated via Super Admin desk',
  });

  return { success: true, user: newUser, payment: paymentRecord };
}

/**
 * Create a new Agent user (SUPER ADMIN EXCLUSIVE)
 * Agents can only be created by Super Admin and cannot self-register.
 */
export function createAgentUser(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  city?: string;
  branch?: string;
  desk?: string;
  staffId?: string;
  employeeId?: string;
  permissions?: string[];
}): { success: boolean; agent?: RegisteredUser; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not defined' };
  }

  const cleanEmail = (data.email || '').trim().toLowerCase();
  const cleanPhone = (data.phone || '').trim();
  const cleanName = (data.name || '').trim();

  if (!cleanName) return { success: false, error: 'Agent full name is required' };
  if (!cleanEmail && !cleanPhone) return { success: false, error: 'Email or phone number is required' };

  const all = getAllRegisteredUsers();
  const exists = all.some(
    (u) =>
      (cleanEmail && u.email?.toLowerCase() === cleanEmail) ||
      (cleanPhone && u.phone === cleanPhone)
  );

  if (exists) {
    return { success: false, error: 'A staff member or user with this email/phone already exists' };
  }

  const agentStaffId = data.staffId || data.employeeId || `AG-${Math.floor(100 + Math.random() * 900)}`;
  const nowIso = new Date().toISOString();

  const newAgent: RegisteredUser = {
    id: `ag-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone || '+92 300 0000000',
    password: data.password || 'password123',
    city: data.city || 'Lahore',
    countryCode: 'PK',
    role: 'AGENT',
    employeeId: agentStaffId,
    staffId: agentStaffId,
    branch: data.branch || 'Headquarters Desk',
    desk: data.desk || data.branch || 'Headquarters Desk',
    registeredAt: nowIso,
    kycStatus: 'VERIFIED',
    permissions: data.permissions || [
      'customer.view',
      'customer.search',
      'customer.view_details',
      'listing.view',
      'listing.search',
      'listing.approve',
      'listing.reject',
      'listing.activate',
      'listing.suspend',
      'driver.view',
      'driver.search',
      'driver.verify_docs',
      'booking.view',
      'booking.search',
      'reports.view_dashboard',
    ],
    subscription: {
      status: 'ACTIVE',
      quota: 0,
      usedQuota: 0,
      planName: 'Enterprise Staff Clearance',
    },
    metrics: {
      viewCount: 0,
      leadsCount: 0,
      clickCount: 0,
      lastActive: nowIso,
    },
    activities: [
      {
        id: `act-${Date.now()}`,
        type: 'REGISTER',
        title: 'Agent Account Created by Super Admin',
        description: `Official staff credentials issued: ${cleanName} (${agentStaffId})`,
        timestamp: nowIso,
      },
    ],
  };

  all.unshift(newAgent);
  saveAllRegisteredUsers(all);

  // Save granular permissions map (Strict: Agents cannot delete records)
  try {
    saveAgentPermissions(newAgent.id, {
      view: true,
      contact: true,
      approve: true,
      verify: true,
      edit: true,
      del: false, // Strict: AGENTS CANNOT DELETE USERS
      analytics: true,
      export: true,
      promo: false,
    });
    saveAgentPermissions(agentStaffId, {
      view: true,
      contact: true,
      approve: true,
      verify: true,
      edit: true,
      del: false, // Strict: AGENTS CANNOT DELETE USERS
      analytics: true,
      export: true,
      promo: false,
    });
  } catch (e) {}

  try {
    recordAuditAction({
      action: 'AGENT_CREATED',
      staffId: 'SUPER_ADMIN',
      staffName: 'Super Admin',
      targetType: 'StaffAgent',
      targetId: newAgent.id,
      details: `Created new SafarPK Agent: ${cleanName} (${agentStaffId}) with official clearance`,
    });
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('safarpk_user_registered', { detail: newAgent }));
  window.dispatchEvent(new Event('safarpk_agent_permissions_updated'));

  return { success: true, agent: newAgent };
}

/**
 * Synchronize user fleet listings with their allowed quota limit and active status.
 * If isActive is false, all listings are paused and added to paused list.
 * If isActive is true, up to quota listings are set to LIVE; excess listings stay PAUSED.
 */
export function syncUserListingsQuota(
  userId: string,
  quota: number = 1,
  isActive: boolean = true
): { total: number; live: number; paused: number } {
  if (typeof window === 'undefined') return { total: 0, live: 0, paused: 0 };
  try {
    const fleetKey = `safarpk_fleet_${userId}`;
    const rawFleet = localStorage.getItem(fleetKey);
    const pausedIds = new Set<string>(getPausedListingIds());
    let total = 0;
    let live = 0;
    let paused = 0;

    if (rawFleet) {
      const fleet = JSON.parse(rawFleet);
      if (Array.isArray(fleet) && fleet.length > 0) {
        total = fleet.length;
        const allowedLiveLimit = Math.max(0, quota);

        const updatedFleet = fleet.map((item: any, idx: number) => {
          const itemId = String(item.id || `veh-${idx}`);
          if (!isActive) {
            paused++;
            pausedIds.add(itemId);
            return {
              ...item,
              status: 'PAUSED',
              pausedReason: 'Subscription Inactive / Paused',
            };
          } else if (idx < allowedLiveLimit) {
            live++;
            pausedIds.delete(itemId);
            return {
              ...item,
              status: 'LIVE',
              pausedReason: undefined,
            };
          } else {
            paused++;
            pausedIds.add(itemId);
            return {
              ...item,
              status: 'PAUSED',
              pausedReason: `Plan Quota Limit Reached (Max ${allowedLiveLimit} Allowed)`,
            };
          }
        });

        localStorage.setItem(fleetKey, JSON.stringify(updatedFleet));
      }
    }

    localStorage.setItem('safarpk_paused_listings', JSON.stringify(Array.from(pausedIds)));
    window.dispatchEvent(new Event('safarpk_listing_pause_updated'));
    window.dispatchEvent(new Event('safarpk_fleet_updated'));

    return { total, live, paused };
  } catch (e) {
    return { total: 0, live: 0, paused: 0 };
  }
}

/**
 * Pause / Resume a user's subscription (Available to SUPER_ADMIN and AGENT)
 */
export function toggleUserSubscriptionPause(
  userId: string,
  performedBy: string = 'Staff Admin'
): { success: boolean; isPaused: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, isPaused: false, message: 'Window not defined' };
  try {
    const all = getAllRegisteredUsers();
    const user = all.find((u) => u.id === userId);
    if (!user) return { success: false, isPaused: false, message: 'User not found' };

    const wasActive = user.subscription?.status === 'ACTIVE';
    const newStatus: SubscriptionStatus = wasActive ? 'PAUSED' : 'ACTIVE';
    const effectiveQuota = user.subscription?.quota ?? (user.role === 'DRIVER' ? 1 : 15);

    user.subscription = user.subscription || { quota: effectiveQuota, usedQuota: 0, status: 'UNSUBSCRIBED' };
    user.subscription.status = newStatus;
    user.subscription.quota = effectiveQuota;

    // If resuming an expired subscription, give it 30 days of active grace
    if (newStatus === 'ACTIVE') {
      const now = new Date();
      const validUntil = user.subscription.validUntil ? new Date(user.subscription.validUntil) : null;
      if (!validUntil || isNaN(validUntil.getTime()) || validUntil <= now) {
        const renewed = new Date();
        const cycleDays = user.subscription.billingCycle === 'ANNUAL' ? 365 : 30;
        renewed.setDate(renewed.getDate() + cycleDays);
        user.subscription.validUntil = renewed.toISOString();
        user.subscription.endDate = renewed.toISOString();
        user.subscription.renewsOn = renewed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }

    const actionText = newStatus === 'PAUSED' ? 'Paused' : 'Resumed / Activated';
    user.activities = user.activities || [];
    user.activities.unshift({
      id: `act-${Date.now()}`,
      type: 'PROFILE_UPDATED',
      title: `Subscription ${actionText}`,
      description: `Subscription was ${actionText.toLowerCase()} by ${performedBy}.`,
      timestamp: new Date().toISOString(),
    });

    saveAllRegisteredUsers(all);

    const active = getActiveUser();
    if (active && (active.id === user.id || active.phone === user.phone)) {
      active.subscription = user.subscription;
      setActiveUser(active);
    }

    try {
      recordAuditAction({
        action: 'SUBSCRIPTION_STATUS_CHANGE',
        staffId: performedBy,
        staffName: performedBy,
        targetType: 'UserSubscription',
        targetId: user.id,
        details: `Subscription ${actionText} for ${user.name} (${user.phone})`,
      });
    } catch (e) {}

    // Synchronize fleet listings: when subscription is active, activate up to quota; when paused, pause all
    syncUserListingsQuota(user.id, effectiveQuota, newStatus === 'ACTIVE');

    window.dispatchEvent(new CustomEvent('safarpk_user_subscription_updated', { detail: { userId, status: newStatus } }));
    return {
      success: true,
      isPaused: newStatus === 'PAUSED',
      message: `User subscription has been ${actionText.toLowerCase()}. Active live listings updated as per quota (${effectiveQuota}).`,
    };
  } catch (e: any) {
    return { success: false, isPaused: false, message: e.message || 'Operation failed' };
  }
}

/**
 * Deactivate / Reactivate a user profile (Available to SUPER_ADMIN and AGENT)
 * Note: Agents CANNOT delete users, they can only deactivate profiles!
 */
export function toggleUserProfileDeactivation(
  userId: string,
  reason?: string,
  performedBy: string = 'Staff Admin'
): { success: boolean; isDeactivated: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, isDeactivated: false, message: 'Window not defined' };
  try {
    const all = getAllRegisteredUsers();
    const user = all.find((u) => u.id === userId);
    if (!user) return { success: false, isDeactivated: false, message: 'User not found' };

    const willDeactivate = !user.isDeactivated;
    user.isDeactivated = willDeactivate;
    user.deactivatedReason = willDeactivate ? (reason || 'Deactivated by SafarPK Compliance') : undefined;
    user.deactivatedAt = willDeactivate ? new Date().toISOString() : undefined;
    user.deactivatedBy = willDeactivate ? performedBy : undefined;

    const actionText = willDeactivate ? 'Deactivated' : 'Reactivated';
    user.activities = user.activities || [];
    user.activities.unshift({
      id: `act-${Date.now()}`,
      type: 'PROFILE_UPDATED',
      title: `Profile ${actionText}`,
      description: `User profile was ${actionText.toLowerCase()} by ${performedBy}${reason ? ` (${reason})` : ''}.`,
      timestamp: new Date().toISOString(),
    });

    saveAllRegisteredUsers(all);

    const active = getActiveUser();
    if (active && (active.id === user.id || active.phone === user.phone)) {
      active.isDeactivated = willDeactivate;
      active.deactivatedReason = user.deactivatedReason;
      active.deactivatedAt = user.deactivatedAt;
      active.deactivatedBy = user.deactivatedBy;
      setActiveUser(active);
    }

    try {
      recordAuditAction({
        action: 'USER_PROFILE_DEACTIVATION',
        staffId: performedBy,
        staffName: performedBy,
        targetType: 'UserProfile',
        targetId: user.id,
        details: `Profile ${actionText} for ${user.name} (${user.phone})`,
      });
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('safarpk_user_profile_updated', { detail: { userId, isDeactivated: willDeactivate } }));
    return {
      success: true,
      isDeactivated: willDeactivate,
      message: `User profile has been ${actionText.toLowerCase()}.`,
    };
  } catch (e: any) {
    return { success: false, isDeactivated: false, message: e.message || 'Operation failed' };
  }
}

/**
 * Listing Moderation (Pause / Resume) Controls
 * Agents & Super Admins can pause/unpause listings.
 * Note: Agents cannot delete listings; they can only pause them.
 */
export function getPausedListingIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('safarpk_paused_listings');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isListingPaused(listingId: string, ownerIdentifier?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const paused = getPausedListingIds();
    if (paused.includes(listingId)) return true;

    if (ownerIdentifier) {
      const all = getAllRegisteredUsers();
      const cleanOwner = ownerIdentifier.replace(/\D/g, '');
      const owner = all.find(
        (u) =>
          u.id === ownerIdentifier ||
          (cleanOwner && u.phone && u.phone.replace(/\D/g, '').endsWith(cleanOwner.slice(-10))) ||
          (u.email && u.email.toLowerCase() === ownerIdentifier.toLowerCase())
      );
      if (owner && owner.subscription) {
        if (owner.subscription.status === 'PAUSED' || owner.subscription.status === 'EXPIRED') {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

export function toggleListingPause(
  listingId: string,
  performedBy: string = 'Staff Admin',
  listingRef?: string
): { success: boolean; isPaused: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, isPaused: false, message: 'Window not defined' };
  try {
    const current = getPausedListingIds();
    const isCurrentlyPaused = current.includes(listingId);
    let next: string[];
    if (isCurrentlyPaused) {
      next = current.filter((id) => id !== listingId);
    } else {
      next = [...current, listingId];
    }
    localStorage.setItem('safarpk_paused_listings', JSON.stringify(next));

    try {
      recordAuditAction({
        action: isCurrentlyPaused ? 'LISTING_STATUS_CHANGE' : 'LISTING_SUSPENDED',
        staffId: performedBy,
        staffName: performedBy,
        targetType: 'MarketplaceListing',
        targetId: listingId,
        details: `Listing ${listingRef || listingId} was ${isCurrentlyPaused ? 'resumed (unpaused)' : 'paused'} by ${performedBy}`,
      });
    } catch {}

    window.dispatchEvent(
      new CustomEvent('safarpk_listing_pause_updated', {
        detail: { listingId, isPaused: !isCurrentlyPaused },
      })
    );

    return {
      success: true,
      isPaused: !isCurrentlyPaused,
      message: `Listing has been ${!isCurrentlyPaused ? 'paused' : 'resumed and unpaused'}.`,
    };
  } catch (e: any) {
    return { success: false, isPaused: false, message: e.message || 'Operation failed' };
  }
}

/**
 * =========================================================================
 * CATEGORY PROMOTIONAL POLICIES & FREE SUBSCRIPTION ENGINE
 * =========================================================================
 */
export interface CategoryPromoPolicy {
  category: 'DRIVER' | 'RENT_A_CAR' | 'PICK_AND_DROP' | 'HOME_SHIFTING' | 'CITY_TO_CITY';
  label: string;
  role: UserRole;
  isFreePromoActive: boolean; // TRUE for DRIVER by default
  freeDurationDays: number; // default: 30 days
  displayOriginalPrice: number; // e.g. 2500 for driver, 12000 for rent a car
  currency: string;
  symbol: string;
  planName: string;
  reason: string;
  requiresListingApproval: boolean;
  quota?: number; // Allowed listing quota (e.g. 1 for DRIVER, 15 for RENT_A_CAR)
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
  planId?: string;
}

const STORAGE_CATEGORY_PROMO_KEY = 'safarpk_category_promo_policies';

export const DEFAULT_CATEGORY_PROMO_POLICIES: CategoryPromoPolicy[] = [
  {
    category: 'DRIVER',
    label: 'Hire a Driver (Chauffeur Directory)',
    role: 'DRIVER',
    isFreePromoActive: true, // Free subscription for drivers by default!
    freeDurationDays: 365, // 12 Months / 1 Year Annual Free Launch Pass
    displayOriginalPrice: 7000,
    quota: 1, // Drivers have 1 profile/listing!
    billingCycle: 'ANNUAL',
    currency: 'PKR',
    symbol: 'Rs',
    planName: 'Independent Chauffeur Annual Pass (100% Free Promo)',
    reason: 'Driver Launch Promotion — Free to List Profile (Pending Approval)',
    requiresListingApproval: true,
  },
  {
    category: 'RENT_A_CAR',
    label: 'Rent a Car Fleet',
    role: 'LISTER',
    isFreePromoActive: false,
    freeDurationDays: 30,
    displayOriginalPrice: 12000,
    quota: 15,
    billingCycle: 'MONTHLY',
    currency: 'PKR',
    symbol: 'Rs',
    planName: 'Professional Fleet Hub (15 Vehicles)',
    reason: 'Standard Paid Subscription Required',
    requiresListingApproval: true,
  },
  {
    category: 'PICK_AND_DROP',
    label: 'Pick & Drop Shuttles',
    role: 'PROVIDER',
    isFreePromoActive: false,
    freeDurationDays: 30,
    displayOriginalPrice: 4800,
    quota: 5,
    billingCycle: 'MONTHLY',
    currency: 'PKR',
    symbol: 'Rs',
    planName: 'Commuter Route Shuttle Pass',
    reason: 'Standard Paid Subscription Required',
    requiresListingApproval: true,
  },
  {
    category: 'HOME_SHIFTING',
    label: 'Home Shifting & Cargo',
    role: 'PROVIDER',
    isFreePromoActive: false,
    freeDurationDays: 30,
    displayOriginalPrice: 5500,
    quota: 5,
    billingCycle: 'MONTHLY',
    currency: 'PKR',
    symbol: 'Rs',
    planName: 'Cargo & Shifting Mover Pass',
    reason: 'Standard Paid Subscription Required',
    requiresListingApproval: true,
  },
  {
    category: 'CITY_TO_CITY',
    label: 'City to City Rides',
    role: 'PROVIDER',
    isFreePromoActive: false,
    freeDurationDays: 30,
    displayOriginalPrice: 4500,
    quota: 5,
    billingCycle: 'MONTHLY',
    currency: 'PKR',
    symbol: 'Rs',
    planName: 'Intercity Travel Route Pass',
    reason: 'Standard Paid Subscription Required',
    requiresListingApproval: true,
  },
];

export function getCategoryPromoPolicies(): CategoryPromoPolicy[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORY_PROMO_POLICIES;
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORY_PROMO_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CATEGORY_PROMO_KEY, JSON.stringify(DEFAULT_CATEGORY_PROMO_POLICIES));
      return DEFAULT_CATEGORY_PROMO_POLICIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CATEGORY_PROMO_POLICIES;
  }
}

export function saveCategoryPromoPolicies(policies: CategoryPromoPolicy[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CATEGORY_PROMO_KEY, JSON.stringify(policies));
    window.dispatchEvent(new Event('safarpk_category_promos_updated'));
  } catch (e) {}
}

export function toggleCategoryPromoPolicy(category: string, active?: boolean): CategoryPromoPolicy | null {
  const current = getCategoryPromoPolicies();
  const target = current.find((p) => p.category === category);
  if (!target) return null;
  target.isFreePromoActive = typeof active === 'boolean' ? active : !target.isFreePromoActive;
  saveCategoryPromoPolicies(current);
  return target;
}

export function updateCategoryPromoPolicy(category: string, updates: Partial<CategoryPromoPolicy>): boolean {
  const current = getCategoryPromoPolicies();
  const idx = current.findIndex((p) => p.category === category);
  if (idx === -1) return false;
  current[idx] = { ...current[idx], ...updates };
  saveCategoryPromoPolicies(current);
  return true;
}

export function isCategoryFreePromoActive(role: UserRole, subtype?: ProviderSubtype): CategoryPromoPolicy | null {
  const policies = getCategoryPromoPolicies();
  let categoryKey: 'DRIVER' | 'RENT_A_CAR' | 'PICK_AND_DROP' | 'HOME_SHIFTING' | 'CITY_TO_CITY' = 'RENT_A_CAR';
  let targetRoleKey: 'CAR_RENTAL' | 'DRIVER' | 'PICK_AND_DROP' | 'SHIFTING' | 'PROVIDER' = 'CAR_RENTAL';

  if (role === 'DRIVER') {
    categoryKey = 'DRIVER';
    targetRoleKey = 'DRIVER';
  } else if (role === 'LISTER') {
    categoryKey = 'RENT_A_CAR';
    targetRoleKey = 'CAR_RENTAL';
  } else if (role === 'PROVIDER') {
    if (subtype === 'PICK_AND_DROP') {
      categoryKey = 'PICK_AND_DROP';
      targetRoleKey = 'PICK_AND_DROP';
    } else if (subtype === 'COMMERCIAL_CARGO') {
      categoryKey = 'HOME_SHIFTING';
      targetRoleKey = 'SHIFTING';
    } else {
      categoryKey = 'CITY_TO_CITY';
      targetRoleKey = 'CAR_RENTAL';
    }
  }

  // Priority check: Look for any stored subscription package created with price === 0 (or marked free promo)
  try {
    const storedPlans = getStoredPlans();
    const freePlan = storedPlans.find(
      (p) =>
        p.isActive &&
        p.price === 0 &&
        (p.targetRole === targetRoleKey || p.targetRole === 'ALL' || (role === 'DRIVER' && p.targetRole === 'DRIVER'))
    );
    if (freePlan) {
      const isAnnual = freePlan.billingCycle === 'ANNUAL';
      const duration = isAnnual ? 365 : 30;
      return {
        category: categoryKey,
        label: freePlan.name,
        role: role,
        isFreePromoActive: true,
        freeDurationDays: duration,
        displayOriginalPrice: freePlan.wasPrice || (isAnnual ? 7000 : 2500),
        quota: freePlan.maxListings || (role === 'DRIVER' ? 1 : 15),
        billingCycle: freePlan.billingCycle,
        currency: 'PKR',
        symbol: 'Rs',
        planName: freePlan.name,
        planId: freePlan.id,
        reason: 'Super Admin Published 100% Free Subscription Package',
        requiresListingApproval: true,
      };
    }
  } catch (e) {}

  const p = policies.find((pol) => pol.category === categoryKey);
  return p && p.isFreePromoActive ? p : null;
}

export interface GrantFreeSubscriptionParams {
  userId: string;
  planId?: string;
  planName?: string;
  originalPrice?: number;
  durationDays?: number;
  customExpiryDate?: string;
  quota?: number;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
  status?: SubscriptionStatus;
  reason?: string;
  grantedBy?: string;
}

export function grantFreePromotionalSubscription(params: GrantFreeSubscriptionParams): {
  success: boolean;
  user: RegisteredUser | null;
  expiryDate: string;
  message: string;
} {
  const all = getAllRegisteredUsers();
  const user = all.find((u) => u.id === params.userId);
  if (!user) return { success: false, user: null, expiryDate: '', message: 'User not found' };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const durationDays = params.durationDays ?? (params.billingCycle === 'ANNUAL' ? 365 : 30);
  let expiryDate = new Date();
  if (params.customExpiryDate) {
    const custom = new Date(params.customExpiryDate.includes('T') ? params.customExpiryDate : params.customExpiryDate + 'T23:59:59');
    if (!isNaN(custom.getTime())) {
      expiryDate = custom;
    } else {
      expiryDate.setDate(expiryDate.getDate() + durationDays);
    }
  } else {
    expiryDate.setDate(expiryDate.getDate() + durationDays);
  }

  const expiryIso = expiryDate.toISOString();
  const expiryDisplay = expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const isAnnual = params.billingCycle === 'ANNUAL' || durationDays >= 300;
  const originalPrice = params.originalPrice ?? (user.role === 'DRIVER' ? (isAnnual ? 7000 : 2500) : user.role === 'LISTER' ? 12000 : 5000);
  const planName = params.planName || (user.role === 'DRIVER' ? (isAnnual ? 'Independent Chauffeur Annual Pass (100% Free Promo)' : 'Independent Chauffeur Pass (100% Free Promo)') : 'Commercial Lister Pass (100% Free Promo)');
  const quota = params.quota !== undefined ? params.quota : (user.role === 'DRIVER' ? 1 : 15);
  const subscriptionStatus: SubscriptionStatus = params.status || 'ACTIVE';

  user.subscription = {
    status: subscriptionStatus,
    planId: params.planId || 'free-promo-pass',
    planName,
    amountPaid: 0,
    originalAmount: originalPrice,
    discountAmount: originalPrice,
    discountPercentage: 100,
    isFreePromo: true,
    freePromoReason: params.reason || 'Super Admin 100% Discounted Free Trial',
    currency: 'PKR',
    symbol: 'Rs',
    billingCycle: params.billingCycle || (isAnnual ? 'ANNUAL' : 'MONTHLY'),
    startDate: todayStr,
    endDate: expiryIso,
    validUntil: expiryIso,
    renewsOn: expiryDisplay,
    quota,
    usedQuota: user.subscription?.usedQuota || 0,
    approvedAt: now.toISOString(),
    paymentRef: `PROMO-FREE-${Date.now().toString().slice(-6)}`,
  };

  user.activities = user.activities || [];
  user.activities.unshift({
    id: `act-${Date.now()}`,
    type: 'SUBSCRIPTION_REQUESTED',
    title: '100% Free Promotional Subscription Granted',
    description: `Granted active free subscription until ${expiryDisplay} (${params.reason || 'Admin Waiver'}). Quota: ${quota} listing(s). Original value: PKR ${originalPrice.toLocaleString()} (0 PKR paid).`,
    timestamp: now.toISOString(),
  });

  saveAllRegisteredUsers(all);

  const active = getActiveUser();
  if (active && (active.id === user.id || active.phone === user.phone)) {
    active.subscription = user.subscription;
    setActiveUser(active);
  }

  // Record into financial ledger with 0 PKR paid and 100% discount
  recordSubscriptionPayment({
    userId: user.id,
    userName: user.name,
    businessName: user.businessName,
    phone: user.phone,
    role: user.role,
    providerSubtype: user.providerSubtype,
    planId: params.planId || 'free-promo-pass',
    planName,
    amountPaid: 0,
    originalAmount: originalPrice,
    discountAmount: originalPrice,
    discountPercentage: 100,
    isFreePromo: true,
    currency: 'PKR',
    symbol: 'Rs',
    paymentMode: '100% Promo Waiver / Free Trial',
    paymentRef: user.subscription.paymentRef || `PROMO-${Date.now().toString().slice(-6)}`,
    status: 'CONFIRMED',
    recordedBy: params.grantedBy || 'Super Admin',
    notes: `${params.reason || 'Super Admin 100% Discounted Free Trial'} · Quota: ${quota} Listing(s)`,
  });

  try {
    recordAuditAction({
      action: 'SUBSCRIPTION_STATUS_CHANGE',
      staffId: params.grantedBy || 'Super Admin',
      staffName: params.grantedBy || 'Super Admin',
      targetType: 'UserSubscription',
      targetId: user.id,
      details: `Granted 100% Free Subscription until ${expiryDisplay} for ${user.name} (${user.phone}). Value: PKR ${originalPrice}, Quota: ${quota}, Paid: 0 PKR.`,
    });
  } catch (e) {}

  // Synchronize fleet listings: activate up to quota if ACTIVE, or pause all if PAUSED
  syncUserListingsQuota(user.id, quota, subscriptionStatus === 'ACTIVE');

  window.dispatchEvent(new CustomEvent('safarpk_user_subscription_updated', { detail: { userId: user.id, status: subscriptionStatus } }));
  window.dispatchEvent(new Event('safarpk_auth_state_changed'));

  return {
    success: true,
    user,
    expiryDate: expiryDisplay,
    message: `100% Free subscription activated for ${user.name} until ${expiryDisplay}! Allowed quota: ${quota} Listing(s). Amount: PKR 0 Paid (Value: PKR ${originalPrice.toLocaleString()}).`,
  };
}

export function syncSubscriptionExpiries(): {
  checkedCount: number;
  expiredCount: number;
} {
  if (typeof window === 'undefined') return { checkedCount: 0, expiredCount: 0 };
  try {
    const all = getAllRegisteredUsers();
    const now = new Date();
    let expiredCount = 0;

    all.forEach((user) => {
      if (user.subscription && user.subscription.status === 'ACTIVE') {
        const endStr = user.subscription.validUntil || user.subscription.endDate;
        if (endStr) {
          const end = new Date(endStr.includes('T') ? endStr : endStr + 'T23:59:59');
          if (!isNaN(end.getTime()) && now > end) {
            // Subscription has expired!
            user.subscription.status = 'PAUSED';
            user.subscription.rejectionReason = 'Subscription validity expired';
            expiredCount++;

            // Auto-pause all fleet listings for this user and add to safarpk_paused_listings
            syncUserListingsQuota(user.id, user.subscription.quota || 1, false);

            user.activities = user.activities || [];
            user.activities.unshift({
              id: `act-${Date.now()}`,
              type: 'PROFILE_UPDATED',
              title: 'Subscription Expired — Listings Paused',
              description: `Subscription period ended on ${end.toLocaleDateString()}. All listings automatically paused.`,
              timestamp: now.toISOString(),
            });
          }
        }
      }
    });

    if (expiredCount > 0) {
      saveAllRegisteredUsers(all);
      const active = getActiveUser();
      if (active) {
        const updated = all.find((u) => u.id === active.id);
        if (updated) setActiveUser(updated);
      }
      window.dispatchEvent(new Event('safarpk_user_subscription_updated'));
      window.dispatchEvent(new Event('safarpk_auth_state_changed'));
    }

    return { checkedCount: all.length, expiredCount };
  } catch (e) {
    return { checkedCount: 0, expiredCount: 0 };
  }
}




