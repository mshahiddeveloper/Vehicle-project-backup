'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Car,
  Users,
  CreditCard,
  Bell,
  FileText,
  Globe,
  SlidersHorizontal,
  DollarSign,
  AlertCircle,
  Eye,
  CheckCircle2,
  Trash2,
  RefreshCw,
  PlusCircle,
  Edit3,
  X,
  UserCheck,
  Lock,
  Upload,
  ExternalLink,
  Filter,
  AlertTriangle,
  Receipt,
  FileCheck,
  Search,
  Check,
  Sparkles,
  Phone,
  Building,
  Navigation,
  Truck,
  MapPin,
  Calendar,
  Radio,
  Tag,
  Percent,
  Gift,
  BarChart2,
  BarChart3,
  Activity,
  PhoneCall,
  TrendingUp,
  Wallet,
  Copy,
  Share2,
  ArrowUpRight,
  CheckCircle,
  Mail,
  Save,
} from 'lucide-react';
import { AgentPermissionEditor } from '@/components/AgentPermissionEditor';
import { SubscriptionFollowUpDesk } from '@/components/SubscriptionFollowUpDesk';
import { AdminBrandingTab } from '@/components/AdminBrandingTab';
import {
  getAllCountryDocRules,
  getDocRulesForCountry,
  saveDocRulesForCountry,
  isMasterDocAskEnabled,
  setMasterDocAskEnabled,
  DocRuleItem,
  DocRequirement,
} from '@/data/docRules';
import { AnalyticsReportHub } from '@/components/AnalyticsReportHub';
import {
  getAgentAnalyticsPermission,
  setAgentAnalyticsPermission,
} from '@/data/analyticsEngine';
import { API_BASE, getApiBaseUrl, formatPKR, maskCnic, maskPhone } from '@/lib/api';
import {
  PromoCode,
  SubscriptionPlan,
  DEFAULT_PROMO_CODES,
  DEFAULT_SUBSCRIPTION_PLANS,
  getStoredPromoCodes,
  saveStoredPromoCodes,
  getStoredPlans,
  saveStoredPlans,
} from '@/data/promoCodes';
import {
  getAllRegisteredUsers,
  purgeDemoData,
  approveSubscriptionByAdmin,
  rejectSubscriptionByAdmin,
  assignUserToAgent,
  RegisteredUser,
  getApprovedServicesForUser,
  updateUserApprovedServices,
  getActiveUser,
  getUserDashboardPath,
  SafarServiceType,
  ALL_SAFAR_SERVICES,
  getAllSubscriptionPayments,
  recordSubscriptionPayment,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
  createManualVendorWithSubscription,
  SubscriptionPaymentRecord,
  extendUserSubscription,
} from '@/data/userAuth';
import {
  getAllLeads,
  getAllClickEvents,
  updateLead,
  MarketplaceLead,
  MarketplaceClickEvent,
} from '@/data/activityTracker';
import { normalizeWhatsAppPhone } from '@/data/chatEngine';
import {
  getInternationalInquiries,
  getAdminContactEmail,
  setAdminContactEmail,
  updateInternationalInquiryStatus,
  InternationalInquiry,
} from '@/data/countries';

