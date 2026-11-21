'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  UserCheck,
  Clock,
  ShieldCheck,
  Star,
  Calendar,
  MessageCircle,
  CreditCard,
  Settings,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Phone,
  FileText,
  Upload,
  Scan,
  Check,
  Power,
  EyeOff,
  Eye,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  Trash2,
  Lock,
  Edit3,
  X,
  Sparkles,
  MessageSquare,
  ExternalLink,
  Send,
  ArrowRight,
  BarChart2,
  Receipt,
} from 'lucide-react';
import { AnalyticsReportHub } from '@/components/AnalyticsReportHub';
import { API_BASE, formatPKR, maskCnic, maskLicense, maskPhone } from '@/lib/api';
import { SubscriptionPricingSection } from '@/components/SubscriptionPricingSection';
import { BillingHistoryManager } from '@/components/BillingHistoryManager';
import { getActiveUser, RegisteredUser, logoutActiveUser, getUserDashboardPath, syncSubscriptionExpiries } from '@/data/userAuth';
import {
  getDriverBookings,
  confirmDriverBooking,
  declineDriverBooking,
  maskPakistaniCnic,
  maskPakistaniLicense,
  DriverBooking,
} from '@/data/driverBookings';
import { MobileNavBar } from '@/components/MobileNavBar';
import { DashboardStoreWidget } from '@/components/DashboardStoreWidget';
import { isDocActiveForRole, isDocMandatoryForRole } from '@/data/docRules';
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
import { useCountry } from '@/app/context/CountryContext';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';

