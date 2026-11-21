'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bus,
  Truck,
  Users,
  Navigation,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  DollarSign,
  PlusCircle,
  MessageCircle,
  FileText,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Calculator,
  Layers,
  Settings,
  HelpCircle,
  Edit3,
  X,
  Sparkles,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Send,
  Phone,
  BarChart2,
  Receipt,
} from 'lucide-react';
import { AnalyticsReportHub } from '@/components/AnalyticsReportHub';
import { API_BASE, formatPKR, maskPhone } from '@/lib/api';
import { SubscriptionPricingSection } from '@/components/SubscriptionPricingSection';
import { BillingHistoryManager } from '@/components/BillingHistoryManager';
import {
  getActiveUser,
  setActiveUser,
  getAllRegisteredUsers,
  RegisteredUser,
  logoutActiveUser,
  getApprovedServicesForUser,
  isServiceApprovedForUser,
  getUserDashboardPath,
  SafarServiceType,
  syncSubscriptionExpiries,
} from '@/data/userAuth';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';
import { DashboardStoreWidget } from '@/components/DashboardStoreWidget';
import {
  getUserConversations,
  getConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  ChatConversation,
  ChatMessage,
  formatMessageTime,
  getWhatsAppTargetUrl,
  generateOwnerFollowUpWhatsAppText,
} from '@/data/chatEngine';
import { CITY_COMMUTE_AREAS } from '@/data/marketplaceData';

const DEFAULT_ALMAKKA_FLEET = [
  {
    id: 'cf-1',
    model: 'Hyundai Shehzore D-100 Shifting Truck',
    type: 'CARGO_MOVING',
    reg: 'LHR-SH-202',
    capacityTons: 2.5,
    capacityCubicFt: '350 cu. ft',
    baseFare: 4500,
    kmRate: 120,
    helperRate: 1000,
    driverName: 'Aslam Khan',
    baseCity: 'Rawalpindi',
    status: 'READY_FOR_DISPATCH',
  },
  {
    id: 'cf-2',
    model: 'Suzuki Ravi Pickup 800cc',
    type: 'CARGO_MOVING',
    reg: 'LHR-RV-99',
    capacityTons: 0.8,
    capacityCubicFt: '120 cu. ft',
    baseFare: 2500,
    kmRate: 90,
    helperRate: 800,
    driverName: 'Muhammad Imran',
    baseCity: 'Rawalpindi',
    status: 'READY_FOR_DISPATCH',
  },
  {
    id: 'cf-3',
    model: 'Mazda Titan 14-ft Cargo Truck',
    type: 'CARGO_MOVING',
    reg: 'LEA-MZD-410',
    capacityTons: 5.0,
    capacityCubicFt: '750 cu. ft',
    baseFare: 7500,
    kmRate: 160,
    helperRate: 1200,
    driverName: 'Unassigned',
    baseCity: 'Rawalpindi',
    status: 'IN_DEPOT',
  },
];

const DEFAULT_ALMAKKA_DRIVERS = [
  {
    id: 'drv-team-1',
    name: 'Aslam Khan',
    phone: '+92 302 8819204',
    cnic: '35202-9981240-1',
    licenseCategory: 'HTV Heavy Transport',
    assignedTruck: 'Hyundai Shehzore D-100 (LHR-SH-202)',
    status: 'AVAILABLE',
  },
  {
    id: 'drv-team-2',
    name: 'Muhammad Imran',
    phone: '+92 312 4491029',
    cnic: '35201-7712049-3',
    licenseCategory: 'LTV / HTV',
    assignedTruck: 'Suzuki Ravi Cargo (LHR-RV-99)',
    status: 'AVAILABLE',
  },
];

const DEFAULT_ALMAKKA_QUOTES = [
  {
    id: 'q-101',
    customerName: 'Dr. Usman Farooq',
    customerPhone: '+92 333 4910291',
    shiftingType: '3 BHK Full House Shifting',
    fromAddress: 'House 42, Sector G-11/2, Islamabad',
    toAddress: 'Apartment 402, Bahria Town Phase 7, Rawalpindi',
    distanceKm: 28,
    truckRequired: 'Hyundai Shehzore (2.5 Ton)',
    helpersNeeded: 3,
    floorCount: 2,
    date: '2026-11-16',
    quotedAmount: 11400,
    estimatedTotal: 11400,
    assignedDriver: 'Aslam Khan',
    status: 'CONFIRMED',
  },
  {
    id: 'q-102',
    customerName: 'Saima Waqas',
    customerPhone: '+92 300 8192041',
    shiftingType: 'Office Furniture & Relocation',
    fromAddress: 'Gulberg III, Main Boulevard, Lahore',
    toAddress: 'DHA Phase 6, Raya Fairways, Lahore',
    distanceKm: 18,
    truckRequired: 'Mazda Titan (5.0 Ton)',
    helpersNeeded: 4,
    floorCount: 1,
    date: '2026-11-18',
    quotedAmount: 14500,
    estimatedTotal: 14500,
    assignedDriver: 'Muhammad Imran',
    status: 'PENDING_APPROVAL',
  },
];

const DEFAULT_SUBHAN_FLEET = [
  {
    id: 'cf-4',
    model: 'Toyota HiAce Grand Cabin (14 Seats)',
    type: 'PASSENGER_SHUTTLE',
    reg: 'LEA-24-9988',
    capacityTons: null,
    capacityCubicFt: '14 Passengers',
    baseFare: 3500,
    kmRate: 100,
    helperRate: 500,
    driverName: 'Tariq Mahmood',
    baseCity: 'Lahore',
    status: 'ON_DAILY_ROUTE',
  },
  {
    id: 'cf-5',
    model: 'Toyota Coaster Executive (22 Seats)',
    type: 'PASSENGER_SHUTTLE',
    reg: 'ISB-CS-202',
    capacityTons: null,
    capacityCubicFt: '22 Passengers',
    baseFare: 6000,
    kmRate: 140,
    helperRate: 600,
    driverName: 'Nadeem Akhtar',
    baseCity: 'Islamabad',
    status: 'ON_DAILY_ROUTE',
  },
];

const DEFAULT_SUBHAN_DRIVERS = [
  {
    id: 'drv-team-3',
    name: 'Tariq Mahmood',
    phone: '+92 301 9821045',
    cnic: '35201-4412098-5',
    licenseCategory: 'PSV / HTV',
    assignedTruck: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
    status: 'ON_DUTY',
  },
  {
    id: 'drv-team-4',
    name: 'Nadeem Akhtar',
    phone: '+92 333 5510291',
    cnic: '35202-1102948-7',
    licenseCategory: 'PSV Coaster Special',
    assignedTruck: 'Toyota Coaster Executive (ISB-CS-202)',
    status: 'ON_ROUTE',
  },
];

const DEFAULT_SUBHAN_ROUTES = [
  {
    id: 'rt-1',
    title: 'Johar Town ➔ Gulberg Main Blvd / Mall Road',
    type: 'PICK_AND_DROP',
    city: 'Lahore',
    vehicle: 'Toyota HiAce Grand Cabin (LEA-24-9988)',
    assignedDriver: 'Tariq Mahmood',
    driverPhone: '+92 301 9821045',
    timings: '07:20 AM – 05:30 PM',
    capacity: 14,
    filledSeats: 11,
    availableSeats: 3,
    monthlySeatRate: 8500,
    dailySeatRate: 500,
    category: 'Corporate & Office Executives',
    acStatus: 'Chilled Dual AC',
    stops: [
      { stop: 'Johar Town G-1 Market', time: '07:20 AM' },
      { stop: 'Doctor Hospital Canal', time: '07:40 AM' },
      { stop: 'Muslim Town Flyover', time: '08:00 AM' },
      { stop: 'Gulberg Main Boulevard', time: '08:20 AM' },
      { stop: 'Mall Road / Charing Cross', time: '08:35 AM' },
    ],
    status: 'ACTIVE',
  },
  {
    id: 'rt-2',
    title: 'Rawalpindi Saddar ➔ Islamabad Blue Area / F-8',
    type: 'PICK_AND_DROP',
    city: 'Islamabad',
    vehicle: 'Toyota Coaster Executive (ISB-CS-202)',
    assignedDriver: 'Nadeem Akhtar',
    driverPhone: '+92 333 5510291',
    timings: '07:15 AM – 05:00 PM',
    capacity: 22,
    filledSeats: 16,
    availableSeats: 6,
    monthlySeatRate: 9500,
    dailySeatRate: 500,
    category: 'Office Staff & Executives',
    acStatus: 'Chilled Dual AC',
    stops: [
      { stop: 'Saddar Metro Station', time: '07:15 AM' },
      { stop: 'Chandni Chowk Murree Rd', time: '07:30 AM' },
      { stop: 'Faizabad Interchange', time: '07:45 AM' },
      { stop: 'Zero Point Islamabad', time: '08:00 AM' },
      { stop: 'Blue Area (Stock Exchange)', time: '08:15 AM' },
      { stop: 'F-8 Markaz Courts', time: '08:30 AM' },
    ],
    status: 'ACTIVE',
  },
];

const VEHICLE_PRESETS = [
  // Cargo & Moving Presets
  {
    id: 'p-shehzore',
    label: 'Shehzore (2.5T)',
    model: 'Hyundai Shehzore D-100 (2.5 Ton)',
    type: 'CARGO_MOVING',
    icon: '🚚',
    tons: 2.5,
    vol: '350 cu. ft',
    seats: 3,
    base: 4500,
    km: 120,
    helper: 1000,
  },
  {
    id: 'p-ravi',
    label: 'Ravi Pickup (0.8T)',
    model: 'Suzuki Ravi Pickup 800cc',
    type: 'CARGO_MOVING',
    icon: '🛻',
    tons: 0.8,
    vol: '120 cu. ft',
    seats: 2,
    base: 2500,
    km: 90,
    helper: 800,
  },
  {
    id: 'p-mazda',
    label: 'Mazda Titan (5.0T)',
    model: 'Mazda Titan 14-ft Cargo Truck',
    type: 'CARGO_MOVING',
    icon: '🚛',
    tons: 5.0,
    vol: '750 cu. ft',
    seats: 3,
    base: 7500,
    km: 160,
    helper: 1200,
  },
  {
    id: 'p-flatbed',
    label: 'Master Flatbed (7.0T)',
    model: 'Master / Isuzu Flatbed Hauler',
    type: 'CARGO_MOVING',
    icon: '🏗️',
    tons: 7.0,
    vol: 'Open Flatbed 18ft',
    seats: 3,
    base: 9500,
    km: 180,
    helper: 1500,
  },

  // Commuter Shuttle Presets
  {
    id: 'p-hiace',
    label: 'HiAce Van (14 Seats)',
    model: 'Toyota HiAce Grand Cabin (14 Seats)',
    type: 'PASSENGER_SHUTTLE',
    icon: '🚐',
    tons: 0,
    vol: '14 Passengers',
    seats: 14,
    base: 3500,
    km: 100,
    helper: 500,
  },
  {
    id: 'p-coaster',
    label: 'Coaster (22 Seats)',
    model: 'Toyota Coaster Executive (22 Seats)',
    type: 'PASSENGER_SHUTTLE',
    icon: '🚌',
    tons: 0,
    vol: '22 Passengers',
    seats: 22,
    base: 6000,
    km: 140,
    helper: 600,
  },
  {
    id: 'p-apv',
    label: 'Suzuki APV (7 Seats)',
    model: 'Suzuki APV GLX Dual AC (7 Seats)',
    type: 'PASSENGER_SHUTTLE',
    icon: '🚐',
    tons: 0,
    vol: '7 Passengers',
    seats: 7,
    base: 2800,
    km: 85,
    helper: 400,
  },
];