export default function SuperAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'services' | 'listings' | 'plans' | 'promocodes' | 'promotions' | 'featured' | 'doc_rules' | 'directory' | 'analytics' | 'leads' | 'subscription_leads' | 'agents' | 'stealthAudit' | 'legal' | 'countries' | 'branding'
  >('overview');

  // Enforce Super Admin role guard & read URL search param (?tab=...) on mount
  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/admin');
      }
      return;
    }
    if (user.role !== 'SUPER_ADMIN') {
      if (typeof window !== 'undefined') {
        window.location.replace(getUserDashboardPath(user));
      }
      return;
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // User Search & Role Filter for Overview
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<string>('ALL');

  // Extend Plan Modal State (Desktop & Mobile)
  const [extendModalUser, setExtendModalUser] = useState<RegisteredUser | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendReason, setExtendReason] = useState<string>('Administrative Plan Extension');
  const [extendNotifyWhatsApp, setExtendNotifyWhatsApp] = useState<boolean>(true);
  const [quickExtendUserId, setQuickExtendUserId] = useState<string>('');
  const [quickExtendDays, setQuickExtendDays] = useState<number>(30);

  // Promo Creator State (Desktop & Mobile)
  const [ncCode, setNcCode] = useState('');
  const [ncType, setNcType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXTRA_TIME'>('PERCENTAGE');
  const [ncValue, setNcValue] = useState<number>(20);
  const [ncUnit, setNcUnit] = useState<'DAYS' | 'MONTHS'>('MONTHS');
  const [ncApplies, setNcApplies] = useState<'ON_PAY' | 'ANYTIME'>('ON_PAY');
  const [ncCountry, setNcCountry] = useState<string>('PK');
  const [ncRoles, setNcRoles] = useState<string>('ALL');
  const [ncMax, setNcMax] = useState<number>(100);
  const [ncExpires, setNcExpires] = useState<string>('2026-12-31');

  // International Expansion & Partner Pre-Registrations
  const [intlInquiries, setIntlInquiries] = useState<InternationalInquiry[]>([]);
  const [adminContactEmailInput, setAdminContactEmailInput] = useState('');
  const [emailSaveNotice, setEmailSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    setIntlInquiries(getInternationalInquiries());
    setAdminContactEmailInput(getAdminContactEmail());

    const handleInquiryChange = () => setIntlInquiries(getInternationalInquiries());
    window.addEventListener('safarpk_intl_inquiry_added', handleInquiryChange);
    window.addEventListener('safarpk_intl_inquiry_updated', handleInquiryChange);
    return () => {
      window.removeEventListener('safarpk_intl_inquiry_added', handleInquiryChange);
      window.removeEventListener('safarpk_intl_inquiry_updated', handleInquiryChange);
    };
  }, []);

  const handleSaveAdminContactEmail = () => {
    if (!adminContactEmailInput.trim()) return;
    setAdminContactEmail(adminContactEmailInput.trim());
    setEmailSaveNotice('Global partner receiving email saved successfully!');
    setTimeout(() => setEmailSaveNotice(null), 4000);
  };

  const handleUpdateInquiryStatus = (id: string, status: InternationalInquiry['status']) => {
    updateInternationalInquiryStatus(id, status);
    setIntlInquiries(getInternationalInquiries());
  };

  const handleExtendPlan = (user: RegisteredUser, days: number, reason: string) => {
    extendUserSubscription(user.id, days, reason, 'SUPER_ADMIN');
    setRegisteredUsersList(getAllRegisteredUsers());
    setAdminNotice(`Plan extended by ${days} days for ${user.businessName || user.name}!`);
    if (extendNotifyWhatsApp && user.phone) {
      const text = encodeURIComponent(
        `Assalam-o-Alaikum ${user.name},\nYour SafarPK subscription plan has been extended by ${days} days (${reason}). Thank you for partnering with SafarPK!`
      );
      if (typeof window !== 'undefined') {
        window.open(`https://wa.me/${normalizeWhatsAppPhone(user.phone)}?text=${text}`, '_blank');
      }
    }
    setExtendModalUser(null);
    setTimeout(() => setAdminNotice(null), 5000);
  };

  const handleAddPromoCode = () => {
    if (!ncCode.trim()) {
      alert('Please enter a promo code');
      return;
    }
    const newPromo: PromoCode = {
      id: `PROMO-${Date.now()}`,
      code: ncCode.trim().toUpperCase(),
      discountType: ncType === 'EXTRA_TIME' ? 'PERCENTAGE' : ncType,
      discountValue: ncValue,
      appliesTo: ncRoles === 'ALL' ? ['CAR_RENTAL', 'DRIVER', 'PICK_DROP', 'MOVERS'] : [ncRoles as any],
      validUntil: ncExpires,
      usageLimit: ncMax,
      usedCount: 0,
      isActive: true,
      minBookingDays: 1,
      minAmount: 0,
    };
    const updated = [newPromo, ...promoCodes];
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
    setAdminNotice(`Promo code ${newPromo.code} created successfully!`);
    setNcCode('');
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const getPromoPreviewSentence = () => {
    if (ncType === 'PERCENTAGE') {
      return `Takes ${ncValue}% off price for ${ncRoles === 'ALL' ? 'all' : ncRoles} plans in ${ncCountry} until ${ncExpires}.`;
    }
    if (ncType === 'FIXED_AMOUNT') {
      return `Takes Rs. ${formatPKR(ncValue)} off price for ${ncRoles === 'ALL' ? 'all' : ncRoles} plans in ${ncCountry} until ${ncExpires}.`;
    }
    return `Adds ${ncValue} ${ncUnit.toLowerCase()} to plan (${ncApplies === 'ON_PAY' ? 'when they pay' : 'anytime, no payment needed'}) for ${ncRoles === 'ALL' ? 'all' : ncRoles} in ${ncCountry} until ${ncExpires}.`;
  };

  // Master Service Switches
  const [modules, setModules] = useState({
    carRental: true,
    pickAndDrop: true,
    cityToCity: true,
    homeShifting: true,
    hireDriver: true,
  });

  // Country Specific Verification & Document Upload Rules
  const [selectedAdminCountry, setSelectedAdminCountry] = useState<string>('GLOBAL');
  const [countryRules, setCountryRules] = useState<Record<string, {
    cardUploadPolicy: 'REQUIRED' | 'OPTIONAL' | 'HIDDEN';
    requireNationalId: boolean;
    requireDrivingLicense: boolean;
    enabledCategories: {
      carRental: boolean;
      pickAndDrop: boolean;
      cityToCity: boolean;
      homeShifting: boolean;
      hireDriver: boolean;
    };
  }>>({
    GLOBAL: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
    PK: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
    DE: {
      cardUploadPolicy: 'OPTIONAL',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: false, hireDriver: true },
    },
    AE: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
    GB: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
    SA: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
    US: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
    CA: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: { carRental: true, pickAndDrop: true, cityToCity: true, homeShifting: true, hireDriver: true },
    },
  });

  const handleUpdateCountryPolicy = (countryCode: string, policy: 'REQUIRED' | 'OPTIONAL' | 'HIDDEN') => {
    const updated = {
      ...countryRules,
      [countryCode]: {
        ...(countryRules[countryCode] || countryRules.GLOBAL),
        cardUploadPolicy: policy,
      },
    };
    setCountryRules(updated);
    if (typeof window !== 'undefined') {
      const payload = {
        globalCardUploadPolicy: updated.GLOBAL.cardUploadPolicy,
        countryRules: updated,
      };
      localStorage.setItem('safarpk_country_settings', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('safarpk_country_settings_changed', { detail: payload }));
    }
    setAdminNotice(`✅ Document/Card Upload Policy for ${countryCode} updated to ${policy}.`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  const handleToggleCountryCategory = (countryCode: string, category: 'carRental' | 'pickAndDrop' | 'cityToCity' | 'homeShifting' | 'hireDriver') => {
    const currentRule = countryRules[countryCode] || countryRules.GLOBAL;
    const currentCat = currentRule.enabledCategories[category] ?? true;
    const updated = {
      ...countryRules,
      [countryCode]: {
        ...currentRule,
        enabledCategories: {
          ...currentRule.enabledCategories,
          [category]: !currentCat,
        },
      },
    };
    setCountryRules(updated);
    if (typeof window !== 'undefined') {
      const payload = {
        globalCardUploadPolicy: updated.GLOBAL.cardUploadPolicy,
        countryRules: updated,
      };
      localStorage.setItem('safarpk_country_settings', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('safarpk_country_settings_changed', { detail: payload }));
    }
    setAdminNotice(`✅ Category ${category} in ${countryCode} set to ${!currentCat ? 'ACTIVE' : 'DISABLED'}.`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  // Notice Toast
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Initialize modules from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedModules = localStorage.getItem('safarpk_module_switches');
        if (savedModules) setModules(JSON.parse(savedModules));

        const savedPlans = localStorage.getItem('safarpk_subscription_plans');
        if (savedPlans) setPlans(JSON.parse(savedPlans));

        const savedPromo = localStorage.getItem('safarpk_promo_announcement');
        if (savedPromo) {
          const p = JSON.parse(savedPromo);
          setPromoHeading(p.heading || promoHeading);
          setPromoMessage(p.message || promoMessage);
          setPromoEnabled(p.enabled ?? true);
          setPromoStyle(p.style || 'MARQUEE_TICKER');
          setPromoBadge(p.badge || '🔥 SafarPK Launch Announcement');
        }

        const savedPolicies = localStorage.getItem('safarpk_platform_policies');
        if (savedPolicies) setPolicies(JSON.parse(savedPolicies));
      } catch (e) {
        // use defaults
      }
    }
  }, []);

  // Registered Platform Users & Dynamic Subscription Approvals
  const [registeredUsersList, setRegisteredUsersList] = useState<RegisteredUser[]>([]);

  useEffect(() => {
    setRegisteredUsersList(getAllRegisteredUsers());
    const onUsersUpdate = () => {
      setRegisteredUsersList(getAllRegisteredUsers());
    };
    window.addEventListener('safarpk_users_updated', onUsersUpdate);
    window.addEventListener('safarpk_auth_state_changed', onUsersUpdate);
    return () => {
      window.removeEventListener('safarpk_users_updated', onUsersUpdate);
      window.removeEventListener('safarpk_auth_state_changed', onUsersUpdate);
    };
  }, []);

  // =========================================================================
  // FINANCIAL LEDGER & TIME FILTERED SUBSCRIPTION METRICS
  // =========================================================================
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH');
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPaymentRecord[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'FAILED'>('ALL');
  const [adminSlipModal, setAdminSlipModal] = useState<string | null>(null);

  // Manual Vendor Portal & Subscription Creation Modal
  const [showManualVendorModal, setShowManualVendorModal] = useState(false);
  const [mvName, setMvName] = useState('');
  const [mvBusinessName, setMvBusinessName] = useState('');
  const [mvPhone, setMvPhone] = useState('');
  const [mvEmail, setMvEmail] = useState('');
  const [mvCity, setMvCity] = useState('Lahore');
  const [mvRole, setMvRole] = useState<'LISTER' | 'DRIVER' | 'PROVIDER'>('LISTER');
  const [mvProviderSubtype, setMvProviderSubtype] = useState<'COMMERCIAL_CARGO' | 'PICK_AND_DROP'>('COMMERCIAL_CARGO');
  const [mvPassword, setMvPassword] = useState('Safar@2026');
  const [mvPlanId, setMvPlanId] = useState('p-2');
  const [mvPlanName, setMvPlanName] = useState('Professional Fleet Hub (15 Vehicles)');
  const [mvQuota, setMvQuota] = useState(15);
  const [mvAmountPaid, setMvAmountPaid] = useState(12000);
  const [mvPaymentMode, setMvPaymentMode] = useState('Cash (Office)');
  const [mvPaymentRef, setMvPaymentRef] = useState('');
  const [mvNotes, setMvNotes] = useState('');
  const [createdVendorSlip, setCreatedVendorSlip] = useState<{
    user: RegisteredUser;
    payment: SubscriptionPaymentRecord;
    passwordText: string;
  } | null>(null);

  useEffect(() => {
    setSubscriptionPayments(getAllSubscriptionPayments());
    const onLedgerUpdate = () => {
      setSubscriptionPayments(getAllSubscriptionPayments());
    };
    window.addEventListener('safarpk_ledger_updated', onLedgerUpdate);
    return () => {
      window.removeEventListener('safarpk_ledger_updated', onLedgerUpdate);
    };
  }, []);

  // Update Plan Defaults when Role is Selected in Manual Onboarding
  const handleSelectMvRole = (role: 'LISTER' | 'DRIVER' | 'PROVIDER') => {
    setMvRole(role);
    if (role === 'LISTER') {
      setMvPlanId('p-2');
      setMvPlanName('Professional Fleet Hub (15 Vehicles)');
      setMvQuota(15);
      setMvAmountPaid(12000);
    } else if (role === 'DRIVER') {
      setMvPlanId('p-drv2');
      setMvPlanName('VIP Executive Chauffeur Pass');
      setMvQuota(1);
      setMvAmountPaid(3000);
    } else {
      setMvPlanId('p-prov1');
      setMvPlanName('Cargo & Shifting Mover Pass');
      setMvQuota(5);
      setMvAmountPaid(5500);
    }
  };

  const handleCreateManualVendor = () => {
    if (!mvName.trim() || !mvPhone.trim()) {
      alert('Please enter Vendor Full Name and Phone Number');
      return;
    }

    const res = createManualVendorWithSubscription({
      name: mvName,
      businessName: mvBusinessName,
      phone: mvPhone,
      email: mvEmail,
      password: mvPassword,
      city: mvCity,
      countryCode: 'PK',
      role: mvRole,
      providerSubtype: mvRole === 'PROVIDER' ? mvProviderSubtype : undefined,
      planId: mvPlanId,
      planName: mvPlanName,
      quota: mvQuota,
      amountPaid: mvAmountPaid,
      paymentMode: mvPaymentMode,
      paymentRef: mvPaymentRef || `CASH-REC-${Date.now().toString().slice(-5)}`,
      adminNotes: mvNotes,
    });

    if (res.success) {
      setRegisteredUsersList(getAllRegisteredUsers());
      setSubscriptionPayments(getAllSubscriptionPayments());
      setCreatedVendorSlip({
        user: res.user,
        payment: res.payment,
        passwordText: mvPassword,
      });
      setAdminNotice(`✅ Vendor "${res.user.name}" created and subscription of Rs. ${formatPKR(res.payment.amountPaid)} recorded!`);

      // Reset form fields
      setMvName('');
      setMvBusinessName('');
      setMvPhone('');
      setMvEmail('');
      setMvPassword('Safar@2026');
      setMvPaymentRef('');
      setMvNotes('');
    }
  };

  const handleApproveUserSubscription = (userId: string) => {
    const updated = approveSubscriptionByAdmin(userId);
    if (updated) {
      setRegisteredUsersList(getAllRegisteredUsers());
      setAdminNotice(`✅ Subscription approved for ${updated.name}! Quota (${updated.subscription.quota}) unlocked.`);
      setTimeout(() => setAdminNotice(null), 4000);
    }
  };

  const handleRejectUserSubscription = (userId: string) => {
    const reason =
      prompt('Please enter rejection reason for this subscriber:', 'Payment slip could not be verified') ||
      'Payment slip could not be verified';
    const updated = rejectSubscriptionByAdmin(userId, reason);
    if (updated) {
      setRegisteredUsersList(getAllRegisteredUsers());
      setAdminNotice(`⚠️ Subscription request rejected for ${updated.name}.`);
      setTimeout(() => setAdminNotice(null), 4000);
    }
  };

  // Real Marketplace Leads & Click Analytics
  const [leadsList, setLeadsList] = useState<MarketplaceLead[]>([]);
  const [clicksList, setClicksList] = useState<MarketplaceClickEvent[]>([]);
  const [leadFilterType, setLeadFilterType] = useState<string>('ALL');

  useEffect(() => {
    setLeadsList(getAllLeads());
    setClicksList(getAllClickEvents());
    const onLeadsUpdate = () => setLeadsList(getAllLeads());
    const onClicksUpdate = () => setClicksList(getAllClickEvents());
    window.addEventListener('safarpk_leads_updated', onLeadsUpdate);
    window.addEventListener('safarpk_clicks_updated', onClicksUpdate);
    return () => {
      window.removeEventListener('safarpk_leads_updated', onLeadsUpdate);
      window.removeEventListener('safarpk_clicks_updated', onClicksUpdate);
    };
  }, []);

  const handleAssignUserToAgent = (userId: string, agentStaffId: string) => {
    const targetAgent = agents.find((a) => a.staffId === agentStaffId);
    const agentName = targetAgent ? targetAgent.name : 'Unassigned';
    assignUserToAgent(userId, agentStaffId, agentName);
    setRegisteredUsersList(getAllRegisteredUsers());
    setAdminNotice(`✓ Assigned user to ${agentName} (${agentStaffId}) for management & support.`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  const handleUpdateLeadStatus = (leadId: string, status: MarketplaceLead['status']) => {
    updateLead(leadId, { status });
    setLeadsList(getAllLeads());
    setAdminNotice(`✓ Lead marked as ${status}.`);
    setTimeout(() => setAdminNotice(null), 2500);
  };

  const handleAssignLeadToAgent = (leadId: string, agentStaffId: string) => {
    const targetAgent = agents.find((a) => a.staffId === agentStaffId);
    const agentName = targetAgent ? targetAgent.name : 'Unassigned';
    updateLead(leadId, { assignedAgentId: agentStaffId, assignedAgentName: agentName });
    setLeadsList(getAllLeads());
    setAdminNotice(`✓ Lead assigned to ${agentName}.`);
    setTimeout(() => setAdminNotice(null), 2500);
  };

  const toggleModule = (mod: keyof typeof modules) => {
    const updated = { ...modules, [mod]: !modules[mod] };
    setModules(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_module_switches', JSON.stringify(updated));
      window.dispatchEvent(new Event('safarpk_modules_changed'));
    }
    setAdminNotice(`Updated module ${mod} to ${updated[mod] ? 'LIVE' : 'DISABLED PLATFORM-WIDE'}`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  // =========================================================================
  // 1. ALL LISTINGS FULL CRUD
  // =========================================================================
  const [listings, setListings] = useState<any[]>([
    { id: 'l-1', ref: 'LST-480853', title: 'Honda Civic Oriel Turbo 2024', city: 'Islamabad', rate: 14000, status: 'LIVE', lister: 'Kashif Autos', category: 'CAR_RENTAL', transmission: 'Automatic' },
    { id: 'l-2', ref: 'LST-065123', title: 'Toyota Corolla Altis Grande 2024', city: 'Lahore', rate: 8500, status: 'LIVE', lister: 'Salman Rentals', category: 'CAR_RENTAL', transmission: 'CVT Automatic' },
    { id: 'l-3', ref: 'SHF-2026-001', title: 'Hyundai Shehzore D-100 Shifting Pickup', city: 'Lahore', rate: 4500, status: 'LIVE', lister: 'Al-Makkah Transport', category: 'GOODS_TRANSPORT', transmission: 'Manual 5-Speed' },
    { id: 'l-4', ref: 'PND-9901', title: 'Toyota HiAce Grand Cabin Office Commute', city: 'Lahore', rate: 8500, status: 'LIVE', lister: 'Metro Commute Services', category: 'PICK_AND_DROP', transmission: 'Automatic' },
  ]);

  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [newListingForm, setNewListingForm] = useState({
    title: '',
    city: 'Lahore',
    rate: 7000,
    lister: 'SafarPK Direct Override',
    category: 'CAR_RENTAL',
    transmission: 'Automatic',
    status: 'LIVE',
  });

  const handleSaveListingEdit = () => {
    if (!editingListing) return;
    setListings(listings.map((l) => (l.id === editingListing.id ? { ...editingListing } : l)));
    setAdminNotice(`Listing ${editingListing.ref} (${editingListing.title}) successfully updated.`);
    setEditingListing(null);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleDeleteListing = (id: string, ref: string) => {
    if (confirm(`Are you sure you want to permanently delete listing ${ref}? This action is irreversible.`)) {
      setListings(listings.filter((l) => l.id !== id));
      setAdminNotice(`Listing ${ref} permanently deleted from platform.`);
      setTimeout(() => setAdminNotice(null), 3000);
    }
  };

  const handleCreateOverrideListing = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `l-${Date.now()}`;
    const newRef = `LST-${Math.floor(100000 + Math.random() * 900000)}`;
    const created = {
      id: newId,
      ref: newRef,
      ...newListingForm,
    };
    setListings([created, ...listings]);
    setShowAddListingModal(false);
    setNewListingForm({
      title: '',
      city: 'Lahore',
      rate: 7000,
      lister: 'SafarPK Direct Override',
      category: 'CAR_RENTAL',
      transmission: 'Automatic',
      status: 'LIVE',
    });
    setAdminNotice(`Direct listing ${newRef} created and published LIVE.`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  const toggleListingStatus = (id: string) => {
    setListings(
      listings.map((l) =>
        l.id === id ? { ...l, status: l.status === 'LIVE' ? 'SUSPENDED' : 'LIVE' } : l
      )
    );
  };

  // =========================================================================
  // 2. SUBSCRIPTION PLANS & QUOTAS FULL CRUD (WAS - NOW PRICING)
  // =========================================================================
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    name: '',
    targetRole: 'CAR_RENTAL',
    wasPrice: 7000,
    price: 5000,
    billingCycle: 'MONTHLY',
    maxListings: 5,
    featuresText: 'Direct Booking Leads, Priority Search Placement, Verified Badge',
    isActive: true,
  });

  // =========================================================================
  // 2B. PROMO CODES & COUNTRY-TARGETED DISCOUNTS (FULL CRUD)
  // =========================================================================
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(DEFAULT_PROMO_CODES);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [newPromoForm, setNewPromoForm] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 20,
    currency: 'PKR',
    targetCountry: 'GLOBAL',
    targetRole: 'ALL',
    expiryDate: '2026-12-31',
    maxUses: 200,
    description: '',
  });

  useEffect(() => {
    setPlans(getStoredPlans());
    setPromoCodes(getStoredPromoCodes());
  }, []);

  const handleSavePlanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const updated = plans.map((p) => (p.id === editingPlan.id ? { ...editingPlan } : p));
    setPlans(updated);
    saveStoredPlans(updated);
    setAdminNotice(`Subscription Package "${editingPlan.name}" updated with WAS - NOW rates.`);
    setEditingPlan(null);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanForm.name.trim()) return;
    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: newPlanForm.name.trim(),
      targetRole: newPlanForm.targetRole as any,
      wasPrice: Number(newPlanForm.wasPrice) || Number(newPlanForm.price) + 2000,
      price: Number(newPlanForm.price),
      billingCycle: newPlanForm.billingCycle as any,
      maxListings: Number(newPlanForm.maxListings),
      features: newPlanForm.featuresText.split(',').map((f) => f.trim()).filter(Boolean),
      isActive: newPlanForm.isActive,
      subscribersCount: 0,
    };
    const updated = [...plans, newPlan];
    setPlans(updated);
    saveStoredPlans(updated);
    setShowAddPlanModal(false);
    setNewPlanForm({
      name: '',
      targetRole: 'CAR_RENTAL',
      wasPrice: 7000,
      price: 5000,
      billingCycle: 'MONTHLY',
      maxListings: 5,
      featuresText: 'Direct Booking Leads, Priority Search Placement, Verified Badge',
      isActive: true,
    });
    setAdminNotice(`New Package "${newPlan.name}" created with WAS-NOW pricing.`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete subscription package "${name}"?`)) {
      const updated = plans.filter((p) => p.id !== id);
      setPlans(updated);
      saveStoredPlans(updated);
      setAdminNotice(`Package "${name}" deleted.`);
      setTimeout(() => setAdminNotice(null), 3000);
    }
  };

  const handleTogglePlanStatus = (id: string) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    setPlans(updated);
    saveStoredPlans(updated);
  };

  // Promo Code Handlers
  const handleSavePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    const updated = promoCodes.map((p) => (p.id === editingPromo.id ? { ...editingPromo } : p));
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
    setAdminNotice(`Promo code "${editingPromo.code}" updated successfully.`);
    setEditingPromo(null);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoForm.code.trim()) return;
    const cleanCode = newPromoForm.code.trim().toUpperCase().replace(/\s+/g, '');
    const newPromo: PromoCode = {
      id: `promo-${Date.now()}`,
      code: cleanCode,
      discountType: newPromoForm.discountType,
      discountValue: Number(newPromoForm.discountValue),
      currency: newPromoForm.currency,
      targetCountries: [newPromoForm.targetCountry],
      targetRoles: [newPromoForm.targetRole],
      expiryDate: newPromoForm.expiryDate,
      maxUses: Number(newPromoForm.maxUses) || undefined,
      currentUses: 0,
      isActive: true,
      description: newPromoForm.description.trim() || `${cleanCode} subscription discount`,
    };
    const updated = [newPromo, ...promoCodes];
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
    setShowAddPromoModal(false);
    setNewPromoForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      currency: 'PKR',
      targetCountry: 'GLOBAL',
      targetRole: 'ALL',
      expiryDate: '2026-12-31',
      maxUses: 200,
      description: '',
    });
    setAdminNotice(`Promo code "${newPromo.code}" created and active for ${newPromo.targetCountries.join(', ')}.`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  const handleDeletePromoCode = (id: string, code: string) => {
    if (confirm(`Delete promo code "${code}"?`)) {
      const updated = promoCodes.filter((p) => p.id !== id);
      setPromoCodes(updated);
      saveStoredPromoCodes(updated);
      setAdminNotice(`Promo code "${code}" deleted.`);
      setTimeout(() => setAdminNotice(null), 3000);
    }
  };

  const handleTogglePromoStatus = (id: string) => {
    const updated = promoCodes.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    setPromoCodes(updated);
    saveStoredPromoCodes(updated);
  };

  // =========================================================================
  // 3. SITE-WIDE PROMOTIONAL ANNOUNCEMENT & MARQUEE TICKER SYSTEM
  // =========================================================================
  const [promoHeading, setPromoHeading] = useState('🔥 Welcome to SafarPK: Direct Mobility & Transport Marketplace');
  const [promoMessage, setPromoMessage] = useState('Direct connections for vehicle rentals, passenger shuttles, and home shifting across Islamabad, Rawalpindi, Lahore, and nationwide.');
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [promoStyle, setPromoStyle] = useState<'MARQUEE_TICKER' | 'POPUP_MODAL' | 'BANNER_STRIP'>('MARQUEE_TICKER');
  const [promoBadge, setPromoBadge] = useState('🔥 LIMITED LAUNCH PROMO');

  const handleSaveAndBroadcastPromo = () => {
    const promoData = {
      heading: promoHeading,
      message: promoMessage,
      enabled: promoEnabled,
      style: promoStyle,
      badge: promoBadge,
      updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_promo_announcement', JSON.stringify(promoData));
      window.dispatchEvent(new Event('safarpk_promo_changed'));
    }
    setAdminNotice(`Announcement broadcasted live on public marketplace! (Style: ${promoStyle}, Status: ${promoEnabled ? 'ACTIVE' : 'OFF'})`);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // =========================================================================
  // 4. LEGAL TERMS & MULTI-POLICY EDITOR (DEPLOYABLE NATIONWIDE)
  // =========================================================================
  const defaultPolicies = {
    generalTerms: 'SafarPK operates solely as an online technology directory and connecting marketplace. Users must comply with applicable road safety laws and contract terms established directly between customer and provider.',
    zeroLiability: 'SafarPK maintains STRICT ZERO LIABILITY for cash transactions, advance token deposits, vehicle mechanical condition, road accidents, or security deposits. All monetary exchanges occur privately between client and provider.',
    mutualPrivacy: 'As per Government of Pakistan Electronic Transactions Ordinance (ETO 2002) and PECA regulations, user CNIC numbers and driving licenses are encrypted. Verified documents are revealed EXCLUSIVELY to the counterparty (Customer <-> Vehicle Owner) upon confirmed booking to ensure security and prevent identity fraud.',
    providerRules: 'All vehicle listers, commercial shuttle operators, and shifting vendors must maintain valid Excise Registration Smart Cards, fitness certificates, and authorized commercial permits. Providing forged documents results in instant permanent blacklist.',
  };

  const [policies, setPolicies] = useState(defaultPolicies);
  const [activePolicyTab, setActivePolicyTab] = useState<'generalTerms' | 'zeroLiability' | 'mutualPrivacy' | 'providerRules'>('mutualPrivacy');

  const handleSavePolicies = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_platform_policies', JSON.stringify(policies));
      window.dispatchEvent(new Event('safarpk_policies_changed'));
    }
    setAdminNotice('Platform Legal Policies updated and deployed across all booking modals, lister registration wizard, and public disclaimer!');
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // =========================================================================
  // 5. USER, LISTER & CHAUFFEUR DIRECTORY SEARCH DESK (CUSTOMER SUPPORT)
  // =========================================================================
  const [directorySearchTerm, setDirectorySearchTerm] = useState('');
  const [directoryCategoryFilter, setDirectoryCategoryFilter] = useState('ALL');
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [servicesModalUser, setServicesModalUser] = useState<any | null>(null);
  const [selectedServicesForUser, setSelectedServicesForUser] = useState<SafarServiceType[]>([]);

  const mockDirectoryUsers = [
    {
      id: 'usr-1',
      name: 'Salman Rent a Car & Tours',
      contactPerson: 'Salman Bashir',
      phone: '+92 300 1234567',
      role: 'CAR_RENTAL',
      city: 'Lahore',
      cnic: '35201-9876543-1',
      ntnNumber: 'NTN-781920-3',
      kycStatus: 'VERIFIED',
      activeListingsCount: 15,
      activeBookingsCount: 8,
      plan: 'Professional Fleet (15 Vehicles)',
      status: 'ACTIVE',
      smartCardScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-2',
      name: 'Tariq Mahmood',
      contactPerson: 'Tariq Mahmood (Self)',
      phone: '+92 301 9821045',
      role: 'DRIVER',
      city: 'Lahore',
      cnic: '35201-4412098-5',
      licenseNumber: 'LHR-DL-449102',
      licenseExpiry: '2028-11-20',
      kycStatus: 'VERIFIED',
      activeListingsCount: 1,
      activeBookingsCount: 4,
      plan: 'Independent Chauffeur Pass',
      status: 'ACTIVE',
      licenseScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-3',
      name: 'Metro Commute Shuttles',
      contactPerson: 'Rana Nadeem',
      phone: '+92 322 8841920',
      role: 'PICK_AND_DROP',
      city: 'Islamabad / Rawalpindi',
      cnic: '37405-1109283-7',
      ntnNumber: 'NTN-990142-8',
      kycStatus: 'VERIFIED',
      activeListingsCount: 4,
      activeBookingsCount: 42,
      plan: 'Pick & Drop Shuttle Pass',
      status: 'ACTIVE',
      smartCardScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-4',
      name: 'Al-Makkah Transport & Cargo',
      contactPerson: 'Haji Abdul Rasheed',
      phone: '+92 321 4409124',
      role: 'SHIFTING',
      city: 'Lahore',
      cnic: '35202-4410291-5',
      ntnNumber: 'NTN-660192-4',
      kycStatus: 'VERIFIED',
      activeListingsCount: 6,
      activeBookingsCount: 11,
      plan: 'Home Shifting & Cargo Pass',
      status: 'ACTIVE',
      smartCardScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-5',
      name: 'Hamza Tariq',
      contactPerson: 'Hamza Tariq (Customer)',
      phone: '+92 300 8472910',
      role: 'CUSTOMER',
      city: 'Lahore',
      cnic: '35202-8172910-3',
      licenseNumber: 'LHR-DL-449102',
      kycStatus: 'VERIFIED',
      activeListingsCount: 0,
      activeBookingsCount: 2,
      plan: 'Public Customer Account',
      status: 'ACTIVE',
      licenseScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-6',
      name: 'Kashif Autos & 4x4 Fleet',
      contactPerson: 'Mian Kashif',
      phone: '+92 333 4901842',
      role: 'CAR_RENTAL',
      city: 'Islamabad',
      cnic: '37405-9912048-1',
      ntnNumber: 'NTN-441029-9',
      kycStatus: 'VERIFIED',
      activeListingsCount: 8,
      activeBookingsCount: 5,
      plan: 'Professional Fleet Hub',
      status: 'ACTIVE',
      smartCardScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const allMergedDirectoryUsers = [
    ...registeredUsersList.map((ru) => ({
      id: ru.id,
      name: ru.businessName || ru.name,
      contactPerson: ru.name,
      phone: ru.phone,
      email: ru.email || 'N/A',
      cnic: ru.nationalId || '35201-9988123-5',
      city: ru.city,
      country: ru.countryCode,
      role: ru.role === 'LISTER' ? 'CAR_RENTAL' : ru.role === 'DRIVER' ? 'DRIVER' : ru.providerSubtype || 'PICK_AND_DROP',
      activeListingsCount: ru.subscription?.usedQuota || 0,
      activeBookingsCount: 0,
      quotaLimit: ru.subscription?.quota || 0,
      plan: ru.subscription?.planName || (ru.subscription?.status === 'ACTIVE' ? 'Active Subscription' : ru.subscription?.status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Unsubscribed'),
      subscriptionStatus: ru.subscription?.status || 'UNSUBSCRIBED',
      amountPaid: ru.subscription?.amountPaid,
      currency: ru.subscription?.currency,
      paymentRef: ru.subscription?.paymentRef,
      assignedAgentId: ru.assignedAgentId,
      assignedAgentName: ru.assignedAgentName || 'Unassigned',
      viewCount: ru.metrics?.viewCount || 0,
      leadsCount: ru.metrics?.leadsCount || 0,
      clickCount: ru.metrics?.clickCount || 0,
      lastActive: ru.metrics?.lastActive || ru.registeredAt,
      activities: ru.activities || [],
      kycStatus: ru.subscription?.status === 'ACTIVE' ? 'VERIFIED' : ru.subscription?.status === 'PENDING_APPROVAL' ? 'PENDING' : 'UNVERIFIED',
      status: ru.subscription?.status === 'ACTIVE' ? 'ACTIVE' : ru.subscription?.status === 'PENDING_APPROVAL' ? 'PENDING' : 'INACTIVE',
      smartCardScan: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      rawUser: ru,
      approvedServices: getApprovedServicesForUser(ru),
    })),
    ...mockDirectoryUsers,
  ];

  const filteredDirectory = allMergedDirectoryUsers.filter((u) => {
    const matchesCat = directoryCategoryFilter === 'ALL' || u.role === directoryCategoryFilter;
    const term = directorySearchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      u.name.toLowerCase().includes(term) ||
      u.contactPerson.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      u.cnic.includes(term) ||
      u.city.toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });

  // =========================================================================
  // 6. STAFF AGENTS MANAGEMENT (SUPER ADMIN EXCLUSIVE)
  // =========================================================================
  const [agents, setAgents] = useState<any[]>([
    {
      id: 'ag-1',
      name: 'Kashif Raza',
      staffId: 'AG-101',
      email: 'kashif.raza@safarpk.com',
      phone: '+92 301 8472910',
      branch: 'Lahore Regional Desk',
      role: 'Senior Compliance Auditor',
      status: 'ACTIVE',
      lastActive: '10 mins ago',
      permissions: {
        canVerifyCnic: true,
        canVerifyLicense: true,
        canEditCustomer: true,
        canEditLister: true,
        canCreateListerManual: true,
        canApproveSubscription: true,
        canDeleteListings: false,
        canViewUnmaskedData: true,
      },
    },
    {
      id: 'ag-2',
      name: 'Bilal Ahmed',
      staffId: 'AG-102',
      email: 'bilal.ahmed@safarpk.com',
      phone: '+92 333 4901284',
      branch: 'Islamabad HQ Operations',
      role: 'Verification Executive',
      status: 'ACTIVE',
      lastActive: '25 mins ago',
      permissions: {
        canVerifyCnic: true,
        canVerifyLicense: true,
        canEditCustomer: false,
        canEditLister: true,
        canCreateListerManual: true,
        canApproveSubscription: false,
        canDeleteListings: false,
        canViewUnmaskedData: false,
      },
    },
    {
      id: 'ag-3',
      name: 'Ayesha Khan',
      staffId: 'AG-103',
      email: 'ayesha.khan@safarpk.com',
      phone: '+92 321 5592014',
      branch: 'Karachi South Hub',
      role: 'Customer Support Specialist',
      status: 'ACTIVE',
      lastActive: '1 hour ago',
      permissions: {
        canVerifyCnic: true,
        canVerifyLicense: true,
        canEditCustomer: true,
        canEditLister: false,
        canCreateListerManual: false,
        canApproveSubscription: false,
        canDeleteListings: false,
        canViewUnmaskedData: false,
      },
    },
  ]);

  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    staffId: `AG-${Math.floor(104 + Math.random() * 50)}`,
    email: '',
    phone: '+92 300 ',
    pin: '7860',
    branch: 'Lahore Desk',
    role: 'Verification Officer',
    permissions: {
      canVerifyCnic: true,
      canVerifyLicense: true,
      canEditCustomer: false,
      canEditLister: false,
      canCreateListerManual: true,
      canApproveSubscription: false,
      canDeleteListings: false,
      canViewUnmaskedData: false,
    },
  });

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentForm.name || !newAgentForm.email) return;
    const created = {
      id: `ag-${Date.now()}`,
      ...newAgentForm,
      status: 'ACTIVE',
      lastActive: 'Just registered',
    };
    setAgents([...agents, created]);
    setShowCreateAgentModal(false);
    setNewAgentForm({
      name: '',
      staffId: `AG-${Math.floor(104 + Math.random() * 50)}`,
      email: '',
      phone: '+92 300 ',
      pin: '7860',
      branch: 'Lahore Desk',
      role: 'Verification Officer',
      permissions: {
        canVerifyCnic: true,
        canVerifyLicense: true,
        canEditCustomer: false,
        canEditLister: false,
        canCreateListerManual: true,
        canApproveSubscription: false,
        canDeleteListings: false,
        canViewUnmaskedData: false,
      },
    });
    setAdminNotice(`SafarPK Staff Agent ${created.name} (${created.staffId}) created.`);
    setTimeout(() => setAdminNotice(null), 3500);
  };

  const handleToggleAgentStatus = (id: string) => {
    setAgents(
      agents.map((ag) =>
        ag.id === id ? { ...ag, status: ag.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : ag
      )
    );
  };

  const getAgentPermissionsList = (permissions: any): string[] => {
    if (Array.isArray(permissions)) return permissions;
    if (permissions && typeof permissions === 'object') {
      const list: string[] = [];
      if (permissions.canVerifyCnic) list.push('customer.view', 'driver.verify');
      if (permissions.canVerifyLicense) list.push('driver.verify', 'driver.approve');
      if (permissions.canEditCustomer) list.push('customer.edit');
      if (permissions.canEditLister) list.push('listing.edit');
      if (permissions.canCreateListerManual) list.push('listing.create');
      if (permissions.canApproveSubscription) list.push('payment.approve', 'payment.view');
      if (permissions.canDeleteListings) list.push('listing.delete');
      if (permissions.canViewUnmaskedData) list.push('platform.audit_logs');
      return list;
    }
    return [];
  };

  const handleSaveAgentPermissionsFromEditor = (newPermissions: string[]) => {
    if (!editingAgent) return;
    setAgents(agents.map((ag) => (ag.id === editingAgent.id ? { ...ag, permissions: newPermissions } : ag)));
    if (typeof window !== 'undefined') {
      fetch(`${getApiBaseUrl()}/admin/agents/${editingAgent.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions }),
      }).catch(() => {});
    }
    setAdminNotice(`Enterprise permissions successfully updated for ${editingAgent.name} (${editingAgent.staffId}).`);
    setEditingAgent(null);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Top 9 Featured Ads Placements
  const [featuredSlots, setFeaturedSlots] = useState([
    { slot: 1, title: 'Honda Civic Oriel Turbo 2024', lister: 'Kashif Motors Islamabad', city: 'Islamabad', dailyRate: 14000, pricePerDay: 1500, active: true, impressions: 3420, clicks: 184 },
    { slot: 2, title: 'Toyota Corolla Altis Grande 1.8', lister: 'Lahore Premier Car Rentals', city: 'Lahore', dailyRate: 11000, pricePerDay: 1500, active: true, impressions: 2950, clicks: 142 },
    { slot: 3, title: 'Toyota Fortuner Legender 2023', lister: 'Royal SUV Islamabad', city: 'Islamabad', dailyRate: 28000, pricePerDay: 2000, active: true, impressions: 4100, clicks: 230 },
    { slot: 4, title: 'Hyundai Elantra GLS 2024', lister: 'Executive Wheels Karachi', city: 'Karachi', dailyRate: 12000, pricePerDay: 1500, active: true, impressions: 1820, clicks: 96 },
    { slot: 5, title: 'KIA Sportage AWD 2023', lister: 'Frontier Fleet Peshawar', city: 'Peshawar', dailyRate: 16000, pricePerDay: 1500, active: true, impressions: 1640, clicks: 88 },
    { slot: 6, title: 'Toyota Land Cruiser V8 ZX', lister: 'VIP Motors Lahore', city: 'Lahore', dailyRate: 45000, pricePerDay: 2500, active: true, impressions: 5310, clicks: 312 },
    { slot: 7, title: 'Suzuki Alto VXR 2024 (Budget)', lister: 'City Economy Wheels Rawalpindi', city: 'Rawalpindi', dailyRate: 4500, pricePerDay: 1000, active: false, impressions: 980, clicks: 42 },
    { slot: 8, title: 'Toyota Yaris ATIV X 1.5', lister: 'Capital Express Islamabad', city: 'Islamabad', dailyRate: 8500, pricePerDay: 1200, active: true, impressions: 1420, clicks: 75 },
    { slot: 9, title: 'Changan Karvaan Plus 7-Seater', lister: 'Family Commute Lahore', city: 'Lahore', dailyRate: 8000, pricePerDay: 1200, active: true, impressions: 1250, clicks: 61 },
  ]);

  // Document Rules Matrix State
  const [docCountry, setDocCountry] = useState<string>('PK');
  const [docRulesList, setDocRulesList] = useState<DocRuleItem[]>(() => getDocRulesForCountry('PK'));
  const [masterDocAsk, setMasterDocAsk] = useState<boolean>(() => isMasterDocAskEnabled());

  useEffect(() => {
    setDocRulesList(getDocRulesForCountry(docCountry));
  }, [docCountry]);

  const handleToggleDocRuleCell = (ruleIdx: number, roleKey: 'owner' | 'driver' | 'shuttle' | 'mover' | 'renter') => {
    const states: DocRequirement[] = ['Upload', 'Type it', 'Optional', 'Off'];
    const currentVal = docRulesList[ruleIdx][roleKey];
    const nextIdx = (states.indexOf(currentVal) + 1) % states.length;
    const nextVal = states[nextIdx];

    const updated = [...docRulesList];
    updated[ruleIdx] = { ...updated[ruleIdx], [roleKey]: nextVal };
    setDocRulesList(updated);
  };

  const handleSaveDocRules = () => {
    saveDocRulesForCountry(docCountry, docRulesList);
    setMasterDocAskEnabled(masterDocAsk);
    setAdminNotice(`✓ Document Verification Rules successfully saved and applied immediately across ${docCountry}.`);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // =========================================================================
  // 7. STEALTH ANTI-FRAUD & STAFF SURVEILLANCE AUDIT LOG (TOP SECRET)
  // =========================================================================
  const [stealthAuditLogs, setStealthAuditLogs] = useState<any[]>([
    {
      id: 'stl-1',
      timestamp: '2026-11-10 14:42 PKT',
      agentName: 'Bilal Ahmed',
      staffId: 'AG-102',
      branch: 'Islamabad HQ Operations',
      ipAddress: '192.168.10.42 (Terminal-ISB-02)',
      actionType: 'MANUAL_LISTER_CREATE',
      actionDesc: 'Created Lister Profile: "Pak Punjab Tours & Fleet" (Sheikhupura)',
      targetEntity: 'Lister: Pak Punjab Tours (LST-9021)',
      officialTariff: 12000,
      feeReported: 7000,
      isSuspicious: true,
      suspicionReason: 'CRITICAL TARIFF DEFICIT (-PKR 5,000): Agent submitted PKR 7,000 against scheduled PKR 12,000 fee. Potential unapproved discount or offline cash diversion.',
      paymentMethod: 'JAZZCASH_TILL',
      trnRef: 'JC-8921849102-PK',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'stl-2',
      timestamp: '2026-11-10 13:15 PKT',
      agentName: 'Kashif Raza',
      staffId: 'AG-101',
      branch: 'Lahore Regional Desk',
      ipAddress: '192.168.1.18 (Terminal-LHR-01)',
      actionType: 'SUBSCRIPTION_APPROVAL',
      actionDesc: 'Approved Subscription: "Salman Rent a Car & Tours"',
      targetEntity: 'Lister: Salman Rentals (p-2)',
      officialTariff: 12000,
      feeReported: 12000,
      isSuspicious: false,
      suspicionReason: 'Tariff Reconciled (100% schedule match)',
      paymentMethod: 'MEEZAN_BANK_TRANSFER',
      trnRef: 'TX-MEEZAN-99210',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    },
  ]);

  const [stealthFilterAgent, setStealthFilterAgent] = useState('ALL');
  const [viewingProofModal, setViewingProofModal] = useState<any | null>(null);

  const filteredAuditLogs = stealthFilterAgent === 'ALL'
    ? stealthAuditLogs
    : stealthAuditLogs.filter((log) => log.staffId === stealthFilterAgent);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#101828] flex flex-col font-sans selection:bg-[#0B6B4F] selection:text-white antialiased">
      {/* Mobile Top Header (matching App-Admin.dc.html) */}
      <header className="lg:hidden bg-[#101828] text-white border-b border-[#1E293B] p-4 flex flex-col gap-3 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-black text-sm shrink-0">
              S
            </span>
            <div className="min-w-0">
              <span className="font-extrabold text-sm text-white block leading-tight truncate">
                SafarPK Admin
              </span>
              <span className="text-[11px] font-bold text-[#F5B547] block leading-none">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (confirm('🧹 Clean / Purge all demo accounts?\n\nThis will remove demo users and leave only your Super Admin account (admin@safarpk.com).')) {
                  purgeDemoData();
                  setRegisteredUsersList(getAllRegisteredUsers());
                  setAdminNotice('✅ Demo accounts purged! The portal is clean for real user registrations.');
                  setTimeout(() => setAdminNotice(null), 4000);
                }
              }}
              className="text-[11px] font-bold px-2 py-1 rounded-lg text-amber-300 bg-amber-950/70 border border-amber-800"
              title="Clean demo data"
            >
              🧹 Demo
            </button>
            <Link
              href="/admin/console"
              className="text-[11px] font-bold px-2 py-1 rounded-lg text-slate-200 bg-slate-800 border border-slate-700"
            >
              Console
            </Link>
            <Link
              href="/"
              className="text-[11px] font-bold px-2 py-1 rounded-lg text-slate-300 bg-slate-800 border border-slate-700"
            >
              ← Site
            </Link>
          </div>
        </div>

        {/* 3 Segmented Tabs (Today / Approvals / All modules) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/10 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#101828] shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'plans'
                ? 'bg-white text-[#101828] shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Approvals</span>
            {registeredUsersList.filter((u) => u.subscription?.status === 'PENDING_APPROVAL').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#D92D20] text-white text-[10px] flex items-center justify-center font-bold">
                {registeredUsersList.filter((u) => u.subscription?.status === 'PENDING_APPROVAL').length}
              </span>
            )}
          </button>
          <Link
            href="/admin/console"
            className="py-1.5 rounded-lg text-slate-300 hover:text-white transition flex items-center justify-center"
          >
            All modules
          </Link>
        </div>

        {/* Swipeable Sub-tab Pills */}
        <div className="w-full overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 min-w-max text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'directory', label: 'Directory' },
              { id: 'listings', label: 'Listings' },
              { id: 'plans', label: 'Packages' },
              { id: 'promocodes', label: 'Promos' },
              { id: 'leads', label: 'Leads' },
              { id: 'agents', label: 'Agents' },
              { id: 'services', label: 'Services' },
              { id: 'doc_rules', label: 'Doc Rules' },
              { id: 'featured', label: 'Featured Top 9' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'stealthAudit', label: 'Anti-Fraud' },
              { id: 'countries', label: 'Global' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#0B6B4F] text-white font-bold shadow-xs'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full flex flex-col lg:flex-row">
        {/* Desktop Sidebar (matching Desktop-Admin.dc.html) */}
        <nav
          aria-label="Admin"
          className="hidden lg:flex flex-col w-[256px] min-w-[256px] shrink-0 bg-[#101828] text-white p-5 gap-2 border-r border-[#1E293B] sticky top-0 max-h-screen overflow-y-auto"
        >
          {/* Logo & Super Admin Pill */}
          <div className="flex items-center gap-2.5 pb-2">
            <span className="w-8 h-8 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-black text-base shrink-0">
              S
            </span>
            <span className="font-extrabold text-xl text-white tracking-tight">
              SafarPK
            </span>
          </div>

          <span className="self-start px-2 py-0.5 rounded-md bg-[#F5B547] text-[#101828] text-[10px] font-black tracking-wider uppercase mb-2">
            SUPER ADMIN
          </span>

          {/* Hub Direct Links */}
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 mb-2">
            <Link
              href="/admin/console"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">🗂️</span>
                <span>All Modules Console</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0B6B4F] text-white font-bold">
                Hub
              </span>
            </Link>
            <Link
              href="/admin/agents"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">👥</span>
                <span>Staff & Agents Portal</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-bold">
                3
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-0.5 text-xs font-semibold">
            {[
              {
                id: 'overview',
                label: 'Platform overview',
                icon: TrendingUp,
              },
              {
                id: 'directory',
                label: 'User & vendor directory',
                icon: Search,
                badge: allMergedDirectoryUsers.length,
              },
              {
                id: 'plans',
                label: 'Packages & approvals',
                icon: DollarSign,
                pendingCount: registeredUsersList.filter((u) => u.subscription?.status === 'PENDING_APPROVAL').length,
              },
              {
                id: 'promocodes',
                label: 'Promo codes',
                icon: Tag,
                badge: promoCodes.length,
              },
              {
                id: 'listings',
                label: 'All vehicle listings',
                icon: Car,
                badge: listings.length,
              },
              {
                id: 'leads',
                label: 'Leads & click activity',
                icon: BarChart3,
                badge: leadsList.length,
              },
              {
                id: 'subscription_leads',
                label: 'Subscription follow-ups',
                icon: PhoneCall,
              },
              {
                id: 'services',
                label: 'Service switches',
                icon: SlidersHorizontal,
              },
              {
                id: 'doc_rules',
                label: 'Document rules matrix',
                icon: FileCheck,
              },
              {
                id: 'featured',
                label: 'Featured top 9 slots',
                icon: Sparkles,
              },
              {
                id: 'promotions',
                label: 'Announcement bar',
                icon: Bell,
              },
              {
                id: 'analytics',
                label: 'Analytics hub',
                icon: BarChart2,
              },
              {
                id: 'stealthAudit',
                label: 'Stealth anti-fraud log',
                icon: ShieldCheck,
              },
              {
                id: 'legal',
                label: 'Terms & safety legal',
                icon: FileText,
              },
              {
                id: 'countries',
                label: 'Global network',
                icon: Globe,
              },
              {
                id: 'branding',
                label: 'Portal branding',
                icon: Sparkles,
              },
            ].map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    active
                      ? 'bg-[#0B6B4F] text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.pendingCount && item.pendingCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#D92D20] text-white text-[10px] font-bold shrink-0 animate-pulse">
                      {item.pendingCount}
                    </span>
                  ) : item.badge !== undefined ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-bold shrink-0">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Footer Utilities */}
          <div className="pt-4 mt-auto border-t border-white/10 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('🧹 Clean / Purge all demo accounts?\n\nThis will remove demo users and leave only your Super Admin account (admin@safarpk.com).')) {
                  purgeDemoData();
                  setRegisteredUsersList(getAllRegisteredUsers());
                  setAdminNotice('✅ Demo accounts purged! The portal is clean for real user registrations.');
                  setTimeout(() => setAdminNotice(null), 4000);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 transition cursor-pointer"
            >
              <span>🧹</span>
              <span>Clean Demo Data</span>
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <Link href="/" className="hover:text-white transition">
                ← Public Site
              </Link>
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>200 OK</span>
              </span>
            </div>
          </div>
        </nav>

        {/* Main Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full">
          {adminNotice && (
            <div className="p-4 bg-[#E9F3EE] border border-[#0B6B4F]/40 text-[#08513C] rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">✓</span>
                <span>{adminNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminNotice(null)}
                className="text-[#0B6B4F] hover:text-[#08513C] cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 0: 👑 PLATFORM OVERVIEW (matching Desktop-Admin.dc.html)               */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (() => {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const startOfWeek = new Date();
            startOfWeek.setDate(now.getDate() - 7);

            const filteredPayments = subscriptionPayments.filter((p) => {
              if (timeFilter === 'TODAY') {
                return p.date.startsWith(todayStr);
              }
              if (timeFilter === 'WEEK') {
                return new Date(p.date) >= startOfWeek;
              }
              if (timeFilter === 'MONTH') {
                const d = new Date(p.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }
              return true;
            });

            const periodRevenue = filteredPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            const allTimeRevenue = subscriptionPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

            const pendingSubs = registeredUsersList.filter(
              (u) => u.subscription?.status === 'PENDING_APPROVAL'
            );

            // Filter users for the table
            const filteredUsersForTable = registeredUsersList.filter((u) => {
              if (adminRoleFilter === 'CUSTOMER' && u.role !== 'CUSTOMER') return false;
              if (adminRoleFilter === 'LISTER' && u.role !== 'LISTER' && u.role !== 'OWNER') return false;
              if (adminRoleFilter === 'DRIVER' && u.role !== 'DRIVER') return false;
              if (adminRoleFilter === 'PICK_DROP' && !(u.role === 'PROVIDER' && u.providerSubtype === 'PICK_AND_DROP')) return false;
              if (adminRoleFilter === 'MOVERS' && !(u.role === 'PROVIDER' && u.providerSubtype === 'COMMERCIAL_CARGO')) return false;

              if (adminUserSearch.trim()) {
                const q = adminUserSearch.toLowerCase();
                const matchName = u.name?.toLowerCase().includes(q);
                const matchBiz = u.businessName?.toLowerCase().includes(q);
                const matchPhone = u.phone?.toLowerCase().includes(q);
                const matchId = u.id?.toLowerCase().includes(q);
                const matchCity = u.city?.toLowerCase().includes(q);
                const matchCnic = (u as any).cnic?.toLowerCase().includes(q);
                if (!matchName && !matchBiz && !matchPhone && !matchId && !matchCity && !matchCnic) return false;
              }
              return true;
            });

            return (
              <div className="space-y-6">
                {/* Header Row: Title + Search Users */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight">
                      Platform overview
                    </h1>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Live numbers, member subscriptions, approvals queue, and activity across Pakistan
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2.5 h-[42px] px-3.5 rounded-xl bg-white border border-[#E4E7EC] min-w-[280px] sm:min-w-[340px] shadow-xs">
                      <Search className="w-4 h-4 text-[#667085] shrink-0" />
                      <input
                        type="search"
                        aria-label="Search users"
                        placeholder="Search users, phone, CNIC, ref"
                        value={adminUserSearch}
                        onChange={(e) => setAdminUserSearch(e.target.value)}
                        className="flex-1 min-w-0 border-0 outline-none text-sm font-medium text-[#101828] placeholder-[#98A2B3] bg-transparent"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowManualVendorModal(true)}
                      className="h-[42px] px-4 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Register Vendor</span>
                    </button>
                  </div>
                </div>

                {/* Section 1: Key Numbers / KPIs (matching Desktop-Admin.dc.html #overview) */}
                <section id="overview" aria-label="Key numbers" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#475467] uppercase tracking-wider">
                      Key Performance Indicators
                    </span>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E4E7EC] text-xs font-bold shadow-xs">
                      {[
                        { id: 'TODAY', label: 'Today' },
                        { id: 'WEEK', label: '7 Days' },
                        { id: 'MONTH', label: 'This Month' },
                        { id: 'ALL', label: 'All Time' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTimeFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                            timeFilter === f.id
                              ? 'bg-[#101828] text-white'
                              : 'text-[#475467] hover:text-[#101828]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-xs">
                      <span className="text-xs font-semibold text-[#475467]">Registered users</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
                        {registeredUsersList.length}
                      </span>
                      <span className="text-xs text-[#667085] truncate">
                        {registeredUsersList.filter((u) => u.role === 'LISTER' || u.role === 'OWNER').length} fleet · {registeredUsersList.filter((u) => u.role === 'DRIVER').length} drivers
                      </span>
                    </div>

                    <div className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-xs">
                      <span className="text-xs font-semibold text-[#475467]">Live listings</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
                        {listings.length}
                      </span>
                      <span className="text-xs text-[#667085] truncate">
                        {listings.filter((l) => l.isActive !== false).length} active · {listings.filter((l) => l.isVerified).length} verified
                      </span>
                    </div>

                    <div className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-xs">
                      <span className="text-xs font-semibold text-[#475467]">Leads & clicks</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
                        {leadsList.length + clicksList.length}
                      </span>
                      <span className="text-xs text-[#667085] truncate">
                        {leadsList.length} leads · {clicksList.length} clicks
                      </span>
                    </div>

                    <div className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-xs">
                      <span className="text-xs font-semibold text-[#475467]">Plan revenue</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#0B6B4F]">
                        PKR {formatPKR(periodRevenue)}
                      </span>
                      <span className="text-xs text-[#667085] truncate">
                        All-time: PKR {formatPKR(allTimeRevenue)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Page 42: Quick Lister Plan Extension Widget */}
                <div className="bg-gradient-to-br from-[#0B6B4F] to-[#08513C] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-300" />
                      <h2 className="font-extrabold text-base sm:text-lg text-white">Extend a lister's plan</h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-emerald-100">
                      Quick action
                    </span>
                  </div>

                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Grant complimentary plan days or extend an active subscription directly with instant WhatsApp notification.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Vendor Dropdown */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-emerald-200">Select Lister / Vendor</label>
                      <select
                        value={quickExtendUserId}
                        onChange={(e) => setQuickExtendUserId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-white text-[#101828] text-xs font-bold border-0 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-xs"
                      >
                        <option value="">-- Choose a vendor / host --</option>
                        {registeredUsersList
                          .filter((u) => u.role === 'LISTER' || u.role === 'OWNER' || u.role === 'PROVIDER' || u.role === 'DRIVER')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.businessName || u.role}) - {u.phone}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Days Picker Chips */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-emerald-200">Extension Duration</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: '+7d', val: 7 },
                          { label: '+15d', val: 15 },
                          { label: '+30d', val: 30 },
                          { label: '+90d', val: 90 },
                        ].map((chip) => (
                          <button
                            key={chip.val}
                            type="button"
                            onClick={() => setQuickExtendDays(chip.val)}
                            className={`h-11 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                              quickExtendDays === chip.val
                                ? 'bg-white text-[#0B6B4F] shadow-xs'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                    <span className="text-[11px] text-emerald-200">
                      {quickExtendUserId
                        ? `Will add ${quickExtendDays} days & notify owner on WhatsApp`
                        : 'Select an owner above to activate extension'}
                    </span>

                    <button
                      type="button"
                      disabled={!quickExtendUserId}
                      onClick={() => {
                        if (!quickExtendUserId) return;
                        const target = registeredUsersList.find((u) => u.id === quickExtendUserId);
                        if (!target) return;
                        extendUserSubscription(target.id, quickExtendDays, 'Super Admin Quick Extension');
                        setRegisteredUsersList(getAllRegisteredUsers());
                        if (target.phone) {
                          const clean = normalizeWhatsAppPhone(target.phone);
                          const msg = encodeURIComponent(`Assalam-o-Alaikum ${target.name}! Your SafarPK plan has been extended by ${quickExtendDays} days by Super Admin. Shukriya!`);
                          window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
                        }
                        setAdminNotice(`✅ Extended ${target.name}'s plan by ${quickExtendDays} days!`);
                        setTimeout(() => setAdminNotice(null), 4000);
                      }}
                      className="h-10 px-5 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-[#0B6B4F] font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      Extend Plan Now
                    </button>
                  </div>
                </div>

                {/* Page 42: Needs Your Attention Approvals Queue */}
                {subscriptionPayments.filter((p) => p.status === 'PENDING').length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <h2 className="font-extrabold text-base text-amber-950">Needs your attention</h2>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-900">
                        {subscriptionPayments.filter((p) => p.status === 'PENDING').length} pending approval
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {subscriptionPayments
                        .filter((p) => p.status === 'PENDING')
                        .slice(0, 4)
                        .map((p) => (
                          <div key={p.id} className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-xs text-[#101828] block">{p.listerName}</span>
                                <span className="text-[11px] text-slate-500">{p.packageName} · PKR {p.amountPaid.toLocaleString()}</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                                {p.paymentMethod}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                              {p.receiptUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPaymentForReceipt(p)}
                                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                                >
                                  View Slip
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  rejectSubscriptionPayment(p.id, 'Super Admin Reject');
                                  setSubscriptionPayments(getAllSubscriptionPayments());
                                  setRegisteredUsersList(getAllRegisteredUsers());
                                  setAdminNotice(`Payment rejected for ${p.listerName}`);
                                  setTimeout(() => setAdminNotice(null), 3000);
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-[#D92D20] bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  approveSubscriptionPayment(p.id, 'Super Admin Instant');
                                  setSubscriptionPayments(getAllSubscriptionPayments());
                                  setRegisteredUsersList(getAllRegisteredUsers());
                                  setAdminNotice(`✅ Approved payment for ${p.listerName}!`);
                                  setTimeout(() => setAdminNotice(null), 3000);
                                }}
                                className="px-3 py-1 text-xs font-bold text-white bg-[#0B6B4F] hover:bg-[#08513C] rounded-lg cursor-pointer transition"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Users Table with Role Filters (matching Desktop-Admin.dc.html #users) */}
                <section
                  id="users"
                  className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-lg text-[#101828]">Users</h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {filteredUsersForTable.length} shown
                      </span>
                    </div>

                    {/* Role Filter Buttons */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'CUSTOMER', label: 'Customer' },
                        { id: 'LISTER', label: 'Fleet owner' },
                        { id: 'DRIVER', label: 'Driver' },
                        { id: 'PICK_DROP', label: 'Pick & drop' },
                        { id: 'MOVERS', label: 'Movers' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setAdminRoleFilter(f.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            adminRoleFilter === f.id
                              ? 'bg-[#0B6B4F] text-white shadow-xs'
                              : 'bg-white border border-[#D0D5DD] text-[#344054] hover:bg-slate-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm min-w-[960px]">
                      <thead>
                        <tr className="text-left text-[#667085] text-xs border-b border-[#F0F2F4]">
                          <th className="py-2.5 pr-2 font-semibold">User</th>
                          <th className="p-2 font-semibold">Role</th>
                          <th className="p-2 font-semibold">Phone · City</th>
                          <th className="p-2 font-semibold">Joined</th>
                          <th className="p-2 font-semibold">Plan</th>
                          <th className="p-2 font-semibold">Views · Leads · Clicks</th>
                          <th className="py-2.5 pl-2 font-semibold">Assigned agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F2F4]">
                        {filteredUsersForTable.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-[#667085]">
                              No users match current filters or search query.
                            </td>
                          </tr>
                        ) : (
                          filteredUsersForTable.map((u) => {
                            const userLeads = leadsList.filter((l) => l.vendorPhone === u.phone || (l as any).ownerId === u.id);
                            const userClicks = clicksList.filter((c) => c.phone === u.phone || (c as any).ownerId === u.id);
                            const canExtend = u.role !== 'CUSTOMER' && u.role !== 'SUPER_ADMIN';

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 pr-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-[#101828] text-sm">{u.name}</span>
                                    <span className="text-xs text-[#667085]">
                                      {u.businessName || 'Individual'} · <span className="font-mono text-[11px] text-[#475467]">{u.id}</span>
                                    </span>
                                  </div>
                                </td>

                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    u.role === 'LISTER' || u.role === 'OWNER'
                                      ? 'bg-[#E9F3EE] text-[#08513C]'
                                      : u.role === 'DRIVER'
                                      ? 'bg-amber-50 text-amber-800'
                                      : u.role === 'PROVIDER'
                                      ? u.providerSubtype === 'COMMERCIAL_CARGO'
                                        ? 'bg-orange-50 text-orange-800'
                                        : 'bg-indigo-50 text-indigo-800'
                                      : u.role === 'SUPER_ADMIN'
                                      ? 'bg-slate-900 text-[#F5B547]'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {u.role === 'LISTER' || u.role === 'OWNER'
                                      ? 'Fleet owner'
                                      : u.role === 'DRIVER'
                                      ? 'Chauffeur'
                                      : u.role === 'PROVIDER'
                                      ? u.providerSubtype === 'COMMERCIAL_CARGO'
                                        ? 'Movers'
                                        : 'Pick & Drop'
                                      : u.role === 'SUPER_ADMIN'
                                      ? 'Super Admin'
                                      : 'Customer'}
                                  </span>
                                </td>

                                <td className="p-2 text-[#475467] text-xs">
                                  <span className="font-mono">{u.phone}</span> · {u.city || 'Karachi'}
                                </td>

                                <td className="p-2 text-[#475467] text-xs">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Nov 2026'}
                                </td>

                                <td className="p-2">
                                  <div className="flex flex-col items-start gap-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.subscription?.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : u.subscription?.status === 'PENDING_APPROVAL'
                                        ? 'bg-amber-50 text-amber-700 animate-pulse'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {u.subscription?.planName || 'No plan'} · {u.subscription?.status || 'UNSUBSCRIBED'}
                                    </span>
                                    {u.subscription?.validUntil && (
                                      <span className="text-[11px] text-[#475467]">
                                        Ends {new Date(u.subscription.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      </span>
                                    )}
                                    {canExtend && (
                                      <button
                                        type="button"
                                        onClick={() => setExtendModalUser(u)}
                                        className="h-7 px-2.5 rounded-lg border border-[#0B6B4F] bg-white text-[#0B6B4F] hover:bg-[#E9F3EE] font-semibold text-xs transition cursor-pointer mt-0.5"
                                      >
                                        + Extend plan
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td className="p-2 text-xs font-mono text-[#344054]">
                                  <span>{userLeads.length} leads · {userClicks.length} clicks</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('leads')}
                                    className="font-sans font-semibold text-xs text-[#0B6B4F] hover:underline ml-2"
                                  >
                                    Leads report
                                  </button>
                                </td>

                                <td className="py-3 pl-2">
                                  <select
                                    aria-label="Assign agent"
                                    value={u.assignedAgentId || ''}
                                    onChange={(e) => {
                                      handleAssignUserToAgent(u.id, e.target.value);
                                      setAdminNotice(`Assigned ${u.name} to agent successfully.`);
                                      setTimeout(() => setAdminNotice(null), 3000);
                                    }}
                                    className="h-8 border border-[#D0D5DD] rounded-lg px-2 text-xs font-semibold bg-white text-[#344054] focus:outline-none focus:ring-1 focus:ring-[#0B6B4F]"
                                  >
                                    <option value="">Unassigned</option>
                                    <option value="AG-101">Kashif Raza</option>
                                    <option value="AG-102">Bilal Ahmed</option>
                                    <option value="AG-103">Ayesha Khan</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 3 & 4: Responsive Grid for Payments & Promos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* Payments to Approve (#payments) */}
                  <section
                    id="payments"
                    className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-lg text-[#101828]">Payments to approve</h2>
                        {pendingSubs.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#D92D20] text-white animate-pulse">
                            {pendingSubs.length} pending
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('plans')}
                        className="text-xs font-semibold text-[#0B6B4F] hover:underline cursor-pointer"
                      >
                        All Packages ➔
                      </button>
                    </div>

                    {subscriptionPayments.filter((p) => p.status === 'PENDING').length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-[#D0D5DD]">
                        <p className="text-xs font-bold text-[#08513C]">
                          ✓ All pending subscription payments approved! Queue cleared.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {subscriptionPayments
                          .filter((p) => p.status === 'PENDING')
                          .map((p) => (
                            <div
                              key={p.id}
                              className="p-3 border border-[#EEF0F2] rounded-xl flex items-center gap-3 flex-wrap"
                            >
                              <div
                                onClick={() => p.slipUrl && setAdminSlipModal(p.slipUrl)}
                                className={`w-12 h-14 rounded-lg border border-[#E4E7EC] flex items-center justify-center text-[10px] font-bold text-[#667085] shrink-0 cursor-pointer ${
                                  p.slipUrl ? 'bg-emerald-50 text-[#08513C] hover:opacity-80' : 'bg-[#F2F4F7]'
                                }`}
                                title={p.slipUrl ? 'Click to inspect receipt slip' : 'No receipt attached'}
                              >
                                {p.slipUrl ? 'SLIP 📷' : 'RECEIPT'}
                              </div>

                              <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
                                <span className="font-bold text-[#101828] text-sm">{p.userName}</span>
                                <span className="text-xs text-[#475467]">
                                  {p.planName} · PKR {formatPKR(p.amountPaid)}
                                </span>
                                <span className="text-[11px] text-[#667085]">
                                  {p.paymentMode} · <span className="font-mono text-[#101828]">{p.paymentRef}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason for this payment:', 'Bank credit not found / invalid receipt');
                                    if (reason) {
                                      rejectSubscriptionPayment(p.id, 'Super Admin', reason);
                                      setSubscriptionPayments(getAllSubscriptionPayments());
                                      setAdminNotice(`Rejected payment for ${p.userName}`);
                                      if (p.phone) {
                                        const text = encodeURIComponent(`Assalam-o-Alaikum ${p.userName},\nYour SafarPK subscription payment ref ${p.paymentRef} could not be verified: ${reason}. Please reply with valid bank screenshot.`);
                                        window.open(`https://wa.me/${normalizeWhatsAppPhone(p.phone)}?text=${text}`, '_blank');
                                      }
                                    }
                                  }}
                                  className="h-9 px-3 rounded-xl border border-[#FDA29B] bg-white text-[#B42318] hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                                >
                                  Reject + WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    approveSubscriptionPayment(p.id, 'Super Admin');
                                    setSubscriptionPayments(getAllSubscriptionPayments());
                                    setRegisteredUsersList(getAllRegisteredUsers());
                                    setAdminNotice(`Approved payment and unlocked quota for ${p.userName}!`);
                                    setTimeout(() => setAdminNotice(null), 4000);
                                  }}
                                  className="h-9 px-3 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                                >
                                  Approve & unlock
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>

                  {/* Promo Codes Module (#promos) */}
                  <section
                    id="promos"
                    className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
                  >
                    <div>
                      <h2 className="font-extrabold text-lg text-[#101828]">Promo codes</h2>
                      <p className="text-xs text-[#475467] mt-0.5">
                        Discount codes, or extra-time codes that add days or months to a plan.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs min-w-[480px]">
                        <thead>
                          <tr className="text-left text-[#667085] border-b border-[#F0F2F4]">
                            <th className="py-2 pr-2 font-semibold">Code</th>
                            <th className="p-2 font-semibold">Gives</th>
                            <th className="p-2 font-semibold">For</th>
                            <th className="p-2 font-semibold">Used</th>
                            <th className="p-2 font-semibold">Ends</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F4]">
                          {promoCodes.slice(0, 4).map((c) => (
                            <tr key={c.id}>
                              <td className="py-2.5 pr-2">
                                <span className="font-mono font-bold text-[#101828] text-xs block">
                                  {c.code}
                                </span>
                              </td>
                              <td className="p-2 font-bold text-[#0B6B4F]">
                                {c.discountType === 'PERCENTAGE'
                                  ? `${c.discountValue}% OFF`
                                  : `PKR ${formatPKR(c.discountValue)} OFF`}
                              </td>
                              <td className="p-2 text-[#475467]">
                                {Array.isArray(c.appliesTo) ? c.appliesTo.join(', ') : 'ALL'}
                              </td>
                              <td className="p-2 text-[#475467]">{c.usedCount || 0}</td>
                              <td className="p-2 text-[#475467]">{c.validUntil || '2026-12-31'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Inline Promo Code Creator Form (matching Desktop-Admin.dc.html) */}
                    <div className="pt-3 border-t border-[#F0F2F4] grid grid-cols-3 gap-2">
                      <span className="col-span-3 text-xs font-bold text-[#101828]">
                        Create Promo Code
                      </span>

                      <input
                        type="text"
                        aria-label="Code"
                        value={ncCode}
                        onChange={(e) => setNcCode(e.target.value.toUpperCase())}
                        placeholder="CODE, e.g. EXTRA2M"
                        className="h-9 border border-[#D0D5DD] rounded-lg px-2.5 font-mono font-bold text-xs uppercase"
                      />

                      <select
                        aria-label="Promo type"
                        value={ncType}
                        onChange={(e) => setNcType(e.target.value as any)}
                        className="h-9 border border-[#D0D5DD] rounded-lg px-2 text-xs font-semibold bg-white"
                      >
                        <option value="PERCENTAGE">% off price</option>
                        <option value="FIXED_AMOUNT">Rs. off price</option>
                        <option value="EXTRA_TIME">Extra time on plan</option>
                      </select>

                      <input
                        type="number"
                        min={1}
                        aria-label="Value"
                        value={ncValue}
                        onChange={(e) => setNcValue(parseInt(e.target.value) || 0)}
                        placeholder="Value (e.g. 20)"
                        className="h-9 border border-[#D0D5DD] rounded-lg px-2.5 text-xs font-semibold"
                      />

                      {ncType === 'EXTRA_TIME' && (
                        <>
                          <select
                            aria-label="Days or months"
                            value={ncUnit}
                            onChange={(e) => setNcUnit(e.target.value as any)}
                            className="h-9 border border-[#D0D5DD] rounded-lg px-2 text-xs font-semibold bg-white"
                          >
                            <option value="DAYS">Days</option>
                            <option value="MONTHS">Months</option>
                          </select>
                          <select
                            aria-label="When it applies"
                            value={ncApplies}
                            onChange={(e) => setNcApplies(e.target.value as any)}
                            className="col-span-2 h-9 border border-[#D0D5DD] rounded-lg px-2 text-xs font-semibold bg-white"
                          >
                            <option value="ON_PAY">When they pay for a plan</option>
                            <option value="ANYTIME">Anytime, no payment needed</option>
                          </select>
                        </>
                      )}

                      <select
                        aria-label="Country"
                        value={ncCountry}
                        onChange={(e) => setNcCountry(e.target.value)}
                        className="h-9 border border-[#D0D5DD] rounded-lg px-2 text-xs font-semibold bg-white"
                      >
                        <option value="PK">PK</option>
                        <option value="AE">AE</option>
                        <option value="SA">SA</option>
                        <option value="GB">GB</option>
                        <option value="US">US</option>
                        <option value="GLOBAL">GLOBAL</option>
                      </select>

                      <select
                        aria-label="Eligible roles"
                        value={ncRoles}
                        onChange={(e) => setNcRoles(e.target.value)}
                        className="h-9 border border-[#D0D5DD] rounded-lg px-2 text-xs font-semibold bg-white"
                      >
                        <option value="ALL">ALL ROLES</option>
                        <option value="CAR_RENTAL">CAR_RENTAL</option>
                        <option value="DRIVER">DRIVER</option>
                        <option value="PICK_DROP">PICK_DROP</option>
                        <option value="MOVERS">MOVERS</option>
                      </select>

                      <input
                        type="number"
                        min={1}
                        aria-label="Max uses"
                        value={ncMax}
                        onChange={(e) => setNcMax(parseInt(e.target.value) || 100)}
                        placeholder="Max uses"
                        className="h-9 border border-[#D0D5DD] rounded-lg px-2.5 text-xs font-semibold"
                      />

                      <label className="col-span-3 flex items-center gap-2 text-xs font-semibold text-[#344054]">
                        <span>Code ends on:</span>
                        <input
                          type="date"
                          value={ncExpires}
                          onChange={(e) => setNcExpires(e.target.value)}
                          className="flex-1 h-9 border border-[#D0D5DD] rounded-lg px-2.5 text-xs font-medium"
                        />
                      </label>

                      {/* Live Sentence Preview */}
                      <span className="col-span-3 p-2.5 rounded-lg bg-[#F7F8FA] border border-[#E4E7EC] text-xs text-[#344054] font-medium">
                        {getPromoPreviewSentence()}
                      </span>

                      <button
                        type="button"
                        onClick={handleAddPromoCode}
                        className="col-span-2 h-10 rounded-xl bg-[#101828] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Add Promo Code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNcCode('');
                          setNcValue(20);
                        }}
                        className="h-10 rounded-xl border border-[#D0D5DD] bg-white text-[#344054] hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </section>
                </div>

                {/* Section 5: Latest Leads & Clicks (#leads) */}
                <section
                  id="leads"
                  className="bg-white border border-[#EEF0F2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-lg text-[#101828]">Latest leads & clicks</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('leads')}
                      className="text-xs font-semibold text-[#0B6B4F] hover:underline cursor-pointer"
                    >
                      View All Activity Log ➔
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs min-w-[720px]">
                      <thead>
                        <tr className="text-left text-[#667085] border-b border-[#F0F2F4]">
                          <th className="py-2.5 pr-2 font-semibold">When</th>
                          <th className="p-2 font-semibold">Customer</th>
                          <th className="p-2 font-semibold">For listing</th>
                          <th className="p-2 font-semibold">Type</th>
                          <th className="py-2.5 pl-2 font-semibold">Lister (gets lead)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F2F4]">
                        {leadsList.slice(0, 6).map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 pr-2 text-[#475467]">
                              {new Date(l.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2 font-bold text-[#101828]">
                              {l.customerName}
                              <span className="block text-[11px] font-mono text-[#667085] font-normal">
                                {l.customerPhone}
                              </span>
                            </td>
                            <td className="p-2 text-[#344054]">
                              {l.vehicleTitle || 'Vehicle Inquiry'}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.leadType === 'BOOKING_REQUEST'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : l.leadType === 'WHATSAPP_CLICK'
                                  ? 'bg-teal-50 text-teal-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {l.leadType}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 text-[#344054]">
                              {l.vendorBusinessName || 'Safar Partner'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Extend Plan Modal Dialog */}
                {extendModalUser && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="extT"
                    className="fixed inset-0 bg-[#101828]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
                  >
                    <div className="w-[480px] max-w-full bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-2xl border border-[#EEF0F2]">
                      <div>
                        <h2 id="extT" className="font-extrabold text-xl text-[#101828]">
                          Extend Plan
                        </h2>
                        <p className="text-sm text-[#475467] mt-0.5">
                          {extendModalUser.businessName || extendModalUser.name} · {extendModalUser.subscription?.planName || 'Standard Plan'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#475467] mb-1.5">
                          Quick Extension Options
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { days: 7, label: '+7 days' },
                            { days: 15, label: '+15 days' },
                            { days: 30, label: '+1 month' },
                            { days: 90, label: '+3 months' },
                          ].map((q) => (
                            <button
                              key={q.days}
                              type="button"
                              onClick={() => setExtendDays(q.days)}
                              className={`h-10 rounded-xl font-bold text-xs transition cursor-pointer border ${
                                extendDays === q.days
                                  ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                                  : 'border-[#E4E7EC] bg-white text-[#344054] hover:bg-slate-50'
                              }`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#475467] mb-1">
                          Custom Extension Days
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={extendDays}
                          onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full h-10 px-3 rounded-xl border border-[#D0D5DD] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#475467] mb-1">
                          Reason for Extension
                        </label>
                        <input
                          type="text"
                          value={extendReason}
                          onChange={(e) => setExtendReason(e.target.value)}
                          placeholder="e.g. Promotional goodwill, downtime compensation"
                          className="w-full h-10 px-3 rounded-xl border border-[#D0D5DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs font-medium text-[#475467] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extendNotifyWhatsApp}
                          onChange={(e) => setExtendNotifyWhatsApp(e.target.checked)}
                          className="rounded text-[#0B6B4F] focus:ring-[#0B6B4F]"
                        />
                        <span>Notify lister via WhatsApp with updated validity</span>
                      </label>

                      <div className="flex gap-2.5 pt-2 border-t border-[#F2F4F7]">
                        <button
                          type="button"
                          onClick={() => setExtendModalUser(null)}
                          className="flex-1 h-11 rounded-xl border border-[#D0D5DD] bg-white font-bold text-sm text-[#344054] hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExtendPlan(extendModalUser, extendDays, extendReason)}
                          className="flex-1 h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-bold text-sm shadow-md transition cursor-pointer"
                        >
                          Confirm & Extend
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slip Preview Modal */}
                {adminSlipModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden border border-[#E4E7EC] shadow-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between text-[#101828] pb-2 border-b border-[#F0F2F4]">
                        <span className="text-xs font-bold font-mono">Subscriber Payment Deposit Slip</span>
                        <button
                          type="button"
                          onClick={() => setAdminSlipModal(null)}
                          className="p-1 text-[#667085] hover:text-[#101828] rounded-lg cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2">
                        <img
                          src={adminSlipModal}
                          alt="Bank deposit slip"
                          className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setAdminSlipModal(null)}
                          className="px-4 py-2 bg-[#101828] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Close Slip View
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SERVICE MASTER SWITCHES */}
          {/* ========================================================================= */}
          {activeTab === 'services' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div>
                <h3 className="font-extrabold text-base text-white">Marketplace Service Module Switches</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Instantly enable or disable any of the 5 services platform-wide. When a switch is turned OFF, it displays an official administrative pause notice and disables booking pathways.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'carRental', name: '🚗 Within-City Car Rental', desc: 'Self-drive and chauffeur-driven car rentals in Lahore, Islamabad, Karachi' },
                  { key: 'hireDriver', name: '👨‍✈️ Hire an Independent Driver', desc: 'Hire professional licensed drivers for personal cars' },
                  { key: 'cityToCity', name: '🛣️ City to City Intercity Rides', desc: 'Motorway shared and private sedan bookings' },
                  { key: 'pickAndDrop', name: '🚌 Pick & Drop Commuter Shuttle', desc: 'Daily/monthly office and university passenger shuttle routes' },
                  { key: 'homeShifting', name: '📦 Home & Office Shifting Cargo', desc: 'Commercial cargo trucks, Shehzore, and Mazdoor helpers' },
                ].map((item) => {
                  const isEnabled = (modules as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{item.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            isEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {isEnabled ? 'LIVE ON MARKETPLACE' : 'PAUSED PLATFORM-WIDE'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleModule(item.key as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                            : 'bg-rose-700 hover:bg-rose-600 text-white'
                        }`}
                      >
                        {isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{isEnabled ? 'Turn OFF' : 'Turn ON'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ALL LISTINGS FULL CRUD */}
          {/* ========================================================================= */}
          {activeTab === 'listings' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-white">All Marketplace Listings ({listings.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Super Admin master control: Edit any vehicle listing, alter daily rates, suspend fraud listings, or add override listings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddListingModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>➕ Add Direct Override Listing</span>
                </button>
              </div>

              <div className="space-y-3">
                {listings.map((l) => (
                  <div key={l.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {l.ref}
                        </span>
                        <h4 className="font-bold text-white text-sm">{l.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'LIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Category: <strong>{l.category}</strong> · City: <strong>{l.city}</strong> · Rate: <strong className="text-emerald-400">PKR {formatPKR(l.rate)}/day</strong> · Lister: <strong>{l.lister}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingListing(l)}
                        className="px-3 py-1.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => toggleListingStatus(l.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          l.status === 'LIVE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {l.status === 'LIVE' ? 'Suspend' : 'Make LIVE'}
                      </button>

                      <button
                        onClick={() => handleDeleteListing(l.id, l.ref)}
                        className="p-1.5 rounded-xl font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SUBSCRIPTION PLANS & PACKAGES FULL CRUD (ADD, EDIT, DELETE)        */}
          {/* ========================================================================= */}
          {activeTab === 'plans' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Marketplace Subscription Packages & Quotas</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Super Admin master control: Add new packages, update monthly PKR prices, change vehicle quotas, or delete outdated plans.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>➕ Add New Subscription Plan</span>
                </button>
              </div>

              {/* 1. PENDING SUBSCRIBER APPROVALS QUEUE */}
              <div className="bg-slate-950/90 rounded-2xl border-2 border-amber-500/30 p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                      ⏳
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-white">Pending Subscriber Payment Approvals</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black">
                          {registeredUsersList.filter((u) => u.subscription?.status === 'PENDING_APPROVAL').length} Pending
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Subscribers who submitted bank slips or mobile payment proofs waiting for Super Admin verification
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegisteredUsersList(getAllRegisteredUsers())}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Queue</span>
                  </button>
                </div>

                {registeredUsersList.filter((u) => u.subscription?.status === 'PENDING_APPROVAL').length === 0 ? (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-center">
                    <p className="text-xs font-bold text-emerald-400">
                      ✓ All subscription requests are up to date. No pending payments awaiting approval.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {registeredUsersList
                      .filter((u) => u.subscription?.status === 'PENDING_APPROVAL')
                      .map((user) => (
                        <div
                          key={user.id}
                          className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-sm text-white">{user.name}</span>
                              {user.businessName && (
                                <span className="text-xs font-bold text-slate-300">({user.businessName})</span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {user.role}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                PENDING REVIEW
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>📞 {user.phone}</span>
                              <span>📍 {user.city}, {user.countryCode}</span>
                              <span>
                                📦 Plan: <strong className="text-amber-300">{user.subscription.planName}</strong>
                              </span>
                              <span>
                                💰 Amount:{' '}
                                <strong className="text-emerald-400">
                                  {user.subscription.currency || 'PKR'} {formatPKR(user.subscription.amountPaid || 0)}
                                </strong>
                              </span>
                              {user.subscription.promoCodeApplied && (
                                <span className="text-rose-400 font-bold">
                                  🏷️ Promo: {user.subscription.promoCodeApplied}
                                </span>
                              )}
                              <span className="font-mono text-slate-300">
                                🧾 Slip Ref: <strong className="text-white">{user.subscription.paymentRef || 'N/A'}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApproveUserSubscription(user.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>✓ Approve & Unlock Quota</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectUserSubscription(user.id)}
                              className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition ${
                      p.isActive
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase">
                          {p.targetRole}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          p.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-white">{p.name}</h4>
                        {/* WAS - NOW Pricing Display */}
                        <div className="mt-1 space-y-0.5">
                          {p.wasPrice && p.wasPrice > p.price && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 line-through font-semibold">
                                WAS PKR {formatPKR(p.wasPrice)}
                              </span>
                              <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full">
                                {Math.round(((p.wasPrice - p.price) / p.wasPrice) * 100)}% OFF
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">NOW:</span>
                            <span className="text-2xl font-black text-emerald-400">PKR {formatPKR(p.price)}</span>
                            <span className="text-xs text-slate-400">/{p.billingCycle.toLowerCase()}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-300 block mt-2">
                          Quota: <strong className="text-white">{p.maxListings} Vehicles / Routes</strong>
                        </span>
                      </div>

                      {/* Feature Chips */}
                      <div className="pt-2 border-t border-slate-900 space-y-1">
                        {p.features?.map((f: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingPlan({ ...p, featuresText: p.features ? p.features.join(', ') : '' })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePlanStatus(p.id)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[11px] font-semibold border border-slate-800 cursor-pointer"
                        >
                          {p.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800 transition cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3B: SUBSCRIPTION PROMO CODES & COUNTRY-RESTRICTED DISCOUNTS            */}
          {/* ========================================================================= */}
          {activeTab === 'promocodes' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">Subscription Promo Codes & Regional Whitelisting</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {promoCodes.filter((p) => p.isActive).length} ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Percentage (%) or Fixed Currency discounts for subscribers. Whitelist specific countries (e.g. PK only, DE only) or GLOBAL.
                    Subscribers from non-whitelisted countries will never see or be able to apply restricted codes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPromoModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-lg shadow-emerald-950/40"
                >
                  <Gift className="w-4 h-4" />
                  <span>➕ Create Promo Code</span>
                </button>
              </div>

              {/* Promo Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promoCodes.map((promo) => {
                  const isGlobal = promo.targetCountries.includes('GLOBAL');
                  return (
                    <div
                      key={promo.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition ${
                        promo.isActive
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700 shadow-md'
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/60 uppercase tracking-wider flex items-center gap-1">
                              <Tag className="w-3 h-3 text-amber-400" />
                              {promo.code}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              promo.isActive
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {promo.isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        {/* Discount Banner */}
                        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Discount Rate:</span>
                            <span className="text-base font-black text-emerald-400">
                              {promo.discountType === 'PERCENTAGE'
                                ? `${promo.discountValue}% OFF`
                                : `Flat ${promo.currency || 'PKR'} ${promo.discountValue} OFF`}
                            </span>
                          </div>
                          {promo.description && (
                            <p className="text-[11px] text-slate-300 mt-1 italic">
                              &ldquo;{promo.description}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Country Targeting Whitelist */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Region Whitelist:</span>
                            {isGlobal ? (
                              <span className="inline-flex items-center gap-1 font-bold text-blue-400 text-[11px] bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900">
                                <Globe className="w-3 h-3" /> Worldwide (All Countries)
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {promo.targetCountries.map((c) => (
                                  <span
                                    key={c}
                                    className="inline-flex items-center gap-1 font-extrabold text-amber-300 text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800"
                                  >
                                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                                    {c === 'PK' ? '🇵🇰 Pakistan' : c === 'DE' ? '🇩🇪 Germany' : c === 'US' ? '🇺🇸 United States' : c === 'AE' ? '🇦🇪 UAE' : c === 'GB' ? '🇬🇧 UK' : c === 'SA' ? '🇸🇦 Saudi Arabia' : c === 'CA' ? '🇨🇦 Canada' : c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {!isGlobal && (
                            <div className="text-[10px] text-amber-400/90 bg-amber-950/20 p-1.5 rounded border border-amber-900/30">
                              🔒 100% hidden and blocked for visitors outside {promo.targetCountries.join(', ')}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-slate-400">Target Role:</span>
                            <span className="font-semibold text-slate-200">
                              {promo.targetRoles?.includes('ALL') ? 'All Subscribers' : promo.targetRoles?.join(', ')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Redemptions:</span>
                            <span className="font-semibold text-slate-200">
                              {promo.currentUses} / {promo.maxUses ? `${promo.maxUses} max` : 'Unlimited'}
                            </span>
                          </div>

                          {promo.expiryDate && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Valid Until:</span>
                              <span className="font-mono text-slate-300">{promo.expiryDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingPromo({ ...promo })}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePromoStatus(promo.id)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[11px] font-semibold border border-slate-800 cursor-pointer"
                          >
                            {promo.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePromoCode(promo.id, promo.code)}
                          className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800 transition cursor-pointer"
                          title="Delete Promo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SITE-WIDE PROMOTIONAL MARQUEE ANNOUNCEMENT                          */}
          {/* ========================================================================= */}
          {activeTab === 'promotions' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Site-wide Promotional Announcement & Marquee</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Broadcast platform announcements, seasonal service updates, or travel notices across the public website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoEnabled(!promoEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
                    promoEnabled ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${promoEnabled ? 'animate-pulse text-white' : 'text-slate-500'}`} />
                  <span>{promoEnabled ? 'BROADCAST ACTIVE' : 'DISABLED'}</span>
                </button>
              </div>

              {/* Live Preview of the Announcement */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Live Public Banner Preview (As seen by customers):
                </span>
                <div className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/80 rounded-xl text-xs flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-600/60 shrink-0">
                      {promoBadge}
                    </span>
                    <strong className="text-white truncate">{promoHeading}</strong>
                    <span className="text-slate-300 truncate hidden sm:inline">— {promoMessage}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">✕</span>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Promo Badge Tag</label>
                    <input
                      type="text"
                      value={promoBadge}
                      onChange={(e) => setPromoBadge(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Display Presentation Format</label>
                    <select
                      value={promoStyle}
                      onChange={(e) => setPromoStyle(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                    >
                      <option value="MARQUEE_TICKER">Marquee Ticker (Top Non-Intrusive Bar)</option>
                      <option value="BANNER_STRIP">Static Header Banner Strip</option>
                      <option value="POPUP_MODAL">Welcome Modal Popup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Announcement Heading *</label>
                  <input
                    type="text"
                    value={promoHeading}
                    onChange={(e) => setPromoHeading(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Full Detailed Message *</label>
                  <textarea
                    rows={3}
                    value={promoMessage}
                    onChange={(e) => setPromoMessage(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAndBroadcastPromo}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Save & Broadcast Announcement Platform-wide</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: USER & VENDOR DIRECTORY (CUSTOMER SUPPORT & RESOLUTION)            */}
          {/* ========================================================================= */}
          {activeTab === 'directory' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div>
                <h3 className="font-extrabold text-base text-white">User, Lister & Driver Directory ({filteredDirectory.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deep search any customer, private fleet owner, commuter operator, or chauffeur by Name, Phone, CNIC, or City to troubleshoot inquiries and resolve complaints.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, contact phone, National ID, or city..."
                    value={directorySearchTerm}
                    onChange={(e) => setDirectorySearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <select
                    value={directoryCategoryFilter}
                    onChange={(e) => setDirectoryCategoryFilter(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="CAR_RENTAL">Car Rental Fleet Owners</option>
                    <option value="DRIVER">Independent Chauffeurs</option>
                    <option value="PICK_AND_DROP">Pick & Drop Shuttle Providers</option>
                    <option value="SHIFTING">Home & Office Shifting Movers</option>
                    <option value="CUSTOMER">Registered Customers</option>
                  </select>
                </div>
              </div>

              {/* Directory Cards */}
              <div className="space-y-3">
                {filteredDirectory.map((user: any) => (
                  <div
                    key={user.id}
                    className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                        {user.role === 'CAR_RENTAL' && '🚗'}
                        {user.role === 'DRIVER' && '👨‍✈️'}
                        {user.role === 'PICK_AND_DROP' && '🚌'}
                        {user.role === 'SHIFTING' && '📦'}
                        {user.role === 'CUSTOMER' && '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-white">{user.name}</h4>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              user.subscriptionStatus === 'ACTIVE' || user.kycStatus === 'VERIFIED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : user.subscriptionStatus === 'PENDING_APPROVAL'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {user.subscriptionStatus === 'PENDING_APPROVAL'
                              ? '⏳ SUBSCRIPTION PENDING'
                              : `✓ ${user.kycStatus || 'VERIFIED'}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Contact: <strong>{user.contactPerson}</strong> · Phone: <strong>{user.phone}</strong> · City: <strong>{user.city}</strong>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px]">
                          <span className="text-slate-400">ID: <strong className="font-mono text-slate-200">{maskCnic(user.cnic)}</strong></span>
                          {user.ntnNumber && (
                            <span className="text-slate-400">Tax / Business ID: <strong className="text-cyan-300 font-mono">{user.ntnNumber}</strong></span>
                          )}
                          <span className="text-emerald-400 font-semibold">{user.plan}</span>
                        </div>

                        {/* Real Dynamic Metrics & Agent Delegation */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-900 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                            👁️ {user.viewCount || 0} Views
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-bold">
                            🎯 {user.leadsCount || 0} Leads
                          </span>
                          <span className="px-2 py-0.5 rounded bg-sky-950/70 border border-sky-800 text-sky-300 font-bold">
                            🖱️ {user.clickCount || 0} Clicks
                          </span>
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-slate-500 font-bold">Assigned Agent:</span>
                            <select
                              value={user.assignedAgentId || ''}
                              onChange={(e) => handleAssignUserToAgent(user.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-0.5 cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {agents.map((ag) => (
                                <option key={ag.id} value={ag.staffId}>
                                  {ag.name} ({ag.staffId})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Approved Service Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Services:</span>
                          {((user.approvedServices && user.approvedServices.length > 0)
                            ? user.approvedServices
                            : (user.rawUser ? getApprovedServicesForUser(user.rawUser) : [])
                          ).map((srv: SafarServiceType) => {
                            const svcMeta = ALL_SAFAR_SERVICES.find((s) => s.id === srv);
                            return (
                              <span
                                key={srv}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-emerald-400 border border-slate-700 flex items-center gap-1"
                              >
                                <span>{svcMeta?.icon || '🚗'}</span>
                                <span>{svcMeta?.label || srv}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user.subscriptionStatus === 'PENDING_APPROVAL' && (
                        <button
                          type="button"
                          onClick={() => handleApproveUserSubscription(user.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 transition cursor-pointer shadow-sm text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Sub</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const targetUser = user.rawUser || user;
                          const currentApproved = user.approvedServices || getApprovedServicesForUser(targetUser);
                          setServicesModalUser(user);
                          setSelectedServicesForUser(currentApproved);
                        }}
                        className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                        title="Manage Approved Services for this User"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Services</span>
                      </button>
                      <a
                        href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl font-bold flex items-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Direct Call / Chat</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setInspectingUser(user)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-400" />
                        <span>Inspect Profile</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5A: MASTER ANALYTICS & INTELLIGENCE HUB (VISUAL BARS, ACTIONS, EXPORT) */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsReportHub
                role="SUPER_ADMIN"
                viewerName="Super Administrator"
                allowExport={true}
                allowClaim={true}
                accentColor="#E11D48"
              />
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5B: MARKETPLACE LEADS & CLICK ANALYTICS (SUPER ADMIN + AGENT ANALYSIS) */}
          {/* ========================================================================= */}
          {activeTab === 'leads' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">Marketplace Leads, Direct Calls & Clicks</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-black">
                      {leadsList.length} Total Leads
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live capture of every customer WhatsApp inquiry, direct phone call, and shifting quote request. Delegate leads directly to staff agents for follow-up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLeadsList(getAllLeads());
                    setClicksList(getAllClickEvents());
                    setAdminNotice('✓ Leads and click streams refreshed live!');
                    setTimeout(() => setAdminNotice(null), 2500);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Leads</span>
                </button>
              </div>

              {/* KPI Header Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Leads</span>
                  <div className="text-2xl font-black text-white">{leadsList.length}</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">100% Verified Direct Contacts</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">New / Pending</span>
                  <div className="text-2xl font-black text-amber-400">
                    {leadsList.filter((l) => l.status === 'NEW').length}
                  </div>
                  <span className="text-[10px] text-amber-300 font-semibold">Awaiting Agent Follow-up</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Click Events</span>
                  <div className="text-2xl font-black text-sky-400">{clicksList.length}</div>
                  <span className="text-[10px] text-sky-300 font-semibold">Cards & Details Viewed</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">Gross Inquired Value</span>
                  <div className="text-2xl font-black text-emerald-400">
                    PKR {formatPKR(leadsList.reduce((acc, l) => acc + (l.amount || 0), 0))}
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold">Rental & Chauffeur Total</span>
                </div>
              </div>

              {/* Lead Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
                {[
                  { id: 'ALL', label: `All Inquiries (${leadsList.length})` },
                  { id: 'WHATSAPP', label: `WhatsApp Leads (${leadsList.filter((l) => l.leadType === 'WHATSAPP').length})` },
                  { id: 'DIRECT_CALL', label: `Phone Calls (${leadsList.filter((l) => l.leadType === 'DIRECT_CALL').length})` },
                  { id: 'CARGO_QUOTE', label: `Shifting Quotes (${leadsList.filter((l) => l.leadType === 'CARGO_QUOTE').length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLeadFilterType(t.id)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                      leadFilterType === t.id
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Leads List */}
              <div className="space-y-3">
                {leadsList
                  .filter((l) => leadFilterType === 'ALL' || l.leadType === leadFilterType)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              lead.leadType === 'WHATSAPP'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : lead.leadType === 'DIRECT_CALL'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                          >
                            {lead.leadType}
                          </span>
                          <span className="font-black text-sm text-white">{lead.customerName}</span>
                          <span className="font-mono text-slate-300 font-bold">{lead.customerPhone}</span>
                          {lead.customerCity && (
                            <span className="text-[10px] text-slate-400 font-semibold">📍 {lead.customerCity}</span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.status === 'CONVERTED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : lead.status === 'CONTACTED'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : lead.status === 'CANCELLED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            Target: <strong className="text-white">{lead.targetTitle}</strong>
                          </span>
                          <span>
                            Owner: <strong className="text-slate-300">{lead.targetOwnerName}</strong> ({lead.targetOwnerPhone})
                          </span>
                          {lead.amount && (
                            <span>
                              Value: <strong className="text-emerald-400">PKR {formatPKR(lead.amount)}</strong>
                            </span>
                          )}
                          <span className="text-slate-500">
                            {new Date(lead.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {lead.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                            &ldquo;{lead.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Delegation & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Assign Agent:</span>
                          <select
                            value={lead.assignedAgentId || ''}
                            onChange={(e) => handleAssignLeadToAgent(lead.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg px-2 py-1 cursor-pointer"
                          >
                            <option value="">Unassigned</option>
                            {agents.map((ag) => (
                              <option key={ag.id} value={ag.staffId}>
                                {ag.name} ({ag.staffId})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {lead.status !== 'CONVERTED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateLeadStatus(lead.id, 'CONVERTED')}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              ✓ Won / Converted
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${lead.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${lead.customerName}, this is SafarPK Support following up on your inquiry for "${lead.targetTitle}". How may we assist you?`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>WhatsApp Customer</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SUBSCRIPTION FOLLOW-UP LEADS (SUPER ADMIN & AGENT SALES DESK)       */}
          {/* ========================================================================= */}
          {activeTab === 'subscription_leads' && (
            <SubscriptionFollowUpDesk
              currentRole="SUPER_ADMIN"
              agentName="Super Admin"
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: STAFF / AGENT MANAGEMENT (SUPER ADMIN EXCLUSIVE)                    */}
          {/* ========================================================================= */}
          {activeTab === 'agents' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">SafarPK Staff & Verification Agents ({agents.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Super Admin exclusive: Create official employee agent profiles, configure individual access permissions, and manage desk branch assignments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateAgentModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>➕ Create SafarPK Agent / Staff</span>
                </button>
              </div>

              <div className="space-y-3">
                {agents.map((ag) => (
                  <div key={ag.id} className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                          👨‍💼
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{ag.name}</h4>
                            <span className="font-mono text-[10px] font-bold text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {ag.staffId}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              ag.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}>
                              {ag.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ag.role} · {ag.branch} · {ag.phone} · Last Active: {ag.lastActive}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAgent({ ...ag })}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Permissions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAgentStatus(ag.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            ag.status === 'ACTIVE' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {ag.status === 'ACTIVE' ? 'Suspend Access' : 'Activate'}
                        </button>
                      </div>
                    </div>

                    {/* Permissions Chips */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Assigned Granular Authorities:</span>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {ag.permissions.canVerifyCnic && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            ✓ Verify CNIC
                          </span>
                        )}
                        {ag.permissions.canVerifyLicense && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            ✓ Verify License
                          </span>
                        )}
                        {ag.permissions.canEditCustomer && (
                          <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                            ✓ Customer Profile Edit
                          </span>
                        )}
                        {ag.permissions.canEditLister && (
                          <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                            ✓ Lister Fleet Edit
                          </span>
                        )}
                        {ag.permissions.canCreateListerManual && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                            ✓ Manual Lister Registration
                          </span>
                        )}
                        {ag.permissions.canApproveSubscription && (
                          <span className="px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800">
                            ✓ Approve Subscription Proof
                          </span>
                        )}
                        {ag.permissions.canDeleteListings && (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                            ✓ Delete Fraud Listings
                          </span>
                        )}
                        {ag.permissions.canViewUnmaskedData && (
                          <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                            ✓ Lawful Unmasked View
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const cur = getAgentAnalyticsPermission(ag.id);
                            setAgentAnalyticsPermission(ag.id, !cur);
                            setAdminNotice(`✓ Analytics access for ${ag.name} set to ${!cur ? 'ALLOWED' : 'RESTRICTED'}`);
                            setTimeout(() => setAdminNotice(null), 3000);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                            getAgentAnalyticsPermission(ag.id)
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                              : 'bg-rose-950/90 text-rose-300 border-rose-700'
                          }`}
                        >
                          {getAgentAnalyticsPermission(ag.id) ? '✓ Analytics & Export Allowed' : '✕ Analytics Restricted'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: STEALTH ANTI-FRAUD SURVEILLANCE LOG (SUPER ADMIN ONLY)              */}
          {/* ========================================================================= */}
          {activeTab === 'stealthAudit' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-rose-300 font-extrabold text-sm">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>CONFIDENTIAL SURVEILLANCE: SUPER ADMIN EYES ONLY</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Verification agents and desk staff have <strong>zero knowledge</strong> of this monitoring system. Every action taken by any agent is logged here, including fee collection amounts vs standard tariffs and mandatory payment slip uploads.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-bold">Filter By Agent:</span>
                  <select
                    value={stealthFilterAgent}
                    onChange={(e) => setStealthFilterAgent(e.target.value)}
                    className="p-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs"
                  >
                    <option value="ALL">All Agents ({stealthAuditLogs.length} actions)</option>
                    {agents.map((ag) => (
                      <option key={ag.staffId} value={ag.staffId}>
                        {ag.name} ({ag.staffId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-amber-400 font-bold">
                  ⚠️ {stealthAuditLogs.filter(l => l.isSuspicious).length} Flagged Irregularities
                </div>
              </div>

              {/* Audit Feed */}
              <div className="space-y-3">
                {filteredAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border text-xs space-y-3 ${
                      log.isSuspicious
                        ? 'bg-rose-950/20 border-rose-700/80'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold text-rose-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {log.staffId}
                        </span>
                        <div>
                          <strong className="text-white text-sm">{log.agentName}</strong>
                          <span className="text-[11px] text-slate-400 ml-2">({log.branch}) · {log.timestamp}</span>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        IP: {log.ipAddress}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{log.actionDesc}</span>
                        <span className="text-[11px] font-mono text-slate-400">{log.targetEntity}</span>
                      </div>

                      {log.officialTariff > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Scheduled Official Tariff:</span>
                            <span className="font-black text-slate-200">PKR {formatPKR(log.officialTariff)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Fee Reported by Agent:</span>
                            <span className={`font-black ${log.feeReported < log.officialTariff ? 'text-rose-400' : 'text-emerald-400'}`}>
                              PKR {formatPKR(log.feeReported)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Transaction Reference:</span>
                            <span className="font-mono font-bold text-cyan-300">{log.trnRef}</span>
                          </div>
                        </div>
                      )}

                      {log.isSuspicious ? (
                        <div className="p-2.5 bg-rose-950/80 border border-rose-700 rounded-xl text-rose-300 text-[11px] font-semibold flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{log.suspicionReason}</span>
                          </div>
                          {log.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingProofModal(log)}
                              className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-[10px] font-bold transition cursor-pointer shrink-0"
                            >
                              Inspect Payment Slip
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300 text-[11px] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{log.suspicionReason}</span>
                          </div>
                          {log.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingProofModal(log)}
                              className="px-2 py-0.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              View Slip
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: LEGAL TERMS & MULTI-POLICY DEPLOYMENT (GOV PECA / ETO 2002)        */}
          {/* ========================================================================= */}
          {activeTab === 'legal' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div>
                <h3 className="font-extrabold text-base text-white">Platform Legal Terms & Multi-Policy Editor</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Edits made here reflect immediately in customer self-drive booking modals, mutual credential disclosure disclaimers, and lister onboarding contracts.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
                {[
                  { id: 'mutualPrivacy', label: 'Mutual Identity Privacy (PECA / ETO)' },
                  { id: 'zeroLiability', label: 'Zero-Liability & Cash Disclaimer' },
                  { id: 'generalTerms', label: 'General Terms of Service' },
                  { id: 'providerRules', label: 'Provider Legal Code of Conduct' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePolicyTab(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      activePolicyTab === item.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Policy Text Editor ({activePolicyTab})
                </label>
                <textarea
                  rows={6}
                  value={(policies as any)[activePolicyTab]}
                  onChange={(e) => setPolicies({ ...policies, [activePolicyTab]: e.target.value })}
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs font-mono text-slate-200 leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSavePolicies}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Deploy Updated Policy Live Platform-Wide</span>
                </button>
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: OPERATING SCOPE & COUNTRY VERIFICATION RULES */}
          {/* ========================================================================= */}
          {activeTab === 'countries' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-xl text-xs">
              {/* International Destination Email Configuration */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 rounded-2xl border border-emerald-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span>International Fleet Pre-Registration Destination Email</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When vehicle owners or fleet operators pre-register in Germany, UAE, UK, Saudi Arabia, etc., the system routes inquiries to this email and opens pre-filled email drafts addressed here.
                    </p>
                  </div>
                  {emailSaveNotice && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-3 py-1 rounded-full animate-in fade-in">
                      ✓ {emailSaveNotice}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="relative flex-1 w-full">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={adminContactEmailInput}
                      onChange={(e) => setAdminContactEmailInput(e.target.value)}
                      placeholder="support@safarpk.com"
                      className="w-full h-10 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAdminContactEmail}
                    className="w-full sm:w-auto h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Operations Email</span>
                  </button>
                </div>
              </div>

              {/* International Inquiries Table */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        Global Partner Pre-Registrations & Inquiries ({intlInquiries.length})
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Live capture of international vehicle owners & fleet companies awaiting onboarding.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                      {intlInquiries.filter((i) => i.status === 'NEW').length} New Pending
                    </span>
                  </div>
                </div>

                {intlInquiries.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No international inquiries yet. Pre-registrations from Germany, UAE, UK, etc. will appear here in real time.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Partner / Host</th>
                          <th className="py-2.5 px-3">Country & City</th>
                          <th className="py-2.5 px-3">Service & Fleet Details</th>
                          <th className="py-2.5 px-3">Contact</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {intlInquiries.map((inq) => {
                          const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
                          return (
                            <tr key={inq.id} className="hover:bg-slate-900/50 transition">
                              <td className="py-3 px-3">
                                <p className="font-bold text-white text-xs">{inq.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{new Date(inq.createdAt).toLocaleDateString()}</p>
                              </td>
                              <td className="py-3 px-3">
                                <p className="text-white font-semibold">{inq.countryName}</p>
                                <p className="text-[10px] text-emerald-400">{inq.city}</p>
                              </td>
                              <td className="py-3 px-3 max-w-xs">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 block w-fit mb-1">
                                  {inq.serviceType}
                                </span>
                                <p className="text-slate-300 text-[11px] truncate">{inq.fleetDetails}</p>
                                {inq.notes && <p className="text-slate-500 text-[10px] italic truncate mt-0.5">"{inq.notes}"</p>}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px]">
                                <p className="text-emerald-400 font-bold">{inq.phone}</p>
                                <p className="text-slate-400 text-[10px]">{inq.email}</p>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  inq.status === 'NEW'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : inq.status === 'CONTACTED'
                                    ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}>
                                  {inq.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`https://wa.me/${cleanPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-[10px] border border-emerald-800 transition"
                                    title="Direct WhatsApp"
                                  >
                                    WhatsApp
                                  </a>
                                  <a
                                    href={`mailto:${inq.email}?subject=${encodeURIComponent(`Safar Partnership - ${inq.countryName} Launch`)}`}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] border border-slate-700 transition"
                                    title="Email Partner"
                                  >
                                    Email
                                  </a>
                                  {inq.status !== 'ONBOARDED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateInquiryStatus(inq.id, inq.status === 'NEW' ? 'CONTACTED' : 'ONBOARDED')}
                                      className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-[10px] border border-rose-800 transition cursor-pointer"
                                    >
                                      {inq.status === 'NEW' ? 'Mark Contacted' : 'Mark Onboarded'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 pt-4">
                <div>
                  <h3 className="font-extrabold text-base text-white">Country Verification Rules & Service Scopes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure Driving License / ID Card upload requirements per country (Required, Optional, or completely Hidden).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Live Client Sync Active
                  </span>
                </div>
              </div>

              {/* Country Pill Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Country to Configure:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: 'GLOBAL', label: 'All Countries (Global Default)', flag: '🌐' },
                    { code: 'PK', label: 'Pakistan', flag: '🇵🇰' },
                    { code: 'DE', label: 'Germany', flag: '🇩🇪' },
                    { code: 'AE', label: 'United Arab Emirates', flag: '🇦🇪' },
                    { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
                    { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
                    { code: 'US', label: 'United States', flag: '🇺🇸' },
                    { code: 'CA', label: 'Canada', flag: '🇨🇦' },
                  ].map((c) => {
                    const active = selectedAdminCountry === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setSelectedAdminCountry(c.code)}
                        className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          active
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 border border-rose-500'
                            : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm">{c.flag}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Country Policy Card */}
              {(() => {
                const currentRule = countryRules[selectedAdminCountry] || countryRules.GLOBAL;
                const currentPolicy = currentRule.cardUploadPolicy;
                return (
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-5">
                    {/* Policy Radio Cards */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-white">
                          Driving License & ID Card Upload Setting for {selectedAdminCountry}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Applied to Booking & Signup Modals
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* REQUIRED */}
                        <div
                          onClick={() => handleUpdateCountryPolicy(selectedAdminCountry, 'REQUIRED')}
                          className={`p-4 rounded-2xl border cursor-pointer transition space-y-1.5 ${
                            currentPolicy === 'REQUIRED'
                              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 text-rose-200'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs">MANDATORY / REQUIRED</span>
                            {currentPolicy === 'REQUIRED' && <span className="text-rose-400 font-bold">✓ Active</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            Customer must upload a valid photograph of their official driving license and enter National ID. Validated by system before booking confirmation.
                          </p>
                        </div>

                        {/* OPTIONAL */}
                        <div
                          onClick={() => handleUpdateCountryPolicy(selectedAdminCountry, 'OPTIONAL')}
                          className={`p-4 rounded-2xl border cursor-pointer transition space-y-1.5 ${
                            currentPolicy === 'OPTIONAL'
                              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 text-amber-200'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs">OPTIONAL / FLEXIBLE</span>
                            {currentPolicy === 'OPTIONAL' && <span className="text-amber-400 font-bold">✓ Active</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            Card upload is optional. Customers can choose to upload photo or skip and show their physical license/ID to the car owner during key handover.
                          </p>
                        </div>

                        {/* HIDDEN */}
                        <div
                          onClick={() => handleUpdateCountryPolicy(selectedAdminCountry, 'HIDDEN')}
                          className={`p-4 rounded-2xl border cursor-pointer transition space-y-1.5 ${
                            currentPolicy === 'HIDDEN'
                              ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 text-blue-200'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs">HIDDEN / DISABLED</span>
                            {currentPolicy === 'HIDDEN' && <span className="text-blue-400 font-bold">✓ Active</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            Completely hides document upload boxes from customers in this country. Allows 100% frictionless instant booking via direct phone/chat.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Category Switches for this Country */}
                    <div className="pt-4 border-t border-slate-900 space-y-3">
                      <span className="font-extrabold text-sm text-white block">
                        Enabled Categories in {selectedAdminCountry}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        {[
                          { id: 'carRental', label: '🚗 Car Rental' },
                          { id: 'pickAndDrop', label: '🚌 Pick & Drop' },
                          { id: 'hireDriver', label: '👨‍✈️ Hire Driver' },
                          { id: 'cityToCity', label: '🛣️ City to City' },
                          { id: 'homeShifting', label: '📦 Cargo Shifting' },
                        ].map((cat) => {
                          const isEnabled = currentRule.enabledCategories[cat.id as keyof typeof currentRule.enabledCategories] ?? true;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleToggleCountryCategory(selectedAdminCountry, cat.id as any)}
                              className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                                isEnabled
                                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}
                            >
                              <span className="block truncate">{cat.label}</span>
                              <span className="text-[10px] block mt-0.5 opacity-80">
                                {isEnabled ? '🟢 Active' : '⚪ Disabled'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PORTAL BRANDING & CUSTOM LOGOS (DESKTOP & MOBILE)                    */}
          {/* ========================================================================= */}
          {activeTab === 'branding' && <AdminBrandingTab />}


          {/* ========================================================================= */}
          {/* TAB: FEATURED ADS (TOP 9 SPONSORED SLOTS)                                 */}
          {/* ========================================================================= */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Featured Ads & Sponsored Placements (Top 9 Slots)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage the premier top-9 slots displayed on the SafarPK homepage. Allocate premium visibility to subscribed listers and monitor impressions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    9 Active Tier Slots
                  </span>
                </div>
              </div>

              {/* 9 Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={`p-4 rounded-2xl border transition-all ${
                      slot.active
                        ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-black flex items-center justify-center border border-amber-500/30">
                          #{slot.slot}
                        </span>
                        <span className="text-xs font-bold text-slate-300">{slot.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSlots(
                            featuredSlots.map((s) => (s.slot === slot.slot ? { ...s, active: !s.active } : s))
                          );
                        }}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer ${
                          slot.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <h4 className="font-bold text-sm text-white truncate">{slot.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Host: {slot.lister}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Rate: {formatPKR(slot.dailyRate)}/day</span>
                        <span className="font-mono text-amber-300 font-bold">Fee: {formatPKR(slot.pricePerDay)}/day</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>👁️ {slot.impressions.toLocaleString()} views</span>
                      <span>🖱️ {slot.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOCUMENT RULES MATRIX (MULTI-COUNTRY & WORKFLOW RULES)                */}
          {/* ========================================================================= */}
          {activeTab === 'doc_rules' && (
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base text-white">Document Verification Rules Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure document submission requirements for hosts, drivers, shuttles, movers, and customers. Click any badge to cycle: Upload → Type it → Optional → Off.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMasterDocAsk(!masterDocAsk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      masterDocAsk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Master Ask: {masterDocAsk ? 'ENABLED' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>

              {/* Country Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { code: 'PK', name: 'Pakistan (PK)' },
                  { code: 'AE', name: 'United Arab Emirates (AE)' },
                  { code: 'SA', name: 'Saudi Arabia (SA)' },
                  { code: 'GB', name: 'United Kingdom (GB)' },
                  { code: 'DE', name: 'Germany (DE)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setDocCountry(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      docCountry === c.code
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/60">
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Car Rental Host</th>
                      <th className="p-3.5">Driver</th>
                      <th className="p-3.5">Shuttle Operator</th>
                      <th className="p-3.5">Mover</th>
                      <th className="p-3.5">Renter / Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {docRulesList.map((rule, idx) => {
                      const getBadgeClass = (req: DocRequirement) => {
                        switch (req) {
                          case 'Upload':
                            return 'bg-emerald-950 text-emerald-300 border border-emerald-800';
                          case 'Type it':
                            return 'bg-blue-950 text-blue-300 border border-blue-800';
                          case 'Optional':
                            return 'bg-amber-950 text-amber-300 border border-amber-800';
                          case 'Off':
                          default:
                            return 'bg-slate-900 text-slate-500 border border-slate-800';
                        }
                      };

                      return (
                        <tr key={rule.docName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-white">{rule.docName}</td>
                          {(['owner', 'driver', 'shuttle', 'mover', 'renter'] as const).map((role) => (
                            <td key={role} className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleToggleDocRuleCell(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition hover:opacity-80 ${getBadgeClass(
                                  rule[role]
                                )}`}
                                title="Click to cycle status"
                              >
                                {rule[role]}
                              </button>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDocRules}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Save Document Matrix Platform-wide</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SUBSCRIPTION PLAN                                            */}
      {/* ========================================================================= */}
      {showAddPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setShowAddPlanModal(false)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Create New Subscription Package</h4>
                <p className="text-[11px] text-slate-400">Configure monthly fee, quota limits, and target role</p>
              </div>
              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Luxury Car Fleet"
                  value={newPlanForm.name}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Target Service Role</label>
                  <select
                    value={newPlanForm.targetRole}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, targetRole: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="CAR_RENTAL">Car Rental Fleet Owners</option>
                    <option value="DRIVER">Independent Chauffeurs</option>
                    <option value="PICK_AND_DROP">Pick & Drop Shuttle Operators</option>
                    <option value="SHIFTING">Home & Cargo Movers</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Billing Cycle</label>
                  <select
                    value={newPlanForm.billingCycle}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, billingCycle: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly (3 Months)</option>
                    <option value="ANNUAL">Annual (12 Months)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    WAS Price (PKR)
                    <span className="text-[10px] text-slate-400 font-normal block">Strikethrough before rate</span>
                  </label>
                  <input
                    type="number"
                    value={newPlanForm.wasPrice}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, wasPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    NOW Price (PKR) *
                    <span className="text-[10px] text-emerald-400 font-normal block">Active payable price</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanForm.price}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Max Listings Quota *
                    <span className="text-[10px] text-slate-400 font-normal block">Allowed vehicles</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlanForm.maxListings}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, maxListings: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Features (Comma separated)</label>
                <textarea
                  rows={2}
                  value={newPlanForm.featuresText}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, featuresText: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create & Publish Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT SUBSCRIPTION PLAN (WAS - NOW)                                */}
      {/* ========================================================================= */}
      {editingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setEditingPlan(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Edit Package: {editingPlan.name}</h4>
                <p className="text-[11px] text-slate-400">Update WAS - NOW rates, quotas, or feature list</p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    WAS Price (PKR)
                    <span className="text-[10px] text-slate-400 font-normal block">Original strikethrough</span>
                  </label>
                  <input
                    type="number"
                    value={editingPlan.wasPrice || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, wasPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    NOW Price (PKR) *
                    <span className="text-[10px] text-emerald-400 font-normal block">Payable package rate</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Max Listings
                    <span className="text-[10px] text-slate-400 font-normal block">Quota limit</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.maxListings}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxListings: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Features (Comma separated)</label>
                <textarea
                  rows={3}
                  value={editingPlan.featuresText || (editingPlan.features ? editingPlan.features.join(', ') : '')}
                  onChange={(e) => {
                    const text = e.target.value;
                    setEditingPlan({
                      ...editingPlan,
                      featuresText: text,
                      features: text.split(',').map((f: string) => f.trim()).filter(Boolean),
                    });
                  }}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Package Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2B: CREATE NEW PROMO CODE WITH REGIONAL TARGETING                   */}
      {/* ========================================================================= */}
      {showAddPromoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setShowAddPromoModal(false)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Create Subscription Promo Code</h4>
                <p className="text-[11px] text-slate-400">Set percentage/fixed discount and country isolation rules</p>
              </div>
              <button onClick={() => setShowAddPromoModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromoCode} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Promo Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25, LAUNCHPK"
                  value={newPromoForm.code}
                  onChange={(e) => setNewPromoForm({ ...newPromoForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold tracking-wider uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Discount Type</label>
                  <select
                    value={newPromoForm.discountType}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, discountType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FIXED_AMOUNT">Fixed Price (Currency Off)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    {newPromoForm.discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={newPromoForm.discountType === 'PERCENTAGE' ? 100 : undefined}
                    value={newPromoForm.discountValue}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {newPromoForm.discountType === 'FIXED_AMOUNT' && (
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Fixed Discount Currency</label>
                  <select
                    value={newPromoForm.currency}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, currency: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="PKR">PKR (Rs - Pakistan)</option>
                    <option value="EUR">EUR (€ - Germany / Eurozone)</option>
                    <option value="USD">USD ($ - United States)</option>
                    <option value="AED">AED (AED - UAE)</option>
                    <option value="GBP">GBP (£ - United Kingdom)</option>
                    <option value="SAR">SAR (SAR - Saudi Arabia)</option>
                    <option value="CAD">CAD ($ - Canada)</option>
                  </select>
                </div>
              )}

              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                <label className="font-bold text-amber-300 block text-xs">
                  🌍 Target Country Whitelist (Region Isolation)
                </label>
                <select
                  value={newPromoForm.targetCountry}
                  onChange={(e) => setNewPromoForm({ ...newPromoForm, targetCountry: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="GLOBAL">🌐 GLOBAL (All Countries Worldwide)</option>
                  <option value="PK">🇵🇰 Pakistan Only (Hidden from all other countries)</option>
                  <option value="DE">🇩🇪 Germany Only (Hidden from all other countries)</option>
                  <option value="US">🇺🇸 United States Only (Hidden from all other countries)</option>
                  <option value="AE">🇦🇪 United Arab Emirates Only (Hidden from all other countries)</option>
                  <option value="GB">🇬🇧 United Kingdom Only (Hidden from all other countries)</option>
                  <option value="SA">🇸🇦 Saudi Arabia Only (Hidden from all other countries)</option>
                  <option value="CA">🇨🇦 Canada Only (Hidden from all other countries)</option>
                </select>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  🔒 If a specific country is chosen, subscribers visiting from other countries will <strong>neither see this promo code nor be permitted to apply it</strong> (&ldquo;Not applicable in your region&rdquo;).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Target Subscriber Role</label>
                  <select
                    value={newPromoForm.targetRole}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, targetRole: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="ALL">All Roles (Fleet, Drivers, Movers)</option>
                    <option value="CAR_RENTAL">Car Rental Fleet Owners Only</option>
                    <option value="DRIVER">Independent Chauffeurs Only</option>
                    <option value="PROVIDER">Movers & Shuttle Providers Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={newPromoForm.maxUses}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, maxUses: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newPromoForm.expiryDate}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Exclusive regional launch discount"
                    value={newPromoForm.description}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPromoModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  Create & Activate Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2C: EDIT PROMO CODE                                                 */}
      {/* ========================================================================= */}
      {editingPromo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setEditingPromo(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Edit Promo Code: {editingPromo.code}</h4>
                <p className="text-[11px] text-slate-400">Update rates, country whitelist, or validity</p>
              </div>
              <button onClick={() => setEditingPromo(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromoCode} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Promo Code</label>
                <input
                  type="text"
                  required
                  value={editingPromo.code}
                  onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold tracking-wider uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Discount Type</label>
                  <select
                    value={editingPromo.discountType}
                    onChange={(e) => setEditingPromo({ ...editingPromo, discountType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FIXED_AMOUNT">Fixed Price (Currency Off)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    {editingPromo.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={editingPromo.discountType === 'PERCENTAGE' ? 100 : undefined}
                    value={editingPromo.discountValue}
                    onChange={(e) => setEditingPromo({ ...editingPromo, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {editingPromo.discountType === 'FIXED_AMOUNT' && (
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Fixed Discount Currency</label>
                  <select
                    value={editingPromo.currency || 'PKR'}
                    onChange={(e) => setEditingPromo({ ...editingPromo, currency: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="PKR">PKR (Rs - Pakistan)</option>
                    <option value="EUR">EUR (€ - Germany / Eurozone)</option>
                    <option value="USD">USD ($ - United States)</option>
                    <option value="AED">AED (AED - UAE)</option>
                    <option value="GBP">GBP (£ - United Kingdom)</option>
                    <option value="SAR">SAR (SAR - Saudi Arabia)</option>
                    <option value="CAD">CAD ($ - Canada)</option>
                  </select>
                </div>
              )}

              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                <label className="font-bold text-amber-300 block text-xs">
                  🌍 Target Country Whitelist
                </label>
                <select
                  value={editingPromo.targetCountries[0] || 'GLOBAL'}
                  onChange={(e) => setEditingPromo({ ...editingPromo, targetCountries: [e.target.value] })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="GLOBAL">🌐 GLOBAL (All Countries Worldwide)</option>
                  <option value="PK">🇵🇰 Pakistan Only</option>
                  <option value="DE">🇩🇪 Germany Only</option>
                  <option value="US">🇺🇸 United States Only</option>
                  <option value="AE">🇦🇪 United Arab Emirates Only</option>
                  <option value="GB">🇬🇧 United Kingdom Only</option>
                  <option value="SA">🇸🇦 Saudi Arabia Only</option>
                  <option value="CA">🇨🇦 Canada Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={editingPromo.maxUses || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, maxUses: Number(e.target.value) || undefined })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editingPromo.expiryDate || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, expiryDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={editingPromo.description || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INSPECT USER / VENDOR PROFILE & RESOLVE ISSUES                    */}
      {/* ========================================================================= */}
      {inspectingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setInspectingUser(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-white">{inspectingUser.name}</h4>
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ✓ {inspectingUser.kycStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Directory ID: {inspectingUser.id} · Role: {inspectingUser.role}</p>
              </div>
              <button onClick={() => setInspectingUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Contact Person:</span>
                  <strong className="text-white">{inspectingUser.contactPerson}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone (+92):</span>
                  <strong className="text-white">{inspectingUser.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">National ID (CNIC / Passport):</span>
                  <strong className="font-mono text-cyan-300">{inspectingUser.cnic}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">City Base:</span>
                  <strong className="text-white">{inspectingUser.city}</strong>
                </div>
                {inspectingUser.ntnNumber && (
                  <div>
                    <span className="text-slate-400 block">FBR NTN Tax ID:</span>
                    <strong className="font-mono text-emerald-400">{inspectingUser.ntnNumber}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block">Subscription Tier:</span>
                  <strong className="text-amber-300">{inspectingUser.plan}</strong>
                </div>
              </div>

              {/* Document Scans */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Official Verified Government Document:</span>
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-48 flex items-center justify-center">
                  <img
                    src={inspectingUser.smartCardScan || inspectingUser.licenseScan}
                    alt="Verified Document Scan"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  ✓ Audited by SafarPK Compliance Team. Exclusively accessible for authorized contract handovers.
                </span>
              </div>

              {/* Real Performance Metrics & Leads */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block text-xs">Marketplace Performance & Leads Generated:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Views</span>
                    <strong className="text-base text-white font-black">{inspectingUser.viewCount || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-emerald-400 block uppercase font-bold">Leads</span>
                    <strong className="text-base text-emerald-400 font-black">{inspectingUser.leadsCount || 0}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-sky-400 block uppercase font-bold">Clicks</span>
                    <strong className="text-base text-sky-400 font-black">{inspectingUser.clickCount || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Staff Agent Assignment & Delegation */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Super Admin Staff Delegation:</span>
                  <p className="text-[10px] text-slate-500">
                    Assign this user profile and inquiries to a specific staff agent for dedicated analysis and onboarding.
                  </p>
                </div>
                <select
                  value={inspectingUser.assignedAgentId || ''}
                  onChange={(e) => {
                    handleAssignUserToAgent(inspectingUser.id, e.target.value);
                    const ag = agents.find((a) => a.staffId === e.target.value);
                    setInspectingUser({
                      ...inspectingUser,
                      assignedAgentId: e.target.value,
                      assignedAgentName: ag ? ag.name : 'Unassigned',
                    });
                  }}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 cursor-pointer font-bold shrink-0"
                >
                  <option value="">Unassigned</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.staffId}>
                      {ag.name} ({ag.staffId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chronological Activities Log Timeline */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white block text-xs">User Activity Timeline & Audit Trail:</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inspectingUser.activities?.length || 0} events recorded
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {!inspectingUser.activities || inspectingUser.activities.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No recent activity events recorded.</p>
                  ) : (
                    inspectingUser.activities.map((act: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5 text-[11px]"
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                          {act.type === 'LOGIN' ? '🔑' : act.type === 'REGISTER' ? '✨' : act.type === 'LEAD_RECEIVED' ? '🎯' : '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{act.title}</span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{act.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resolution Actions */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Account Status: <strong>{inspectingUser.status}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Verified account status refreshed for ${inspectingUser.name}`);
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Refresh Clearance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Account ${inspectingUser.name} suspended by Root Authority.`);
                      setInspectingUser(null);
                    }}
                    className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Suspend User
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3B: MANAGE APPROVED SERVICES (EXACT 5 SERVICES MATRIX)               */}
      {/* ========================================================================= */}
      {servicesModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setServicesModalUser(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-heading font-extrabold text-base text-white">
                    Manage Approved Services
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provider: <strong>{servicesModalUser.name}</strong> · ID: {servicesModalUser.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setServicesModalUser(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              Super Admin assigns and authorizes exactly which of the <strong>5 Main Services</strong> this provider may access. Providers can only see dashboards, create listings, and receive inquiries for approved services.
            </div>

            <div className="space-y-2.5">
              {ALL_SAFAR_SERVICES.map((svc) => {
                const isChecked = selectedServicesForUser.includes(svc.id);
                return (
                  <label
                    key={svc.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServicesForUser((prev) => [...prev, svc.id]);
                        } else {
                          setSelectedServicesForUser((prev) => prev.filter((id) => id !== svc.id));
                        }
                      }}
                      className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{svc.icon}</span>
                        <span className="font-bold text-white">{svc.label}</span>
                        <span className="font-mono text-[10px] text-slate-500">({svc.id})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{svc.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Selected: <strong>{selectedServicesForUser.length} / 5</strong> services
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServicesModalUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (servicesModalUser) {
                      updateUserApprovedServices(servicesModalUser.id, selectedServicesForUser);
                      setRegisteredUsersList(getAllRegisteredUsers());
                      setAdminNotice(
                        `✅ Approved services updated for ${servicesModalUser.name} (${selectedServicesForUser.length} services enabled).`
                      );
                      setTimeout(() => setAdminNotice(null), 4000);
                      setServicesModalUser(null);
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-heading font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Approved Services</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT LISTING (FULL CRUD)                                         */}
      {/* ========================================================================= */}
      {editingListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setEditingListing(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Edit Marketplace Listing ({editingListing.ref})</h4>
                <p className="text-[11px] text-slate-400">Super Admin Direct Override</p>
              </div>
              <button onClick={() => setEditingListing(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Vehicle / Route Title</label>
                <input
                  type="text"
                  value={editingListing.title}
                  onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">City</label>
                  <input
                    type="text"
                    value={editingListing.city}
                    onChange={(e) => setEditingListing({ ...editingListing, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Daily / Monthly Rate (PKR)</label>
                  <input
                    type="number"
                    value={editingListing.rate}
                    onChange={(e) => setEditingListing({ ...editingListing, rate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Lister / Fleet Owner</label>
                  <input
                    type="text"
                    value={editingListing.lister}
                    onChange={(e) => setEditingListing({ ...editingListing, lister: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Listing Status</label>
                  <select
                    value={editingListing.status}
                    onChange={(e) => setEditingListing({ ...editingListing, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="LIVE">LIVE (Visible on Marketplace)</option>
                    <option value="SUSPENDED">SUSPENDED (Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveListingEdit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
              >
                Save Listing Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD DIRECT OVERRIDE LISTING                                      */}
      {/* ========================================================================= */}
      {showAddListingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setShowAddListingModal(false)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Create Direct Override Listing</h4>
                <p className="text-[11px] text-slate-400">Super Admin direct publish without agent queue</p>
              </div>
              <button onClick={() => setShowAddListingModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOverrideListing} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Vehicle / Route Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Prado TX L-Package 2024"
                  value={newListingForm.title}
                  onChange={(e) => setNewListingForm({ ...newListingForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Service Channel</label>
                  <select
                    value={newListingForm.category}
                    onChange={(e) => setNewListingForm({ ...newListingForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="CAR_RENTAL">Car Rental</option>
                    <option value="PICK_AND_DROP">Pick & Drop Shuttle</option>
                    <option value="CITY_TO_CITY">City to City Intercity</option>
                    <option value="GOODS_TRANSPORT">Cargo Moving & Shifting</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Operating City</label>
                  <input
                    type="text"
                    required
                    value={newListingForm.city}
                    onChange={(e) => setNewListingForm({ ...newListingForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Rent Rate (PKR / Day)</label>
                  <input
                    type="number"
                    required
                    value={newListingForm.rate}
                    onChange={(e) => setNewListingForm({ ...newListingForm, rate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Assigned Lister Name</label>
                  <input
                    type="text"
                    required
                    value={newListingForm.lister}
                    onChange={(e) => setNewListingForm({ ...newListingForm, lister: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddListingModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Publish LIVE Immediately
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CREATE SAFARPK VERIFICATION STAFF / AGENT                        */}
      {/* ========================================================================= */}
      {showCreateAgentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setShowCreateAgentModal(false)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl p-6 text-xs space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Create New SafarPK Staff / Agent</h4>
                <p className="text-[11px] text-slate-400">Configure dedicated employee account with granular access matrix</p>
              </div>
              <button onClick={() => setShowCreateAgentModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Farooq"
                    value={newAgentForm.name}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Staff ID</label>
                  <input
                    type="text"
                    required
                    value={newAgentForm.staffId}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, staffId: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Employee Email / Login *</label>
                  <input
                    type="email"
                    required
                    placeholder="usman@safarpk.com"
                    value={newAgentForm.email}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Secret Access PIN / Password</label>
                  <input
                    type="text"
                    required
                    value={newAgentForm.pin}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, pin: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Assigned Desk / City</label>
                  <select
                    value={newAgentForm.branch}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="Lahore Regional Desk">Lahore Regional Desk</option>
                    <option value="Islamabad HQ Operations">Islamabad HQ Operations</option>
                    <option value="Karachi South Hub">Karachi South Hub</option>
                    <option value="Peshawar Desk">Peshawar Desk</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Role Title</label>
                  <input
                    type="text"
                    value={newAgentForm.role}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Granular Permission Checkboxes */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block text-xs">Granular Access & Permission Matrix:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgentForm.permissions.canVerifyCnic}
                      onChange={(e) => setNewAgentForm({
                        ...newAgentForm,
                        permissions: { ...newAgentForm.permissions, canVerifyCnic: e.target.checked },
                      })}
                      className="rounded accent-rose-600"
                    />
                    <span>Verify National ID / CNIC</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgentForm.permissions.canVerifyLicense}
                      onChange={(e) => setNewAgentForm({
                        ...newAgentForm,
                        permissions: { ...newAgentForm.permissions, canVerifyLicense: e.target.checked },
                      })}
                      className="rounded accent-rose-600"
                    />
                    <span>Verify Driving Licenses</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgentForm.permissions.canCreateListerManual}
                      onChange={(e) => setNewAgentForm({
                        ...newAgentForm,
                        permissions: { ...newAgentForm.permissions, canCreateListerManual: e.target.checked },
                      })}
                      className="rounded accent-rose-600"
                    />
                    <span>Manual Lister Registration</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgentForm.permissions.canEditLister}
                      onChange={(e) => setNewAgentForm({
                        ...newAgentForm,
                        permissions: { ...newAgentForm.permissions, canEditLister: e.target.checked },
                      })}
                      className="rounded accent-rose-600"
                    />
                    <span>Edit Lister Fleet Listings</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgentForm.permissions.canApproveSubscription}
                      onChange={(e) => setNewAgentForm({
                        ...newAgentForm,
                        permissions: { ...newAgentForm.permissions, canApproveSubscription: e.target.checked },
                      })}
                      className="rounded accent-rose-600"
                    />
                    <span>Approve Subscription Proof</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgentForm.permissions.canDeleteListings}
                      onChange={(e) => setNewAgentForm({
                        ...newAgentForm,
                        permissions: { ...newAgentForm.permissions, canDeleteListings: e.target.checked },
                      })}
                      className="rounded accent-rose-600"
                    />
                    <span>Delete Fraud Listings</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateAgentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create & Activate Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ENTERPRISE HIERARCHICAL PERMISSION EDITOR (SHOPIFY-GRADE)        */}
      {/* ========================================================================= */}
      {editingAgent && (
        <AgentPermissionEditor
          initialPermissions={getAgentPermissionsList(editingAgent.permissions)}
          agentName={editingAgent.name}
          onSave={handleSaveAgentPermissionsFromEditor}
          onCancel={() => setEditingAgent(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: INSPECT PAYMENT PROOF SLIP (STEALTH AUDIT)                       */}
      {/* ========================================================================= */}
      {viewingProofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden"
          onClick={() => setViewingProofModal(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 text-xs space-y-4 text-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-white">Payment Proof Voucher Audit</h4>
                <p className="text-[11px] text-slate-400">
                  Transaction: <strong className="font-mono text-cyan-300">{viewingProofModal.trnRef}</strong>
                </p>
              </div>
              <button onClick={() => setViewingProofModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 max-h-64 flex items-center justify-center">
                <img
                  src={viewingProofModal.paymentProofUrl}
                  alt="Payment Voucher Slip"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Submitted By Agent:</span>
                  <strong className="text-white">{viewingProofModal.agentName} ({viewingProofModal.staffId})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <strong className="text-white">{viewingProofModal.paymentMethod}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fee Amount Reported:</span>
                  <strong className={viewingProofModal.isSuspicious ? 'text-rose-400 font-black' : 'text-emerald-400 font-black'}>
                    PKR {formatPKR(viewingProofModal.feeReported)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scheduled Tariff:</span>
                  <strong className="text-slate-300 font-black">PKR {formatPKR(viewingProofModal.officialTariff)}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewingProofModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUALLY REGISTER & ACTIVATE VENDOR SUBSCRIPTION                 */}
      {/* ========================================================================= */}
      {showManualVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  <span>Manually Register & Activate Vendor Portal</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Direct Super Admin onboarding: Creates vendor login credentials, assigns listing quota, and records payment into the platform ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualVendorModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  1. Select Vendor Category / Partner Role *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectMvRole('LISTER')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition ${
                      mvRole === 'LISTER'
                        ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    🚗 Car Rental Fleet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMvRole('DRIVER')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition ${
                      mvRole === 'DRIVER'
                        ? 'border-blue-500 bg-blue-950 text-blue-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    👨‍✈️ Chauffeur Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMvRole('PROVIDER');
                      setMvProviderSubtype('COMMERCIAL_CARGO');
                      setMvPlanId('p-prov1');
                      setMvPlanName('Cargo & Shifting Mover Pass');
                      setMvQuota(5);
                      setMvAmountPaid(5500);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition ${
                      mvRole === 'PROVIDER' && mvProviderSubtype === 'COMMERCIAL_CARGO'
                        ? 'border-orange-500 bg-orange-950 text-orange-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    📦 Cargo & Movers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMvRole('PROVIDER');
                      setMvProviderSubtype('PICK_AND_DROP');
                      setMvPlanId('p-prov2');
                      setMvPlanName('Commuter Route Shuttle Pass');
                      setMvQuota(5);
                      setMvAmountPaid(4800);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition ${
                      mvRole === 'PROVIDER' && mvProviderSubtype === 'PICK_AND_DROP'
                        ? 'border-teal-500 bg-teal-950 text-teal-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    🚌 Commuter Shuttles
                  </button>
                </div>
              </div>

              {/* Personal & Business Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 font-semibold">
                  <span>Vendor Full Name *</span>
                  <input
                    type="text"
                    value={mvName}
                    onChange={(e) => setMvName(e.target.value)}
                    placeholder="e.g. Asad Mehmood"
                    className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="flex flex-col gap-1 font-semibold">
                  <span>Business / Company Name</span>
                  <input
                    type="text"
                    value={mvBusinessName}
                    onChange={(e) => setMvBusinessName(e.target.value)}
                    placeholder="e.g. Mehmood Rent a Car"
                    className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="flex flex-col gap-1 font-semibold">
                  <span>WhatsApp Phone Number (Login ID) *</span>
                  <input
                    type="tel"
                    value={mvPhone}
                    onChange={(e) => setMvPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="flex flex-col gap-1 font-semibold">
                  <span>City *</span>
                  <select
                    value={mvCity}
                    onChange={(e) => setMvCity(e.target.value)}
                    className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                  </select>
                </label>
              </div>

              {/* Login Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <label className="flex flex-col gap-1 font-semibold">
                  <span>Login Password *</span>
                  <input
                    type="text"
                    value={mvPassword}
                    onChange={(e) => setMvPassword(e.target.value)}
                    className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setMvPassword(`Safar@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="h-10 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Generate Password</span>
                </button>
              </div>

              {/* Subscription Plan & Payment Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                  2. Subscription Plan & Financial Collection
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 font-semibold">
                    <span>Subscription Plan</span>
                    <select
                      value={mvPlanId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setMvPlanId(pid);
                        if (pid === 'p-1') {
                          setMvPlanName('Starter Fleet Pass');
                          setMvQuota(2);
                          setMvAmountPaid(3500);
                        } else if (pid === 'p-2') {
                          setMvPlanName('Professional Fleet Hub');
                          setMvQuota(15);
                          setMvAmountPaid(12000);
                        } else if (pid === 'p-3') {
                          setMvPlanName('Enterprise Corporate Fleet');
                          setMvQuota(50);
                          setMvAmountPaid(30000);
                        } else if (pid === 'p-drv1') {
                          setMvPlanName('Independent Chauffeur Pass');
                          setMvQuota(1);
                          setMvAmountPaid(2000);
                        } else if (pid === 'p-drv2') {
                          setMvPlanName('VIP Executive Chauffeur Pass');
                          setMvQuota(1);
                          setMvAmountPaid(3000);
                        } else if (pid === 'p-prov1') {
                          setMvPlanName('Cargo & Shifting Mover Pass');
                          setMvQuota(5);
                          setMvAmountPaid(5500);
                        } else if (pid === 'p-prov2') {
                          setMvPlanName('Commuter Route Shuttle Pass');
                          setMvQuota(5);
                          setMvAmountPaid(4800);
                        } else {
                          setMvPlanName('Enterprise Transport Operator');
                          setMvQuota(25);
                          setMvAmountPaid(18000);
                        }
                      }}
                      className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none cursor-pointer"
                    >
                      <optgroup label="Car Rental Plans">
                        <option value="p-1">Starter Fleet Pass (Rs. 3,500 · 2 Cars)</option>
                        <option value="p-2">Professional Fleet Hub (Rs. 12,000 · 15 Cars)</option>
                        <option value="p-3">Enterprise Corporate Fleet (Rs. 30,000 · 50 Cars)</option>
                      </optgroup>
                      <optgroup label="Driver & Chauffeur Plans">
                        <option value="p-drv1">Independent Chauffeur Pass (Rs. 2,000 · 1 Profile)</option>
                        <option value="p-drv2">VIP Executive Chauffeur Pass (Rs. 3,000 · Top Ranking)</option>
                      </optgroup>
                      <optgroup label="Transport & Provider Passes">
                        <option value="p-prov1">Cargo & Shifting Mover Pass (Rs. 5,500 · 5 Trucks)</option>
                        <option value="p-prov2">Commuter Route Shuttle Pass (Rs. 4,800 · 5 Routes)</option>
                        <option value="p-prov3">Enterprise Transport Operator (Rs. 18,000 · 25 Units)</option>
                      </optgroup>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 font-semibold">
                    <span>Amount Collected (PKR) *</span>
                    <input
                      type="number"
                      value={mvAmountPaid}
                      onChange={(e) => setMvAmountPaid(Number(e.target.value))}
                      className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold text-sm outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1 font-semibold">
                    <span>Payment Mode *</span>
                    <select
                      value={mvPaymentMode}
                      onChange={(e) => setMvPaymentMode(e.target.value)}
                      className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none cursor-pointer"
                    >
                      <option value="Cash (Office)">Cash Handover (Office)</option>
                      <option value="Bank Transfer / Raast">Bank Transfer / Raast</option>
                      <option value="JazzCash / Easypaisa">JazzCash / Easypaisa</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 font-semibold">
                    <span>Payment Reference / Receipt ID</span>
                    <input
                      type="text"
                      value={mvPaymentRef}
                      onChange={(e) => setMvPaymentRef(e.target.value)}
                      placeholder="e.g. CASH-OFFICE-801 or TRX-829104"
                      className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowManualVendorModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateManualVendor}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black transition cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Create Account & Activate Subscription</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATED VENDOR CREDENTIALS SLIP & WHATSAPP SHARE                 */}
      {/* ========================================================================= */}
      {createdVendorSlip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center mx-auto text-2xl font-black">
                ✓
              </div>
              <h3 className="text-xl font-black text-white">
                Vendor Portal & Subscription Live!
              </h3>
              <p className="text-slate-400 text-xs">
                Account created successfully. Payment of <strong className="text-emerald-400 font-mono">PKR {formatPKR(createdVendorSlip.payment.amountPaid)}</strong> recorded into financial ledger.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Vendor Name:</span>
                <strong className="text-white font-sans">{createdVendorSlip.user.name}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Login Phone / User:</span>
                <strong className="text-emerald-400">{createdVendorSlip.user.phone}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Password:</span>
                <strong className="text-amber-400">{createdVendorSlip.passwordText}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Role / Category:</span>
                <strong className="text-white font-sans">{createdVendorSlip.user.role}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Subscription Plan:</span>
                <strong className="text-white font-sans">{createdVendorSlip.payment.planName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400 font-sans">Payment Mode:</span>
                <span className="text-slate-300 font-sans">{createdVendorSlip.payment.paymentMode}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400 font-sans">Portal URL:</span>
                <span className="text-blue-400 underline font-sans">http://localhost:3000/login</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const txt = `Salam ${createdVendorSlip.user.name}!\nAap ka SafarPK Partner Portal account create aur subscription activate ho chuki hai.\n\n🌐 Portal Login: http://localhost:3000/login\n📱 Login Phone: ${createdVendorSlip.user.phone}\n🔑 Password: ${createdVendorSlip.passwordText}\n📦 Package: ${createdVendorSlip.payment.planName} (ACTIVE)\n💰 Amount Received: PKR ${formatPKR(createdVendorSlip.payment.amountPaid)}\nReceipt Ref: ${createdVendorSlip.payment.paymentRef}\n\nAb aap foran login kar ke apni listings publish kar sakty hain!`;
                  navigator.clipboard.writeText(txt);
                  alert('✓ Login credentials copied to clipboard!');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy Credentials Slip</span>
              </button>

              <a
                href={`https://wa.me/${createdVendorSlip.user.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Salam ${createdVendorSlip.user.name}!\nAap ka SafarPK Partner Portal account create aur subscription activate ho chuki hai.\n\n🌐 Portal Login: http://localhost:3000/login\n📱 Login Phone: ${createdVendorSlip.user.phone}\n🔑 Password: ${createdVendorSlip.passwordText}\n📦 Package: ${createdVendorSlip.payment.planName} (ACTIVE)\n💰 Amount Received: PKR ${formatPKR(createdVendorSlip.payment.amountPaid)}\nReceipt Ref: ${createdVendorSlip.payment.paymentRef}\n\nAb aap foran login kar ke apni listings publish kar sakty hain!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Send on WhatsApp</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreatedVendorSlip(null);
                setShowManualVendorModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Done & Return to Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