function DriverDashboardContent() {
  const { country } = useCountry();
  const searchParams = useSearchParams();
  const isPakistan = !country || country.code === 'PK';
  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'availability' | 'rates' | 'requests' | 'chats' | 'documents' | 'reviews' | 'subscription'
  >('overview');

  const handleTabChange = (
    newTab: 'overview' | 'analytics' | 'availability' | 'rates' | 'requests' | 'chats' | 'documents' | 'reviews' | 'subscription'
  ) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      const currentState = window.history.state;
      window.history.replaceState(currentState, '', url.pathname + url.search);
      window.dispatchEvent(new CustomEvent('safarpk_active_tab_changed', { detail: { tab: newTab } }));
    }
  };

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab &&
      ['overview', 'analytics', 'availability', 'rates', 'requests', 'chats', 'documents', 'reviews', 'subscription'].includes(
        tab
      )
    ) {
      setActiveTab(tab as any);
      window.dispatchEvent(new CustomEvent('safarpk_active_tab_changed', { detail: { tab } }));
    }
  }, [searchParams]);

  // Listen for direct tab switch events (from MobileNavBar or shortcuts)
  useEffect(() => {
    const handleTabSwitch = (e: any) => {
      const target = e.detail?.tab;
      if (
        target &&
        ['overview', 'analytics', 'availability', 'rates', 'requests', 'chats', 'documents', 'reviews', 'subscription'].includes(
          target
        )
      ) {
        setActiveTab(target as any);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', target);
          const currentState = window.history.state;
      window.history.replaceState(currentState, '', url.pathname + url.search);
        }
      }
    };
    window.addEventListener('safarpk_driver_switch_tab', handleTabSwitch);
    return () => window.removeEventListener('safarpk_driver_switch_tab', handleTabSwitch);
  }, []);

  // Active Driver User Session
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  // Driver In-App Customer Chats State
  const [driverConversations, setDriverConversations] = useState<ChatConversation[]>([]);
  const [activeDriverChatId, setActiveDriverChatId] = useState<string>('');
  const [driverChatMessages, setDriverChatMessages] = useState<ChatMessage[]>([]);
  const [driverChatInput, setDriverChatInput] = useState<string>('');
  const [driverChatMobileView, setDriverChatMobileView] = useState<'LIST' | 'CONV'>('LIST');

  // Driver Profile State
  const [driverName, setDriverName] = useState('Tariq Mahmood');
  const [driverPhone, setDriverPhone] = useState('+92 301 9821045');
  const [driverCity, setDriverCity] = useState('Lahore');
  const [driverBio, setDriverBio] = useState(
    'Ex-Executive Chauffeur for corporate MNCs. Non-smoker, fluent in Urdu and Punjabi, experienced on M-2 & M-3 Motorways.'
  );

  const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);

  // Sync with logged in driver profile & enforce Driver role guard
  useEffect(() => {
    syncSubscriptionExpiries();
    const user = getActiveUser();
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?redirect=/driver');
      }
      return;
    }
    if (user.role !== 'DRIVER') {
      if (typeof window !== 'undefined') {
        window.location.replace(getUserDashboardPath(user));
      }
      return;
    }

    setCurrentUser(user);
    if (user.name) {
      setDriverName(user.name);
      setEditDriverName(user.name);
    }
    if (user.phone) {
      setDriverPhone(user.phone);
      setEditDriverPhone(user.phone);
    }
    if (user.city) {
      setDriverCity(user.city);
    }
    if (user.bio) {
      setDriverBio(user.bio);
      setEditDriverBio(user.bio);
    }

    // Sync bookings queue
    setRequests(getDriverBookings());
    const handleBookingUpdate = () => {
      setRequests(getDriverBookings());
    };
    window.addEventListener('safarpk_driver_booking_status_updated', handleBookingUpdate);
    return () => {
      window.removeEventListener('safarpk_driver_booking_status_updated', handleBookingUpdate);
    };
  }, []);

  // Booking Confirmation Handlers
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  const handleConfirmBooking = (bookingId: string, clientName: string) => {
    const res = confirmDriverBooking(bookingId);
    if (res.success) {
      setBookingNotice(`✓ Booking confirmed for ${clientName}! Your verified CNIC (${driverCnic}) and Driving Licence (${licenseNumber}) have been securely released to the customer's portal.`);
      setRequests(getDriverBookings());
      setTimeout(() => setBookingNotice(null), 5000);
    }
  };

  const handleDeclineBooking = (bookingId: string) => {
    declineDriverBooking(bookingId);
    setBookingNotice('Booking request declined.');
    setRequests(getDriverBookings());
    setTimeout(() => setBookingNotice(null), 3000);
  };

  // Edit Driver Profile Modal State (FULL CRUD)
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [editDriverName, setEditDriverName] = useState(driverName);
  const [editDriverPhone, setEditDriverPhone] = useState(driverPhone);
  const [editDriverBio, setEditDriverBio] = useState(driverBio);

  const handleSaveDriverProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setDriverName(editDriverName);
    setDriverPhone(editDriverPhone);
    setDriverBio(editDriverBio);
    setShowEditDriverModal(false);
    setRatesSavedNotice('✅ Driver Profile, contact details & bio successfully updated live!');
    setTimeout(() => setRatesSavedNotice(null), 3500);
  };

  // Driver In-App Customer Chats Synchronization
  useEffect(() => {
    const activeDriver = currentUser || {
      id: 'usr-demo-driver',
      name: driverName || 'Tariq Mahmood',
      role: 'DRIVER' as any,
      city: driverCity || 'Lahore',
      phone: driverPhone || '+92 301 9821045',
      countryCode: 'PK',
      registeredAt: new Date().toISOString(),
      subscription: { status: 'ACTIVE', quota: 10, usedQuota: 1 },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: 'Now' },
      activities: [],
    };
    const convs = getUserConversations(activeDriver as any);
    setDriverConversations(convs);
    if (convs.length > 0 && !activeDriverChatId) {
      setActiveDriverChatId(convs[0].id);
    }
  }, [currentUser, driverName, driverPhone]);

  useEffect(() => {
    if (!activeDriverChatId) return;
    const driverId = currentUser?.id || 'usr-demo-driver';
    markConversationAsRead(activeDriverChatId, driverId);
    setDriverChatMessages(getConversationMessages(activeDriverChatId));
    const activeDriver = currentUser || {
      id: 'usr-demo-driver',
      name: driverName || 'Tariq',
      role: 'DRIVER' as any,
      phone: driverPhone,
      city: driverCity,
    };
    setDriverConversations(getUserConversations(activeDriver as any));
  }, [activeDriverChatId]);

  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const activeDriver = currentUser || {
        id: 'usr-demo-driver',
        name: driverName || 'Tariq',
        role: 'DRIVER' as any,
        phone: driverPhone,
        city: driverCity,
      };
      const convs = getUserConversations(activeDriver as any);
      setDriverConversations(convs);
      if (activeDriverChatId && e.detail?.conversationId === activeDriverChatId) {
        setDriverChatMessages(getConversationMessages(activeDriverChatId));
      }
    };
    window.addEventListener('safarpk_chat_updated', handleChatUpdate);
    window.addEventListener('storage', handleChatUpdate);
    return () => {
      window.removeEventListener('safarpk_chat_updated', handleChatUpdate);
      window.removeEventListener('storage', handleChatUpdate);
    };
  }, [activeDriverChatId, currentUser]);

  const handleSendDriverMessage = () => {
    if (!driverChatInput.trim() || !activeDriverChatId) return;
    const activeDriver = currentUser || {
      id: 'usr-demo-driver',
      name: driverName || 'Tariq Mahmood',
      role: 'DRIVER' as any,
      city: driverCity || 'Lahore',
      phone: driverPhone || '+92 301 9821045',
      countryCode: 'PK',
      registeredAt: new Date().toISOString(),
      subscription: { status: 'ACTIVE', quota: 10, usedQuota: 1 },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: 'Now' },
      activities: [],
    };

    const activeConv = driverConversations.find((c) => c.id === activeDriverChatId);
    if (!activeConv) return;

    const partnerId =
      activeConv.participantIds.find((id) => id !== activeDriver.id) || 'usr-demo-customer';
    const partnerName = activeConv.participantNames[partnerId] || 'Customer Booker';

    sendChatMessage({
      conversationId: activeDriverChatId,
      senderUser: activeDriver as any,
      receiverId: partnerId,
      receiverName: partnerName,
      text: driverChatInput.trim(),
      ref: activeConv.bookingRef,
      itemDetails: activeConv.about,
    });

    setDriverChatInput('');
    setDriverChatMessages(getConversationMessages(activeDriverChatId));
  };

  const unreadDriverChatsCount = driverConversations.reduce((acc, c) => {
    const driverId = currentUser?.id || 'usr-demo-driver';
    return acc + (c.unreadCountFor?.[driverId] || 0);
  }, 0);

  // Master Availability Switch (3 States: AVAILABLE, BUSY, OFFLINE)
  const [availability, setAvailability] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');
  const [availabilityNotice, setAvailabilityNotice] = useState<string | null>(null);

  // Client Hire & Contact Requirement Switch (Default: REQUIRED_DETAILS)
  const [hireRequirement, setHireRequirement] = useState<'REQUIRED_DETAILS' | 'DIRECT_CONTACT'>('REQUIRED_DETAILS');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('safarpk_driver_hire_requirement');
      if (stored === 'DIRECT_CONTACT' || stored === 'REQUIRED_DETAILS') {
        setHireRequirement(stored);
      }
    } catch (e) {}
  }, []);

  // Self-Managed Pricing (Hourly, Daily, Full-Day with hours, Outstation)
  const [hourlyRate, setHourlyRate] = useState('350');
  const [hourlyMinHours, setHourlyMinHours] = useState('4');
  const [dailyRateLocal8Hr, setDailyRateLocal8Hr] = useState('2200');
  const [dailyRateLocal12Hr, setDailyRateLocal12Hr] = useState('2800');
  const [dailyRate24Hr, setDailyRate24Hr] = useState('4200');
  const [overtimePerHour, setOvertimePerHour] = useState('300');
  const [outstationRatePerDay, setOutstationRatePerDay] = useState('3800');
  const [nightStayAllowance, setNightStayAllowance] = useState('1500');
  const [ratesSavedNotice, setRatesSavedNotice] = useState<string | null>(null);

  // Availability Schedule & Working Hours
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);
  const [shiftStartTime, setShiftStartTime] = useState('08:00 AM');
  const [shiftEndTime, setShiftEndTime] = useState('08:00 PM');
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-11-20', '2026-11-21']);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Operating Coverage Cities & Custom City Autonomy (Matching Image 7)
  const [driverAvailableCities, setDriverAvailableCities] = useState<string[]>([
    'Lahore',
    'Islamabad',
    'Rawalpindi',
    'Karachi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Gujranwala',
  ]);
  const [driverOperatingCities, setDriverOperatingCities] = useState<string[]>([
    'Lahore',
    'Islamabad',
    'Rawalpindi',
  ]);
  const [customCityDriverInput, setCustomCityDriverInput] = useState('');
  const [showCustomCityDriver, setShowCustomCityDriver] = useState(false);

  const handleToggleDriverCoverageCity = (city: string) => {
    if (driverOperatingCities.includes(city)) {
      if (driverOperatingCities.length > 1) {
        setDriverOperatingCities(driverOperatingCities.filter((c) => c !== city));
      }
    } else {
      setDriverOperatingCities([...driverOperatingCities, city]);
    }
  };

  const handleAddCustomCityDriver = () => {
    const trimmed = customCityDriverInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!driverAvailableCities.includes(formatted)) {
      setDriverAvailableCities([...driverAvailableCities, formatted]);
    }
    if (!driverOperatingCities.includes(formatted)) {
      setDriverOperatingCities([...driverOperatingCities, formatted]);
    }
    setDriverCity(formatted);
    setCustomCityDriverInput('');
    setShowCustomCityDriver(false);
  };

  // Document Uploads & OCR Verification
  const [licenseCategory, setLicenseCategory] = useState<'LTV' | 'HTV' | 'PSV'>('LTV');
  const [licenseNumber, setLicenseNumber] = useState('LHR-LTV-99210');
  const [licenseExpiry, setLicenseExpiry] = useState('2028-09-14');
  const [driverCnic, setDriverCnic] = useState('35201-4412098-5');
  const [licenseDocPreview, setLicenseDocPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
  );
  const [licenseDocName, setLicenseDocName] = useState('driving_license_card.jpg');
  const [cnicDocPreview, setCnicDocPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'
  );
  const [cnicDocName, setCnicDocName] = useState('national_id_card.jpg');
  const [policeCertPreview, setPoliceCertPreview] = useState<string | null>(null);
  const [docScanState, setDocScanState] = useState<'IDLE' | 'SCANNING' | 'VERIFIED'>('VERIFIED');
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // Incoming Hiring Requests Queue
  const [requests, setRequests] = useState<any[]>([
    {
      id: 'dreq-1',
      bookingRef: 'DRV-4410',
      customerName: 'Chaudhry Bilal',
      customerPhone: '+92 300 5512901',
      startDate: '2026-11-14',
      days: 2,
      dutyType: 'OUT_OF_STATION',
      destination: 'Lahore to Murree Hills (Family Trip)',
      vehicleProvided: 'Customer Honda Civic',
      totalFare: 7600,
      status: 'CONFIRMED',
    },
    {
      id: 'dreq-2',
      bookingRef: 'DRV-8912',
      customerName: 'Malik Zeeshan',
      customerPhone: '+92 321 8891024',
      startDate: '2026-11-16',
      days: 1,
      dutyType: 'LOCAL_FULL_DAY',
      destination: 'Lahore City Wedding Conveyance (12 Hours)',
      vehicleProvided: 'Customer Toyota Fortuner',
      totalFare: 2800,
      status: 'PENDING_CONFIRMATION',
    },
  ]);

  // Ratings & Reviews
  const [reviews] = useState<any[]>([
    {
      id: 'rev-1',
      author: 'Kamran Haider',
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent driver! Safe driving on the motorway at night, very polite and punctual.',
    },
    {
      id: 'rev-2',
      author: 'Shahid Butt',
      rating: 5,
      date: '1 week ago',
      comment: 'Very professional chauffeur. Drove my family to Islamabad safely and was available on time.',
    },
  ]);

  // Master Toggle Availability Handler
  const handleToggleStatus = (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    if (newStatus === 'AVAILABLE' && currentUser?.subscription?.status !== 'ACTIVE') {
      setAvailabilityNotice('⚠️ Active subscription required to go online. Your profile is paused. Please renew your subscription pass or contact support.');
      setTimeout(() => setAvailabilityNotice(null), 5000);
      return;
    }
    setAvailability(newStatus);
    if (newStatus === 'OFFLINE') {
      setAvailabilityNotice('🔴 You are now OFFLINE. Your profile is HIDDEN from the public marketplace.');
    } else if (newStatus === 'AVAILABLE') {
      setAvailabilityNotice('🟢 You are now ONLINE & AVAILABLE. Customers can find and hire you directly.');
    } else {
      setAvailabilityNotice('🟡 You are marked ON ACTIVE TRIP. Status set to Busy.');
    }
    setTimeout(() => setAvailabilityNotice(null), 4000);
  };

  // Save Self-Managed Rates
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setRatesSavedNotice('✅ Your custom hourly, daily & outstation rates have been updated live!');
    setTimeout(() => setRatesSavedNotice(null), 3500);
  };

  // Toggle Working Days
  const handleToggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Add Blocked Vacation Date
  const handleAddBlockedDate = () => {
    if (!newBlockDate || blockedDates.includes(newBlockDate)) return;
    setBlockedDates([...blockedDates, newBlockDate]);
    setNewBlockDate('');
    setScheduleNotice('Date added to unavailable calendar.');
    setTimeout(() => setScheduleNotice(null), 3000);
  };

  // Remove Blocked Date
  const handleRemoveBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== date));
  };

  // Driver Document Upload Handlers (with strict validation against random web banners)
  const handleUploadLicense = (file?: File) => {
    setDocUploadError(null);
    if (!file) return;
    const lower = file.name.toLowerCase();
    const forbidden = ['banner', '11.11', 'sale', 'promo', 'poster', 'flyer', 'ad_', 'discount'];
    if (forbidden.some((k) => lower.includes(k))) {
      setDocUploadError('Invalid Document: Web banners, advertisements, or promotional artwork are rejected. Please upload a clear photo of your official driving license.');
      return;
    }
    setDocScanState('SCANNING');
    setLicenseDocName(file.name);
    setLicenseDocPreview(URL.createObjectURL(file));
    setTimeout(() => {
      setDocScanState('VERIFIED');
      setLicenseNumber('LHR-LTV-99210');
      setLicenseExpiry('2028-09-14');
    }, 1000);
  };

  const handleUploadCnic = (file?: File) => {
    setDocUploadError(null);
    if (!file) return;
    const lower = file.name.toLowerCase();
    const forbidden = ['banner', '11.11', 'sale', 'promo', 'poster', 'flyer', 'ad_', 'discount'];
    if (forbidden.some((k) => lower.includes(k))) {
      setDocUploadError('Invalid Document: Promotional banners are rejected. Please upload a clear photo of your National ID Card (CNIC / Passport).');
      return;
    }
    setDocScanState('SCANNING');
    setCnicDocName(file.name);
    setCnicDocPreview(URL.createObjectURL(file));
    setTimeout(() => {
      setDocScanState('VERIFIED');
      setDriverCnic('35201-4412098-5');
      setDriverName('Tariq Mahmood');
    }, 1000);
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
            The Driver Cockpit is only accessible to registered {isPakistan ? 'Independent Drivers & Captains' : 'Independent Chauffeurs & Drivers'}.
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
              Sign Out & Register as Driver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Customer Chat Contact Calculations
  const activeDriverConv =
    driverConversations.find((c) => c.id === activeDriverChatId) || driverConversations[0] || null;
  const driverEffectiveId = currentUser?.id || 'usr-demo-driver';
  const activeCustomerPartnerId =
    activeDriverConv?.participantIds.find((id) => id !== driverEffectiveId) || 'usr-demo-customer';
  const activeCustomerName =
    activeDriverConv?.participantNames[activeCustomerPartnerId] || 'Customer Booker';
  const activeCustomerPhone =
    activeDriverConv?.participantPhones[activeCustomerPartnerId] || '+92 300 0000000';

  const activeCustomerMeta = activeDriverConv?.bookingMetadata || {
    category: 'driver' as const,
    customerName: activeCustomerName,
    customerPhone: activeCustomerPhone,
    customerCity: activeDriverConv?.bookingMetadata?.customerCity || driverCity,
    providerName: driverName,
    providerManager: driverName,
    providerPhone: driverPhone,
    itemName: activeDriverConv?.about || 'Chauffeur Hiring Duty',
    pickupDate: activeDriverConv?.dates || 'Scheduled Date',
    bookingRef: activeDriverConv?.bookingRef || 'SF-DriverInquiry',
  };

  const activeCustomerWhatsAppUrl = getWhatsAppTargetUrl(
    activeCustomerPhone,
    generateOwnerFollowUpWhatsAppText(activeCustomerMeta)
  );

  const driverNavItems = [
    { id: 'overview', label: 'Driver Cockpit', icon: User },
    { id: 'analytics', label: '📊 Analytics & Actions', icon: BarChart2 },
    { id: 'availability', label: 'Availability & Duty Switch', icon: Clock },
    { id: 'rates', label: 'Duty Charges & Rates', icon: DollarSign },
    { id: 'requests', label: 'Hiring Requests', icon: Calendar, badge: requests.length },
    {
      id: 'chats',
      label: 'Passenger Chats (Inbox)',
      icon: MessageSquare,
      badge: unreadDriverChatsCount > 0 ? unreadDriverChatsCount : driverConversations.length,
      isHighlight: unreadDriverChatsCount > 0,
    },
    { id: 'documents', label: 'License & CNIC Verification', icon: ShieldCheck },
    { id: 'reviews', label: 'Passenger Ratings', icon: Star },
    { id: 'subscription', label: 'Billing & Monthly Pass', icon: Receipt, badge: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-28 md:pb-0">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                S
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">SafarPK</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              Independent Driver Cockpit
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Passenger Chats Button in Top Navbar */}
            <button
              type="button"
              onClick={() => handleTabChange('chats')}
              className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
              title="Passenger Inquiries & Live In-App Chats"
            >
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Passenger Chats</span>
              {unreadDriverChatsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {unreadDriverChatsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 hidden sm:inline">
                  {driverConversations.length}
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

            {/* Quick Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  availability === 'AVAILABLE'
                    ? 'bg-emerald-500 animate-pulse'
                    : availability === 'BUSY'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="capitalize">{availability.toLowerCase()}</span>
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
          {driverNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white shadow-xs'
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
                        : 'bg-sky-100 text-sky-900 font-bold'
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
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 text-sky-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{driverName}</h3>
                <span className="text-[11px] text-slate-500 block">{licenseCategory} {isPakistan ? 'Verified Driver / Captain' : 'Verified Chauffeur'}</span>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 inline-block">
                    ★ 4.95 (142 Trips)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block ${
                      currentUser?.subscription?.status === 'ACTIVE'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                        ? 'text-amber-800 bg-amber-50 border-amber-300'
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}
                  >
                    {currentUser?.subscription?.planName ||
                      (currentUser?.subscription?.status === 'ACTIVE'
                        ? (isPakistan ? 'Driver & Captain Pass' : 'Chauffeur Pass')
                        : currentUser?.subscription?.status === 'PENDING_APPROVAL'
                        ? 'Pending Approval'
                        : 'Unsubscribed')}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => {
                  setEditDriverName(driverName);
                  setEditDriverPhone(driverPhone);
                  setEditDriverBio(driverBio);
                  setShowEditDriverModal(true);
                }}
                className="w-full py-1.5 px-3 rounded-xl border border-sky-600 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Bio</span>
              </button>
            </div>
          </div>

          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs text-xs font-semibold">
            {driverNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    active
                      ? 'bg-sky-600 text-white shadow-sm font-bold'
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
          {/* DRIVER SUBSCRIPTION PROMOTIONAL BANNER */}
          {currentUser && (!currentUser.subscription || currentUser.subscription.status === 'UNSUBSCRIBED') && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-amber-500/10 border-2 border-sky-600/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-lg">
                  👨‍✈️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Welcome, {driverName}! {isPakistan ? 'Activate Your Driver / Captain Pass' : 'Activate Your Chauffeur Listing Pass'}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      {isPakistan ? 'Driver Pass Required' : 'Chauffeur Pass Required'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isPakistan
                      ? 'Activate your Independent Driver & Captain Pass to receive direct customer ride bookings, outstation assignments, and corporate requests across your chosen cities.'
                      : 'Activate your Independent Chauffeur Pass to receive direct customer ride bookings, outstation assignments, and corporate requests across your chosen cities.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer shrink-0"
              >
                ⚡ Choose Driver Pass & Apply Promo Code
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
                      ⏳ Driver Subscription Payment Under Review
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                      Ref: {currentUser.subscription.paymentRef || 'Submitted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your payment receipt for &ldquo;{currentUser.subscription.planName}&rdquo; is under review by admin. Once approved, your chauffeur profile will go LIVE on the public driver directory.
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

          {/* FREE PROMOTIONAL DRIVER PASS BANNER */}
          {currentUser?.subscription?.isFreePromo && currentUser.subscription.status === 'ACTIVE' && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-2 border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-black shrink-0">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-emerald-950">
                      Launch Promotion Active: 100% Free Driver Subscription!
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-black bg-emerald-600 text-white">
                      Rs. 0 Paid (Value: Rs. {formatPKR(currentUser.subscription.originalAmount || 2500)})
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {currentUser.subscription.freePromoReason || 'SafarPK Driver Promotion: Free subscription granted to list your chauffeur profile and receive direct customer inquiries.'}
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
                      Subscription Pass Paused / Expired
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white">
                      Profile Paused
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Your driver subscription validity has ended. Your profile is temporarily hidden from customer searches. Please renew your subscription pass or contact support to reactivate your listing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                Renew Driver Pass
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Duty Status Card with Master Offline Control */}
              <div className="p-6 bg-gradient-to-r from-sky-900 via-slate-900 to-slate-800 text-white rounded-3xl shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
                      Live Duty & Marketplace Visibility
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black mt-1">
                      {availability === 'OFFLINE'
                        ? 'Profile Offline & Hidden'
                        : availability === 'BUSY'
                        ? 'On Active Trip'
                        : 'Available & Ready for Hire'}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      {availability === 'OFFLINE'
                        ? 'Your profile and contact number are completely HIDDEN from customers in the marketplace.'
                        : 'Customers in ' + driverCity + ' can see your hourly/daily rates and contact you directly.'}
                    </p>
                  </div>

                  {/* 3-State Toggle Switch */}
                  <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('AVAILABLE')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        availability === 'AVAILABLE'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                      <span>Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('BUSY')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        availability === 'BUSY'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-200" />
                      <span>On Trip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus('OFFLINE')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        availability === 'OFFLINE'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Go Offline</span>
                    </button>
                  </div>
                </div>

                {availabilityNotice && (
                  <div className="p-3 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20">
                    {availabilityNotice}
                  </div>
                )}
              </div>

              {/* Offline Warning Banner */}
              {availability === 'OFFLINE' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <EyeOff className="w-5 h-5 text-rose-600" />
                    <div>
                      <strong className="text-rose-950 font-bold block">Privacy Mode Active: You are Offline</strong>
                      <span className="text-rose-800 text-[11px]">Your profile is hidden from the marketplace. No customer can see or book you right now.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus('AVAILABLE')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Go Online Now
                  </button>
                </div>
              )}

              {/* Public Driver Profile Shareable Widget */}
              <DashboardStoreWidget
                type="DRIVER"
                identifier={driverName}
                subtitle="Share your dedicated public chauffeur profile link on WhatsApp status or with private clients to let anyone inspect your licence categories, rates, and contact you directly without needing to log in."
              />

              {/* Client Hire & Direct Contact Policy Switch */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Client Hire & Direct Contact Policy</h3>
                    <p className="text-slate-500 text-[11px]">Choose whether clients must submit verified name and phone before connecting with you.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${hireRequirement === 'REQUIRED_DETAILS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {hireRequirement === 'REQUIRED_DETAILS' ? '🔒 Required Details (Active)' : '⚡ Direct Contact (Active)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setHireRequirement('REQUIRED_DETAILS');
                      localStorage.setItem('safarpk_driver_hire_requirement', 'REQUIRED_DETAILS');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      hireRequirement === 'REQUIRED_DETAILS'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-black">🔒 Require Client Details (Default & Recommended)</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                      Clients must confirm their name and phone before opening your WhatsApp or calling you.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHireRequirement('DIRECT_CONTACT');
                      localStorage.setItem('safarpk_driver_hire_requirement', 'DIRECT_CONTACT');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      hireRequirement === 'DIRECT_CONTACT'
                        ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-black">⚡ Instant Direct Contact</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                      Allow clients to directly message you on WhatsApp without filling verification forms.
                    </span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Hourly Charge</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">PKR {hourlyRate}/hr</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Min {hourlyMinHours} Hours Booking</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Full Day (12 Hrs)</span>
                  <span className="text-2xl font-black text-sky-700 mt-1 block">PKR {dailyRateLocal12Hr}</span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+PKR {overtimePerHour}/hr Overtime</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Intercity Outstation</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">PKR {outstationRatePerDay}/day</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">+PKR {nightStayAllowance} Night Stay</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-semibold block">Driver Rating</span>
                  <span className="text-2xl font-black text-amber-500 mt-1 block">★ 4.95</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">142 Successful Trips</span>
                </div>
              </div>

              {/* Active Hiring Requests */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900">Active Customer Hiring Requests</h3>
                  <button onClick={() => setActiveTab('requests')} className="text-xs font-bold text-sky-700 hover:underline">
                    View All ({requests.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-300">
                            {r.bookingRef}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{r.destination}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-900">
                            {r.dutyType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Client: <strong>{r.customerName}</strong> ({r.customerPhone}) · {r.days} Day(s) · Total: PKR {formatPKR(r.totalFare)}
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/${r.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(r.customerName)},%20confirming%20my%20driver%20booking%20${r.bookingRef}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Direct Contact Client</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1B: DRIVER ANALYTICS & LEAD METRICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsReportHub
                role="DRIVER"
                viewerName={driverName}
                viewerPhone={driverPhone}
                allowExport={true}
                allowClaim={false}
                accentColor="#D97706"
              />
            </div>
          )}

          {/* TAB 2: AVAILABILITY & DUTY TIME SET */}
          {activeTab === 'availability' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Set Availability Schedule & Duty Hours</h3>
                <p className="text-slate-500">Configure your daily working hours, available weekdays, and block vacation dates.</p>
              </div>

              {scheduleNotice && (
                <div className="p-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200">
                  {scheduleNotice}
                </div>
              )}

              {/* Master Offline Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Marketplace Online / Offline Status</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Toggle your profile offline when resting, on break, or unavailable for hire.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus('AVAILABLE')}
                    className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                      availability === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🟢 Online & Available
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus('OFFLINE')}
                    className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                      availability === 'OFFLINE'
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🔴 Go Offline (Hidden)
                  </button>
                </div>
              </div>

              {/* Service Area & Operating Cities (Matching Reference Image 7 with + Custom City) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Service Area & Operating Cities</h4>
                    <p className="text-[11px] text-slate-500">
                      Select cities where you accept driving duties. Selected: <strong className="text-slate-800">{driverOperatingCities.join(', ')}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Base City:</span>
                    <select
                      value={driverCity}
                      onChange={(e) => setDriverCity(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {driverOperatingCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cities Chip List (Matching Reference Image 7) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {driverAvailableCities.map((city) => {
                    const isSelected = driverOperatingCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleToggleDriverCoverageCity(city)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{city}</span>
                      </button>
                    );
                  })}

                  {/* + Custom City Button & Inline Input */}
                  {!showCustomCityDriver ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomCityDriver(true)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold transition border-2 border-dashed border-purple-400 bg-purple-50/60 hover:bg-purple-100 text-purple-900 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+</span>
                      <span>Custom City</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-white border-2 border-purple-600 rounded-full pl-3 pr-1 py-0.5 shadow-sm">
                      <input
                        type="text"
                        autoFocus
                        value={customCityDriverInput}
                        onChange={(e) => setCustomCityDriverInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCityDriver();
                          } else if (e.key === 'Escape') {
                            setShowCustomCityDriver(false);
                          }
                        }}
                        placeholder="Type city name..."
                        className="text-xs outline-none font-bold text-slate-900 w-36 bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCityDriver}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-[11px] cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomCityDriver(false)}
                        className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Shift Hours */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Standard Working Shift Hours</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shift Start Time</label>
                    <input
                      type="text"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shift End Time</label>
                    <input
                      type="text"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      placeholder="08:00 PM"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Available Days */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Weekly Working Days (Click to toggle)</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const active = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {active ? '✓ ' : '+ '} {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Blocked Dates */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-sm text-slate-900">Block Specific Vacation / Busy Dates</h4>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newBlockDate}
                    onChange={(e) => {
                      const today = new Date().toISOString().split('T')[0];
                      if (e.target.value && e.target.value < today) {
                        setNewBlockDate(today);
                      } else {
                        setNewBlockDate(e.target.value);
                      }
                    }}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    + Block Date
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold"
                    >
                      <span>Unavailable: {d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedDate(d)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SELF-MANAGED RATES (HOURLY, DAILY, FULL-DAY, OUTSTATION) */}
          {activeTab === 'rates' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Set Your Driver Charges & Rates</h3>
                <p className="text-slate-500">
                  You have full autonomy over your pricing. Set your hourly, daily, full-day with hours, and intercity travel rates.
                </p>
              </div>

              {ratesSavedNotice && (
                <div className="p-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200">
                  {ratesSavedNotice}
                </div>
              )}

              <form onSubmit={handleSaveRates} className="space-y-5">
                {/* 1. Hourly Rates */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">1. Hourly Hiring Charges</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Hourly Rate (PKR / hour) *</label>
                      <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="350"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Minimum Booking Duration (Hours)</label>
                      <input
                        type="number"
                        value={hourlyMinHours}
                        onChange={(e) => setHourlyMinHours(e.target.value)}
                        placeholder="4"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Daily Local Rates */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">2. Local Daily Rates (Within {driverCity})</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">8-Hour Shift (PKR / day)</label>
                      <input
                        type="number"
                        value={dailyRateLocal8Hr}
                        onChange={(e) => setDailyRateLocal8Hr(e.target.value)}
                        placeholder="2200"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Day 12-Hour Shift (PKR / day)</label>
                      <input
                        type="number"
                        value={dailyRateLocal12Hr}
                        onChange={(e) => setDailyRateLocal12Hr(e.target.value)}
                        placeholder="2800"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sky-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Overtime (PKR / extra hour)</label>
                      <input
                        type="number"
                        value={overtimePerHour}
                        onChange={(e) => setOvertimePerHour(e.target.value)}
                        placeholder="300"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Outstation Rates */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">3. Outstation & Intercity Duty (M-2, GT Road, Murree)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Outstation Rate (PKR / day) *</label>
                      <input
                        type="number"
                        value={outstationRatePerDay}
                        onChange={(e) => setOutstationRatePerDay(e.target.value)}
                        placeholder="3800"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Night Stay / Food Allowance (PKR / night)</label>
                      <input
                        type="number"
                        value={nightStayAllowance}
                        onChange={(e) => setNightStayAllowance(e.target.value)}
                        placeholder="1500"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Save & Publish My Rates
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: HIRING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Customer Hiring Requests Queue</h3>
                  <p className="text-xs text-slate-500">
                    Review and confirm customer requests. Confirming a booking safely unlocks your verified CNIC & Licence to the booker.
                  </p>
                </div>
                <span className="self-start px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  {requests.filter((r) => r.status === 'PENDING_CONFIRMATION').length} Pending Confirmation
                </span>
              </div>

              {bookingNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bookingNotice}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                {requests.map((r) => {
                  const isConfirmed = r.status === 'CONFIRMED';
                  return (
                    <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <span className="font-mono text-xs font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200">
                            {r.bookingRef}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">{r.destination}</h4>
                        </div>
                        <span className="text-sm font-black text-slate-900">PKR {formatPKR(r.totalFare)}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold block">Client</span>
                          <span className="font-bold text-slate-800">{r.customerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold block">Date & Duration</span>
                          <span className="font-bold text-slate-800">{r.startDate} ({r.days} Days)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold block">Vehicle Provided</span>
                          <span className="font-bold text-slate-800">{r.vehicleProvided}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold block">Booking Status</span>
                          <span className={`font-bold px-2 py-0.5 rounded border inline-block ${
                            isConfirmed
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {isConfirmed ? 'CONFIRMED' : 'PENDING YOUR CONFIRMATION'}
                          </span>
                        </div>
                      </div>

                      {/* Verification Status & Confirmation Actions */}
                      {!isConfirmed ? (
                        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              Awaiting Your Confirmation
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                              Credentials Currently Masked
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-snug">
                            This customer currently sees your masked credentials (CNIC: <span className="font-mono font-bold">{maskPakistaniCnic(driverCnic)}</span>, Licence: <span className="font-mono font-bold">{maskPakistaniLicense(licenseNumber)}</span>). Tap confirm below to accept the ride and release your full unmasked credentials to their portal.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleConfirmBooking(r.id, r.customerName)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ Confirm Booking & Share Verified ID</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineBooking(r.id)}
                              className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              Decline
                            </button>
                            <a
                              href={`https://wa.me/${r.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(r.customerName)},%20I%20am%20reviewing%20your%20booking%20request%20${r.bookingRef}.`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-auto px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Chat with Client</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Booking Confirmed · Verified Credentials Released to Client</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-emerald-900 pt-0.5">
                              <span>Shared CNIC: <strong>{driverCnic}</strong></span>
                              <span>·</span>
                              <span>Driving Licence: <strong>{licenseNumber}</strong></span>
                              <span>·</span>
                              <span>Contact: <strong>{r.customerPhone}</strong></span>
                            </div>
                          </div>
                          <a
                            href={`https://wa.me/${r.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(r.customerName)},%20I%20have%20confirmed%20your%20driver%20booking%20${r.bookingRef}.%20My%20verified%20CNIC%20is%20${driverCnic}%20and%20Licence%20is%20${licenseNumber}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Client</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: PASSENGER CHATS (INBOX & INQUIRIES) */}
          {activeTab === 'chats' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              {/* Tab Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Passenger Inquiries & Direct In-App Chats
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                      {driverConversations.length} Active Threads
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time messaging with passengers who booked your chauffeur service. Agree on pickup address, motorway route, and reporting timing.
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
                    driverChatMobileView === 'CONV' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Passenger Inquiries</span>
                    <span className="text-[10px] font-mono text-slate-400">TTL: 7 Days</span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                    {driverConversations.length > 0 ? (
                      driverConversations.map((c) => {
                        const selected = c.id === activeDriverChatId;
                        const partnerId = currentUser
                          ? c.participantIds.find((id) => id !== currentUser.id) || ''
                          : '';
                        const partnerName = c.participantNames[partnerId] || 'Passenger Booker';
                        const unread = (currentUser && c.unreadCountFor?.[currentUser.id]) || 0;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setActiveDriverChatId(c.id);
                              setDriverChatMobileView('CONV');
                            }}
                            className={`w-full p-3.5 text-left flex items-start gap-2.5 transition cursor-pointer ${
                              selected ? 'bg-sky-50/60 border-l-4 border-l-sky-600' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
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
                              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>No passenger chats yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Conversation Pane */}
                <div
                  className={`flex-1 flex flex-col min-w-0 bg-[#FAFBFC] ${
                    driverChatMobileView === 'LIST' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  {activeDriverConv ? (
                    <>
                      {/* Active Conversation Top Bar */}
                      <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setDriverChatMobileView('LIST')}
                            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                          </button>
                          <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {activeCustomerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{activeCustomerName}</h4>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                Passenger
                              </span>
                              {activeDriverConv.bookingRef && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200">
                                  {activeDriverConv.bookingRef}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">
                              {activeDriverConv.about} {activeDriverConv.dates ? `· ${activeDriverConv.dates}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Customer Direct Contact Actions */}
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${activeCustomerPhone}`}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1 transition"
                            title={`Call Passenger (${activeCustomerPhone})`}
                          >
                            <Phone className="w-3 h-3 text-sky-600" />
                            <span className="hidden sm:inline">Call Passenger</span>
                          </a>

                          <a
                            href={activeCustomerWhatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                            title={`WhatsApp Passenger (${activeCustomerPhone})`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Direct WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {driverChatMessages.map((m) => {
                          const isMe = currentUser ? m.senderId === currentUser.id : m.senderRole === 'DRIVER';
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                                  isMe
                                    ? 'bg-sky-800 text-white rounded-br-xs shadow-xs'
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
                          value={driverChatInput}
                          onChange={(e) => setDriverChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSendDriverMessage();
                            }
                          }}
                          placeholder={`Reply to ${activeCustomerName} as ${driverName}...`}
                          className="flex-1 h-10 px-3.5 border border-slate-300 rounded-xl font-sans text-xs text-slate-900 outline-none focus:border-sky-600"
                        />
                        <button
                          type="button"
                          onClick={handleSendDriverMessage}
                          className="h-10 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
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

          {/* TAB 5: LICENSE & CNIC VERIFICATION */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Driving License & National ID Verification</h3>
                <p className="text-slate-500">
                  Manage your verified credentials. Documents are configured centrally by Super Admin.
                </p>
              </div>

              {docUploadError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{docUploadError}</span>
                </div>
              )}

              {/* Dynamic Document Checks based on Super Admin docRules */}
              {(() => {
                const isLicenseActive = isDocActiveForRole('DRIVER', 'license');
                const isCnicActive = isDocActiveForRole('DRIVER', 'cnic');

                if (!isLicenseActive && !isCnicActive) {
                  return (
                    <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-emerald-950">No Driver Documents Required</h4>
                      <p className="text-xs text-emerald-800 max-w-md mx-auto">
                        Super Admin has currently set document requirements to <strong>OFF</strong> for drivers. You can accept trips and customer bookings without uploading documents.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Driving License Upload */}
                    {isLicenseActive && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scan className="w-4 h-4 text-sky-700" />
                            <span className="font-bold text-slate-900">1. Commercial Driving License (LTV / HTV / PSV)</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ Verified
                          </span>
                        </div>

                        {!licenseDocPreview ? (
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl bg-white cursor-pointer transition text-center group">
                            <Upload className="w-6 h-6 text-sky-600 group-hover:scale-110 transition mb-1" />
                            <span className="font-bold text-xs text-slate-900">Upload Driving License (Front / Back Photo)</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadLicense(f);
                              }}
                            />
                          </label>
                        ) : (
                          <div className="p-3 bg-white border border-sky-200 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={licenseDocPreview}
                                alt="License preview"
                                className="w-16 h-11 object-cover rounded-lg border border-slate-200 shadow-2xs"
                              />
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{licenseDocName}</span>
                                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Extracted: {licenseNumber} ({licenseCategory}) · Valid to {licenseExpiry}</span>
                                </span>
                              </div>
                            </div>
                            <label className="text-[11px] font-bold text-sky-800 hover:underline px-2.5 py-1 bg-sky-50 rounded-lg cursor-pointer">
                              <span>Re-upload</span>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadLicense(f);
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* National ID Upload */}
                    {isCnicActive && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span className="font-bold text-slate-900">2. National Identity Card (CNIC / Passport)</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ Verified
                          </span>
                        </div>

                        {!cnicDocPreview ? (
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white cursor-pointer transition text-center group">
                            <Upload className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition mb-1" />
                            <span className="font-bold text-xs text-slate-900">Upload National ID Card</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadCnic(f);
                              }}
                            />
                          </label>
                        ) : (
                          <div className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={cnicDocPreview}
                                alt="CNIC preview"
                                className="w-16 h-11 object-cover rounded-lg border border-slate-200 shadow-2xs"
                              />
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{cnicDocName}</span>
                                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>CNIC: {maskCnic(driverCnic)} · Name: {driverName}</span>
                                </span>
                              </div>
                            </div>
                            <label className="text-[11px] font-bold text-emerald-800 hover:underline px-2.5 py-1 bg-emerald-50 rounded-lg cursor-pointer">
                              <span>Re-upload</span>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadCnic(f);
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Manual Verification Number Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
                <label className="flex flex-col gap-1">
                  <span className="font-bold text-slate-700">Official CNIC (13 Digits)</span>
                  <input
                    type="text"
                    value={driverCnic}
                    onChange={(e) => setDriverCnic(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400">Stored securely with SafarPK</span>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-bold text-slate-700">Commercial Driving Licence Number</span>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400">e.g. LHR-LTV-99210 or ISB-DL-49201</span>
                </label>
              </div>

              {/* Customer Privacy Disclosure Preview */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>How Customers See Your Credentials (Privacy Protection)</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Automated Rule
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* State 1: Public / Before Confirmation */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block">
                      Before Booking Confirmation
                    </span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Public directory and pending bookers see that you are verified, but sensitive digits are masked:
                    </p>
                    <div className="font-mono text-xs font-bold text-slate-800 space-y-0.5 pt-1">
                      <p>CNIC: <span className="text-amber-900">{maskPakistaniCnic(driverCnic)}</span></p>
                      <p>Licence: <span className="text-amber-900">{maskPakistaniLicense(licenseNumber)}</span></p>
                    </div>
                  </div>

                  {/* State 2: After Confirmation */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 inline-block">
                      After You Confirm Booking
                    </span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      The specific customer whose ride you confirm can view your full unmasked credentials:
                    </p>
                    <div className="font-mono text-xs font-bold text-slate-800 space-y-0.5 pt-1">
                      <p>CNIC: <span className="text-emerald-800">{driverCnic}</span></p>
                      <p>Licence: <span className="text-emerald-800">{licenseNumber}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Passenger Ratings & Feedback</h3>
                <p className="text-slate-500">Reviews submitted by verified clients after completed driving trips.</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-amber-600">4.95</span>
                  <span className="text-xs text-slate-600 ml-2">out of 5 stars (58 Reviews)</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Top Rated Chauffeur
                </span>
              </div>

              <div className="space-y-3">
                {reviews.map((rv) => (
                  <div key={rv.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rv.author}</span>
                      <span className="text-amber-500 font-bold">★★★★★</span>
                    </div>
                    <p className="text-slate-600 italic">&ldquo;{rv.comment}&rdquo;</p>
                    <span className="text-[10px] text-slate-400 block">{rv.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BILLING & SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <BillingHistoryManager
              role="DRIVER"
              roleTitle="Independent Chauffeur"
              businessName={driverName}
              initialPlanName="Independent Chauffeur Pass"
            />
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT DRIVER PROFILE & BIO (FULL CRUD)                              */}
      {/* ========================================================================= */}
      {showEditDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-base text-slate-900">Edit Driver Profile & Bio</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditDriverModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverProfile} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Direct Contact / Phone</label>
                  <input
                    type="text"
                    required
                    value={editDriverPhone}
                    onChange={(e) => setEditDriverPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base City</label>
                  <select
                    value={driverCity}
                    onChange={(e) => setDriverCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {driverAvailableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Professional Bio & Experience</label>
                <textarea
                  rows={4}
                  required
                  value={editDriverBio}
                  onChange={(e) => setEditDriverBio(e.target.value)}
                  placeholder="Describe your executive experience, motorway comfort, punctuality, and client references..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditDriverModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Profile Changes
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

export default function DriverDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-xs font-bold">
          Loading Driver Cockpit...
        </div>
      }
    >
      <DriverDashboardContent />
    </Suspense>
  );
}