export default function ServiceProviderDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'pricing' | 'team' | 'fleet' | 'routes' | 'quotes' | 'chats' | 'subscription'
  >('overview');

  // Active Authenticated Provider
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  // Provider In-App Customer Chats State
  const [providerConversations, setProviderConversations] = useState<ChatConversation[]>([]);
  const [activeProviderChatId, setActiveProviderChatId] = useState<string>('');
  const [providerChatMessages, setProviderChatMessages] = useState<ChatMessage[]>([]);
  const [providerChatInput, setProviderChatInput] = useState<string>('');
  const [providerChatMobileView, setProviderChatMobileView] = useState<'LIST' | 'CONV'>('LIST');

  // Provider Mode: Distinguish Pick & Drop Shuttles vs Commercial Cargo/Shifting
  const [providerMode, setProviderMode] = useState<'ALL' | 'PICK_AND_DROP' | 'COMMERCIAL_CARGO'>('ALL');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'pick_and_drop') {
        setProviderMode('PICK_AND_DROP');
        setActiveTab('routes');
      } else if (mode === 'commercial_cargo') {
        setProviderMode('COMMERCIAL_CARGO');
        setActiveTab('pricing');
      }
      const tab = params.get('tab');
      if (tab && ['overview', 'pricing', 'team', 'fleet', 'routes', 'quotes', 'chats', 'subscription'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Commercial Provider Business State
  const [companyName, setCompanyName] = useState('Pak Movers & Al-Makkah Logistics');
  const [managerName, setManagerName] = useState('Haji Abdul Rasheed');
  const [contactPhone, setContactPhone] = useState('+92 321 4409124');
  const [cityBase, setCityBase] = useState('Lahore');

  const [isCustomerBlocked, setIsCustomerBlocked] = React.useState(false);

  const approvedServices = React.useMemo(() => {
    return currentUser ? getApprovedServicesForUser(currentUser) : ['PICK_AND_DROP', 'HOME_SHIFTING'];
  }, [currentUser]);

  const hasPickAndDrop = approvedServices.includes('PICK_AND_DROP');
  const hasHomeShifting = approvedServices.includes('HOME_SHIFTING');

  // Sync with logged-in user profile & enforce Provider role guard
  React.useEffect(() => {
    syncSubscriptionExpiries();
    const user = getActiveUser();
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/provider');
      }
      return;
    }

    if (user.role !== 'PROVIDER') {
      if (typeof window !== 'undefined') {
        window.location.replace(getUserDashboardPath(user));
      }
      return;
    }

    if (user && user.role === 'PROVIDER') {
      setCurrentUser(user);
      if (user.businessName) setCompanyName(user.businessName);
      if (user.name) setManagerName(user.name);
      if (user.phone) setContactPhone(user.phone);
      if (user.city) {
        setCityBase(user.city);
        setServiceCoverageCities((prev) => (prev.includes(user.city) ? prev : [user.city, ...prev]));
      }
      const services = getApprovedServicesForUser(user);
      if (services.includes('PICK_AND_DROP') && !services.includes('HOME_SHIFTING')) {
        setProviderMode('PICK_AND_DROP');
        setActiveTab((prev) => (prev === 'pricing' || prev === 'quotes' ? 'routes' : prev));
      } else if (services.includes('HOME_SHIFTING') && !services.includes('PICK_AND_DROP')) {
        setProviderMode('COMMERCIAL_CARGO');
        setActiveTab((prev) => (prev === 'routes' ? 'pricing' : prev));
      } else if (user.providerSubtype) {
        setProviderMode(user.providerSubtype);
      }

      // Dynamic Per-Account Isolation & Storage Sync
      const userKey = user?.id || (user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest_provider');
      const isShuttleOnly = user.email === 'subhan.shuttles@safarpk.com' || (services.includes('PICK_AND_DROP') && !services.includes('HOME_SHIFTING'));

      // 1. Fleet
      try {
        const savedFleet = localStorage.getItem(`safarpk_provider_fleet_${userKey}`);
        if (savedFleet) {
          let parsed = JSON.parse(savedFleet);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (isShuttleOnly) {
              parsed = parsed.map((v: any) => ({
                ...v,
                type: 'PASSENGER_SHUTTLE',
                capacityCubicFt: v.capacityCubicFt && (v.capacityCubicFt.includes('cu. ft') || v.capacityCubicFt.includes('Tons'))
                  ? '14 Passengers'
                  : (v.capacityCubicFt || '14 Passengers'),
              }));
            }
            setCommercialFleet(parsed);
            setSelectedCalcVehicleId(parsed[0].id);
          }
        } else {
          const initFleet = isShuttleOnly ? DEFAULT_SUBHAN_FLEET : DEFAULT_ALMAKKA_FLEET;
          setCommercialFleet(initFleet);
          setSelectedCalcVehicleId(initFleet[0].id);
          localStorage.setItem(`safarpk_provider_fleet_${userKey}`, JSON.stringify(initFleet));
        }
      } catch {}

      // 2. Drivers
      try {
        const savedDrivers = localStorage.getItem(`safarpk_provider_drivers_${userKey}`);
        if (savedDrivers) {
          const parsed = JSON.parse(savedDrivers);
          if (Array.isArray(parsed) && parsed.length > 0) setDriverTeam(parsed);
        } else {
          const initDrivers = isShuttleOnly ? DEFAULT_SUBHAN_DRIVERS : DEFAULT_ALMAKKA_DRIVERS;
          setDriverTeam(initDrivers);
          localStorage.setItem(`safarpk_provider_drivers_${userKey}`, JSON.stringify(initDrivers));
        }
      } catch {}

      // 3. Quotes
      try {
        const savedQuotes = localStorage.getItem(`safarpk_provider_quotes_${userKey}`);
        if (savedQuotes) {
          const parsed = JSON.parse(savedQuotes);
          if (Array.isArray(parsed)) setQuoteRequests(parsed);
        } else {
          const initQuotes = isShuttleOnly ? [] : DEFAULT_ALMAKKA_QUOTES;
          setQuoteRequests(initQuotes);
          localStorage.setItem(`safarpk_provider_quotes_${userKey}`, JSON.stringify(initQuotes));
        }
      } catch {}

      // 4. Routes
      try {
        const savedRoutes = localStorage.getItem(`safarpk_provider_routes_${userKey}`);
        if (savedRoutes) {
          const parsed = JSON.parse(savedRoutes);
          if (Array.isArray(parsed)) setRoutes(parsed);
        } else {
          const initRoutes = isShuttleOnly ? DEFAULT_SUBHAN_ROUTES : [];
          setRoutes(initRoutes);
          localStorage.setItem(`safarpk_provider_routes_${userKey}`, JSON.stringify(initRoutes));
        }
      } catch {}
    }
  }, []);

  // Sync Provider In-App Chats
  React.useEffect(() => {
    const activeProvider = currentUser || {
      id: 'usr-demo-provider',
      name: managerName || 'Haji Abdul Rasheed',
      businessName: companyName || 'Pak Movers & Al-Makkah Logistics',
      role: 'PROVIDER' as any,
      city: cityBase || 'Lahore',
      phone: contactPhone || '+92 321 4409124',
      countryCode: 'PK',
      registeredAt: new Date().toISOString(),
      subscription: { status: 'ACTIVE', quota: 10, usedQuota: 2 },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: 'Now' },
      activities: [],
    };
    const convs = getUserConversations(activeProvider as any);
    setProviderConversations(convs);
    if (convs.length > 0 && !activeProviderChatId) {
      setActiveProviderChatId(convs[0].id);
    }
  }, [currentUser, companyName, contactPhone]);

  React.useEffect(() => {
    if (!activeProviderChatId) return;
    const providerId = currentUser?.id || 'usr-demo-provider';
    markConversationAsRead(activeProviderChatId, providerId);
    setProviderChatMessages(getConversationMessages(activeProviderChatId));
    const activeProvider = currentUser || {
      id: 'usr-demo-provider',
      name: managerName,
      role: 'PROVIDER' as any,
      phone: contactPhone,
      city: cityBase,
    };
    setProviderConversations(getUserConversations(activeProvider as any));
  }, [activeProviderChatId]);

  React.useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const activeProvider = currentUser || {
        id: 'usr-demo-provider',
        name: managerName,
        role: 'PROVIDER' as any,
        phone: contactPhone,
        city: cityBase,
      };
      const convs = getUserConversations(activeProvider as any);
      setProviderConversations(convs);
      if (activeProviderChatId && e.detail?.conversationId === activeProviderChatId) {
        setProviderChatMessages(getConversationMessages(activeProviderChatId));
      }
    };
    window.addEventListener('safarpk_chat_updated', handleChatUpdate);
    window.addEventListener('storage', handleChatUpdate);
    return () => {
      window.removeEventListener('safarpk_chat_updated', handleChatUpdate);
      window.removeEventListener('storage', handleChatUpdate);
    };
  }, [activeProviderChatId, currentUser]);

  const handleSendProviderMessage = () => {
    if (!providerChatInput.trim() || !activeProviderChatId) return;
    const activeProvider = currentUser || {
      id: 'usr-demo-provider',
      name: managerName || 'Haji Abdul Rasheed',
      businessName: companyName || 'Pak Movers & Al-Makkah Logistics',
      role: 'PROVIDER' as any,
      city: cityBase || 'Lahore',
      phone: contactPhone || '+92 321 4409124',
      countryCode: 'PK',
      registeredAt: new Date().toISOString(),
      subscription: { status: 'ACTIVE', quota: 10, usedQuota: 2 },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: 'Now' },
      activities: [],
    };

    const activeConv = providerConversations.find((c) => c.id === activeProviderChatId);
    if (!activeConv) return;

    const partnerId =
      activeConv.participantIds.find((id) => id !== activeProvider.id) || 'usr-demo-customer';
    const partnerName = activeConv.participantNames[partnerId] || 'Customer Booker';

    sendChatMessage({
      conversationId: activeProviderChatId,
      senderUser: activeProvider as any,
      receiverId: partnerId,
      receiverName: partnerName,
      text: providerChatInput.trim(),
      ref: activeConv.bookingRef,
      itemDetails: activeConv.about,
    });

    setProviderChatInput('');
    setProviderChatMessages(getConversationMessages(activeProviderChatId));
  };

  const unreadProviderChatsCount = providerConversations.reduce((acc, c) => {
    const providerId = currentUser?.id || 'usr-demo-provider';
    return acc + (c.unreadCountFor?.[providerId] || 0);
  }, 0);
  const [availableCoverageCities, setAvailableCoverageCities] = useState<string[]>([
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Karachi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Gujranwala',
  ]);
  const [serviceCoverageCities, setServiceCoverageCities] = useState<string[]>([
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Karachi',
    'Faisalabad',
  ]);
  const [customCityInput, setCustomCityInput] = useState('');
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);

  const handleAddCustomCity = () => {
    const trimmed = customCityInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!availableCoverageCities.includes(formatted)) {
      setAvailableCoverageCities([...availableCoverageCities, formatted]);
    }
    if (!serviceCoverageCities.includes(formatted)) {
      setServiceCoverageCities([...serviceCoverageCities, formatted]);
    }
    setCustomCityInput('');
    setShowCustomCityInput(false);
  };

  // Pricing Model State
  const [rates, setRates] = useState({
    ratePerKmLocal: 120, // Intra-city
    ratePerKmIntercity: 180, // Inter-city (e.g. M-2 Motorway)
    ratePerMazdoor: 1000, // Per helper for loading & unloading
    floorSurchargePerFloor: 500, // Per floor if no elevator
    includedBaseKm: 5,
  });
  const [ratesSavedNotice, setRatesSavedNotice] = useState<string | null>(null);

  // Dynamic Fleet, Drivers, Quotes & Routes States (Initialized with Defaults)
  const [commercialFleet, setCommercialFleet] = useState<any[]>(DEFAULT_ALMAKKA_FLEET);
  const [driverTeam, setDriverTeam] = useState<any[]>(DEFAULT_ALMAKKA_DRIVERS);
  const [quoteRequests, setQuoteRequests] = useState<any[]>(DEFAULT_ALMAKKA_QUOTES);
  const [routes, setRoutes] = useState<any[]>(DEFAULT_SUBHAN_ROUTES);

  // Storage Persistence Helpers for Account-Level Isolation
  const getUserKey = () => {
    return currentUser?.id || (currentUser?.email ? currentUser.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest_provider');
  };

  const updateAndSaveFleet = (newFleet: any[]) => {
    setCommercialFleet(newFleet);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`safarpk_provider_fleet_${getUserKey()}`, JSON.stringify(newFleet));
    }
  };

  const updateAndSaveDrivers = (newDrivers: any[]) => {
    setDriverTeam(newDrivers);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`safarpk_provider_drivers_${getUserKey()}`, JSON.stringify(newDrivers));
    }
  };

  const updateAndSaveQuotes = (newQuotes: any[]) => {
    setQuoteRequests(newQuotes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`safarpk_provider_quotes_${getUserKey()}`, JSON.stringify(newQuotes));
    }
  };

  const updateAndSaveRoutes = (newRoutes: any[]) => {
    setRoutes(newRoutes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`safarpk_provider_routes_${getUserKey()}`, JSON.stringify(newRoutes));
    }
  };

  // Inline Vehicle Rate Updater
  const handleUpdateVehicleRate = (vehicleId: string, field: 'baseFare' | 'kmRate' | 'helperRate', val: number) => {
    const updated = commercialFleet.map((v) => (v.id === vehicleId ? { ...v, [field]: val } : v));
    updateAndSaveFleet(updated);
    setRatesSavedNotice(`✅ Updated rate for ${commercialFleet.find((v) => v.id === vehicleId)?.model || 'vehicle'}!`);
    setTimeout(() => setRatesSavedNotice(null), 3000);
  };

  // Interactive Live Shifting Quote Calculator State (Dynamic per Listed Vehicle)
  const [selectedCalcVehicleId, setSelectedCalcVehicleId] = useState<string>('cf-1');
  const [calcDistanceKm, setCalcDistanceKm] = useState<number>(25);
  const [calcMazdoorCount, setCalcMazdoorCount] = useState<number>(3);
  const [calcFloorCount, setCalcFloorCount] = useState<number>(2);
  const [calcIsIntercity, setCalcIsIntercity] = useState<boolean>(false);

  // Compute Live Quote dynamically based on selected listed vehicle
  const computeQuote = () => {
    const activeVeh =
      commercialFleet.find((v) => v.id === selectedCalcVehicleId) || commercialFleet[0];
    const base = Number(activeVeh?.baseFare) || 3500;
    const extraKm = Math.max(calcDistanceKm - rates.includedBaseKm, 0);
    const standardKmRate = Number(activeVeh?.kmRate) || rates.ratePerKmLocal;
    const kmRate = calcIsIntercity ? Math.round(standardKmRate * 1.5) : standardKmRate;
    const kmCost = extraKm * kmRate;
    const helperUnitRate = Number(activeVeh?.helperRate) || rates.ratePerMazdoor;
    const mazdoorCost = calcMazdoorCount * helperUnitRate;
    const floorCost = calcFloorCount * rates.floorSurchargePerFloor;
    const total = base + kmCost + mazdoorCost + floorCost;

    return {
      activeVeh,
      base,
      extraKm,
      kmRate,
      kmCost,
      helperUnitRate,
      mazdoorCost,
      floorCost,
      total,
    };
  };
  const liveCalc = computeQuote();

  // New Driver Form State
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverCnic, setNewDriverCnic] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState<'LTV' | 'HTV' | 'PSV'>('HTV');
  const [newDriverAssignTruck, setNewDriverAssignTruck] = useState('Unassigned');

  // Live Seat Occupancy Stepper
  const handleAdjustSeats = (routeId: string, delta: number) => {
    const updated = routes.map((r) => {
      if (r.id === routeId) {
        const newAvail = Math.max(0, Math.min(r.capacity, r.availableSeats + delta));
        const newFilled = r.capacity - newAvail;
        return {
          ...r,
          availableSeats: newAvail,
          filledSeats: newFilled,
          status: newAvail === 0 ? 'FULL' : 'ACTIVE',
        };
      }
      return r;
    });
    updateAndSaveRoutes(updated);
  };

  // Add Route Modal State
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [newRouteTitle, setNewRouteTitle] = useState('');
  const [newRouteCity, setNewRouteCity] = useState('Islamabad');
  const [newRouteCategory, setNewRouteCategory] = useState('Office Staff & Corporate');
  const [newRouteVehicle, setNewRouteVehicle] = useState('Toyota HiAce Grand Cabin (LEA-24-9988)');
  const [newRouteDriver, setNewRouteDriver] = useState('Nadeem Akhtar');
  const [newRouteCapacity, setNewRouteCapacity] = useState(14);
  const [newRouteAvailableSeats, setNewRouteAvailableSeats] = useState(4);
  const [newRouteMonthlyRate, setNewRouteMonthlyRate] = useState(9500);
  const [newRouteDailyRate, setNewRouteDailyRate] = useState(500);
  const [newRouteMorningTime, setNewRouteMorningTime] = useState('07:30 AM');
  const [newRouteEveningTime, setNewRouteEveningTime] = useState('05:30 PM');
  const [newRouteStopsText, setNewRouteStopsText] = useState('Saddar (07:15) ➔ Faizabad (07:45) ➔ Blue Area (08:15)');

  const handleAddRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteTitle) return;

    const parsedStops = newRouteStopsText
      .split(/➔|->|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s, idx) => ({
        stop: s.replace(/\(.*?\)/g, '').trim(),
        time: s.match(/\((.*?)\)/)?.[1] || `${7 + Math.floor(idx / 2)}:${(idx % 2) * 30 || '00'} AM`,
      }));

    const newRt = {
      id: `rt-${Date.now()}`,
      title: newRouteTitle,
      type: 'PICK_AND_DROP',
      city: newRouteCity,
      vehicle: newRouteVehicle,
      assignedDriver: newRouteDriver,
      driverPhone: contactPhone,
      timings: `${newRouteMorningTime} – ${newRouteEveningTime}`,
      capacity: Number(newRouteCapacity) || 14,
      filledSeats: (Number(newRouteCapacity) || 14) - (Number(newRouteAvailableSeats) || 4),
      availableSeats: Number(newRouteAvailableSeats) || 4,
      monthlySeatRate: Number(newRouteMonthlyRate) || 9500,
      dailySeatRate: Number(newRouteDailyRate) || 500,
      category: newRouteCategory,
      acStatus: 'Chilled Dual AC',
      stops:
        parsedStops.length > 0
          ? parsedStops
          : [
              { stop: `${newRouteCity} Origin Point`, time: newRouteMorningTime },
              { stop: 'Faizabad / Midway', time: '08:00 AM' },
              { stop: 'Commercial Hub / Office Stop', time: '08:30 AM' },
            ],
      status: 'ACTIVE',
    };

    const updated = [newRt, ...routes];
    updateAndSaveRoutes(updated);
    setShowAddRouteModal(false);
    setNewRouteTitle('');
  };

  // EDIT ROUTE STATE & HANDLERS (FULL CRUD)
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [editRouteStops, setEditRouteStops] = useState<{ stop: string; time: string }[]>([]);
  const [newStopInput, setNewStopInput] = useState('');
  const [newStopTimeInput, setNewStopTimeInput] = useState('08:00 AM');

  // EDIT TRUCK STATE & HANDLERS (FULL CRUD)
  const [editingTruck, setEditingTruck] = useState<any | null>(null);

  // NEW VEHICLE REGISTRATION MODAL STATE (FOR FLEET VEHICLES)
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [newTruckModel, setNewTruckModel] = useState('Hyundai Shehzore D-100 (2.5 Ton)');
  const [newTruckType, setNewTruckType] = useState('CARGO_MOVING');
  const [newTruckReg, setNewTruckReg] = useState('');
  const [newTruckCity, setNewTruckCity] = useState('Lahore');
  const [newTruckCapacityTons, setNewTruckCapacityTons] = useState(2.5);
  const [newTruckCapacityCubicFt, setNewTruckCapacityCubicFt] = useState('350 cu. ft');
  const [newTruckSeats, setNewTruckSeats] = useState(14);
  const [newTruckBaseFare, setNewTruckBaseFare] = useState(4500);
  const [newTruckKmRate, setNewTruckKmRate] = useState(120);
  const [newTruckHelperRate, setNewTruckHelperRate] = useState(1000);
  const [newTruckDriver, setNewTruckDriver] = useState('Unassigned');

  const applyVehiclePreset = (preset: typeof VEHICLE_PRESETS[0]) => {
    setNewTruckModel(preset.model);
    setNewTruckType(preset.type);
    setNewTruckCapacityTons(preset.tons);
    setNewTruckCapacityCubicFt(preset.vol);
    setNewTruckSeats(preset.seats || (preset.type === 'PASSENGER_SHUTTLE' ? 14 : 3));
    setNewTruckBaseFare(preset.base);
    setNewTruckKmRate(preset.km);
    setNewTruckHelperRate(preset.helper);
  };

  const handleSwitchCategory = (type: string) => {
    setNewTruckType(type);
    const preset = VEHICLE_PRESETS.find((p) => p.type === type);
    if (preset) {
      applyVehiclePreset(preset);
    }
  };

  const openAddVehicleModal = () => {
    const isShuttle = (hasPickAndDrop && !hasHomeShifting) || providerMode === 'PICK_AND_DROP';
    if (isShuttle) {
      setNewTruckType('PASSENGER_SHUTTLE');
      const preset = VEHICLE_PRESETS.find((p) => p.type === 'PASSENGER_SHUTTLE');
      if (preset) {
        applyVehiclePreset(preset);
      } else {
        setNewTruckModel('Toyota HiAce Grand Cabin (14 Seats)');
        setNewTruckCapacityTons(0);
        setNewTruckCapacityCubicFt('14 Passengers');
        setNewTruckSeats(14);
        setNewTruckBaseFare(3500);
        setNewTruckKmRate(100);
        setNewTruckHelperRate(500);
      }
    } else {
      setNewTruckType('CARGO_MOVING');
      const preset = VEHICLE_PRESETS.find((p) => p.type === 'CARGO_MOVING');
      if (preset) {
        applyVehiclePreset(preset);
      } else {
        setNewTruckModel('Hyundai Shehzore D-100 (2.5 Ton)');
        setNewTruckCapacityTons(2.5);
        setNewTruckCapacityCubicFt('350 cu. ft');
        setNewTruckSeats(3);
        setNewTruckBaseFare(4500);
        setNewTruckKmRate(120);
        setNewTruckHelperRate(1000);
      }
    }
    setNewTruckReg('');
    setNewTruckCity(cityBase || 'Lahore');
    setNewTruckDriver('Unassigned');
    setShowAddTruckModal(true);
  };

  const handleCreateNewTruck = (e: React.FormEvent) => {
    e.preventDefault();
    const isShuttle = newTruckType === 'PASSENGER_SHUTTLE';
    const newVeh = {
      id: `cf-${Date.now()}`,
      model: newTruckModel.trim() || (isShuttle ? 'Toyota HiAce Commercial Shuttle' : 'Hyundai Shehzore Commercial Truck'),
      type: newTruckType,
      reg: newTruckReg.trim().toUpperCase() || `PK-${Math.floor(100 + Math.random() * 900)}`,
      capacityTons: isShuttle ? null : (Number(newTruckCapacityTons) || 2.5),
      capacityCubicFt: isShuttle ? `${newTruckSeats || 14} Passengers` : (newTruckCapacityCubicFt || '350 cu. ft'),
      baseFare: Number(newTruckBaseFare) || (isShuttle ? 3500 : 4500),
      kmRate: Number(newTruckKmRate) || (isShuttle ? 100 : 120),
      helperRate: Number(newTruckHelperRate) || (isShuttle ? 500 : 1000),
      driverName: newTruckDriver,
      baseCity: newTruckCity || cityBase,
      status: isShuttle ? 'ON_DAILY_ROUTE' : 'READY_FOR_DISPATCH',
    };
    const updated = [newVeh, ...commercialFleet];
    updateAndSaveFleet(updated);
    setSelectedCalcVehicleId(newVeh.id);

    if (newTruckDriver && newTruckDriver !== 'Unassigned') {
      const updatedDrivers = driverTeam.map((d) =>
        d.name === newTruckDriver ? { ...d, assignedTruck: `${newVeh.model} (${newVeh.reg})` } : d
      );
      updateAndSaveDrivers(updatedDrivers);
    }

    setShowAddTruckModal(false);
    setSaveNotice(`✅ Vehicle "${newVeh.model}" (${newVeh.reg}) added to your fleet successfully!`);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleOpenEditRoute = (route: any) => {
    setEditingRoute({ ...route });
    setEditRouteStops(route.stops ? route.stops.map((s: any) => ({ ...s })) : []);
  };

  const handleSaveRouteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    const updated = routes.map((r) =>
      r.id === editingRoute.id ? { ...editingRoute, stops: editRouteStops } : r
    );
    updateAndSaveRoutes(updated);
    setEditingRoute(null);
    setSaveNotice('✅ Route details, stops & scheduled timings updated live!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleAddStopToEdit = () => {
    if (!newStopInput.trim()) return;
    setEditRouteStops([...editRouteStops, { stop: newStopInput.trim(), time: newStopTimeInput }]);
    setNewStopInput('');
  };

  const handleRemoveStopFromEdit = (index: number) => {
    setEditRouteStops(editRouteStops.filter((_, idx) => idx !== index));
  };

  const handleOpenEditTruck = (truck: any) => {
    setEditingTruck({ ...truck });
  };

  const handleSaveTruckEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTruck) return;
    const updated = commercialFleet.map((t: any) => (t.id === editingTruck.id ? { ...editingTruck } : t));
    updateAndSaveFleet(updated);
    if (editingTruck.driverName && editingTruck.driverName !== 'Unassigned') {
      const updatedDrivers = driverTeam.map((d) =>
        d.name === editingTruck.driverName
          ? { ...d, assignedTruck: `${editingTruck.model} (${editingTruck.reg})` }
          : d
      );
      updateAndSaveDrivers(updatedDrivers);
    }
    setEditingTruck(null);
    setSaveNotice('✅ Vehicle specifications, tariff rates & driver allotment updated live!');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleDeleteTruck = (vehicleId: string, modelName: string) => {
    if (confirm(`Remove vehicle "${modelName}" from your listed fleet?`)) {
      const updated = commercialFleet.filter((f) => f.id !== vehicleId);
      updateAndSaveFleet(updated);
      setSaveNotice(`✅ Vehicle "${modelName}" removed from fleet.`);
      setTimeout(() => setSaveNotice(null), 3500);
    }
  };

  const handleAllotDriverToVehicle = (vehicleId: string, driverName: string) => {
    const targetVeh = commercialFleet.find((v) => v.id === vehicleId);
    const updated = commercialFleet.map((v) => (v.id === vehicleId ? { ...v, driverName } : v));
    updateAndSaveFleet(updated);
    if (targetVeh && driverName !== 'Unassigned') {
      const updatedDrivers = driverTeam.map((d) =>
        d.name === driverName ? { ...d, assignedTruck: `${targetVeh.model} (${targetVeh.reg})` } : d
      );
      updateAndSaveDrivers(updatedDrivers);
    }
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;

    const newDrv = {
      id: `drv-team-${Date.now()}`,
      name: newDriverName,
      phone: newDriverPhone,
      cnic: newDriverCnic || '35201-XXXXXXX-X',
      licenseCategory: newDriverLicense,
      assignedTruck: newDriverAssignTruck,
      status: 'AVAILABLE',
    };

    const updatedDrivers = [...driverTeam, newDrv];
    updateAndSaveDrivers(updatedDrivers);

    if (newDriverAssignTruck && newDriverAssignTruck !== 'Unassigned') {
      const updatedFleet = commercialFleet.map((f) =>
        newDriverAssignTruck.includes(f.reg) || newDriverAssignTruck.includes(f.model)
          ? { ...f, driverName: newDriverName }
          : f
      );
      updateAndSaveFleet(updatedFleet);
    }

    setShowAddDriverModal(false);
    setNewDriverName('');
    setNewDriverPhone('');
    setNewDriverCnic('');
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setRatesSavedNotice('✅ Logistics & Shifting Rates saved! Automatic fare calculator is updated.');
    setTimeout(() => setRatesSavedNotice(null), 3500);
  };

  if (isCustomerBlocked) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#EEF0F2] p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#101828]">Access Restricted</h2>
          <p className="text-sm text-[#475467] leading-relaxed">
            You are signed in as a <strong>Customer</strong> ({currentUser?.name}).
            The Shuttles & Movers Provider Console is only accessible to registered Commercial Transport Operators.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/customer"
              className="w-full py-3 rounded-xl bg-[#0B6B4F] text-white font-bold text-sm hover:bg-[#08513C] transition"
            >
              Go to Customer Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                logoutActiveUser();
                window.location.href = '/register';
              }}
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Sign Out & Register as Provider
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Customer Chat Contact Calculations
  const activeProviderConv =
    providerConversations.find((c) => c.id === activeProviderChatId) || providerConversations[0] || null;
  const providerEffectiveId = currentUser?.id || 'usr-demo-provider';
  const activeCustomerPartnerId =
    activeProviderConv?.participantIds.find((id) => id !== providerEffectiveId) || 'usr-demo-customer';
  const activeCustomerName =
    activeProviderConv?.participantNames[activeCustomerPartnerId] || 'Customer Booker';
  const activeCustomerPhone =
    activeProviderConv?.participantPhones[activeCustomerPartnerId] || '+92 300 0000000';

  const activeCustomerMeta = activeProviderConv?.bookingMetadata || {
    category: (providerMode === 'PICK_AND_DROP' ? 'shuttle' : 'mover') as any,
    customerName: activeCustomerName,
    customerPhone: activeCustomerPhone,
    customerCity: activeProviderConv?.bookingMetadata?.customerCity || cityBase,
    providerName: companyName,
    providerManager: managerName,
    providerPhone: contactPhone,
    itemName: activeProviderConv?.about || 'Commercial Logistics Inquiry',
    pickupDate: activeProviderConv?.dates || 'Scheduled Service',
    bookingRef: activeProviderConv?.bookingRef || 'SF-ProviderInquiry',
  };

  const activeCustomerWhatsAppUrl = getWhatsAppTargetUrl(
    activeCustomerPhone,
    generateOwnerFollowUpWhatsAppText(activeCustomerMeta)
  );

  const providerNavItems = React.useMemo(() => {
    return [
      ...(hasPickAndDrop
        ? [{ id: 'routes', label: 'Pick & Drop Shuttle Routes', icon: Navigation, badge: routes.length, highlight: 'teal' }]
        : []),
      ...(hasHomeShifting
        ? [{ id: 'pricing', label: 'Home Shifting Rates & Pricing', icon: DollarSign }]
        : []),
      { id: 'overview', label: 'Logistics Overview', icon: Building2 },
      { id: 'analytics', label: '📊 Analytics & Actions', icon: BarChart2 },
      {
        id: 'chats',
        label: 'Customer Chats (Inbox)',
        icon: MessageSquare,
        badge: unreadProviderChatsCount > 0 ? unreadProviderChatsCount : providerConversations.length,
        isHighlight: unreadProviderChatsCount > 0,
      },
      { id: 'team', label: 'Driver Team & Allocations', icon: Users, badge: driverTeam.length },
      {
        id: 'fleet',
        label: hasHomeShifting && !hasPickAndDrop ? 'Commercial Fleet Vehicles' : hasPickAndDrop && !hasHomeShifting ? 'Commuter Shuttles Fleet' : 'Commercial Fleet Vehicles',
        icon: Truck,
        badge: commercialFleet.length,
      },
      ...(hasHomeShifting
        ? [{ id: 'quotes', label: 'Moving Quotations Queue', icon: FileText, badge: quoteRequests.length }]
        : []),
      { id: 'subscription', label: 'Billing & Fleet Pass', icon: Receipt, badge: 'Active' },
    ];
  }, [hasPickAndDrop, hasHomeShifting, routes.length, unreadProviderChatsCount, providerConversations.length, driverTeam.length, commercialFleet.length, quoteRequests.length]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-28 md:pb-0">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-lg shadow-sm ${
                  providerMode === 'PICK_AND_DROP'
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600'
                    : providerMode === 'CITY_TO_CITY'
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                    : 'bg-gradient-to-tr from-[#C2410C] to-amber-500'
                }`}
              >
                S
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">SafarPK</span>
            </Link>
            <span
              className={`hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                providerMode === 'PICK_AND_DROP'
                  ? 'bg-violet-50 text-violet-900 border-violet-200'
                  : providerMode === 'CITY_TO_CITY'
                  ? 'bg-cyan-50 text-cyan-900 border-cyan-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {providerMode === 'PICK_AND_DROP'
                ? '🚌 Pick & Drop Commuter Transport'
                : providerMode === 'CITY_TO_CITY'
                ? '🛣️ City to City Express Intercity'
                : '📦 Home Shifting & Cargo Movers'}
            </span>
          </div>

          {/* Quick Category Mode Switcher: ONLY show if provider is approved for BOTH services */}
          {hasPickAndDrop && hasHomeShifting && (
            <div className="hidden md:flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setProviderMode('PICK_AND_DROP');
                  setActiveTab('routes');
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'routes'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Pick & Drop Commuter Routes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProviderMode('COMMERCIAL_CARGO');
                  setActiveTab('pricing');
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab !== 'routes'
                    ? 'bg-[#C2410C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Home Shifting & Cargo Movers</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Customer Chats Button in Top Navbar */}
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-[#9A3412] text-white border-[#C2410C] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
              title="Customer Inquiries & Live In-App Chats"
            >
              <MessageSquare className="w-4 h-4 text-[#C2410C]" />
              <span className="hidden sm:inline">Customer Chats</span>
              {unreadProviderChatsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {unreadProviderChatsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 hidden sm:inline">
                  {providerConversations.length}
                </span>
              )}
            </button>

            <Link
              href="/"
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              <span className="hidden sm:inline">← Public Marketplace</span>
              <span className="sm:hidden">← Market</span>
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-[#9A3412] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-bold text-slate-900 block leading-tight">{companyName}</span>
                <span className="text-[10px] text-[#C2410C] font-semibold">{cityBase} Fleet Hub</span>
              </div>
            </div>
          </div>
        </div>
        <MobilePullToRefresh />
        <OfflineStatusBanner />
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mobile Horizontal Pill Bar */}
        <div className="lg:hidden col-span-1 w-full overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 min-w-max px-0.5">
          {providerNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#9A3412] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      item.isHighlight
                        ? 'bg-rose-500 text-white font-black animate-pulse'
                        : active
                        ? 'bg-white/30 text-white'
                        : 'bg-orange-100 text-[#9A3412] font-bold'
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

        {/* Sidebar Nav */}
        <aside className="hidden lg:block space-y-1">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 mb-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-200 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{companyName}</h3>
                <span className="text-[11px] text-slate-500 block">Manager: {managerName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${
                    currentUser?.subscription?.status === 'ACTIVE'
                      ? 'text-[#C2410C] bg-orange-50 border-orange-200'
                      : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                      ? 'text-amber-800 bg-amber-50 border-amber-300'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}
                >
                  {currentUser?.subscription?.planName ||
                    (currentUser?.subscription?.status === 'ACTIVE'
                      ? 'Transport Partner'
                      : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                      ? 'Pending Approval'
                      : 'Unsubscribed')}
                </span>

                {/* Approved Service Badges */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {hasPickAndDrop && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      🚌 Pick & Drop
                    </span>
                  )}
                  {hasHomeShifting && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-900 border border-orange-200">
                      📦 Home Shifting
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dual-Service Focus Switcher if Provider is approved for both */}
          {hasPickAndDrop && hasHomeShifting && (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl mb-3 flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase px-1">Focus:</span>
              <button
                type="button"
                onClick={() => setActiveTab('routes')}
                className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'routes'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
                }`}
              >
                🚌 Pick & Drop
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quotes')}
                className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  activeTab === 'quotes' || activeTab === 'pricing'
                    ? 'bg-[#C2410C] text-white shadow-xs'
                    : 'bg-white text-orange-900 hover:bg-orange-50 border border-orange-200'
                }`}
              >
                📦 Home Shifting
              </button>
            </div>
          )}

          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold">
            {providerNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const isTeal = item.id === 'routes';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    active
                      ? isTeal
                        ? 'bg-teal-600 text-white shadow-sm font-bold'
                        : 'bg-[#C2410C] text-white shadow-sm font-bold'
                      : isTeal
                      ? 'text-teal-900 bg-teal-50/50 hover:bg-teal-100 font-bold'
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
                        item.isHighlight
                          ? 'bg-rose-500 text-white font-black animate-pulse'
                          : active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700'
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

        {/* Canvas */}
        <main className="lg:col-span-3 space-y-6">
          {saveNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs">
              <span>{saveNotice}</span>
              <button onClick={() => setSaveNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
            </div>
          )}

          {/* PROVIDER SUBSCRIPTION PROMOTIONAL BANNER */}
          {currentUser && (!currentUser.subscription || currentUser.subscription.status === 'UNSUBSCRIBED') && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-orange-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C2410C] text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-lg">
                  📦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Welcome, {companyName}! Activate Your Commercial Provider Pass
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      Provider Pass Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Activate your Commercial Fleet or Pick & Drop Route Pass to publish unlimited logistics routes, receive corporate quote requests, and deploy Mazdoor shifting teams.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-5 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer shrink-0"
              >
                ⚡ Choose Provider Package & Apply Promo Code
              </button>
            </div>
          )}

          {currentUser?.subscription?.status === 'PENDING_APPROVAL' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-amber-950">
                      ⏳ Commercial Subscription Payment Under Review
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                      Ref: {currentUser.subscription.paymentRef || 'Submitted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your payment receipt for &ldquo;{currentUser.subscription.planName}&rdquo; is pending Super Admin approval. Your routes and commercial pricing will go LIVE once approved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-bold shrink-0"
              >
                View Status
              </button>
            </div>
          )}

          {/* FREE PROMOTIONAL PROVIDER PASS BANNER */}
          {currentUser?.subscription?.isFreePromo && currentUser.subscription.status === 'ACTIVE' && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-2 border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-black shrink-0">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-emerald-950">
                      Launch Promotion Active: 100% Free Transport Provider Pass!
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-black bg-emerald-600 text-white">
                      Rs. 0 Paid (Value: Rs. {formatPKR(currentUser.subscription.originalAmount || 5000)})
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {currentUser.subscription.freePromoReason || 'SafarPK Provider Promotion: Free subscription granted to publish routes and receive direct corporate leads.'}
                    {currentUser.subscription.validUntil && ` Valid until ${new Date(currentUser.subscription.validUntil).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                View Pass & Receipt
              </button>
            </div>
          )}

          {/* SUBSCRIPTION PAUSED / EXPIRED BANNER */}
          {(currentUser?.subscription?.status === 'PAUSED' || currentUser?.subscription?.status === 'EXPIRED') && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg font-black shrink-0">
                  ⏸️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-rose-950">
                      Transport Provider Subscription Paused / Expired
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white">
                      Listings Paused
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Your transport subscription validity has expired. Your active routes and commercial listings have been automatically paused. Please renew your subscription pass or contact support to reactivate.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                Renew Provider Pass
              </button>
            </div>
          )}
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {hasPickAndDrop && !hasHomeShifting ? (
                <>
                  {/* Commuter Pick & Drop Operations Banner */}
                  <div className="p-6 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-teal-300">
                        Daily Commuter Shuttle Operations Desk
                      </span>
                      <h2 className="text-lg sm:text-2xl font-black mt-1">{companyName}</h2>
                      <p className="text-xs text-slate-300 mt-1">
                        Operating verified daily school, university, and corporate office pick & drop commuter routes in {cityBase} and surrounding areas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('routes')}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                    >
                      <Bus className="w-4 h-4" />
                      <span>Manage Commuter Routes</span>
                    </button>
                  </div>

                  {/* Public Storefront Shareable Widget */}
                  <DashboardStoreWidget
                    type="STORE"
                    identifier={companyName}
                    subtitle="Share your dedicated commuter storefront link displaying your active van routes, stops, schedules, and vacant seats with direct WhatsApp booking."
                  />

                  {/* Pick & Drop KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Active Commuter Routes</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {routes.length} Routes
                      </span>
                      <span className="text-[10px] text-teal-600 font-bold mt-1 block">Daily Fixed Schedules</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Shuttle Fleet</span>
                      <span className="text-2xl font-black text-teal-700 mt-1 block">
                        {commercialFleet.filter((c) => c.type === 'PASSENGER_SHUTTLE').length || routes.length} Vans
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">HiAce & APVs</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Vacant Seats</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">
                        {routes.reduce((acc, r) => acc + (r.availableSeats || 0), 0)} Seats
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Available for Enrollment</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Enrolled Passengers</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {routes.reduce((acc, r) => acc + (r.filledSeats || 0), 0)} Commuters
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Active Monthly Passes</span>
                    </div>
                  </div>

                  {/* Active Routes Live Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-extrabold text-sm text-slate-900">Your Active Commuter Routes</h3>
                      <button onClick={() => setActiveTab('routes')} className="text-xs font-bold text-teal-700 hover:underline">
                        View All Routes ({routes.length}) →
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      {routes.map((r) => (
                        <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200">
                                {r.id}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900">{r.title}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
                                {r.vehicle}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Timings: {r.timings} · Category: {r.category} · {r.stops?.length || 0} Scheduled Stops
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                              Rs. {r.monthlySeatRate?.toLocaleString()}/mo
                            </span>
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {r.availableSeats} Seats Left
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 bg-gradient-to-r from-[#7C2D12] via-slate-900 to-[#9A3412] text-white rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-orange-200">
                        Home Shifting & Cargo Moving Desk
                      </span>
                      <h2 className="text-lg sm:text-2xl font-black mt-1">{companyName}</h2>
                      <p className="text-xs text-slate-300 mt-1">
                        Operating home shifting, office relocations, freight cargo, and heavy item moving in {cityBase} and nationwide.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pricing')}
                      className="px-5 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl text-xs font-bold transition shadow-md whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Configure Fare Calculator</span>
                    </button>
                  </div>

                  {/* Public Commercial Storefront Shareable Widget */}
                  <DashboardStoreWidget
                    type="STORE"
                    identifier={companyName}
                    subtitle="Share your dedicated commercial storefront link displaying all your registered trucks and home shifting quotation options with direct WhatsApp booking."
                  />

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Total Moving Trucks</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        {commercialFleet.filter((c) => c.type === 'CARGO_MOVING').length || 3} Vehicles
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Ravi, Shehzore, Mazda</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Company Drivers</span>
                      <span className="text-2xl font-black text-[#C2410C] mt-1 block">
                        {driverTeam.length} Drivers
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">100% HTV / LTV Allotted</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Base Fleet Fare</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">
                        PKR {formatPKR(commercialFleet[0]?.baseFare || 4500)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Includes first {rates.includedBaseKm} km</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Mazdoor / Labor</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">
                        PKR {formatPKR(commercialFleet[0]?.helperRate || rates.ratePerMazdoor)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Per Helper with Packing</span>
                    </div>
                  </div>

                  {/* Live Calculator Preview Card */}
                  <div className="bg-orange-50/60 border border-orange-200 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-[#C2410C]" />
                        <h3 className="font-extrabold text-sm text-[#7C2D12]">
                          Live Shifting Fare Formula (Active on Public Portal)
                        </h3>
                      </div>
                      <button onClick={() => setActiveTab('pricing')} className="text-xs font-bold text-[#C2410C] hover:underline">
                        Edit Pricing Rules →
                      </button>
                    </div>
                    <p className="text-xs text-[#9A3412]">
                      Total Fare = <strong>Base Truck Fare</strong> + (<strong>Distance km</strong> × PKR {rates.ratePerKmLocal}/km) + (<strong>Mazdoor Count</strong> × PKR {rates.ratePerMazdoor}) + Floor Surcharge.
                    </p>
                    <div className="p-3 bg-white rounded-2xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Sample: {liveCalc.activeVeh?.model || 'Commercial Fleet'} + 25 km + 3 Mazdoors + 2 Floors</span>
                        <strong className="text-slate-900 text-sm">
                          Base {formatPKR(liveCalc.base)} + KM {formatPKR(liveCalc.kmCost)} + Mazdoor {formatPKR(liveCalc.mazdoorCost)} + Floor {formatPKR(liveCalc.floorCost)}
                        </strong>
                      </div>
                      <span className="text-base font-black text-[#9A3412] bg-orange-100 px-3 py-1 rounded-xl">
                        Total: PKR {formatPKR(liveCalc.total)}
                      </span>
                    </div>
                  </div>

                  {/* Shifting Quotes Queue Alert */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-extrabold text-sm text-slate-900">Recent Shifting Bookings & Assigned Drivers</h3>
                      <button onClick={() => setActiveTab('quotes')} className="text-xs font-bold text-[#C2410C] hover:underline">
                        Manage All Quotes →
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      {quoteRequests.map((q) => (
                        <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#9A3412] bg-white px-2 py-0.5 rounded border border-orange-200">
                                {q.id}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900">{q.shiftingType}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#9A3412]">
                                {q.truckRequired}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              From: {q.fromAddress} ➔ To: {q.toAddress} ({q.distanceKm} km · {q.helpersNeeded} Mazdoors)
                            </p>
                            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                              Assigned Driver: <strong>{q.assignedDriver}</strong>
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-[#9A3412]">
                            PKR {formatPKR(q.estimatedTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 1B: LOGISTICS & ROUTES ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsReportHub
                role="PROVIDER"
                viewerName={currentUser?.businessName || 'Logistics Fleet'}
                viewerPhone={currentUser?.phone || '+92 333 5599182'}
                allowExport={true}
                allowClaim={false}
                accentColor="#0284C7"
              />
            </div>
          )}

          {/* TAB 2: PRICING RULES & KM / MAZDOOR CALCULATOR */}
          {activeTab === 'pricing' && (
            !hasHomeShifting ? (
              <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
                  🚫
                </div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
                  Service Access Restricted: Home Shifting
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Your provider account ({companyName}) is approved for <strong>Pick & Drop Commuter Routes</strong> only. You do not have permissions to access Home Shifting pricing or moving calculations.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('routes')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Go to Your Approved Pick & Drop Workspace
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Logistics & Shifting Rate Engine (KM, Mazdoor, Base Fare)
                </h3>
                <p className="text-slate-500">
                  Configure your pricing rules. The portal automatically computes transparent customer moving quotes based on distance, truck capacity, and helpers.
                </p>
              </div>

              {ratesSavedNotice && (
                <div className="p-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200">
                  {ratesSavedNotice}
                </div>
              )}

              {/* Interactive Live Fare Simulator */}
              <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#C2410C]" />
                  <h4 className="font-bold text-sm text-[#7C2D12]">Live Fare Simulator (Test Your Calculation)</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Select Listed Vehicle</label>
                    <select
                      value={selectedCalcVehicleId}
                      onChange={(e) => setSelectedCalcVehicleId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-orange-200 rounded-xl font-bold text-slate-900 cursor-pointer text-xs"
                    >
                      {commercialFleet.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.model} ({v.reg}) · Base Rs. {formatPKR(v.baseFare || 3500)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimated Distance</label>
                    <div className="flex items-center gap-1 bg-white border border-orange-200 rounded-xl px-2.5 py-1.5">
                      <input
                        type="number"
                        value={calcDistanceKm}
                        onChange={(e) => setCalcDistanceKm(Number(e.target.value))}
                        className="w-full font-bold outline-none"
                      />
                      <span className="text-[10px] text-slate-500">km</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mazdoor / Helpers</label>
                    <select
                      value={calcMazdoorCount}
                      onChange={(e) => setCalcMazdoorCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-orange-200 rounded-xl font-medium"
                    >
                      <option value={0}>0 Helpers (Truck Only)</option>
                      <option value={1}>1 Mazdoor</option>
                      <option value={2}>2 Mazdoors</option>
                      <option value={3}>3 Mazdoors</option>
                      <option value={4}>4 Mazdoors</option>
                      <option value={6}>6 Mazdoors (Heavy Moving)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Floor / Stairs</label>
                    <select
                      value={calcFloorCount}
                      onChange={(e) => setCalcFloorCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-orange-200 rounded-xl font-medium"
                    >
                      <option value={0}>Ground Floor / Elevator</option>
                      <option value={1}>1st Floor (Stairs)</option>
                      <option value={2}>2nd Floor (Stairs)</option>
                      <option value={3}>3rd Floor (Stairs)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="intercityCheck"
                    checked={calcIsIntercity}
                    onChange={(e) => setCalcIsIntercity(e.target.checked)}
                    className="w-4 h-4 text-[#C2410C] rounded"
                  />
                  <label htmlFor="intercityCheck" className="font-bold text-slate-800 cursor-pointer">
                    Inter-City Travel Route (Applies outstation rate: PKR {rates.ratePerKmIntercity}/km)
                  </label>
                </div>

                {/* Calculation Breakdown Result */}
                <div className="p-4 bg-white rounded-2xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-semibold">
                      Calculation Formula for {liveCalc.activeVeh?.model || 'Vehicle'}:
                    </span>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 font-medium">
                      <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Base: PKR {formatPKR(liveCalc.base)}
                      </span>
                      <span>+</span>
                      <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Distance ({liveCalc.extraKm} km × PKR {liveCalc.kmRate}/km): PKR {formatPKR(liveCalc.kmCost)}
                      </span>
                      <span>+</span>
                      <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Labor ({calcMazdoorCount} Mazdoors × PKR {liveCalc.helperUnitRate}): PKR {formatPKR(liveCalc.mazdoorCost)}
                      </span>
                      {liveCalc.floorCost > 0 && (
                        <>
                          <span>+</span>
                          <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            Stairs: PKR {formatPKR(liveCalc.floorCost)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Moving Total</span>
                    <span className="text-2xl font-black text-[#7C2D12]">PKR {formatPKR(liveCalc.total)}</span>
                  </div>
                </div>
              </div>

              {/* Form to Edit Standard Rates */}
              <form onSubmit={handleSaveRates} className="space-y-5">
                {/* 1. Listed Fleet Vehicles & Customized Rates */}
                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        1. Listed Fleet Vehicles & Rates (Base Fare, KM & Helper Rates)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Directly customize base fares and distance rates for your listed vehicles. Changes automatically update customer quotes and the live simulator.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddVehicleModal}
                      className="px-3.5 py-1.5 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer transition active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Add / Register Vehicle</span>
                    </button>
                  </div>

                  {commercialFleet.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                      <p className="font-bold text-slate-600">No vehicles listed yet in your fleet.</p>
                      <button
                        type="button"
                        onClick={openAddVehicleModal}
                        className="px-4 py-2 bg-[#C2410C] text-white rounded-xl font-bold text-xs cursor-pointer"
                      >
                        + Add Your First Vehicle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commercialFleet.map((v) => (
                        <div
                          key={v.id}
                          className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:border-orange-200 transition"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {v.reg}
                              </span>
                              <h5 className="font-bold text-sm text-slate-900 truncate">{v.model}</h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {v.driverName && v.driverName !== 'Unassigned' ? `👨‍✈️ ${v.driverName}` : 'Driver Unassigned'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Capacity: <strong>{v.capacityTons ? `${v.capacityTons} Tons (${v.capacityCubicFt})` : v.capacityCubicFt || 'Standard'}</strong> · Base City: {v.baseCity || cityBase}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Base Fare (PKR)</label>
                              <input
                                type="number"
                                min={500}
                                value={v.baseFare || 3500}
                                onChange={(e) => handleUpdateVehicleRate(v.id, 'baseFare', Number(e.target.value))}
                                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-[#9A3412] outline-none focus:border-[#C2410C]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Rate / KM (PKR)</label>
                              <input
                                type="number"
                                min={10}
                                value={v.kmRate || 120}
                                onChange={(e) => handleUpdateVehicleRate(v.id, 'kmRate', Number(e.target.value))}
                                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-800 outline-none focus:border-[#C2410C]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Helper Rate (PKR)</label>
                              <input
                                type="number"
                                min={100}
                                value={v.helperRate || 1000}
                                onChange={(e) => handleUpdateVehicleRate(v.id, 'helperRate', Number(e.target.value))}
                                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-800 outline-none focus:border-[#C2410C]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTruck(v)}
                              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-xs transition cursor-pointer self-end mb-0.5"
                              title="Edit complete vehicle details & driver"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Distance & Labor Rates */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">2. Distance & Mazdoor / Labor Charges</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Per KM Local (PKR / km)</label>
                      <input
                        type="number"
                        value={rates.ratePerKmLocal}
                        onChange={(e) => setRates({ ...rates, ratePerKmLocal: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Per KM Inter-City (PKR / km)</label>
                      <input
                        type="number"
                        value={rates.ratePerKmIntercity}
                        onChange={(e) => setRates({ ...rates, ratePerKmIntercity: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Per Mazdoor Rate (PKR / helper)</label>
                      <input
                        type="number"
                        value={rates.ratePerMazdoor}
                        onChange={(e) => setRates({ ...rates, ratePerMazdoor: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Floor Stairs Surcharge (PKR)</label>
                      <input
                        type="number"
                        value={rates.floorSurchargePerFloor}
                        onChange={(e) => setRates({ ...rates, floorSurchargePerFloor: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Coverage Cities */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <label className="font-bold text-slate-700 block text-xs">Service Area & Operating Cities</label>
                      <span className="text-[10px] text-slate-400">
                        Select cities your cargo moving & logistics team actively covers.
                      </span>
                    </div>
                    <span className="text-[11px] text-[#C2410C] font-bold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 self-start sm:self-auto">
                      ✓ {serviceCoverageCities.length} Cities Active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {availableCoverageCities.map((c) => {
                      const active = serviceCoverageCities.includes(c);
                      const isCustom = !['Lahore', 'Islamabad', 'Rawalpindi', 'Karachi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala'].includes(c);
                      return (
                        <div key={c} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (active) {
                                setServiceCoverageCities(serviceCoverageCities.filter((x) => x !== c));
                              } else {
                                setServiceCoverageCities([...serviceCoverageCities, c]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer text-xs ${
                              active
                                ? 'bg-[#C2410C] text-white border-orange-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {active ? '✓ ' : '+ '} {c}
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvailableCoverageCities(availableCoverageCities.filter((x) => x !== c));
                                setServiceCoverageCities(serviceCoverageCities.filter((x) => x !== c));
                              }}
                              className="ml-1 text-slate-400 hover:text-rose-600 p-1 text-[11px] transition"
                              title={`Delete custom city ${c}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline Custom City Input & Button */}
                    {!showCustomCityInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomCityInput(true)}
                        className="px-3 py-1.5 rounded-xl border-2 border-dashed border-orange-300 text-[#C2410C] hover:border-orange-500 hover:bg-orange-50 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <span>+ Custom City</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-orange-500 shadow-sm">
                        <input
                          type="text"
                          autoFocus
                          value={customCityInput}
                          onChange={(e) => setCustomCityInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCity();
                            } else if (e.key === 'Escape') {
                              setShowCustomCityInput(false);
                            }
                          }}
                          placeholder="Type city name (e.g. Sialkot, Sargodha)"
                          className="px-2.5 py-1 text-xs outline-none w-44 font-medium text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCity}
                          className="px-3 py-1 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCityInput(false);
                            setCustomCityInput('');
                          }}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-extrabold rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Save Logistics & Moving Rates
                  </button>
                </div>
              </form>
            </div>
            )
          )}

          {/* TAB 3: DRIVER TEAM & ALLOCATIONS */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Driver Team & Truck Allotments</h3>
                  <p className="text-slate-500">
                    Manage your in-house commercial drivers, assign them to vehicles, and track their daily status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(true)}
                  className="px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Driver</span>
                </button>
              </div>

              <div className="space-y-3">
                {driverTeam.map((drv) => (
                  <div key={drv.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-lg">
                        👨‍✈️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{drv.name}</h4>
                          <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {drv.licenseCategory}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              drv.status === 'ON_DUTY' || drv.status === 'ON_ROUTE'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {drv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Phone: <strong>{drv.phone}</strong> · CNIC: {drv.cnic}
                        </p>
                        <p className="text-[11px] text-[#9A3412] font-semibold mt-0.5">
                          Assigned Vehicle: {drv.assignedTruck}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={drv.assignedTruck}
                        onChange={(e) => {
                          const updated = driverTeam.map((d) =>
                            d.id === drv.id ? { ...d, assignedTruck: e.target.value } : d
                          );
                          setDriverTeam(updated);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-700"
                      >
                        {commercialFleet.map((f) => (
                          <option key={f.id} value={`${f.model} (${f.reg})`}>
                            Allot: {f.model} ({f.reg})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setDriverTeam(driverTeam.filter((d) => d.id !== drv.id))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        title="Remove driver"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COMMERCIAL FLEET & CAPACITY */}
          {activeTab === 'fleet' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {hasHomeShifting && !hasPickAndDrop
                      ? 'Moving Trucks & Commercial Fleet'
                      : hasPickAndDrop && !hasHomeShifting
                      ? 'Commuter Shuttles & Fleet'
                      : 'Commercial Fleet & Listed Vehicles'}
                  </h3>
                  <p className="text-slate-500">
                    {hasHomeShifting && !hasPickAndDrop
                      ? 'Suzuki Ravi, Hyundai Shehzore, Mazda Titan moving vehicles with dynamic tariffs and driver allotments.'
                      : hasPickAndDrop && !hasHomeShifting
                      ? 'Toyota HiAce Grand Cabin, APV, and Coasters with dedicated driver allotments.'
                      : 'Commercial transport vehicles with custom base fare, per km rate, and dedicated driver allotments.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddVehicleModal}
                  className="px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add / Register Vehicle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {commercialFleet
                  .filter((c) => {
                    if (hasHomeShifting && !hasPickAndDrop) {
                      return c.type === 'CARGO_MOVING' || c.type === 'COMMERCIAL_HAULAGE' || !c.type || c.id.startsWith('cf-');
                    }
                    if (hasPickAndDrop && !hasHomeShifting) {
                      return c.type === 'PASSENGER_SHUTTLE' || !c.type || c.id.startsWith('cf-');
                    }
                    return true;
                  })
                  .map((c) => (
                  <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {c.reg}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.model}</h4>
                      <p className="text-slate-500 mt-0.5">
                        Capacity: <strong>{c.capacityTons ? `${c.capacityTons} Tons (${c.capacityCubicFt})` : c.capacityCubicFt}</strong>
                      </p>
                      {c.type === 'PASSENGER_SHUTTLE' ? (
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                          <span>Fare: Rs. {c.baseFare || 3500}</span>
                          <span>·</span>
                          <span>Rs. {c.kmRate || 100}/km</span>
                          <span>·</span>
                          <span>Dual AC Shuttle</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#C2410C] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                          <span>Base: Rs. {c.baseFare || 4500}</span>
                          <span>·</span>
                          <span>Rs. {c.kmRate || 120}/km</span>
                          <span>·</span>
                          <span>Rs. {c.helperRate || 1000}/helper</span>
                        </div>
                      )}
                    </div>

                    {/* Allot Driver Dropdown */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Allotted Driver</label>
                      <select
                        value={c.driverName}
                        onChange={(e) => handleAllotDriverToVehicle(c.id, e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-900"
                      >
                        <option value="Unassigned">-- Unassigned Driver --</option>
                        {driverTeam.map((d) => (
                          <option key={d.id} value={d.name}>
                            👨‍✈️ {d.name} ({d.licenseCategory})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Actions: Edit Vehicle & Delete */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTruck(c)}
                        className="px-3 py-1.5 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-[#9A3412] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#C2410C]" />
                        <span>Edit Vehicle & Rates</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTruck(c.id, c.model)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SHIFTING QUOTES QUEUE */}
          {activeTab === 'quotes' && (
            !hasHomeShifting ? (
              <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
                  🚫
                </div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
                  Service Access Restricted: Home Shifting Quotes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Your provider account ({companyName}) is approved for <strong>Pick & Drop Commuter Routes</strong> only. You do not have permissions to access Home Shifting customer quotes or moving bookings.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('routes')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Go to Your Approved Pick & Drop Workspace
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Customer Shifting Quotes & Booking Requests</h3>
                <p className="text-slate-500">
                  Manage incoming customer shifting inquiries, assign trucks and drivers, and send booking confirmations.
                </p>
              </div>

              <div className="space-y-3">
                {quoteRequests.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#9A3412] bg-white px-2 py-0.5 rounded border border-orange-200">
                            {q.id}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{q.shiftingType}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Client: <strong>{q.customerName}</strong> ({q.customerPhone}) · Date: {q.date}
                        </p>
                      </div>
                      <span className="text-base font-black text-[#9A3412]">PKR {formatPKR(q.quotedAmount)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="min-w-0">
                        <span className="text-slate-400 text-[10px] font-semibold block">Pickup</span>
                        <span className="font-bold text-slate-800 truncate block">{q.fromAddress}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 text-[10px] font-semibold block">Destination</span>
                        <span className="font-bold text-slate-800 truncate block">{q.toAddress}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 text-[10px] font-semibold block">Vehicle & Helpers</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {q.truckRequired} · {q.helpersNeeded} Helpers
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 text-[10px] font-semibold block mb-0.5">Allotted Driver</span>
                        <select
                          value={q.assignedDriver}
                          onChange={(e) => {
                            const newDriver = e.target.value;
                            const updated = quoteRequests.map((item) =>
                              item.id === q.id ? { ...item, assignedDriver: newDriver } : item
                            );
                            updateAndSaveQuotes(updated);
                          }}
                          className="w-full max-w-full p-1.5 bg-white border border-orange-200 rounded-lg text-xs font-bold text-[#9A3412] cursor-pointer truncate outline-none"
                        >
                          <option value="Unassigned">-- Assign Driver Later --</option>
                          {driverTeam.map((d) => (
                            <option key={d.id} value={d.name}>
                              👨‍✈️ {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`https://wa.me/${q.customerPhone.replace(/[^0-9]/g, '')}?text=As-salamu%20alaykum%20${encodeURIComponent(q.customerName)}!%20Your%20shifting%20booking%20${q.id}%20with%20${encodeURIComponent(companyName)}%20is%20CONFIRMED.%20Designated%20Driver:%20${encodeURIComponent(q.assignedDriver)}%20will%20arrive%20with%20${encodeURIComponent(q.truckRequired)}%20on%20${encodeURIComponent(q.date)}.%20Total:%20PKR%20${formatPKR(q.quotedAmount)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Confirm Booking ({q.customerPhone})</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )
          )}

          {/* TAB 6: COMMUTER ROUTES (PICK & DROP EXPANDED DASHBOARD) */}
          {activeTab === 'routes' && (
            !hasPickAndDrop ? (
              <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
                  🚫
                </div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
                  Service Access Restricted: Pick & Drop Commuter Routes
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Your provider account ({companyName}) is approved for <strong>Home Shifting Services</strong> only. You do not have permissions to access Commuter Pick & Drop routes or shuttle management.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('quotes')}
                    className="px-5 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs transition cursor-pointer"
                  >
                    Go to Your Approved Home Shifting Workspace
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-bold text-sm">🚌</span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      School & Office Pick & Drop Commuter Routes
                    </h3>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Demonstrate your ongoing vehicles, scheduled stops, live vacant seats, and monthly fares so commuters can join your route.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(true)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add New Commuter Route</span>
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Active Routes</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{routes.length} Routes</span>
                  <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">Lahore & Islamabad</span>
                </div>
                <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200">
                  <span className="text-[10px] text-teal-700 font-semibold block">Available Vacant Seats</span>
                  <span className="text-xl font-black text-teal-900 mt-1 block">
                    {routes.reduce((acc, r) => acc + (r.availableSeats || 0), 0)} Seats
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">Live for Customer Booking</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">Occupied / Registered</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {routes.reduce((acc, r) => acc + (r.filledSeats || 0), 0)} Passengers
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Monthly Passes Active</span>
                </div>
                <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-200">
                  <span className="text-[10px] text-[#C2410C] font-semibold block">Fleet Assigned</span>
                  <span className="text-xl font-black text-[#9A3412] mt-1 block">
                    {routes.length} Shuttles
                  </span>
                  <span className="text-[10px] text-[#C2410C] font-bold mt-0.5 block">HiAce & Coasters</span>
                </div>
              </div>

              {/* Commuter Routes Cards */}
              <div className="space-y-4">
                {routes.map((r) => {
                  const occupancyPct = Math.round(((r.capacity - r.availableSeats) / r.capacity) * 100);
                  return (
                    <div
                      key={r.id}
                      className="p-5 bg-slate-50 rounded-3xl border border-slate-200 hover:border-teal-300 transition space-y-3.5 shadow-2xs"
                    >
                      {/* Route Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200">
                              {r.city}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900">{r.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.availableSeats > 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {r.availableSeats > 0 ? '🟢 LIVE ON MARKETPLACE' : '🔴 ROUTE FULL'}
                            </span>
                          </div>
                          <span className="text-[11px] text-teal-800 font-semibold mt-1 block">
                            Target Group: <strong>{r.category}</strong> · {r.acStatus}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900">
                            PKR {formatPKR(r.monthlySeatRate)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">per seat / month (Daily: PKR {r.dailySeatRate || 500})</span>
                        </div>
                      </div>

                      {/* Route Vehicle & Driver Allocation */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Vehicle In Service</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <span>🚐</span>
                            <span className="truncate">{r.vehicle}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Designated Chauffeur</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <span>👨‍✈️</span>
                            <span>{r.assignedDriver} ({r.driverPhone})</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Scheduled Timings</span>
                          <span className="font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span>{r.timings}</span>
                          </span>
                        </div>
                      </div>

                      {/* Waypoints Strip */}
                      {r.stops && r.stops.length > 0 && (
                        <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-1.5">
                          <span className="text-[10px] font-bold text-teal-900 block">
                            Intermediate Boarding Stops & Scheduled Timings:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {r.stops.map((s: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white rounded-xl text-[10px] font-semibold text-slate-800 border border-teal-200 flex items-center gap-1"
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-teal-100 text-teal-800 text-[8px] font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span>{s.stop}</span>
                                <span className="font-mono text-teal-700">({s.time})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* LIVE SEATS OCCUPANCY CONTROLLER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        {/* Stepper */}
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-slate-700">Live Vacant Space:</span>
                          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleAdjustSeats(r.id, -1)}
                              disabled={r.availableSeats <= 0}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
                              title="Decrease available seats (passenger boarded)"
                            >
                              -
                            </button>
                            <span className="px-3 font-mono font-black text-xs text-slate-900">
                              {r.availableSeats} of {r.capacity} Available
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustSeats(r.id, 1)}
                              disabled={r.availableSeats >= r.capacity}
                              className="w-7 h-7 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-black text-sm flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
                              title="Increase available seats (seat vacated)"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400">({occupancyPct}% Full)</span>
                        </div>

                        {/* Actions: Edit, Pause, Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRoute(r)}
                            className="px-3 py-1.5 rounded-xl border border-teal-600 bg-teal-50 hover:bg-teal-100 font-bold text-teal-800 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                            <span>Edit Route</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRoutes(
                                routes.map((item) =>
                                  item.id === r.id ? { ...item, status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : item
                                )
                              )
                            }
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 text-xs transition cursor-pointer"
                          >
                            {r.status === 'ACTIVE' ? 'Pause Route' : 'Make Active'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete commuter route "${r.title}"?`)) {
                                setRoutes(routes.filter((item) => item.id !== r.id));
                              }
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete route"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )
          )}

          {/* TAB: CUSTOMER CHATS (INBOX & INQUIRIES) */}
          {activeTab === 'chats' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              {/* Tab Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#C2410C] flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Customer Inquiries & Live In-App Chats
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-900">
                      {providerConversations.length} Active Threads
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time messaging with customers inquiring about shifting quotes, seat bookings, or shuttle timings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/inbox"
                    className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open Full Screen Inbox</span>
                  </Link>
                </div>
              </div>

              {/* Chat Workspace: Threads Sidebar + Active Chat Stream */}
              <div className="flex flex-col md:flex-row h-[580px] bg-slate-50/50">
                {/* Conversation Threads Sidebar */}
                <div
                  className={`w-full md:w-72 lg:w-80 border-r border-slate-200 flex flex-col bg-white ${
                    providerChatMobileView === 'CONV' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Recent Customer Inquiries</span>
                    <span className="text-[10px] font-mono text-slate-400">TTL: 7 Days</span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                    {providerConversations.length > 0 ? (
                      providerConversations.map((c) => {
                        const selected = c.id === activeProviderChatId;
                        const partnerId = currentUser
                          ? c.participantIds.find((id) => id !== currentUser.id) || ''
                          : '';
                        const partnerName = c.participantNames[partnerId] || 'Customer Booker';
                        const unread = (currentUser && c.unreadCountFor?.[currentUser.id]) || 0;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setActiveProviderChatId(c.id);
                              setProviderChatMobileView('CONV');
                            }}
                            className={`w-full p-3.5 text-left flex items-start gap-2.5 transition cursor-pointer ${
                              selected ? 'bg-orange-50/60 border-l-4 border-l-purple-600' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xs shrink-0">
                              {partnerName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {partnerName}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatMessageTime(c.lastMessageTimestamp)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                                {c.about}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {c.lastMessageText}
                              </p>
                            </div>
                            {unread > 0 && (
                              <span className="w-5 h-5 rounded-full bg-[#C2410C] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>No customer chats yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Conversation Pane */}
                <div
                  className={`flex-1 flex flex-col min-w-0 bg-[#FAFBFC] ${
                    providerChatMobileView === 'LIST' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  {activeProviderConv ? (
                    <>
                      {/* Active Conversation Top Bar */}
                      <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setProviderChatMobileView('LIST')}
                            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                          </button>
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xs shrink-0">
                            {activeCustomerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{activeCustomerName}</h4>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                Customer
                              </span>
                              {activeProviderConv.bookingRef && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-50 text-orange-900 border border-orange-200">
                                  {activeProviderConv.bookingRef}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">
                              {activeProviderConv.about} {activeProviderConv.dates ? `· ${activeProviderConv.dates}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Customer Direct Contact Actions */}
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${activeCustomerPhone}`}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1 transition"
                            title={`Call Customer (${activeCustomerPhone})`}
                          >
                            <Phone className="w-3 h-3 text-[#C2410C]" />
                            <span className="hidden sm:inline">Call Customer</span>
                          </a>

                          <a
                            href={activeCustomerWhatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                            title={`WhatsApp Customer (${activeCustomerPhone})`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Direct WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {providerChatMessages.map((m) => {
                          const isMe = currentUser ? m.senderId === currentUser.id : m.senderRole === 'PROVIDER';
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                                  isMe
                                    ? 'bg-[#7C2D12] text-white rounded-br-xs shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-2xs'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{m.text}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 px-1 mt-0.5">
                                {m.timeStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Input Bar */}
                      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                        <input
                          type="text"
                          value={providerChatInput}
                          onChange={(e) => setProviderChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendProviderMessage();
                            }
                          }}
                          placeholder={`Reply to ${activeCustomerName} as ${companyName}...`}
                          className="flex-1 h-10 px-3.5 border border-slate-300 rounded-xl font-sans text-xs text-slate-900 outline-none focus:border-orange-600"
                        />
                        <button
                          type="button"
                          onClick={handleSendProviderMessage}
                          className="h-10 px-4 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-semibold">Select an inquiry to view messages.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BILLING & SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <BillingHistoryManager
              role="PROVIDER"
              roleTitle="Logistics & Mobility Provider"
              businessName={companyName}
              initialPlanName="Enterprise Cargo & Shuttle Pass"
            />
          )}
        </main>
      </div>

      {/* MODAL: ADD DRIVER TO COMPANY ROSTER */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add Driver to Company Fleet</h3>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDriverSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="e.g. Muhammad Asif"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Direct Contact / Phone *</label>
                <input
                  type="tel"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">National ID (CNIC / Passport)</label>
                <input
                  type="text"
                  value={newDriverCnic}
                  onChange={(e) => setNewDriverCnic(e.target.value)}
                  placeholder="35201-1234567-1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Category</label>
                  <select
                    value={newDriverLicense}
                    onChange={(e: any) => setNewDriverLicense(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="HTV">HTV (Heavy Transport)</option>
                    <option value="PSV">PSV (Passenger Public)</option>
                    <option value="LTV">LTV (Light Transport)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Truck</label>
                  <select
                    value={newDriverAssignTruck}
                    onChange={(e) => setNewDriverAssignTruck(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {commercialFleet.map((f) => (
                      <option key={f.id} value={`${f.model} (${f.reg})`}>
                        {f.model} ({f.reg})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold rounded-xl"
                >
                  Add & Allot Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMMUTER PICK & DROP ROUTE */}
      {showAddRouteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddRouteModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">+ Add Pick & Drop Commuter Route</h3>
                <p className="text-[11px] text-slate-500">
                  Publish a new school, college, or corporate route with stops & live seats.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRouteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRouteSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Title / Main Path *</label>
                <input
                  type="text"
                  required
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  placeholder="e.g. Rawalpindi Saddar to Islamabad Blue Area / F-8"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating City</label>
                  <select
                    value={newRouteCity}
                    onChange={(e) => setNewRouteCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Commute Audience</label>
                  <select
                    value={newRouteCategory}
                    onChange={(e) => setNewRouteCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Office Staff & Corporate">🏢 Office Staff & Corporate</option>
                    <option value="School / College Students">🎒 School & College Students</option>
                    <option value="University Campus Commute">🎓 University Students (NUST/FAST/LUMS)</option>
                    <option value="Women Only & Families">👩‍💼 Women Only & Working Women</option>
                  </select>
                </div>
              </div>

              {/* Stops & Timings */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    Scheduled Waypoints & In-Between Stops *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Sub-route matching active
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={newRouteStopsText}
                  onChange={(e) => setNewRouteStopsText(e.target.value)}
                  placeholder="e.g. Area 1 (07:15) ➔ Area 2 (07:30) ➔ Area 3 (07:45) ➔ Area 4 (08:15)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs sm:text-sm"
                />
                
                {/* Quick Area Chips for Selected City */}
                <div className="mt-2 flex flex-col gap-1.5 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] font-extrabold text-emerald-900 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-700" />
                    <span>Quick-add major areas in {newRouteCity} (Click to append):</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(CITY_COMMUTE_AREAS[newRouteCity] || CITY_COMMUTE_AREAS['Karachi'] || []).slice(0, 10).map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          const separator = newRouteStopsText.trim() ? ' ➔ ' : '';
                          setNewRouteStopsText((prev) => `${prev.trim()}${separator}${area}`);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px] font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                      >
                        + {area}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    💡 <strong>How sub-route matching works:</strong> If you add 8 stops between your origin and destination, passengers searching between <em>any two stops along the corridor</em> (e.g. Stop 2 to Stop 5) will be matched to your van!
                  </span>
                </div>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Morning Pickup Time</label>
                  <input
                    type="text"
                    value={newRouteMorningTime}
                    onChange={(e) => setNewRouteMorningTime(e.target.value)}
                    placeholder="07:15 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Evening Return Time</label>
                  <input
                    type="text"
                    value={newRouteEveningTime}
                    onChange={(e) => setNewRouteEveningTime(e.target.value)}
                    placeholder="05:30 PM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              {/* Vehicle & Driver */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Shuttle Vehicle</label>
                  <select
                    value={newRouteVehicle}
                    onChange={(e) => setNewRouteVehicle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Toyota HiAce Grand Cabin (LEA-24-9988)">Toyota HiAce Grand Cabin (14 Seats)</option>
                    <option value="Toyota Coaster Executive (ISB-CS-202)">Toyota Coaster Executive (22 Seats)</option>
                    <option value="Suzuki APV GLX (KHI-AP-881)">Suzuki APV GLX (7 Seats)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Chauffeur</label>
                  <select
                    value={newRouteDriver}
                    onChange={(e) => setNewRouteDriver(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {driverTeam.map((d) => (
                      <option key={d.id} value={d.name}>
                        👨‍✈️ {d.name} ({d.licenseCategory})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capacity & Live Available Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={newRouteCapacity}
                    onChange={(e) => setNewRouteCapacity(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={newRouteAvailableSeats}
                    onChange={(e) => setNewRouteAvailableSeats(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Fare (PKR)</label>
                  <input
                    type="number"
                    value={newRouteMonthlyRate}
                    onChange={(e) => setNewRouteMonthlyRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Rate (PKR)</label>
                  <input
                    type="number"
                    value={newRouteDailyRate}
                    onChange={(e) => setNewRouteDailyRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Publish & List Commuter Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PICK & DROP COMMUTER ROUTE (FULL CRUD)                         */}
      {/* ========================================================================= */}
      {editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-base text-slate-900">Edit Commuter Route</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoute(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRouteEdit} className="space-y-3.5">
              {/* Route Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Route Title / Path *</label>
                <input
                  type="text"
                  required
                  value={editingRoute.title}
                  onChange={(e) => setEditingRoute({ ...editingRoute, title: e.target.value })}
                  placeholder="e.g. Johar Town ➔ Gulberg Main Blvd / Mall Road"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* City & Target Group */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Operating City</label>
                  <select
                    value={editingRoute.city}
                    onChange={(e) => setEditingRoute({ ...editingRoute, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Commuter Group</label>
                  <select
                    value={editingRoute.category}
                    onChange={(e) => setEditingRoute({ ...editingRoute, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Office Staff & Corporate">🏢 Office Staff & Corporate</option>
                    <option value="School / College Students">🎒 School & College Students</option>
                    <option value="University Campus Commute">🎓 University Students (NUST/FAST/LUMS)</option>
                    <option value="Women Only & Families">👩‍💼 Women Only & Working Women</option>
                  </select>
                </div>
              </div>

              {/* Vehicle & Chauffeur */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designated Shuttle Vehicle</label>
                  <input
                    type="text"
                    value={editingRoute.vehicle}
                    onChange={(e) => setEditingRoute({ ...editingRoute, vehicle: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designated Chauffeur & Phone</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={editingRoute.assignedDriver}
                      onChange={(e) => setEditingRoute({ ...editingRoute, assignedDriver: e.target.value })}
                      placeholder="Driver Name"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <input
                      type="text"
                      value={editingRoute.driverPhone}
                      onChange={(e) => setEditingRoute({ ...editingRoute, driverPhone: e.target.value })}
                      placeholder="+92 301 0000000"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Timings */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Scheduled Duty Timings</label>
                <input
                  type="text"
                  value={editingRoute.timings}
                  onChange={(e) => setEditingRoute({ ...editingRoute, timings: e.target.value })}
                  placeholder="e.g. 07:20 AM – 05:30 PM"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              {/* Fares & Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={editingRoute.capacity}
                    onChange={(e) => setEditingRoute({ ...editingRoute, capacity: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Available Seats</label>
                  <input
                    type="number"
                    value={editingRoute.availableSeats}
                    onChange={(e) => setEditingRoute({ ...editingRoute, availableSeats: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-teal-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Fare (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.monthlySeatRate}
                    onChange={(e) => setEditingRoute({ ...editingRoute, monthlySeatRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Pass (PKR)</label>
                  <input
                    type="number"
                    value={editingRoute.dailySeatRate}
                    onChange={(e) => setEditingRoute({ ...editingRoute, dailySeatRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Intermediate Boarding Stops Manager */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-teal-950 flex items-center gap-1.5">
                    <span>🚏</span>
                    <span>Intermediate Boarding Stops & Timings</span>
                  </span>
                  <span className="text-[10px] text-teal-800 font-bold">{editRouteStops.length} Stops Configured</span>
                </div>

                {/* Existing Stops Editor */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {editRouteStops.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-teal-100">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={st.stop}
                        onChange={(e) => {
                          const updated = [...editRouteStops];
                          updated[idx].stop = e.target.value;
                          setEditRouteStops(updated);
                        }}
                        className="flex-1 p-1 text-xs font-bold text-slate-900 border-b border-slate-200 outline-none"
                      />
                      <input
                        type="text"
                        value={st.time}
                        onChange={(e) => {
                          const updated = [...editRouteStops];
                          updated[idx].time = e.target.value;
                          setEditRouteStops(updated);
                        }}
                        className="w-20 p-1 font-mono text-[11px] font-bold text-teal-800 border-b border-slate-200 outline-none text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStopFromEdit(idx)}
                        className="w-6 h-6 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                        title="Remove stop"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Stop Inline Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newStopInput}
                    onChange={(e) => setNewStopInput(e.target.value)}
                    placeholder="New stop name (e.g. Canal View, F-8 Markaz...)"
                    className="flex-1 p-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                  <input
                    type="text"
                    value={newStopTimeInput}
                    onChange={(e) => setNewStopTimeInput(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-24 p-2 bg-white border border-teal-200 rounded-xl text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddStopToEdit}
                    className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    + Add Stop
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Route Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT COMMERCIAL VEHICLE (FULL CRUD & TARIFFS - RESPONSIVE MODAL)    */}
      {/* ========================================================================= */}
      {editingTruck && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh]">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-black text-sm sm:text-base text-slate-900">Edit Vehicle & Tariff Rates</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTruck(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTruckEdit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Model & Specification *</label>
                <input
                  type="text"
                  required
                  value={editingTruck.model}
                  onChange={(e) => setEditingTruck({ ...editingTruck, model: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#C2410C] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category / Type *</label>
                  <select
                    value={editingTruck.type || 'CARGO_MOVING'}
                    onChange={(e) => setEditingTruck({ ...editingTruck, type: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="CARGO_MOVING">Cargo & Moving (Shehzore/Ravi/Mazda)</option>
                    <option value="PASSENGER_SHUTTLE">Passenger Shuttle (HiAce/Coaster/APV)</option>
                    <option value="COMMERCIAL_HAULAGE">Commercial Haulage / Flatbed</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration # *</label>
                  <input
                    type="text"
                    required
                    value={editingTruck.reg}
                    onChange={(e) => setEditingTruck({ ...editingTruck, reg: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Operating City</label>
                  <select
                    value={editingTruck.baseCity}
                    onChange={(e) => setEditingTruck({ ...editingTruck, baseCity: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {editingTruck.type === 'PASSENGER_SHUTTLE' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Passenger Capacity</label>
                    <input
                      type="text"
                      value={editingTruck.capacityCubicFt || '14 Passengers'}
                      onChange={(e) => setEditingTruck({ ...editingTruck, capacityCubicFt: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      placeholder="e.g. 14 Passengers"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Capacity in Tons</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingTruck.capacityTons || 2.5}
                      onChange={(e) => setEditingTruck({ ...editingTruck, capacityTons: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {editingTruck.type !== 'PASSENGER_SHUTTLE' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume / Cargo Space Description</label>
                  <input
                    type="text"
                    value={editingTruck.capacityCubicFt}
                    onChange={(e) => setEditingTruck({ ...editingTruck, capacityCubicFt: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    placeholder="e.g. 350 cu. ft"
                  />
                </div>
              )}

              {/* Tariff & Rates Setup */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
                <span className="font-extrabold text-xs text-[#9A3412] block">
                  Vehicle Tariff & Rates Setup
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Base Fare (PKR)</label>
                    <input
                      type="number"
                      required
                      value={editingTruck.baseFare || 4500}
                      onChange={(e) => setEditingTruck({ ...editingTruck, baseFare: Number(e.target.value) })}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs"
                      placeholder="4500"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Includes base distance</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Per KM (PKR/km)</label>
                    <input
                      type="number"
                      required
                      value={editingTruck.kmRate || 120}
                      onChange={(e) => setEditingTruck({ ...editingTruck, kmRate: Number(e.target.value) })}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs"
                      placeholder="120"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Distance fee</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Per Helper (PKR)</label>
                    <input
                      type="number"
                      required
                      value={editingTruck.helperRate || 1000}
                      onChange={(e) => setEditingTruck({ ...editingTruck, helperRate: Number(e.target.value) })}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs"
                      placeholder="1000"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Labor per helper</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Allotted Chauffeur / Driver</label>
                <select
                  value={editingTruck.driverName}
                  onChange={(e) => setEditingTruck({ ...editingTruck, driverName: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Unassigned">-- Assign Driver Later (Unassigned) --</option>
                  {driverTeam.map((d) => (
                    <option key={d.id} value={d.name}>
                      👨‍✈️ {d.name} ({d.licenseCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sticky bottom-0 z-10 bg-slate-50/95 backdrop-blur-md -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingTruck(null)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-black rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Vehicle Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER NEW VEHICLE (RESPONSIVE, NON-CLUTTERED, DESKTOP + MOBILE) */}
      {/* ========================================================================= */}
      {showAddTruckModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    newTruckType === 'PASSENGER_SHUTTLE'
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-orange-100 text-[#C2410C]'
                  }`}
                >
                  {newTruckType === 'PASSENGER_SHUTTLE' ? (
                    <Bus className="w-5 h-5" />
                  ) : (
                    <Truck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    {newTruckType === 'PASSENGER_SHUTTLE'
                      ? 'Register Commuter Shuttle'
                      : 'Register Commercial Vehicle'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {newTruckType === 'PASSENGER_SHUTTLE'
                      ? 'Add passenger van or coaster to your fleet'
                      : 'Add moving truck with custom base fare & rates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTruckModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <form onSubmit={handleCreateNewTruck} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {/* Category Segmented Control */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSwitchCategory('PASSENGER_SHUTTLE')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    newTruckType === 'PASSENGER_SHUTTLE'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>Passenger Shuttle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCategory('CARGO_MOVING')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    newTruckType === 'CARGO_MOVING'
                      ? 'bg-white text-[#C2410C] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Moving & Cargo Truck</span>
                </button>
              </div>

              {/* Quick Presets Pills */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Quick 1-Click Fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {VEHICLE_PRESETS.filter((p) => p.type === newTruckType).map((p) => {
                    const isSelected = newTruckModel === p.model;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyVehiclePreset(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model & Specification */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Vehicle Model & Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newTruckType === 'PASSENGER_SHUTTLE'
                      ? 'e.g. Toyota HiAce Grand Cabin (14 Seats)'
                      : 'e.g. Hyundai Shehzore D-100 (2.5 Ton)'
                  }
                  value={newTruckModel}
                  onChange={(e) => setNewTruckModel(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#C2410C] focus:bg-white transition"
                />
              </div>

              {/* Reg # & Operating City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LEA-24-9988"
                    value={newTruckReg}
                    onChange={(e) => setNewTruckReg(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#C2410C] focus:bg-white transition uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Operating City Base
                  </label>
                  <select
                    value={newTruckCity}
                    onChange={(e) => setNewTruckCity(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#C2410C] focus:bg-white transition"
                  >
                    {availableCoverageCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capacity & Specs based on Type */}
              {newTruckType === 'PASSENGER_SHUTTLE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Passenger Seats *
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={60}
                      value={newTruckSeats}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewTruckSeats(val);
                        setNewTruckCapacityCubicFt(`${val} Passengers`);
                      }}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                      placeholder="14"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Comfort & AC Status
                    </label>
                    <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-bold text-slate-800 text-xs">
                      ❄️ Chilled Dual AC / Executive Seats
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Payload Capacity (Tons) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0.5}
                      value={newTruckCapacityTons}
                      onChange={(e) => setNewTruckCapacityTons(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Cargo Box Space (cu. ft)
                    </label>
                    <input
                      type="text"
                      value={newTruckCapacityCubicFt}
                      onChange={(e) => setNewTruckCapacityCubicFt(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      placeholder="350 cu. ft"
                    />
                  </div>
                </div>
              )}

              {/* Tariff & Rates Card */}
              <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-[#9A3412]">
                    Tariff & Rates Setup
                  </span>
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                    Auto-used in Calculations
                  </span>
                </div>

                {newTruckType === 'PASSENGER_SHUTTLE' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Base Route / Trip Fare (PKR)
                      </label>
                      <input
                        type="number"
                        required
                        min={500}
                        value={newTruckBaseFare}
                        onChange={(e) => setNewTruckBaseFare(Number(e.target.value))}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#C2410C]"
                        placeholder="3500"
                      />
                      <span className="text-[9px] text-slate-500 block mt-0.5">Base charter or trip fee</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Per KM Rate (PKR/km)
                      </label>
                      <input
                        type="number"
                        required
                        min={10}
                        value={newTruckKmRate}
                        onChange={(e) => setNewTruckKmRate(Number(e.target.value))}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#C2410C]"
                        placeholder="100"
                      />
                      <span className="text-[9px] text-slate-500 block mt-0.5">Per km fuel/wear charge</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Base Fare (PKR) *
                      </label>
                      <input
                        type="number"
                        required
                        min={500}
                        value={newTruckBaseFare}
                        onChange={(e) => setNewTruckBaseFare(Number(e.target.value))}
                        className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#C2410C]"
                        placeholder="4500"
                      />
                      <span className="text-[9px] text-slate-500 block mt-0.5">First 5 km included</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Per KM (PKR/km) *
                      </label>
                      <input
                        type="number"
                        required
                        min={10}
                        value={newTruckKmRate}
                        onChange={(e) => setNewTruckKmRate(Number(e.target.value))}
                        className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#C2410C]"
                        placeholder="120"
                      />
                      <span className="text-[9px] text-slate-500 block mt-0.5">Distance fee</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Per Helper (PKR) *
                      </label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={newTruckHelperRate}
                        onChange={(e) => setNewTruckHelperRate(Number(e.target.value))}
                        className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#C2410C]"
                        placeholder="1000"
                      />
                      <span className="text-[9px] text-slate-500 block mt-0.5">Labor per helper</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Allotted Driver */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Allotted Driver / Chauffeur
                </label>
                <select
                  value={newTruckDriver}
                  onChange={(e) => setNewTruckDriver(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Unassigned">-- Assign Driver Later (Unassigned) --</option>
                  {driverTeam.map((d) => (
                    <option key={d.id} value={d.name}>
                      👨‍✈️ {d.name} ({d.licenseCategory})
                    </option>
                  ))}
                </select>
              </div>

              {/* STICKY FOOTER ACTION BUTTONS */}
              <div className="sticky bottom-0 z-10 bg-slate-50/95 backdrop-blur-md -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTruckModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-black rounded-xl text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Add Vehicle to Fleet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Mobile Bottom Navigation Bar */}
      <MobileNavBar />
    </div>
  );
}
