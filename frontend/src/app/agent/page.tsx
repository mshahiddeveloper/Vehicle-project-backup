'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  User,
  Car,
  Clock,
  ArrowRight,
  MessageCircle,
  Search,
  ExternalLink,
  PlusCircle,
  Upload,
  Receipt,
  Check,
  X,
  FileCheck,
  Users,
  Target,
  PhoneCall,
  Activity,
  Send,
  Eye,
  MousePointerClick,
  Sparkles,
  Lock,
  BarChart2,
} from 'lucide-react';
import { AnalyticsReportHub } from '@/components/AnalyticsReportHub';
import { SubscriptionFollowUpDesk } from '@/components/SubscriptionFollowUpDesk';
import { isSubscriptionFollowUpEnabled } from '@/data/subscriptionLeads';
import { getAgentAnalyticsPermission } from '@/data/analyticsEngine';
import { API_BASE, formatPKR, maskCnic, maskPhone } from '@/lib/api';
import {
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  RegisteredUser,
  assignUserToAgent,
  logUserActivity,
  incrementUserMetrics,
  getActiveUser,
  setActiveUser,
  logoutActiveUser,
  getUserDashboardPath,
  getAllSubscriptionPayments,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
  SubscriptionPaymentRecord,
  toggleUserSubscriptionPause,
  toggleUserProfileDeactivation,
  getPausedListingIds,
  isListingPaused,
  toggleListingPause,
} from '@/data/userAuth';
import { hasAgentPermission, ENTERPRISE_PERMISSION_TREE } from '@/data/agentPermissions';
import {
  getAllLeads,
  updateLead,
  MarketplaceLead,
} from '@/data/activityTracker';
import {
  getFeaturedAdIds,
  toggleFeaturedAd,
  MAX_FEATURED_ADS,
  getAgentFeaturedPermission,
} from '@/data/featuredAds';
import {
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
} from '@/data/marketplaceData';

const REGISTERED_AGENTS_CATALOG: RegisteredUser[] = [
  {
    id: 'ag-1',
    name: 'Kashif Raza',
    phone: '+92 300 4455661',
    email: 'kashif.raza@safarpk.com',
    password: 'password123',
    city: 'Lahore',
    countryCode: 'PK',
    role: 'AGENT',
    employeeId: 'AGY-PK-101',
    desk: 'Punjab & Islamabad Desk',
    permissions: [
      'customer.view',
      'customer.search',
      'customer.view_details',
      'customer.view_bookings',
      'listing.view',
      'listing.search',
      'listing.approve',
      'listing.reject',
      'listing.activate',
      'listing.edit',
      'driver.view',
      'driver.search',
      'driver.verify_docs',
      'driver.approve',
      'payment.view',
      'payment.view_proof',
      'payment.approve',
      'booking.view',
      'booking.search',
      'booking.view_details',
      'booking.view_contact',
      'complaint.view',
      'complaint.assign',
      'complaint.respond',
      'complaint.resolve',
      'reports.view_dashboard',
      'reports.export',
      'platform.featured',
    ],
    registeredAt: '2026-01-01T09:00:00Z',
    metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: '2026-11-14T10:00:00Z' },
    activities: [],
    subscription: { status: 'ACTIVE', quota: 0, usedQuota: 0 },
  },
  {
    id: 'ag-2',
    name: 'Ayesha Khan',
    phone: '+92 321 5566772',
    email: 'ayesha.khan@safarpk.com',
    password: 'password123',
    city: 'Karachi',
    countryCode: 'PK',
    role: 'AGENT',
    employeeId: 'AGY-PK-102',
    desk: 'Karachi & Sindh Desk',
    permissions: [
      'listing.view',
      'listing.search',
      'listing.approve',
      'listing.reject',
      'listing.activate',
      'driver.view',
      'driver.search',
      'driver.verify_docs',
      'customer.view',
      'customer.search',
      'booking.view',
      'booking.search',
      'reports.view_dashboard',
    ],
    registeredAt: '2026-01-05T09:00:00Z',
    metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: '2026-11-14T09:30:00Z' },
    activities: [],
    subscription: { status: 'ACTIVE', quota: 0, usedQuota: 0 },
  },
  {
    id: 'ag-3',
    name: 'Bilal Ahmed',
    phone: '+92 333 6677883',
    email: 'bilal.ahmed@safarpk.com',
    password: 'password123',
    city: 'Islamabad',
    countryCode: 'PK',
    role: 'AGENT',
    employeeId: 'AGY-PK-103',
    desk: 'Verification & Compliance Desk',
    permissions: [
      'driver.view',
      'driver.search',
      'driver.verify_docs',
      'driver.approve',
      'customer.view',
      'customer.search',
      'customer.view_details',
      'payment.view',
      'payment.view_proof',
      'complaint.view',
      'complaint.respond',
    ],
    registeredAt: '2026-01-10T09:00:00Z',
    metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: '2026-11-14T08:00:00Z' },
    activities: [],
    subscription: { status: 'ACTIVE', quota: 0, usedQuota: 0 },
  },
];

export default function AgentDashboardPage() {
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [authEmail, setAuthEmail] = useState('kashif.raza@safarpk.com');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authError, setAuthError] = useState('');
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    if (user && user.role !== 'AGENT') {
      if (typeof window !== 'undefined') {
        window.location.replace(getUserDashboardPath(user));
      }
      return;
    }
    if (user && user.role === 'AGENT') {
      setCurrentUser(user);
    }
    setIsAuthLoaded(true);
  }, []);

  const handleAgentLogin = (agentDirect?: RegisteredUser) => {
    setAuthError('');
    if (agentDirect) {
      setActiveUser(agentDirect);
      setCurrentUser(agentDirect);
      return;
    }
    const allUsers = getAllRegisteredUsers();
    const found = allUsers.find(
      (u) =>
        u.role === 'AGENT' &&
        (u.email?.toLowerCase() === authEmail.toLowerCase().trim() ||
          u.phone === authEmail.trim() ||
          u.employeeId?.toLowerCase() === authEmail.toLowerCase().trim())
    ) || REGISTERED_AGENTS_CATALOG.find(
      (u) =>
        u.email?.toLowerCase() === authEmail.toLowerCase().trim() ||
        u.phone === authEmail.trim() ||
        u.employeeId?.toLowerCase() === authEmail.toLowerCase().trim()
    );

    if (!found) {
      setAuthError('No staff agent account found with these credentials.');
      return;
    }
    setActiveUser(found);
    setCurrentUser(found);
  };

  const handleAgentLogout = () => {
    logoutActiveUser();
    setCurrentUser(null);
  };

  const [activeTab, setActiveTab] = useState<
    | 'assigned_leads'
    | 'subscription_leads'
    | 'listings'
    | 'payments'
    | 'lookup'
    | 'manual_lister'
    | 'drivers'
    | 'complaints'
    | 'featured_ads'
    | 'analytics'
    | 'profile'
  >('assigned_leads');

  const currentAgent = currentUser || REGISTERED_AGENTS_CATALOG[0];
  const agentName = `${currentAgent.name} (${currentAgent.desk || 'Regional Desk'})`;
  const agentStaffId = currentAgent.employeeId || 'AGY-PK-101';
  const agentRole = 'Verification & Operations Staff';

  // Dynamic Registered Users & Leads System
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [marketplaceLeads, setMarketplaceLeads] = useState<MarketplaceLead[]>([]);
  const [leadStatusFilter, setLeadStatusFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST'>('ALL');
  const [leadScopeFilter, setLeadScopeFilter] = useState<'MY_DESK' | 'ALL_MARKETPLACE'>('MY_DESK');
  const [agentNotice, setAgentNotice] = useState<string | null>(null);
  const [leadNoteInputs, setLeadNoteInputs] = useState<{ [leadId: string]: string }>({});
  const [userNoteInputs, setUserNoteInputs] = useState<{ [userId: string]: string }>({});

  // Moderation & Listing Pause State
  const [pausedListingIds, setPausedListingIds] = useState<string[]>([]);
  const [moderationSearch, setModerationSearch] = useState('');
  const [moderationStatusFilter, setModerationStatusFilter] = useState<'ALL' | 'LIVE' | 'PAUSED'>('ALL');

  const handleToggleListingPause = (listingId: string, listingRef?: string) => {
    const res = toggleListingPause(listingId, agentStaffId, listingRef);
    setPausedListingIds(getPausedListingIds());
    setAgentNotice(res.message);
    setTimeout(() => setAgentNotice(null), 3500);
  };

  // Staff Agents list combining dynamic registered agents with seed catalogue
  const allStaffAgents = useMemo(() => {
    const dynAgents = registeredUsers.filter((u) => u.role === 'AGENT');
    const seen = new Set(dynAgents.map((u) => u.email?.toLowerCase() || u.phone || u.id));
    const seeds = REGISTERED_AGENTS_CATALOG.filter(
      (s) => !seen.has(s.email?.toLowerCase() || s.phone || s.id)
    );
    return [...dynAgents, ...seeds];
  }, [registeredUsers]);

  // Featured Ads State for Agent
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');
  const [featuredSearch, setFeaturedSearch] = useState<string>('');
  const [hasFeaturedPerm, setHasFeaturedPerm] = useState<boolean>(false);
  const [hasAnalyticsPerm, setHasAnalyticsPerm] = useState<boolean>(true);

  // Staff Account Self-Service State (Private to agent)
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');

  const handleUpdateStaffPassword = () => {
    if (!staffNewPassword || staffNewPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (staffNewPassword !== staffConfirmPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }
    const allUsers = getAllRegisteredUsers();
    const me = allUsers.find((u) => u.id === currentAgent.id || u.phone === currentAgent.phone);
    if (me) {
      me.password = staffNewPassword;
      saveAllRegisteredUsers(allUsers);
    }
    setStaffNewPassword('');
    setStaffConfirmPassword('');
    setActionNotice('✓ Your staff account password has been updated securely.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  useEffect(() => {
    setFeaturedIds(getFeaturedAdIds());
    setHasFeaturedPerm(getAgentFeaturedPermission(currentAgent.id));
    setHasAnalyticsPerm(getAgentAnalyticsPermission(currentAgent.id));

    const handleFeaturedUpdate = () => {
      setFeaturedIds(getFeaturedAdIds());
    };
    const handlePermsUpdate = () => {
      setHasFeaturedPerm(getAgentFeaturedPermission(currentAgent.id));
      setHasAnalyticsPerm(getAgentAnalyticsPermission(currentAgent.id));
    };

    window.addEventListener('safarpk_featured_updated', handleFeaturedUpdate);
    window.addEventListener('safarpk_agent_perms_updated', handlePermsUpdate);
    return () => {
      window.removeEventListener('safarpk_featured_updated', handleFeaturedUpdate);
      window.removeEventListener('safarpk_agent_perms_updated', handlePermsUpdate);
    };
  }, [currentAgent.id]);

  const handleToggleFeaturedAgent = (id: string, title: string) => {
    if (!hasFeaturedPerm) {
      setAgentNotice(`⚠️ Authority Required: You do not have Super Admin permission to feature ads.`);
      setTimeout(() => setAgentNotice(null), 4000);
      return;
    }
    const res = toggleFeaturedAd(id);
    if (!res.success && res.error) {
      setAgentNotice(`⚠️ ${res.error}`);
      setTimeout(() => setAgentNotice(null), 4500);
      return;
    }
    setFeaturedIds(getFeaturedAdIds());
    setAgentNotice(
      res.isFeatured
        ? `★ "${title}" promoted to Top Slot #1 (${res.remainingSlots} slots remaining)`
        : `✓ "${title}" removed from Featured slots (${res.remainingSlots} slots available)`
    );
    setTimeout(() => setAgentNotice(null), 3500);
  };

  const allMarketplaceListings = useMemo(() => {
    return [
      ...CARS_DATA.map((c) => ({
        id: c.id,
        title: c.name,
        service: 'CAR_RENTAL' as const,
        serviceLabel: 'Rent a car',
        category: c.category,
        city: c.city,
        owner: c.owner,
        price: `PKR ${c.priceNum.toLocaleString()} /day`,
        image: c.image as string | undefined,
      })),
      ...DRIVERS_DATA.map((d) => ({
        id: d.id,
        title: d.name,
        service: 'DRIVER' as const,
        serviceLabel: 'Hire a driver',
        category: 'Chauffeur',
        city: d.city,
        owner: d.name,
        price: d.city12,
        image: undefined as string | undefined,
      })),
      ...CITY_RIDES_DATA.map((r) => ({
        id: r.id,
        title: `${r.fromCity} ➔ ${r.toCity} (${r.car})`,
        service: 'CITY_TO_CITY' as const,
        serviceLabel: 'City to city',
        category: 'Intercity Ride',
        city: `${r.fromCity} - ${r.toCity}`,
        owner: r.op,
        price: `PKR ${r.one.toLocaleString()} one-way`,
        image: undefined as string | undefined,
      })),
      ...SHUTTLES_DATA.map((s) => ({
        id: s.id,
        title: `${s.from} ➔ ${s.to}`,
        service: 'PICK_AND_DROP' as const,
        serviceLabel: 'Pick & drop',
        category: s.van,
        city: s.city,
        owner: s.op,
        price: `${s.fare} /month`,
        image: undefined as string | undefined,
      })),
      ...MOVERS_DATA.map((m) => ({
        id: m.id,
        title: m.name,
        service: 'MOVERS' as const,
        serviceLabel: 'Home shifting',
        category: m.trucks,
        city: m.city,
        owner: m.name,
        price: m.base,
        image: undefined as string | undefined,
      })),
    ];
  }, []);

  const filteredAgentFeaturedListings = useMemo(() => {
    return allMarketplaceListings
      .filter((item) => {
        if (featuredFilter === 'FEATURED_ONLY' && !featuredIds.includes(item.id)) {
          return false;
        }
        if (featuredFilter !== 'ALL' && featuredFilter !== 'FEATURED_ONLY') {
          if (item.service !== featuredFilter) return false;
        }
        if (featuredSearch.trim()) {
          const q = featuredSearch.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCity = item.city.toLowerCase().includes(q);
          const matchOwner = item.owner.toLowerCase().includes(q);
          const matchId = item.id.toLowerCase().includes(q);
          if (!matchTitle && !matchCity && !matchOwner && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const idxA = featuredIds.indexOf(a.id);
        const idxB = featuredIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
  }, [allMarketplaceListings, featuredFilter, featuredSearch, featuredIds]);

  useEffect(() => {
    // Load initial users, leads, and paused listings
    setRegisteredUsers(getAllRegisteredUsers());
    setMarketplaceLeads(getAllLeads());
    setPausedListingIds(getPausedListingIds());

    const handleUsersUpdate = () => {
      setRegisteredUsers(getAllRegisteredUsers());
    };
    const handleLeadsUpdate = () => {
      setMarketplaceLeads(getAllLeads());
    };
    const handlePauseUpdate = () => {
      setPausedListingIds(getPausedListingIds());
    };

    window.addEventListener('safarpk_users_updated', handleUsersUpdate);
    window.addEventListener('safarpk_user_registered', handleUsersUpdate);
    window.addEventListener('safarpk_user_subscription_updated', handleUsersUpdate);
    window.addEventListener('safarpk_user_profile_updated', handleUsersUpdate);
    window.addEventListener('safarpk_listing_pause_updated', handlePauseUpdate);
    window.addEventListener('safarpk_leads_updated', handleLeadsUpdate);
    window.addEventListener('storage', handleUsersUpdate);
    window.addEventListener('storage', handlePauseUpdate);
    return () => {
      window.removeEventListener('safarpk_users_updated', handleUsersUpdate);
      window.removeEventListener('safarpk_user_registered', handleUsersUpdate);
      window.removeEventListener('safarpk_user_subscription_updated', handleUsersUpdate);
      window.removeEventListener('safarpk_user_profile_updated', handleUsersUpdate);
      window.removeEventListener('safarpk_listing_pause_updated', handlePauseUpdate);
      window.removeEventListener('safarpk_leads_updated', handleLeadsUpdate);
      window.removeEventListener('storage', handleUsersUpdate);
      window.removeEventListener('storage', handlePauseUpdate);
    };
  }, []);

  // Caller & Dispute Search Desk State
  const [callerSearchQuery, setCallerSearchQuery] = useState('');
  const [callerCategory, setCallerCategory] = useState<'ALL' | 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'SHUTTLE' | 'CARGO'>('ALL');
  const [selectedCallerModal, setSelectedCallerModal] = useState<any | null>(null);
  const [callerNotice, setCallerNotice] = useState<string | null>(null);

  const [callerDirectory, setCallerDirectory] = useState<any[]>([
    {
      id: 'usr-1',
      name: 'Hamza Tariq',
      phone: '+92 300 8472910',
      cnic: '35202-8172910-3',
      role: 'CUSTOMER',
      city: 'Lahore',
      license: 'LHR-DL-449102',
      recentBookingRef: 'BKG-8492',
      bookingStatus: 'CONFIRMED',
      assignedVehicle: 'Toyota Corolla Altis Grande 2024 (LEA-24-9988)',
      activeComplaint: 'A/C gas check requested for DHA Phase 5 trip',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-2',
      name: 'Salman Tariq (Salman Rent a Car)',
      phone: '+92 300 1234567',
      cnic: '35201-1234567-1',
      role: 'LISTER',
      city: 'Lahore',
      businessName: 'Salman Rent a Car & Luxury Fleets',
      fbrNtn: '7819201-3 (ATL Active)',
      activeListingsCount: 3,
      subscriptionPlan: 'Professional Fleet (15 Vehicles)',
      recentBookingRef: 'BKG-8492',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-3',
      name: 'Tariq Mahmood',
      phone: '+92 301 9821045',
      cnic: '35201-4412098-5',
      role: 'DRIVER',
      city: 'Lahore',
      license: 'LHR-DL-449102 (PSV / LTV Commercial)',
      dailyRate: 2500,
      tripsCompleted: 142,
      assignedVehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-4',
      name: 'Al-Makkah Commute Express',
      phone: '+92 321 4409124',
      cnic: '35202-5561029-7',
      role: 'SHUTTLE',
      city: 'Lahore',
      route: 'Johar Town ➔ Gulberg Main Blvd (14 Seats)',
      monthlyFare: 8500,
      activeVehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-5',
      name: 'Pak Movers & Shifting Logistics',
      phone: '+92 300 9988776',
      cnic: '35201-7788192-3',
      role: 'CARGO',
      city: 'Lahore',
      vehicle: 'Hyundai Shehzore D-100 Shifting Truck',
      capacityTons: 2.5,
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'usr-6',
      name: 'Ayesha Malik',
      phone: '+92 321 9988771',
      cnic: '35201-8849201-4',
      role: 'CUSTOMER',
      city: 'Islamabad',
      recentBookingRef: 'BKG-4412',
      bookingStatus: 'CONFIRMED',
      assignedVehicle: 'Honda Civic Oriel Turbo 2024 (ISB-24-4412)',
      verificationStatus: 'VERIFIED',
    },
  ]);

  // Persistent Resolved Callers & Disputes Registry (persists across page reloads & sessions)
  const [resolvedCallerIds, setResolvedCallerIds] = useState<Record<string, { resolvedAt: string; resolvedBy: string }>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('safarpk_resolved_callers');
      if (stored) {
        setResolvedCallerIds(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleResolveCallerDispute = (callerId: string, callerName?: string) => {
    const updatedMap = {
      ...resolvedCallerIds,
      [callerId]: {
        resolvedAt: new Date().toISOString(),
        resolvedBy: agentName,
      },
    };
    try {
      localStorage.setItem('safarpk_resolved_callers', JSON.stringify(updatedMap));
    } catch (e) {
      // ignore
    }
    setResolvedCallerIds(updatedMap);

    // 1. Update callerDirectory state
    setCallerDirectory((prev) =>
      prev.map((c) =>
        c.id === callerId
          ? { ...c, activeComplaint: null, verificationStatus: 'VERIFIED (Agent Cleared)' }
          : c
      )
    );

    // 2. Update registeredUsers (and persist to localStorage so it stays verified everywhere!)
    const allUsers = getAllRegisteredUsers();
    const matchedUser = allUsers.find((u) => u.id === callerId);
    if (matchedUser) {
      matchedUser.subscription.status = 'ACTIVE';
      matchedUser.subscription.rejectionReason = undefined;
      matchedUser.kycStatus = 'VERIFIED';
      matchedUser.subscription.approvedAt = new Date().toISOString();
      saveAllRegisteredUsers(allUsers);
      setRegisteredUsers([...allUsers]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('safarpk_auth_state_changed'));
      }
    }

    // 3. Update active modal if open
    setSelectedCallerModal((prev: any) => {
      if (prev && prev.id === callerId) {
        return {
          ...prev,
          activeComplaint: null,
          verificationStatus: 'VERIFIED (Agent Cleared)',
          bookingStatus: 'ACTIVE_PLAN',
        };
      }
      return prev;
    });

    setCallerNotice(`✓ Issue marked resolved & clearance granted for ${callerName || 'caller'} by ${agentName}.`);
  };

  // Agent Granular Permissions (granted by Super Admin)
  const permissions = {
    canVerifyCnic: true,
    canVerifyLicense: true,
    canEditCustomer: true,
    canEditLister: true,
    canCreateListerManual: true,
    canApproveSubscription: true,
    canDeleteListings: false,
    canViewUnmaskedData: false,
  };

  // Pending Vehicle Listings Queue
  const [pendingListings, setPendingListings] = useState<any[]>([
    {
      id: 'lst-pend-1',
      listingRef: 'LST-992104',
      vehicleTitle: 'Toyota Corolla Altis Grande 2024',
      listerName: 'Salman Rent a Car & Tours',
      listerPhone: '+923001234567',
      city: 'Islamabad',
      regNumber: 'LEA-24-9988',
      chassisNumber: 'NZE141-9081245',
      engineNumber: '1NZ-FE-829104',
      ownerCnic: '35201-9876543-1',
      dailyRate: 8500,
      submittedAt: '2026-11-10T08:30:00Z',
      photosCount: 6,
      documentsStatus: 'ALL_ATTACHED',
      img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'lst-pend-2',
      listingRef: 'LST-551029',
      vehicleTitle: 'Hyundai Shehzore D-100 Shifting Pickup',
      listerName: 'Al-Makkah Transport Logistics',
      listerPhone: '+923214409124',
      city: 'Lahore',
      regNumber: 'LHR-SH-202',
      chassisNumber: 'HY-SH-4491024',
      engineNumber: 'D4BB-88910',
      ownerCnic: '35202-4410291-5',
      dailyRate: 4500,
      submittedAt: '2026-11-10T09:15:00Z',
      photosCount: 4,
      documentsStatus: 'ALL_ATTACHED',
      img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  // Live Dynamic Subscription Ledger from Storage
  const [subscriptionLedger, setSubscriptionLedger] = useState<SubscriptionPaymentRecord[]>([]);
  const [agentSlipModal, setAgentSlipModal] = useState<string | null>(null);

  useEffect(() => {
    const syncLedger = () => {
      setSubscriptionLedger(getAllSubscriptionPayments());
    };
    syncLedger();
    window.addEventListener('safarpk_ledger_updated', syncLedger);
    return () => {
      window.removeEventListener('safarpk_ledger_updated', syncLedger);
    };
  }, []);

  // Pending Payments Queue
  const pendingPayments = subscriptionLedger.filter((p) => p.status === 'PENDING');

  // Rejection Notice Modal State
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Photos blurry or missing clear view of Excise Registration Smart Card.');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // =========================================================================
  // MANUAL LISTER REGISTRATION FORM (AGENT DESK)
  // =========================================================================
  const [manualListerForm, setManualListerForm] = useState({
    businessName: '',
    ownerName: '',
    ownerCnic: '',
    phone: '+92 300 ',
    city: 'Lahore',
    category: 'CAR_RENTAL',
    selectedPlan: 'PROFESSIONAL_FLEET', // Starter (3,500), Professional (12,000), Enterprise (30,000)
    officialTariff: 12000,
    collectedFee: 12000,
    paymentMethod: 'JAZZCASH_TILL',
    trnRef: '',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    paymentSlipName: 'jazzcash_receipt_stamp.jpg',
  });

  const handlePlanChange = (plan: string) => {
    let tariff = 12000;
    if (plan === 'STARTER') tariff = 3500;
    if (plan === 'PROFESSIONAL_FLEET') tariff = 12000;
    if (plan === 'ENTERPRISE_HUB') tariff = 30000;
    setManualListerForm((prev) => ({
      ...prev,
      selectedPlan: plan,
      officialTariff: tariff,
      collectedFee: tariff,
    }));
  };

  const handleManualListerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualListerForm.businessName || !manualListerForm.ownerCnic || !manualListerForm.trnRef) {
      alert('Please fill all required fields and enter the Payment Transaction Reference.');
      return;
    }

    // Stealth Audit Logging (Invisible to the agent)
    try {
      const isFeeDiscrepant = manualListerForm.collectedFee < manualListerForm.officialTariff;
      const stealthLog = {
        id: `stl-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) + ' PKT',
        agentName,
        staffId: agentStaffId,
        branch: 'Lahore Desk',
        ipAddress: '192.168.1.18 (Terminal-LHR-01)',
        actionType: 'MANUAL_LISTER_CREATE',
        actionDesc: `Created Lister Profile: "${manualListerForm.businessName}" (${manualListerForm.city})`,
        targetEntity: `Lister: ${manualListerForm.businessName}`,
        officialTariff: manualListerForm.officialTariff,
        feeReported: manualListerForm.collectedFee,
        isSuspicious: isFeeDiscrepant,
        suspicionReason: isFeeDiscrepant
          ? `CRITICAL TARIFF DEFICIT (-PKR ${formatPKR(manualListerForm.officialTariff - manualListerForm.collectedFee)}): Agent reported PKR ${formatPKR(manualListerForm.collectedFee)} against mandatory PKR ${formatPKR(manualListerForm.officialTariff)} tariff. Verify possible unauthorized discount or offline side-arrangement.`
          : 'Tariff Reconciled (100% schedule match)',
        paymentMethod: manualListerForm.paymentMethod,
        trnRef: manualListerForm.trnRef,
        paymentProofUrl: manualListerForm.paymentSlipUrl,
      };

      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('safarpk_stealth_audit_logs') || '[]');
        localStorage.setItem('safarpk_stealth_audit_logs', JSON.stringify([stealthLog, ...existingLogs]));
      }
    } catch (err) {
      // silently proceed
    }

    setActionNotice(`✅ Lister Profile "${manualListerForm.businessName}" successfully registered! Payment proof TX-${manualListerForm.trnRef} archived.`);
    setManualListerForm({
      businessName: '',
      ownerName: '',
      ownerCnic: '',
      phone: '+92 300 ',
      city: 'Lahore',
      category: 'CAR_RENTAL',
      selectedPlan: 'PROFESSIONAL_FLEET',
      officialTariff: 12000,
      collectedFee: 12000,
      paymentMethod: 'JAZZCASH_TILL',
      trnRef: '',
      paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
      paymentSlipName: 'jazzcash_receipt_stamp.jpg',
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleApproveListing = (id: string, ref: string) => {
    setPendingListings(pendingListings.filter((l) => l.id !== id));
    setActionNotice(`✅ Vehicle Listing ${ref} APPROVED & Published LIVE on SafarPK.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectListing = () => {
    if (!rejectingItem) return;
    const phone = rejectingItem.listerPhone?.replace(/[^0-9]/g, '') || '923001234567';
    const waText = `As-salamu alaykum ${rejectingItem.listerName}! Regarding your vehicle listing (${rejectingItem.listingRef} - ${rejectingItem.vehicleTitle}) on SafarPK:\n\nOur compliance officer noted: "${rejectionReason}".\n\nPlease login to your Lister Dashboard (http://localhost:3000/lister) to re-upload clear documents.`;
    
    // Open WhatsApp rejection notice to lister
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`, '_blank');

    setPendingListings(pendingListings.filter((l) => l.id !== rejectingItem.id));
    setActionNotice(`❌ Vehicle Listing ${rejectingItem.listingRef} rejected. Rejection notice sent to lister on WhatsApp.`);
    setRejectingItem(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleApprovePayment = (id: string, ref: string) => {
    approveSubscriptionPayment(id, currentAgent.name || 'Field Agent');
    setSubscriptionLedger(getAllSubscriptionPayments());
    setActionNotice(`✅ Subscription Payment ${ref} verified & approved! Lister account quota updated.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectPayment = (id: string, ref: string) => {
    const reason = prompt('Enter rejection reason for this payment:', 'Bank credit not received / blurry invalid slip');
    if (reason) {
      rejectSubscriptionPayment(id, currentAgent.name || 'Field Agent', reason);
      setSubscriptionLedger(getAllSubscriptionPayments());
      setActionNotice(`❌ Subscription Payment ${ref} marked failed. Reason: ${reason}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: MarketplaceLead['status']) => {
    const updated = updateLead(leadId, { status: newStatus });
    if (updated) {
      setMarketplaceLeads(getAllLeads());
      setActionNotice(`✅ Lead status changed to "${newStatus}" for ${updated.customerName || updated.leadRef}`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleAddLeadNote = (leadId: string) => {
    const note = leadNoteInputs[leadId]?.trim();
    if (!note) return;
    const lead = marketplaceLeads.find((l) => l.id === leadId);
    const existing = lead?.notes ? `${lead.notes}\n` : '';
    const updatedNotes = `${existing}[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${currentAgent.name}]: ${note}`;
    updateLead(leadId, { notes: updatedNotes });
    setMarketplaceLeads(getAllLeads());
    setLeadNoteInputs({ ...leadNoteInputs, [leadId]: '' });
    setActionNotice(`📝 Progress note saved to lead.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleAddUserActivityNote = (userId: string) => {
    const note = userNoteInputs[userId]?.trim();
    if (!note) return;
    logUserActivity(userId, {
      type: 'PROFILE_UPDATED',
      title: `Staff Agent Log (${currentAgent.name})`,
      description: note,
      meta: { agentId: currentAgent.id, staffId: currentAgent.staffId },
    });
    setRegisteredUsers(getAllRegisteredUsers());
    setUserNoteInputs({ ...userNoteInputs, [userId]: '' });
    setActionNotice(`📝 Account interaction logged successfully.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  if (isAuthLoaded && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0B6B4F] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
            S
          </div>
          <h2 className="mt-4 text-2xl font-heading font-black text-white">
            SafarPK Agent & Staff Desk
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Dedicated administrative portal for verified compliance, operations, and support officers
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-slate-950 border border-slate-800 py-8 px-6 sm:px-8 rounded-3xl shadow-2xl space-y-6">
            {/* Quick Switcher for Testing Registered Staff */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                ⚡ Select Authorized Staff Identity:
              </span>
              <div className="flex flex-col gap-1.5">
                {allStaffAgents.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => handleAgentLogin(ag)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-emerald-950/40 hover:border-emerald-600/60 text-left transition flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <strong className="text-white block">{ag.name}</strong>
                      <span className="text-[11px] text-slate-400">{ag.employeeId} · {ag.desk}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Sign In ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Credentials Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAgentLogin();
              }}
              className="space-y-4 pt-2 border-t border-slate-800/80"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Agent Email or Staff ID
                </label>
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. kashif.raza@safarpk.com"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Access Key / Password
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-semibold">
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-extrabold text-xs transition shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Authenticate & Access Workspace</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
                ← Return to Public Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 min-h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
                S
              </div>
              <span className="font-extrabold text-base sm:text-xl text-white tracking-tight">Staff Desk</span>
            </Link>
            <span className="hidden sm:inline-block text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 truncate max-w-[200px]">
              ID: {agentStaffId} · {currentAgent.desk || 'Operations Desk'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 hidden md:inline">
              Officer: <strong className="text-white">{currentAgent.name}</strong>
            </span>
            <button
              type="button"
              onClick={handleAgentLogout}
              className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800 transition cursor-pointer"
            >
              Sign Out
            </button>
            <Link
              href="/"
              className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {(() => {
          const myUsers = registeredUsers.filter((u) => u.assignedAgentId === currentAgent.id);
          const myLeads = marketplaceLeads.filter((l) => l.assignedAgentId === currentAgent.id);
          const perms = currentAgent.permissions || [];

          const navMenuItems: { id: any; label: string; icon: any; badge?: any }[] = [
            { id: 'assigned_leads', label: '🎯 Assigned Leads & Tasks', icon: Target, badge: myLeads.length + myUsers.length },
          ];

          // Subscription Follow-Up Leads (enabled by default; Super Admin can hide/show)
          if (isSubscriptionFollowUpEnabled()) {
            const unsubscribedCount = registeredUsers.filter(
              (u) =>
                u.role !== 'CUSTOMER' &&
                u.role !== 'AGENT' &&
                u.role !== 'SUPER_ADMIN' &&
                (u.subscription?.status === 'UNSUBSCRIBED' || !u.subscription?.status)
            ).length;
            navMenuItems.push({
              id: 'subscription_leads',
              label: '📞 Subscription Follow-Up Leads',
              icon: PhoneCall,
              badge: unsubscribedCount,
            });
          }

          if (hasAgentPermission(perms, 'listing.view') || hasAgentPermission(perms, 'listing.approve')) {
            navMenuItems.push({ id: 'listings', label: 'Listing Approvals Queue', icon: Car, badge: pendingListings.length });
          }
          if (hasAgentPermission(perms, 'driver.view') || hasAgentPermission(perms, 'driver.verify_docs')) {
            navMenuItems.push({ id: 'drivers', label: 'Driver License Audits', icon: User, badge: 3 });
          }
          if (hasAgentPermission(perms, 'payment.view') || hasAgentPermission(perms, 'payment.approve')) {
            navMenuItems.push({ id: 'payments', label: 'Payment Verifications', icon: CreditCard, badge: pendingPayments.length });
          }
          if (hasAgentPermission(perms, 'customer.view') || hasAgentPermission(perms, 'booking.view')) {
            navMenuItems.push({ id: 'lookup', label: '🔍 Caller & Dispute Search Desk', icon: Search });
          }
          if (hasAgentPermission(perms, 'listing.create')) {
            navMenuItems.push({ id: 'manual_lister', label: '➕ Register Walk-in Lister', icon: PlusCircle });
          }
          if (hasAgentPermission(perms, 'complaint.view')) {
            navMenuItems.push({ id: 'complaints', label: 'Customer Complaints', icon: AlertCircle, badge: 1 });
          }
          if (hasAgentPermission(perms, 'platform.featured')) {
            navMenuItems.push({ id: 'featured_ads', label: '⭐ Featured & Promoted (Top 9)', icon: Sparkles, badge: `${featuredIds.length}/9` });
          }
          if (hasAgentPermission(perms, 'reports.view_dashboard')) {
            navMenuItems.push({ id: 'analytics', label: '📊 Analytics Hub', icon: BarChart2, badge: 'Active' });
          }
          navMenuItems.push({ id: 'profile', label: '👤 My Account', icon: User });

          return (
            <>
              {/* Mobile Quick Section Switcher & App-style Tab Scrollbar (< lg screens) */}
              <div className="lg:hidden col-span-1 w-full space-y-2 py-1">
                {/* Mobile Section Dropdown */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs shrink-0 font-bold">
                      🎯
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Agent Desk Section
                      </span>
                      <span className="text-xs font-black text-[#101828] truncate block">
                        {navMenuItems.find((i) => i.id === activeTab)?.label}
                      </span>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as any)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      aria-label="Switch agent section"
                    >
                      {navMenuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} {item.badge ? `(${item.badge})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 shadow-2xs pointer-events-none"
                    >
                      <span>Switch</span>
                      <span className="text-xs text-slate-400">▾</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal App-Style Scrollable Pill Bar */}
                <div className="w-full overflow-x-auto no-scrollbar py-0.5">
                  <div className="flex items-center gap-1.5 min-w-max bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    {navMenuItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                            active
                              ? 'bg-[#0B6B4F] text-white shadow-sm'
                              : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Desktop Sidebar Nav (Hidden on Mobile) */}
              <aside className="hidden lg:block space-y-1">
                <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold sticky top-20">
                  {navMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                          active
                            ? 'bg-[#0B6B4F] text-white shadow-sm font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </aside>
            </>
          );
        })()}

        {/* Canvas */}
        <main className="lg:col-span-3 space-y-6">
          {actionNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>{actionNotice}</span>
              <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
            </div>
          )}

          {/* TAB 0: ASSIGNED LEADS & USER ACCOUNTS (SUPER ADMIN DELEGATED) */}
          {activeTab === 'assigned_leads' && (
            <div className="space-y-6">
              {/* Desk Identity & Real-time Metrics Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl">
                      🎯
                    </div>
                    <div>
                      <h2 className="font-black text-lg sm:text-xl tracking-tight">
                        {currentAgent.name} · Operational Desk
                      </h2>
                      <p className="text-xs text-blue-200">
                        {currentAgent.role} · {currentAgent.branch} · Staff ID: <span className="font-mono font-bold text-amber-300">{currentAgent.staffId}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Live Desk Active
                    </span>
                  </div>
                </div>

                {/* 4 Performance KPI Cards */}
                {(() => {
                  const myUsers = registeredUsers.filter((u) => u.assignedAgentId === currentAgent.id);
                  const myLeads = marketplaceLeads.filter((l) => l.assignedAgentId === currentAgent.id);
                  const convertedCount = myLeads.filter((l) => l.status === 'CONVERTED').length;
                  const convRate = myLeads.length > 0 ? Math.round((convertedCount / myLeads.length) * 100) : 0;
                  const totalDeskViews = myUsers.reduce((sum, u) => sum + (u.metrics?.viewCount || 0), 0);
                  const totalDeskClicks = myUsers.reduce((sum, u) => sum + (u.metrics?.clickCount || 0), 0);

                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] text-blue-200 font-medium block">Assigned Accounts</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-white">{myUsers.length}</span>
                          <span className="text-[10px] text-blue-300">Listers & Drivers</span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] text-amber-200 font-medium block">Delegated Leads</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-amber-300">{myLeads.length}</span>
                          <span className="text-[10px] text-amber-200/80">Inquiries</span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] text-emerald-200 font-medium block">Conversion Success</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-emerald-300">{convRate}%</span>
                          <span className="text-[10px] text-emerald-200/80">{convertedCount} Converted</span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] text-sky-200 font-medium block">Desk Traffic Handled</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-sky-300">{totalDeskClicks}</span>
                          <span className="text-[10px] text-sky-200/80">{totalDeskViews} Views</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION A: DELEGATED LEADS QUEUE */}
              {(() => {
                const myUsers = registeredUsers.filter((u) => u.assignedAgentId === currentAgent.id);
                const scopeLeads = leadScopeFilter === 'MY_DESK'
                  ? marketplaceLeads.filter((l) => l.assignedAgentId === currentAgent.id)
                  : marketplaceLeads;
                const filteredLeads = leadStatusFilter === 'ALL'
                  ? scopeLeads
                  : scopeLeads.filter((l) => l.status === leadStatusFilter);

                return (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <span>Direct Customer Leads & Inquiries ({filteredLeads.length})</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Follow up with callers, WhatsApp inquiries, and booking requests assigned to your desk.
                        </p>
                      </div>

                      {/* Scope Toggle: My Desk vs All */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setLeadScopeFilter('MY_DESK')}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            leadScopeFilter === 'MY_DESK' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          My Desk ({marketplaceLeads.filter((l) => l.assignedAgentId === currentAgent.id).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadScopeFilter('ALL_MARKETPLACE')}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            leadScopeFilter === 'ALL_MARKETPLACE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          All Inquiries ({marketplaceLeads.length})
                        </button>
                      </div>
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {(['ALL', 'NEW', 'CONTACTED', 'CONVERTED', 'LOST'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setLeadStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            leadStatusFilter === st
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'ALL' ? 'All Leads' : st}
                        </button>
                      ))}
                    </div>

                    {/* Leads List */}
                    {filteredLeads.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        No leads found in this filter category. New incoming inquiries from WhatsApp and Direct Bookings will automatically appear here.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredLeads.map((lead) => {
                          const cleanPhone = lead.customerPhone?.replace(/[^0-9]/g, '') || '';
                          const waLink = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
                            lead.customerName || 'Customer'
                          )},%20this%20is%20${encodeURIComponent(
                            currentAgent.name
                          )}%20from%20SafarPK.%20I%20am%20following%20up%20on%20your%20inquiry%20for%20${encodeURIComponent(
                            lead.targetTitle || 'vehicle booking'
                          )}.`;

                          return (
                            <div
                              key={lead.id}
                              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-500">{lead.leadRef || lead.id}</span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                      lead.leadType === 'WHATSAPP'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : lead.leadType === 'DIRECT_CALL'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {lead.leadType === 'WHATSAPP' ? '💬 WhatsApp Click' : lead.leadType === 'DIRECT_CALL' ? '📞 Direct Call' : '📋 Booking Form'}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      lead.status === 'NEW'
                                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                                        : lead.status === 'CONTACTED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : lead.status === 'CONVERTED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    ● {lead.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] font-bold text-slate-500">Update Status:</label>
                                  <select
                                    value={lead.status}
                                    onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                                    className="bg-white border border-slate-300 text-slate-800 text-xs font-bold px-2 py-1 rounded-xl shadow-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                                  >
                                    <option value="NEW">NEW</option>
                                    <option value="CONTACTED">CONTACTED</option>
                                    <option value="CONVERTED">CONVERTED</option>
                                    <option value="LOST">LOST</option>
                                  </select>
                                </div>
                              </div>

                              {/* Customer & Target Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer</span>
                                  <strong className="text-slate-900 text-sm">{lead.customerName || 'Anonymous Visitor'}</strong>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono font-bold text-slate-700">{lead.customerPhone}</span>
                                    {cleanPhone && (
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={waLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] flex items-center gap-1"
                                        >
                                          <MessageCircle className="w-3 h-3" /> WhatsApp
                                        </a>
                                        <a
                                          href={`tel:${lead.customerPhone}`}
                                          className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] flex items-center gap-1"
                                        >
                                          <PhoneCall className="w-3 h-3" /> Call
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Vehicle / Chauffeur</span>
                                  <strong className="text-slate-900">{lead.targetTitle || 'Marketplace General'}</strong>
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    <span>Lister: {lead.targetOwnerPhone || lead.listerPhone || 'Direct Platform'}</span>
                                    {(lead.amount || lead.quotedAmount) ? (
                                      <span className="ml-2 font-mono font-bold text-emerald-700">
                                        Rs. {(lead.amount || lead.quotedAmount)?.toLocaleString()}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              {lead.customerMessage && (
                                <p className="text-xs text-slate-700 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50">
                                  💬 "{lead.customerMessage}"
                                </p>
                              )}

                              {/* Progress Notes & Follow-up log */}
                              {lead.notes && (
                                <div className="text-[11px] bg-slate-100 p-2.5 rounded-xl text-slate-700 font-mono whitespace-pre-wrap">
                                  {lead.notes}
                                </div>
                              )}

                              {/* Add Note Bar */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Add follow-up note (e.g. called client, agreed on dates)..."
                                  value={leadNoteInputs[lead.id] || ''}
                                  onChange={(e) => setLeadNoteInputs({ ...leadNoteInputs, [lead.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddLeadNote(lead.id);
                                    }
                                  }}
                                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddLeadNote(lead.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" /> Save Note
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SECTION B: ASSIGNED FLEET OWNERS & DRIVERS */}
              {(() => {
                const myUsers = registeredUsers.filter((u) => u.assignedAgentId === currentAgent.id);

                return (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <span>Assigned Fleet Owners & Drivers ({myUsers.length})</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          These registered listers, drivers, and providers have been delegated to your desk by Super Admin.
                        </p>
                      </div>
                    </div>

                    {myUsers.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        No fleet owners or drivers currently assigned to this desk. Super Admin can assign users to {currentAgent.name} from the Admin Directory.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                                  {u.role} {u.providerSubtype ? `· ${u.providerSubtype}` : ''}
                                </span>
                                <h4 className="font-black text-sm text-slate-900">{u.name}</h4>
                                {u.businessName && (
                                  <p className="text-xs font-bold text-slate-600">{u.businessName}</p>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  u.subscription?.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {u.subscription?.status || 'UNSUBSCRIBED'}
                              </span>
                            </div>

                            <div className="text-xs space-y-1 text-slate-600">
                              <div className="flex items-center justify-between">
                                <span>Phone: <strong className="font-mono text-slate-900">{u.phone}</strong></span>
                                <span>City: <strong className="text-slate-900">{u.city}</strong></span>
                              </div>
                              {u.email && (
                                <div>Email: <strong className="text-slate-800">{u.email}</strong></div>
                              )}
                            </div>

                            {/* Performance Metrics Strip */}
                            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-100 text-center">
                              <div>
                                <span className="text-[10px] text-slate-400 block">Listing Views</span>
                                <strong className="text-xs text-slate-900 font-black">{u.metrics?.viewCount || 0}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">Total Leads</span>
                                <strong className="text-xs text-blue-700 font-black">{u.metrics?.leadsCount || 0}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">Direct Clicks</span>
                                <strong className="text-xs text-emerald-700 font-black">{u.metrics?.clickCount || 0}</strong>
                              </div>
                            </div>

                            {/* Recent Activity Log */}
                            {u.activities && u.activities.length > 0 && (
                              <div className="text-[11px] bg-slate-100/70 p-2.5 rounded-xl text-slate-700 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Latest Activity:</span>
                                <div className="font-semibold text-slate-800">{u.activities[u.activities.length - 1].title}</div>
                                <div className="text-[10px] text-slate-500">{u.activities[u.activities.length - 1].description}</div>
                              </div>
                            )}

                            {/* Add User Activity Note */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                placeholder="Log desk interaction (e.g. called for renewal)..."
                                value={userNoteInputs[u.id] || ''}
                                onChange={(e) => setUserNoteInputs({ ...userNoteInputs, [u.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddUserActivityNote(u.id);
                                  }
                                }}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddUserActivityNote(u.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Log
                              </button>
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                                  u.name
                                )},%20this%20is%20${encodeURIComponent(currentAgent.name)}%20from%20SafarPK%20account%20support.`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer"
                                title="Open WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: SUBSCRIPTION FOLLOW-UP LEADS (UNSUBSCRIBED REGISTRATIONS) */}
          {activeTab === 'subscription_leads' && (
            <SubscriptionFollowUpDesk
              currentRole="AGENT"
              agentName={currentAgent.name}
            />
          )}

          {/* TAB 0B: ANALYTICS & INTELLIGENCE REPORT */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {!hasAnalyticsPerm && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Notice: Export capability is currently restricted for staff profile {currentAgent.staffId}. You may view metrics below; contact Super Admin to unlock full CSV export.
                  </span>
                </div>
              )}
              <AnalyticsReportHub
                role="AGENT"
                viewerName={currentAgent.name}
                agentStaffId={currentAgent.staffId}
                allowExport={hasAnalyticsPerm}
                allowClaim={true}
                accentColor="#0B6B4F"
              />
            </div>
          )}

          {/* TAB 1: LISTING APPROVALS & MODERATION */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {/* SECTION A: PENDING VERIFICATION QUEUE */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Pending Vehicle Listings Queue ({pendingListings.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify Registration Book / Smart Card, Chassis number, Engine number, and Owner NADRA CNIC before approving.
                    </p>
                  </div>
                </div>

                {pendingListings.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    ✓ All pending listings have been reviewed and audited.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingListings.map((l) => (
                      <div key={l.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img src={l.img} alt={l.vehicleTitle} className="w-24 h-16 object-cover rounded-xl border border-slate-200" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {l.listingRef}
                                </span>
                                <h4 className="font-bold text-sm text-slate-900">{l.vehicleTitle}</h4>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Lister: <strong>{l.listerName}</strong> ({l.listerPhone}) · City: {l.city}
                              </p>
                              <span className="text-xs font-black text-slate-900 mt-1 block">Daily Rent: PKR {formatPKR(l.dailyRate)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveListing(l.id, l.listingRef)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Make LIVE</span>
                            </button>
                            <button
                              onClick={() => setRejectingItem(l)}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject with Notice</span>
                            </button>
                          </div>
                        </div>

                        {/* Extracted OCR Verification Grid */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Excise Reg #</span>
                            <span className="font-mono font-bold text-slate-800">{l.regNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Chassis #</span>
                            <span className="font-mono font-bold text-slate-800">{l.chassisNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Engine #</span>
                            <span className="font-mono font-bold text-slate-800">{l.engineNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Owner CNIC</span>
                            <span className="font-mono font-bold text-slate-800">{maskCnic(l.ownerCnic)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION B: ALL MARKETPLACE LISTINGS & PAUSE / RESUME MODERATION */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Car className="w-5 h-5 text-emerald-600" />
                      <span>Live Marketplace Listings & Moderation Desk</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Staff moderation desk: You can pause any reported or non-compliant vehicle listing. Notice: Agents cannot delete listings; deletion is restricted to Super Admin.
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    {allMarketplaceListings.length} Total Listings
                  </span>
                </div>

                {/* Search & Status Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={moderationSearch}
                      onChange={(e) => setModerationSearch(e.target.value)}
                      placeholder="Search listings by title, city, host, or service..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {(['ALL', 'LIVE', 'PAUSED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setModerationStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          moderationStatusFilter === st
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listings Grid / Table */}
                <div className="space-y-3">
                  {(() => {
                    const filtered = allMarketplaceListings.filter((l) => {
                      const isPaused = pausedListingIds.includes(l.id);
                      if (moderationStatusFilter === 'LIVE' && isPaused) return false;
                      if (moderationStatusFilter === 'PAUSED' && !isPaused) return false;
                      if (!moderationSearch.trim()) return true;
                      const q = moderationSearch.toLowerCase();
                      return (
                        l.title.toLowerCase().includes(q) ||
                        l.city.toLowerCase().includes(q) ||
                        l.owner.toLowerCase().includes(q) ||
                        l.serviceLabel.toLowerCase().includes(q)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                          No marketplace listings match the selected filters.
                        </div>
                      );
                    }

                    return filtered.map((l) => {
                      const isPaused = pausedListingIds.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3">
                            {l.image ? (
                              <img
                                src={l.image}
                                alt={l.title}
                                className="w-16 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                                🚗
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{l.title}</h4>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPaused
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  {isPaused ? '⏸️ PAUSED BY AGENT' : '✅ LIVE ON MARKETPLACE'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Service: <strong>{l.serviceLabel}</strong> · City: <strong>{l.city}</strong> · Host: <strong>{l.owner}</strong> · Rate: <strong className="text-emerald-700">{l.price}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleListingPause(l.id, l.title)}
                              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                isPaused
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <span>{isPaused ? '▶️ Resume Listing (Make Live)' : '⏸️ Pause Listing'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT VERIFICATIONS & FINANCIAL LEDGER */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* 1. Pending Approvals Queue */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      <span>Pending Subscription Payment Proofs ({pendingPayments.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Audit bank receipts, Raast references, and JazzCash/EasyPaisa transaction slips uploaded by listers.
                    </p>
                  </div>
                  {pendingPayments.length > 0 && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold animate-pulse">
                      Action Required ({pendingPayments.length})
                    </span>
                  )}
                </div>

                {pendingPayments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">All Payment Proofs Verified!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">There are no pending subscription deposits waiting in your queue.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPayments.map((p) => (
                      <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {p.paymentRef}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900">{p.planName}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {p.paymentMode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Lister: <strong className="text-slate-800">{p.userName}</strong> {p.businessName ? `(${p.businessName})` : ''} · 📞 {p.phone} · Amount: <strong className="text-emerald-700 font-mono">PKR {formatPKR(p.amountPaid)}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {p.slipUrl ? (
                            <button
                              type="button"
                              onClick={() => setAgentSlipModal(p.slipUrl!)}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Slip</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Ref Only</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleApprovePayment(p.id, p.paymentRef)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                          >
                            Verify & Activate
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectPayment(p.id, p.paymentRef)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Platform Full Financial History Ledger (Agent View) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-slate-600" />
                      <span>All Platform Transactions Ledger ({subscriptionLedger.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Complete history of confirmed, pending, and failed subscription transactions.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Subscriber</th>
                        <th className="py-2.5 px-3">Plan</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Channel & Ref</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Slip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {subscriptionLedger.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{p.userName}</span>
                            <span className="text-[10px] text-slate-400">{p.phone}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{p.planName}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            PKR {formatPKR(p.amountPaid)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="block text-slate-800">{p.paymentMode}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Ref: {p.paymentRef}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {p.status === 'CONFIRMED' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ Paid & Active
                              </span>
                            ) : p.status === 'PENDING' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                ⏳ Pending Review
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                ✕ Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {p.slipUrl ? (
                              <button
                                type="button"
                                onClick={() => setAgentSlipModal(p.slipUrl!)}
                                className="p-1 text-emerald-700 hover:text-emerald-900 transition"
                                title="View Slip"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agent Slip Preview Modal */}
              {agentSlipModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold font-mono">Lister Deposit Proof Slip</span>
                      <button
                        type="button"
                        onClick={() => setAgentSlipModal(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 rounded-2xl p-2">
                      <img
                        src={agentSlipModal}
                        alt="Deposit slip"
                        className="max-h-[65vh] w-auto object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setAgentSlipModal(null)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2B: CALLER & DISPUTE SEARCH DESK (FOR CALL-IN COMPLAINTS & INQUIRIES) */}
          {activeTab === 'lookup' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span>Caller & Complaint Search Desk</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live call center lookups. Search any caller by Name, Phone (+92), NADRA CNIC, or Booking ID to resolve complaints on-call.
                  </p>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
                  Desk Active: {agentStaffId}
                </span>
              </div>

              {callerNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span>{callerNotice}</span>
                  <button onClick={() => setCallerNotice(null)} className="text-emerald-700 font-bold">✕</button>
                </div>
              )}

              {/* Search Bar & Role Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={callerSearchQuery}
                    onChange={(e) => setCallerSearchQuery(e.target.value)}
                    placeholder="Search caller by Phone (03xx, 923xx, 3xx), CNIC (with/without dashes), Name, Licence, or Booking Ref..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                  {callerSearchQuery && (
                    <button
                      onClick={() => setCallerSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Role Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'ALL', label: 'All Callers' },
                    { id: 'CUSTOMER', label: 'Customers' },
                    { id: 'LISTER', label: 'Fleet Owners (Listers)' },
                    { id: 'DRIVER', label: 'Drivers' },
                    { id: 'SHUTTLE', label: 'Pick & Drop Providers' },
                    { id: 'CARGO', label: 'Cargo Movers' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCallerCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        callerCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Search Results */}
              <div className="space-y-3">
                {(() => {
                  const combinedDirectory = [
                    ...registeredUsers.map((u) => {
                      const isResolved = !!resolvedCallerIds[u.id];
                      const isPlanActive = u.subscription?.status === 'ACTIVE' || isResolved;
                      return {
                        id: u.id,
                        name: u.name + (u.businessName ? ` (${u.businessName})` : ''),
                        phone: u.phone,
                        email: u.email,
                        cnic: u.nationalId || 'Verified NADRA Profile',
                        role: u.role === 'PROVIDER' ? (u.providerSubtype === 'PICK_AND_DROP' ? 'SHUTTLE' : 'CARGO') : u.role,
                        city: u.city,
                        license: u.licenseNumber || 'Verified ID',
                        recentBookingRef: `ACC-${u.id.slice(-5).toUpperCase()}`,
                        bookingStatus: isPlanActive ? 'ACTIVE_PLAN' : 'PENDING_SUBSCRIPTION',
                        assignedVehicle: u.businessName || `${u.role} Account (${u.city})`,
                        activeComplaint: isResolved ? null : (u.subscription?.rejectionReason || null),
                        verificationStatus: isPlanActive ? (isResolved ? 'VERIFIED (Agent Cleared)' : 'VERIFIED') : 'PENDING',
                        fbrNtn: undefined,
                        activeListingsCount: u.subscription?.usedQuota || 0,
                        subscriptionPlan: u.subscription?.planName || undefined,
                        isSubPaused: u.subscription?.status === 'PAUSED',
                        isDeactivated: !!u.isDeactivated,
                      };
                    }),
                    ...callerDirectory.map((c) => {
                      const matchedUser = registeredUsers.find((u) => u.id === c.id || u.phone === c.phone);
                      const isSubPaused = matchedUser?.subscription?.status === 'PAUSED';
                      const isDeactivated = !!matchedUser?.isDeactivated;
                      if (resolvedCallerIds[c.id]) {
                        return {
                          ...c,
                          isSubPaused,
                          isDeactivated,
                          activeComplaint: null,
                          verificationStatus: 'VERIFIED (Agent Cleared)',
                        };
                      }
                      return {
                        ...c,
                        isSubPaused,
                        isDeactivated,
                      };
                    }),
                  ];

                  const filteredList = combinedDirectory.filter((c) => {
                    const matchesCat = callerCategory === 'ALL' || c.role === callerCategory;
                    const rawQ = callerSearchQuery.trim();
                    if (!rawQ) return matchesCat;

                    const q = rawQ.toLowerCase();
                    const qDigits = rawQ.replace(/\D/g, '');
                    const qAlpha = rawQ.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                    // 1. Phone number smart matching across all Pakistani formats:
                    // Matches: 033312, 030044, 9230044, 30044, +92 300 44, 3331286257, etc.
                    let matchesPhone = (c.phone || '').toLowerCase().includes(q);
                    if (!matchesPhone && qDigits.length >= 2) {
                      const cDigits = (c.phone || '').replace(/\D/g, '');
                      const cCore = cDigits.startsWith('92') ? cDigits.slice(2) : cDigits.startsWith('0') ? cDigits.slice(1) : cDigits;
                      const qCore = qDigits.startsWith('92') ? qDigits.slice(2) : qDigits.startsWith('0') ? qDigits.slice(1) : qDigits;
                      const cLocal = '0' + cCore;
                      const cIntl = '92' + cCore;

                      matchesPhone =
                        cDigits.includes(qDigits) ||
                        cCore.includes(qCore) ||
                        cLocal.includes(qDigits) ||
                        cIntl.includes(qDigits) ||
                        cCore.includes(qDigits) ||
                        (qCore.length >= 2 && cDigits.includes(qCore)) ||
                        (qCore.length >= 2 && cLocal.includes(qCore));
                    }

                    // 2. CNIC smart matching (with or without dashes: 3520198210453 vs 35201-9821045-3):
                    let matchesCnic = (c.cnic || '').toLowerCase().includes(q);
                    if (!matchesCnic && qDigits.length >= 3) {
                      const cnicDigits = (c.cnic || '').replace(/\D/g, '');
                      matchesCnic = cnicDigits.includes(qDigits);
                    }

                    // 3. Driving Licence smart matching (with or without dashes / spaces: LHR-DL-449102 vs 449102):
                    let matchesLicense = (c.license || '').toLowerCase().includes(q);
                    if (!matchesLicense && qAlpha.length >= 3) {
                      const licenseAlpha = (c.license || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                      matchesLicense = licenseAlpha.includes(qAlpha);
                    }

                    // 4. Booking Reference / Account Reference smart matching (BKG-8492 vs bkg8492 vs 8492):
                    let matchesRef = (c.recentBookingRef || '').toLowerCase().includes(q);
                    if (!matchesRef && qAlpha.length >= 3) {
                      const refAlpha = (c.recentBookingRef || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                      matchesRef = refAlpha.includes(qAlpha);
                    }

                    // 5. Name, Business Name, City, Email, Vehicle, NTN matching:
                    const matchesName = (c.name || '').toLowerCase().includes(q);
                    const matchesBusiness = Boolean(c.businessName && c.businessName.toLowerCase().includes(q));
                    const matchesCity = Boolean(c.city && c.city.toLowerCase().includes(q));
                    const matchesEmail = Boolean(c.email && c.email.toLowerCase().includes(q));
                    const matchesVehicle = Boolean(c.assignedVehicle && c.assignedVehicle.toLowerCase().includes(q));
                    const matchesNtn = Boolean(c.fbrNtn && (c.fbrNtn.toLowerCase().includes(q) || (qDigits.length >= 3 && c.fbrNtn.replace(/\D/g, '').includes(qDigits))));

                    const matchesQ =
                      matchesPhone ||
                      matchesCnic ||
                      matchesLicense ||
                      matchesRef ||
                      matchesName ||
                      matchesBusiness ||
                      matchesCity ||
                      matchesEmail ||
                      matchesVehicle ||
                      matchesNtn;

                    return matchesCat && matchesQ;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <Search className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-800">No Callers or Complaints Found</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          No records matched "{callerSearchQuery}". You can search by any Pakistani phone format (e.g. 03xx, 923xx, 3xx), CNIC with or without dashes, driving licence, name, or booking ref.
                        </p>
                      </div>
                    );
                  }

                  return filteredList.map((caller) => (
                    <div
                      key={caller.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            caller.role === 'CUSTOMER'
                              ? 'bg-purple-100 text-purple-800'
                              : caller.role === 'LISTER'
                              ? 'bg-blue-100 text-blue-800'
                              : caller.role === 'DRIVER'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {caller.role}
                          </span>
                          <strong className="text-sm font-black text-slate-900">{caller.name}</strong>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-semibold">{caller.city}</span>
                          {caller.isDeactivated && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              🚫 DEACTIVATED
                            </span>
                          )}
                          {caller.isSubPaused && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              ⏸️ SUB PAUSED
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {caller.phone}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">NADRA CNIC</span>
                          <span className="font-mono font-bold text-slate-800">{caller.cnic}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Associated Reference</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {caller.recentBookingRef || caller.fbrNtn || `${caller.activeListingsCount || 0} Listings`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">License / Tax Status</span>
                          <span className="font-bold text-slate-800">
                            {caller.license || caller.fbrNtn || caller.subscriptionPlan || 'Verified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Compliance Clearance</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            ✓ {caller.verificationStatus}
                          </span>
                        </div>
                      </div>

                      {/* Active Caller Complaint Banner */}
                      {caller.activeComplaint && (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span><strong>Active Caller Inquiry:</strong> {caller.activeComplaint}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleResolveCallerDispute(caller.id, caller.name);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shrink-0 cursor-pointer transition"
                          >
                            ✓ Mark Issue Resolved
                          </button>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-500">
                          Assigned: <strong>{caller.assignedVehicle || caller.vehicle || caller.route || 'General Profile'}</strong>
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Pause / Resume Subscription (Available to Agent & Super Admin) */}
                          <button
                            type="button"
                            onClick={() => {
                              const res = toggleUserSubscriptionPause(caller.id, agentStaffId);
                              setRegisteredUsers(getAllRegisteredUsers());
                              setCallerNotice(res.message);
                              setTimeout(() => setCallerNotice(null), 3500);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center gap-1 ${
                              caller.isSubPaused
                                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={caller.isSubPaused ? 'Resume user subscription' : 'Pause user subscription'}
                          >
                            <span>{caller.isSubPaused ? '▶️ Resume Sub' : '⏸️ Pause Sub'}</span>
                          </button>

                          {/* Deactivate / Reactivate Profile (Strict: No user deletion) */}
                          <button
                            type="button"
                            onClick={() => {
                              const willDeact = !caller.isDeactivated;
                              const reason = willDeact
                                ? prompt('Reason for profile deactivation:', 'Violation of SafarPK Policy')
                                : undefined;
                              if (willDeact && reason === null) return;
                              const res = toggleUserProfileDeactivation(caller.id, reason || undefined, agentStaffId);
                              setRegisteredUsers(getAllRegisteredUsers());
                              setCallerNotice(res.message);
                              setTimeout(() => setCallerNotice(null), 3500);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center gap-1 ${
                              caller.isDeactivated
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                            title={caller.isDeactivated ? 'Reactivate profile' : 'Deactivate profile'}
                          >
                            <span>{caller.isDeactivated ? '✅ Reactivate' : '🚫 Deactivate'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedCallerModal(caller)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>Inspect Full Record</span>
                          </button>
                          <a
                            href={`https://wa.me/${caller.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(caller.name)},%20this%20is%20Agent%20Farhan%20from%20SafarPK%20Compliance%20Desk%20regarding%20your%20account.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Caller</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER WALK-IN / ASSISTED LISTER (WITH MANDATORY PAYMENT PROOF) */}
          {activeTab === 'manual_lister' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">
                  Register Walk-in / Assisted Lister Profile
                </h3>
                <p className="text-xs text-slate-500">
                  As an authorized SafarPK agent, you can register fleet owners directly. All cash/transfers must be reconciled with official tariffs and accompanied by proof of payment.
                </p>
              </div>

              <form onSubmit={handleManualListerSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business / Agency Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Punjab Car Rentals"
                      value={manualListerForm.businessName}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, businessName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mian Tariq"
                      value={manualListerForm.ownerName}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, ownerName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner NADRA CNIC *</label>
                    <input
                      type="text"
                      required
                      placeholder="35202-*******-*"
                      value={manualListerForm.ownerCnic}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, ownerCnic: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Phone (+92) *</label>
                    <input
                      type="text"
                      required
                      value={manualListerForm.phone}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Operating City</label>
                    <input
                      type="text"
                      required
                      value={manualListerForm.city}
                      onChange={(e) => setManualListerForm({ ...manualListerForm, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Subscription Plan & Tariff */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="font-black text-slate-800 block text-xs">Assigned Subscription Plan & Fee Schedule:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'STARTER', name: 'Starter Fleet (1-2 Cars)', price: 3500 },
                      { id: 'PROFESSIONAL_FLEET', name: 'Professional Fleet (15 Cars)', price: 12000 },
                      { id: 'ENTERPRISE_HUB', name: 'Enterprise Hub (50 Cars)', price: 30000 },
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handlePlanChange(plan.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          manualListerForm.selectedPlan === plan.id
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <strong className="block text-xs">{plan.name}</strong>
                        <span className="text-xs font-bold text-emerald-700">PKR {formatPKR(plan.price)} / mo</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Tariff</label>
                      <input
                        type="text"
                        disabled
                        value={`PKR ${formatPKR(manualListerForm.officialTariff)}`}
                        className="w-full p-2.5 bg-slate-200 border border-slate-300 rounded-xl font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Fee Collected by Agent (PKR) *</label>
                      <input
                        type="number"
                        required
                        value={manualListerForm.collectedFee}
                        onChange={(e) => setManualListerForm({ ...manualListerForm, collectedFee: Number(e.target.value) })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Mandatory Payment Proof Upload */}
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Receipt className="w-4 h-4 text-amber-700" />
                    <span>Mandatory Proof of Payment Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    SafarPK audit rules require attaching the bank slip, JazzCash screenshot, or cash receipt voucher for all manual onboardings.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                      <select
                        value={manualListerForm.paymentMethod}
                        onChange={(e) => setManualListerForm({ ...manualListerForm, paymentMethod: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold bg-white"
                      >
                        <option value="JAZZCASH_TILL">JazzCash Till / Merchant QR</option>
                        <option value="EASYPAISA_MERCHANT">EasyPaisa Merchant</option>
                        <option value="MEEZAN_BANK_TRANSFER">Meezan Bank Raast / IBFT</option>
                        <option value="CASH_COUNTER_RECEIPT">Office Cash Counter Deposit</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Transaction Ref / Slip # *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JC-8921849102-PK"
                        value={manualListerForm.trnRef}
                        onChange={(e) => setManualListerForm({ ...manualListerForm, trnRef: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  {/* Payment Slip Upload Preview */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{manualListerForm.paymentSlipName}</span>
                        <span className="text-[10px] text-slate-400">Attached Payment Voucher Slip (Verified)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('Using verified electronic payment slip.')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Change Slip
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Onboard Lister</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: DRIVER LICENSE AUDITS */}
          {activeTab === 'drivers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Driver License Compliance Audits</h3>
              <p className="text-xs text-slate-500">Cross-reference provincial traffic police driving licenses and police character certificates.</p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block">Tariq Mahmood (LHR-DL-449102)</strong>
                  <span className="text-[11px] text-slate-500">LTV / HTV Commercial License · Expiry: 2028-11-20</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ✓ Document on Record
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Customer Complaints & Dispute Log</h3>
              <p className="text-xs text-slate-500">Customer reports regarding vehicle mechanical failure or provider cancellations.</p>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Booking Ref: BKG-8492</span>
                  <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded">Under Review</span>
                </div>
                <p className="text-slate-700 text-[11px]">Customer requested air conditioning gas check upon vehicle delivery in DHA Phase 5.</p>
              </div>
            </div>
          )}

          {/* TAB: AGENT PROFILE - MY ACCOUNT (PRIVATE SELF-DETAILS ONLY) */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-heading font-black text-xl shadow-xs shrink-0">
                    {currentAgent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900">{currentAgent.name}</h3>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {currentAgent.employeeId || 'AGY-PK-101'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentAgent.desk || 'Punjab & Islamabad Operations Desk'} · SafarPK Staff Identity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Active on Duty · Staff Clearance Active</span>
                  </span>
                </div>
              </div>

              {/* Profile Contact & Hub Meta Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Work Email</span>
                  <span className="font-bold text-xs text-slate-900 mt-0.5 block truncate">{currentAgent.email || 'staff@safarpk.com'}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Contact Phone</span>
                  <span className="font-bold text-xs text-slate-900 mt-0.5 block font-mono">{currentAgent.phone}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Hub / City</span>
                  <span className="font-bold text-xs text-slate-900 mt-0.5 block">{currentAgent.city} Operations Hub</span>
                </div>
              </div>

              {/* Duty Shift & Work Schedule Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="font-bold text-xs text-slate-800">Operational Shift & Duty Details</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                    Core Operations
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Standard Shift Hours:</span>
                    <strong className="text-slate-800">09:00 AM – 06:00 PM (PKT)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Desk Assignment:</span>
                    <strong className="text-slate-800">{currentAgent.desk || 'Operations Desk'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Duty Station:</span>
                    <strong className="text-slate-800">{currentAgent.branch || 'Punjab Regional Centre'}</strong>
                  </div>
                </div>
              </div>

              {/* Password & Account Security Self-Service Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-slate-900">
                    Staff Account Password & Security PIN
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your staff login password or security PIN for accessing this workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={staffNewPassword}
                      onChange={(e) => setStaffNewPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-600 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={staffConfirmPassword}
                      onChange={(e) => setStaffConfirmPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-600 transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Minimum 6 characters. Kept private to your staff session.
                  </span>
                  <button
                    type="button"
                    onClick={handleUpdateStaffPassword}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm self-start sm:self-auto"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* Internal Staff Gateway Notice */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5 text-xs shadow-md">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SafarPK Staff Gateway & Quality Assurance Policy</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your session is authenticated via SafarPK Secure Internal Staff Gateway. All customer dispute resolutions, caller lookups, listing reviews, and onboarding outreach calls are securely logged for customer service quality assurance.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: FEATURED & PROMOTED ADS (SUPER ADMIN DELEGATED AUTHORITY) */}
          {activeTab === 'featured_ads' && (
            <div className="space-y-6">
              {/* Header Banner & Slot Status */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Promoted Ads Desk · Top 9 Slots</span>
                    </div>
                    <h2 className="text-2xl font-heading font-black">
                      Featured Listings Showcase Management
                    </h2>
                    <p className="text-xs text-blue-200 leading-relaxed">
                      Assigned agents can promote verified listings to the top of public category search results. Each newly featured listing automatically shifts to <strong>Slot #1 (Top Priority)</strong>.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0 min-w-[180px]">
                    <div className="text-3xl font-black font-heading text-amber-300">
                      {featuredIds.length} / {MAX_FEATURED_ADS}
                    </div>
                    <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mt-0.5">
                      Slots Occupied
                    </div>
                    <div className="text-[10px] text-blue-300 mt-1">
                      {MAX_FEATURED_ADS - featuredIds.length} slots available
                    </div>
                  </div>
                </div>

                {/* Authority Status Pill */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300">Operational Desk:</span>
                    <span className="font-bold text-white">{currentAgent.name} ({currentAgent.staffId})</span>
                  </div>
                  <div>
                    {hasFeaturedPerm ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Super Admin Authorization Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold">
                        <Lock className="w-3 h-3 text-rose-400" />
                        <span>Permission Locked by Super Admin</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!hasFeaturedPerm ? (
                /* Locked State if Super Admin has not granted authority */
                <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-xs text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-heading font-extrabold text-slate-900">
                    Featured Ads Permission Not Assigned
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Your agent desk account (<strong>{currentAgent.name}</strong>) currently does not have authority to edit or promote Featured Ads. The Super Admin must enable <strong>&ldquo;Promote & Feature Ads (Top 9 slots)&rdquo;</strong> in the Staff Agents & Access console.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                    >
                      View Current Agent Permissions
                    </button>
                  </div>
                </div>
              ) : (
                /* Authorized Management Desk */
                <div className="space-y-6">
                  {/* 9 Slots Visualizer Grid */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Top 9 Priority Slots Visualizer:</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Order reflects public marketplace display priority (Slot #1 is top-most)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                      {Array.from({ length: MAX_FEATURED_ADS }).map((_, slotIdx) => {
                        const adId = featuredIds[slotIdx];
                        const matchedItem = adId
                          ? allMarketplaceListings.find((l) => l.id === adId)
                          : null;

                        return (
                          <div
                            key={slotIdx}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between min-h-[72px] transition ${
                              matchedItem
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className={matchedItem ? 'text-amber-700' : 'text-slate-400'}>
                                Slot #{slotIdx + 1}
                              </span>
                              {matchedItem && <Sparkles className="w-3 h-3 text-amber-500 fill-current" />}
                            </div>

                            {matchedItem ? (
                              <div
                                className="truncate font-bold text-slate-900 text-[11px] mt-1"
                                title={matchedItem.title}
                              >
                                {matchedItem.title}
                              </div>
                            ) : (
                              <span className="text-[10px] italic text-slate-400 mt-1">Empty</span>
                            )}

                            {matchedItem && (
                              <button
                                type="button"
                                onClick={() => handleToggleFeaturedAgent(matchedItem.id, matchedItem.title)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline text-left mt-1 cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Listings Inventory Table with Search & Category Filters */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {[
                          { id: 'ALL', label: `All (${allMarketplaceListings.length})` },
                          { id: 'FEATURED_ONLY', label: `★ Featured (${featuredIds.length})` },
                          { id: 'CAR_RENTAL', label: 'Cars' },
                          { id: 'DRIVER', label: 'Drivers' },
                          { id: 'CITY_TO_CITY', label: 'City to City' },
                          { id: 'PICK_AND_DROP', label: 'Shuttles' },
                          { id: 'MOVERS', label: 'Movers' },
                        ].map((btn) => {
                          const active = featuredFilter === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => setFeaturedFilter(btn.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                active
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Search */}
                      <div className="relative min-w-[220px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search title, city, owner..."
                          value={featuredSearch}
                          onChange={(e) => setFeaturedSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Slot / Rank</th>
                            <th className="py-2.5 px-3">Listing</th>
                            <th className="py-2.5 px-3">Service & City</th>
                            <th className="py-2.5 px-3">Owner / Driver</th>
                            <th className="py-2.5 px-3">Price</th>
                            <th className="py-2.5 px-3 text-right">Promotion Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAgentFeaturedListings.length > 0 ? (
                            filteredAgentFeaturedListings.map((item) => {
                              const isFeatured = featuredIds.includes(item.id);
                              const slotIdx = featuredIds.indexOf(item.id);
                              const isSlotsFull = featuredIds.length >= MAX_FEATURED_ADS;

                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/80 transition ${
                                    isFeatured ? 'bg-amber-50/40' : ''
                                  }`}
                                >
                                  <td className="py-3 px-3 font-semibold">
                                    {isFeatured ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-900 shadow-2xs">
                                        <Sparkles className="w-3 h-3 fill-current" />
                                        <span>Slot #{slotIdx + 1}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-medium">Standard</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2.5">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                                          {item.service === 'DRIVER' ? 'DRV' : item.service === 'MOVERS' ? 'MOV' : 'RIDE'}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="font-extrabold text-slate-900 truncate max-w-xs">
                                          {item.title}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {item.id} · {item.category}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3">
                                    <span className="font-bold text-slate-800 block">{item.serviceLabel}</span>
                                    <span className="text-slate-500">{item.city}</span>
                                  </td>

                                  <td className="py-3 px-3 font-medium text-slate-800">
                                    {item.owner}
                                  </td>

                                  <td className="py-3 px-3 font-extrabold text-[#0B6B4F]">
                                    {item.price}
                                  </td>

                                  <td className="py-3 px-3 text-right">
                                    {isFeatured ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleFeaturedAgent(item.id, item.title)}
                                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition cursor-pointer"
                                      >
                                        Remove from Featured
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isSlotsFull}
                                        onClick={() => handleToggleFeaturedAgent(item.id, item.title)}
                                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto ${
                                          isSlotsFull
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                        }`}
                                        title={isSlotsFull ? 'Max 9 slots filled' : 'Promote to Slot #1 Top'}
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                        <span>{isSlotsFull ? 'Slots Full' : 'Feature to Top (#1)'}</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                No listings matching filters
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-slate-900">
              Reject Listing: {rejectingItem.listingRef}
            </h3>
            <p className="text-xs text-slate-500">
              Select standard rejection reason. A direct WhatsApp message with this notice will open so the lister can rectify the issue immediately.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectListing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp Notice & Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALLER INSPECTION & DISPUTE RESOLUTION MODAL */}
      {selectedCallerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedCallerModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-auto text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  🔍
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Call Center User & Dispute Record
                  </h3>
                  <span className="text-[10px] text-blue-700 font-bold">
                    Agent Investigation & Assistance Desk
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCallerModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Overview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Subject Name</span>
                  <strong className="text-sm text-slate-900">{selectedCallerModal.name}</strong>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {selectedCallerModal.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Direct Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCallerModal.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NADRA CNIC:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedCallerModal.cnic}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Operating City:</span>
                  <span className="font-bold text-slate-800">{selectedCallerModal.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Clearance:</span>
                  <span className="font-bold text-emerald-700">✓ {selectedCallerModal.verificationStatus}</span>
                </div>
              </div>
            </div>

            {/* Association & Booking Data */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-950 block text-xs">Active Asset / Booking Details:</span>
              <div className="text-[11px] space-y-1 text-slate-700">
                <p>
                  <strong>Assigned Asset:</strong> {selectedCallerModal.assignedVehicle || selectedCallerModal.vehicle || selectedCallerModal.route || selectedCallerModal.businessName || 'General Account'}
                </p>
                {selectedCallerModal.recentBookingRef && (
                  <p>
                    <strong>Recent Booking:</strong> <span className="font-mono text-blue-800 font-bold">{selectedCallerModal.recentBookingRef}</span> ({selectedCallerModal.bookingStatus || 'CONFIRMED'})
                  </p>
                )}
                {selectedCallerModal.fbrNtn && (
                  <p>
                    <strong>FBR Tax Registration:</strong> <span className="font-mono text-slate-800 font-bold">{selectedCallerModal.fbrNtn}</span>
                  </p>
                )}
                {selectedCallerModal.license && (
                  <p>
                    <strong>Driving License:</strong> <span className="font-mono text-slate-800 font-bold">{selectedCallerModal.license}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dispute / Inquiry Status */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
              <span className="font-bold text-amber-950 block text-xs">Call Center Inquiry Log:</span>
              <p className="text-[11px] text-amber-900">
                {selectedCallerModal.activeComplaint || 'No active complaints logged. Caller inquiring about booking confirmation and document verification.'}
              </p>
            </div>

            {/* Account Moderation Controls (Strict: No User Deletion) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-[11px] text-slate-800 block">Staff Moderation Controls:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = toggleUserSubscriptionPause(selectedCallerModal.id, agentStaffId);
                    setRegisteredUsers(getAllRegisteredUsers());
                    setSelectedCallerModal({
                      ...selectedCallerModal,
                      isSubPaused: res.isPaused,
                    });
                    setCallerNotice(res.message);
                    setTimeout(() => setCallerNotice(null), 3500);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedCallerModal.isSubPaused
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{selectedCallerModal.isSubPaused ? '▶️ Resume Subscription' : '⏸️ Pause Subscription'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const willDeact = !selectedCallerModal.isDeactivated;
                    const reason = willDeact
                      ? prompt('Reason for profile deactivation:', 'Violation of SafarPK Policy')
                      : undefined;
                    if (willDeact && reason === null) return;
                    const res = toggleUserProfileDeactivation(selectedCallerModal.id, reason || undefined, agentStaffId);
                    setRegisteredUsers(getAllRegisteredUsers());
                    setSelectedCallerModal({
                      ...selectedCallerModal,
                      isDeactivated: res.isDeactivated,
                    });
                    setCallerNotice(res.message);
                    setTimeout(() => setCallerNotice(null), 3500);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedCallerModal.isDeactivated
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <span>{selectedCallerModal.isDeactivated ? '✅ Reactivate Profile' : '🚫 Deactivate Profile'}</span>
                </button>
              </div>
            </div>

            {/* Agent Actions */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                {resolvedCallerIds[selectedCallerModal.id] || selectedCallerModal.verificationStatus?.includes('Agent Cleared') ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Dispute Cleared & Verified</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleResolveCallerDispute(selectedCallerModal.id, selectedCallerModal.name);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>✓ Mark Dispute Resolved & Clear Caller</span>
                  </button>
                )}
                <a
                  href={`https://wa.me/${selectedCallerModal.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedCallerModal.name)},%20this%20is%20Agent%20Farhan%20from%20SafarPK%20following%20up%20on%20your%20call.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCallerModal(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
