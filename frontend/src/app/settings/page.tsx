'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { getActiveUser, setActiveUser, logoutActiveUser, RegisteredUser } from '@/data/userAuth';
import { COUNTRIES } from '@/data/countries';
import {
  User,
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowLeft,
  Upload,
  Camera,
  MapPin,
  Building2,
  FileText,
  CheckCircle2,
  Zap,
  LogOut,
  Car,
  Truck,
  Bus,
  Headphones,
  Sliders,
  Clock,
  Briefcase,
  PhoneCall,
  Sparkles,
  Lock,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
];

interface RoleTheme {
  type: 'DRIVER' | 'LISTER' | 'MOVERS' | 'SHUTTLE' | 'SUPER_ADMIN' | 'AGENT' | 'CUSTOMER';
  label: string;
  badge: string;
  badgeIcon: React.ElementType;
  primaryColor: string;
  primaryBg: string;
  primaryText: string;
  accentLight: string;
  accentBorder: string;
  accentText: string;
  ringColor: string;
  bannerGradient: string;
  badgeBg: string;
  activeTabClass: string;
  dashboardHref: string;
  dashboardLabel: string;
  locationCardTitle: string;
  locationCardDesc: string;
  locationFieldLabel: string;
  businessFieldLabel: string;
  businessPlaceholder: string;
  planName: string;
  quotaText: string;
}

function getRoleTheme(role?: string, subtype?: string): RoleTheme {
  if (role === 'DRIVER') {
    return {
      type: 'DRIVER',
      label: 'Independent Chauffeur',
      badge: '👨‍✈️ Driver Cockpit',
      badgeIcon: User,
      primaryColor: '#0284c7', // Sky-600
      primaryBg: 'bg-sky-600 hover:bg-sky-700',
      primaryText: 'text-sky-600',
      accentLight: 'bg-sky-50',
      accentBorder: 'border-sky-200',
      accentText: 'text-sky-800',
      ringColor: 'border-sky-500/20',
      bannerGradient: 'from-sky-600 via-teal-600 to-slate-900',
      badgeBg: 'bg-sky-100 text-sky-800 border border-sky-300',
      activeTabClass: 'bg-sky-600 text-white shadow-xs',
      dashboardHref: '/driver?tab=overview',
      dashboardLabel: 'Driver Cockpit',
      locationCardTitle: 'Chauffeur Standby Base & Pinned GPS Location',
      locationCardDesc: 'Where you start your daily duty or where passengers pick you up.',
      locationFieldLabel: 'Standby Base / Starting Location',
      businessFieldLabel: 'Professional Driver Title',
      businessPlaceholder: 'e.g. VIP Executive Chauffeur / Highway Expert',
      planName: 'Independent Chauffeur Pass',
      quotaText: '1 / 1 live chauffeur profile',
    };
  }
  if (role === 'LISTER' || role === 'OWNER') {
    return {
      type: 'LISTER',
      label: 'Car Rental & Fleet Lister',
      badge: '🚗 Showroom & Fleet Owner',
      badgeIcon: Car,
      primaryColor: '#0B6B4F', // Forest Emerald
      primaryBg: 'bg-[#0B6B4F] hover:bg-[#08513C]',
      primaryText: 'text-[#0B6B4F]',
      accentLight: 'bg-[#E9F3EE]',
      accentBorder: 'border-[#0B6B4F]/20',
      accentText: 'text-[#08513C]',
      ringColor: 'border-[#0B6B4F]/20',
      bannerGradient: 'from-emerald-700 via-teal-800 to-slate-900',
      badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      activeTabClass: 'bg-[#0B6B4F] text-white shadow-xs',
      dashboardHref: '/lister',
      dashboardLabel: 'Lister Cockpit',
      locationCardTitle: 'Showroom, Dealership & Fleet Yard GPS',
      locationCardDesc: 'Customers visit this location to inspect, rent and handover vehicles.',
      locationFieldLabel: 'Showroom / Operating Address',
      businessFieldLabel: 'Showroom / Dealership / Fleet Title',
      businessPlaceholder: 'e.g. Salman Rent a Car & Luxury Fleet',
      planName: 'Professional Fleet Hub Pass',
      quotaText: '4 / 15 vehicles live',
    };
  }
  if (role === 'PROVIDER' && subtype === 'COMMERCIAL_CARGO') {
    return {
      type: 'MOVERS',
      label: 'Movers & Cargo Operator',
      badge: '📦 Shifting & Cargo Fleet',
      badgeIcon: Truck,
      primaryColor: '#d97706', // Amber-600
      primaryBg: 'bg-amber-600 hover:bg-amber-700',
      primaryText: 'text-amber-600',
      accentLight: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      accentText: 'text-amber-800',
      ringColor: 'border-amber-500/20',
      bannerGradient: 'from-amber-600 via-orange-600 to-slate-900',
      badgeBg: 'bg-amber-100 text-amber-800 border border-amber-300',
      activeTabClass: 'bg-amber-600 text-white shadow-xs',
      dashboardHref: '/provider?tab=overview',
      dashboardLabel: 'Provider Cockpit',
      locationCardTitle: 'Warehouse, Cargo Terminal & Dispatch Hub GPS',
      locationCardDesc: 'Where moving trucks, cargo crates and packing labor teams are stationed.',
      locationFieldLabel: 'Warehouse / Terminal Address',
      businessFieldLabel: 'Movers & Logistics Company Title',
      businessPlaceholder: 'e.g. Al-Makkah Movers & Goods Transport',
      planName: 'Home Shifting & Cargo Pass',
      quotaText: '2 / 10 trucks active',
    };
  }
  if (role === 'PROVIDER' && subtype === 'PICK_AND_DROP') {
    return {
      type: 'SHUTTLE',
      label: 'Pick & Drop Shuttle Provider',
      badge: '🚌 Shuttle & Commuter Fleet',
      badgeIcon: Bus,
      primaryColor: '#7c3aed', // Violet-600
      primaryBg: 'bg-violet-600 hover:bg-violet-700',
      primaryText: 'text-violet-600',
      accentLight: 'bg-violet-50',
      accentBorder: 'border-violet-200',
      accentText: 'text-violet-800',
      ringColor: 'border-violet-500/20',
      bannerGradient: 'from-violet-600 via-indigo-600 to-slate-900',
      badgeBg: 'bg-violet-100 text-violet-800 border border-violet-300',
      activeTabClass: 'bg-violet-600 text-white shadow-xs',
      dashboardHref: '/provider?tab=overview',
      dashboardLabel: 'Provider Cockpit',
      locationCardTitle: 'Van Terminal, Depot & Central Pickup GPS',
      locationCardDesc: 'Central hub where commuter vans start and finish their daily routes.',
      locationFieldLabel: 'Terminal / Central Depot Address',
      businessFieldLabel: 'Shuttle Service / Fleet Name',
      businessPlaceholder: 'e.g. Subhan Commuter Shuttles',
      planName: 'Pick & Drop Shuttle Pass',
      quotaText: '3 / 8 routes live',
    };
  }
  if (role === 'SUPER_ADMIN') {
    return {
      type: 'SUPER_ADMIN',
      label: 'Super Admin',
      badge: '🛡️ Root Administrator',
      badgeIcon: ShieldCheck,
      primaryColor: '#4f46e5', // Indigo-600
      primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
      primaryText: 'text-indigo-600',
      accentLight: 'bg-indigo-50',
      accentBorder: 'border-indigo-200',
      accentText: 'text-indigo-800',
      ringColor: 'border-indigo-500/20',
      bannerGradient: 'from-indigo-700 via-purple-700 to-slate-900',
      badgeBg: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
      activeTabClass: 'bg-indigo-600 text-white shadow-xs',
      dashboardHref: '/admin?tab=overview',
      dashboardLabel: 'Admin Console',
      locationCardTitle: 'Headquarters & Platform Operations Office',
      locationCardDesc: 'Platform operational hub and primary administrative location.',
      locationFieldLabel: 'Operations Office Address',
      businessFieldLabel: 'Administration Title / Desk',
      businessPlaceholder: 'e.g. SafarPK Core Platform Admin',
      planName: 'SafarPK Root Administrative Pass',
      quotaText: 'Unrestricted Core Access',
    };
  }
  if (role === 'AGENT') {
    return {
      type: 'AGENT',
      label: 'Support Agent',
      badge: '🎧 Support Specialist',
      badgeIcon: Headphones,
      primaryColor: '#2563eb', // Blue-600
      primaryBg: 'bg-blue-600 hover:bg-blue-700',
      primaryText: 'text-blue-600',
      accentLight: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      accentText: 'text-blue-800',
      ringColor: 'border-blue-500/20',
      bannerGradient: 'from-blue-600 via-sky-600 to-slate-900',
      badgeBg: 'bg-blue-100 text-blue-800 border border-blue-300',
      activeTabClass: 'bg-blue-600 text-white shadow-xs',
      dashboardHref: '/agent?tab=tickets',
      dashboardLabel: 'Agent Workspace',
      locationCardTitle: 'Assigned Regional Desk & Support Center',
      locationCardDesc: 'Customer support branch and ticket handling station.',
      locationFieldLabel: 'Regional Support Center Address',
      businessFieldLabel: 'Support Desk Title / Employee ID',
      businessPlaceholder: 'e.g. Regional Support Desk #4',
      planName: 'Customer Care & Dispatch Pass',
      quotaText: 'Multi-Channel Support Active',
    };
  }
  // Default Customer
  return {
    type: 'CUSTOMER',
    label: 'Customer Account',
    badge: '👤 Verified Member',
    badgeIcon: User,
    primaryColor: '#0B6B4F',
    primaryBg: 'bg-[#0B6B4F] hover:bg-[#08513C]',
    primaryText: 'text-[#0B6B4F]',
    accentLight: 'bg-[#E9F3EE]',
    accentBorder: 'border-[#0B6B4F]/20',
    accentText: 'text-[#08513C]',
    ringColor: 'border-[#0B6B4F]/20',
    bannerGradient: 'from-[#0B6B4F] via-teal-700 to-slate-900',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    activeTabClass: 'bg-[#0B6B4F] text-white shadow-xs',
    dashboardHref: '/customer',
    dashboardLabel: 'My Dashboard',
    locationCardTitle: 'Home Address & Preferred Drop-off Location',
    locationCardDesc: 'Saved address for vehicle delivery or chauffeur pickup.',
    locationFieldLabel: 'Delivery / Home Residential Address',
    businessFieldLabel: 'Profession / Workplace (Optional)',
    businessPlaceholder: 'e.g. Software Engineer / Business Owner',
    planName: 'SafarPK Verified Member Club',
    quotaText: 'Unlimited Passenger Bookings',
  };
}

export default function SettingsPage() {
  const [activeUser, setActiveUserState] = useState<RegisteredUser | null>(null);

  // Form states - Profile & Business
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [countryCode, setCountryCode] = useState('PK');
  const [currency, setCurrency] = useState('PKR');
  const [language, setLanguage] = useState('English');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Identity & Documents Vault (Authentic OCR & Immutable Records)
  const [nationalId, setNationalId] = useState('');
  const [cnicName, setCnicName] = useState('');
  const [cnicIssueDate, setCnicIssueDate] = useState('');
  const [cnicExpiryDate, setCnicExpiryDate] = useState('');
  const [cnicLocked, setCnicLocked] = useState(false);

  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseName, setLicenseName] = useState('');
  const [licenseCategory, setLicenseCategory] = useState<'LTV' | 'HTV' | 'PSV'>('LTV');
  const [licenseIssueDate, setLicenseIssueDate] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [licenseLocked, setLicenseLocked] = useState(false);

  const [cnicFront, setCnicFront] = useState('');
  const [cnicBack, setCnicBack] = useState('');
  const [licenseDoc, setLicenseDoc] = useState('');
  const [tradeLicenseDoc, setTradeLicenseDoc] = useState('');

  // Location & Pinned GPS
  const [showroomAddress, setShowroomAddress] = useState('Gulberg III, Main Boulevard, Lahore');
  const [gpsLocation, setGpsLocation] = useState('31.5204° N, 74.3587° E (Lahore)');

  // Role-Specific Preferences (Strictly partitioned per role)
  // Driver Specific
  const [driverWithCustomerCar, setDriverWithCustomerCar] = useState(true);
  const [driverTourOutstation, setDriverTourOutstation] = useState(true);
  const [driverNightAllowance, setDriverNightAllowance] = useState(true);

  // Lister Specific
  const [listerSelfDrive, setListerSelfDrive] = useState(true);
  const [listerWithChauffeur, setListerWithChauffeur] = useState(true);
  const [listerShowroomVisits, setListerShowroomVisits] = useState(true);
  const [showroomHours, setShowroomHours] = useState('09:00 AM - 10:00 PM');

  // Movers Specific
  const [moversHomeShifting, setMoversHomeShifting] = useState(true);
  const [moversOfficeRelocation, setMoversOfficeRelocation] = useState(true);
  const [moversPackingLabor, setMoversPackingLabor] = useState(true);

  // Shuttle Specific
  const [shuttleOfficeCommute, setShuttleOfficeCommute] = useState(true);
  const [shuttleStudentVan, setShuttleStudentVan] = useState(true);
  const [shuttleACGuaranteed, setShuttleACGuaranteed] = useState(true);

  // General Notification Toggles
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Active section tab tracking for pill highlighting
  const [activeNavSection, setActiveNavSection] = useState('avatar-studio');

  useEffect(() => {
    const u = getActiveUser();
    if (u) {
      setActiveUserState(u);
      setFullName(u.name || '');
      setBusinessName(u.businessName || '');
      setEmail(u.email || '');
      setCity(u.city || 'Lahore');
      setCountryCode(u.countryCode || 'PK');
      setWhatsappNumber(u.phone || '');
      setNationalId(u.cnicNumber || u.nationalId || '35201-9821045-3');
      setCnicName(u.cnicName || u.name || 'Tariq Mahmood');
      setCnicIssueDate(u.cnicIssueDate || '2020-05-14');
      setCnicExpiryDate(u.cnicExpiryDate || '2030-05-13');
      setCnicLocked(u.cnicLocked ?? Boolean(u.cnicNumber || u.nationalId));

      setLicenseNumber(u.licenseNumber || 'LHR-DL-98210');
      setLicenseName(u.licenseName || u.name || 'Tariq Mahmood');
      setLicenseIssueDate(u.licenseIssueDate || '2019-01-10');
      setLicenseExpiryDate(u.licenseExpiryDate || '2029-01-09');
      setLicenseLocked(u.licenseLocked ?? Boolean(u.licenseNumber || u.role === 'DRIVER'));

      setAvatarUrl(u.avatarUrl || '');
      setCnicFront(u.cnicFrontUrl || 'cnic_front_verified.jpg');
      setCnicBack(u.cnicBackUrl || 'cnic_back_verified.jpg');
      setLicenseDoc(u.licenseUrl || 'license_verified.jpg');
      setTradeLicenseDoc(u.tradeLicenseUrl || '');
      if (u.showroomAddress) setShowroomAddress(u.showroomAddress);
      if (u.gpsLocation) setGpsLocation(u.gpsLocation);

      // Load saved preferences from localStorage if exists
      try {
        const savedPrefs = localStorage.getItem(`safarpk_role_prefs_${u.id}`);
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          if (parsed.licenseCategory) setLicenseCategory(parsed.licenseCategory);
          if (parsed.driverWithCustomerCar !== undefined) setDriverWithCustomerCar(parsed.driverWithCustomerCar);
          if (parsed.driverTourOutstation !== undefined) setDriverTourOutstation(parsed.driverTourOutstation);
          if (parsed.driverNightAllowance !== undefined) setDriverNightAllowance(parsed.driverNightAllowance);
          if (parsed.listerSelfDrive !== undefined) setListerSelfDrive(parsed.listerSelfDrive);
          if (parsed.listerWithChauffeur !== undefined) setListerWithChauffeur(parsed.listerWithChauffeur);
          if (parsed.listerShowroomVisits !== undefined) setListerShowroomVisits(parsed.listerShowroomVisits);
          if (parsed.showroomHours) setShowroomHours(parsed.showroomHours);
          if (parsed.moversHomeShifting !== undefined) setMoversHomeShifting(parsed.moversHomeShifting);
          if (parsed.moversOfficeRelocation !== undefined) setMoversOfficeRelocation(parsed.moversOfficeRelocation);
          if (parsed.moversPackingLabor !== undefined) setMoversPackingLabor(parsed.moversPackingLabor);
          if (parsed.shuttleOfficeCommute !== undefined) setShuttleOfficeCommute(parsed.shuttleOfficeCommute);
          if (parsed.shuttleStudentVan !== undefined) setShuttleStudentVan(parsed.shuttleStudentVan);
          if (parsed.shuttleACGuaranteed !== undefined) setShuttleACGuaranteed(parsed.shuttleACGuaranteed);
        }
      } catch (e) {}
    }
  }, []);

  const theme = getRoleTheme(activeUser?.role, activeUser?.providerSubtype);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCnicUpload = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    if (cnicLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (isFront) setCnicFront(dataUrl);
        else setCnicBack(dataUrl);

        // Intelligent Authentic Pakistani OCR Simulation
        const cleanName = fullName.trim() || activeUser?.name || 'Tariq Mahmood';
        const cleanCnic = nationalId.trim() || '35201-9821045-3';
        const issue = '2020-05-14';
        const expiry = '2030-05-13';

        setCnicName(cleanName);
        setNationalId(cleanCnic);
        setCnicIssueDate(issue);
        setCnicExpiryDate(expiry);
        setCnicLocked(true);

        const u = getActiveUser();
        if (u) {
          if (isFront) u.cnicFrontUrl = dataUrl;
          else u.cnicBackUrl = dataUrl;
          u.cnicNumber = cleanCnic;
          u.nationalId = cleanCnic;
          u.cnicName = cleanName;
          u.cnicIssueDate = issue;
          u.cnicExpiryDate = expiry;
          u.cnicLocked = true;
          setActiveUser(u);
          setActiveUserState({ ...u });
          window.dispatchEvent(new Event('safarpk_auth_state_changed'));
        }

        setToastMessage('🔒 CNIC authenticated & permanently locked in SafarPK Secure Vault.');
        setTimeout(() => setToastMessage(''), 4500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (licenseLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLicenseDoc(dataUrl);

        const cleanName = fullName.trim() || activeUser?.name || 'Tariq Mahmood';
        const cleanLicNum = licenseNumber.trim() || 'LHR-DL-98210';
        const issue = '2019-01-10';
        const expiry = '2029-01-09';

        setLicenseName(cleanName);
        setLicenseNumber(cleanLicNum);
        setLicenseIssueDate(issue);
        setLicenseExpiryDate(expiry);
        setLicenseLocked(true);

        const u = getActiveUser();
        if (u) {
          u.licenseUrl = dataUrl;
          u.licenseNumber = cleanLicNum;
          u.licenseName = cleanName;
          u.licenseCategory = licenseCategory;
          u.licenseIssueDate = issue;
          u.licenseExpiryDate = expiry;
          u.licenseLocked = true;
          setActiveUser(u);
          setActiveUserState({ ...u });
          window.dispatchEvent(new Event('safarpk_auth_state_changed'));
        }

        setToastMessage('🔒 Driving Licence authenticated & permanently locked in SafarPK Secure Vault.');
        setTimeout(() => setToastMessage(''), 4500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      setPasswordError('Full name cannot be empty');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
    }

    setPasswordError('');

    const u = getActiveUser();
    if (u) {
      u.name = fullName.trim();
      u.businessName = businessName.trim();
      u.email = email.trim() || undefined;
      u.city = city;
      u.countryCode = countryCode;
      u.phone = whatsappNumber.trim();
      u.nationalId = nationalId.trim();
      u.licenseNumber = licenseNumber.trim();
      u.cnicNumber = nationalId.trim();
      u.cnicName = cnicName || fullName.trim();
      u.cnicIssueDate = cnicIssueDate || '2020-05-14';
      u.cnicExpiryDate = cnicExpiryDate || '2030-05-13';
      u.cnicLocked = cnicLocked;
      u.licenseName = licenseName || fullName.trim();
      u.licenseCategory = licenseCategory;
      u.licenseIssueDate = licenseIssueDate || '2019-01-10';
      u.licenseExpiryDate = licenseExpiryDate || '2029-01-09';
      u.licenseLocked = licenseLocked;
      u.avatarUrl = avatarUrl;
      u.cnicFrontUrl = cnicFront;
      u.cnicBackUrl = cnicBack;
      u.licenseUrl = licenseDoc;
      u.tradeLicenseUrl = tradeLicenseDoc;
      u.showroomAddress = showroomAddress;
      u.gpsLocation = gpsLocation;
      if (newPassword) u.password = newPassword;

      setActiveUser(u);
      setActiveUserState({ ...u });

      // Save role preferences
      try {
        const prefs = {
          licenseCategory,
          driverWithCustomerCar,
          driverTourOutstation,
          driverNightAllowance,
          listerSelfDrive,
          listerWithChauffeur,
          listerShowroomVisits,
          showroomHours,
          moversHomeShifting,
          moversOfficeRelocation,
          moversPackingLabor,
          shuttleOfficeCommute,
          shuttleStudentVan,
          shuttleACGuaranteed,
        };
        localStorage.setItem(`safarpk_role_prefs_${u.id}`, JSON.stringify(prefs));
      } catch (e) {}

      window.dispatchEvent(new Event('safarpk_auth_state_changed'));
    }

    setToastMessage(`✓ ${theme.label} settings & documents saved successfully!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLogout = () => {
    logoutActiveUser();
    setActiveUserState(null);
    window.location.href = '/login';
  };

  // Section Tab Navigation Items
  const navTabs = [
    { id: 'avatar-studio', label: 'Profile Picture' },
    { id: 'profile', label: 'Personal & Business' },
    { id: 'documents', label: 'Document Vault' },
    { id: 'location-map', label: 'Pinned GPS Location' },
    { id: 'subscription', label: 'Subscription & Quota' },
    ...(theme.type !== 'CUSTOMER' && theme.type !== 'SUPER_ADMIN' && theme.type !== 'AGENT'
      ? [{ id: 'role-preferences', label: `${theme.label.split(' ')[0]} Preferences` }]
      : []),
    { id: 'region', label: 'Country & Currency' },
    { id: 'contact', label: 'WhatsApp & Contact' },
    { id: 'security', label: 'Password & Security' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      {/* MOBILE APP TOP BAR - Compact Native App Header (Visible strictly on mobile) */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <Link
          href={theme.dashboardHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 stroke-[2.5]" />
          <span>{theme.dashboardLabel}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${theme.badgeBg}`}
          >
            {theme.badge}
          </span>

          {activeUser && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 active:scale-90 transition"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-4 sm:px-8 py-5 md:py-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start pb-32 md:pb-12">
        {/* Left Navigation Bar - Static Card on mobile, Sticky on desktop */}
        <aside className="w-full md:w-64 flex flex-col gap-2 shrink-0 md:sticky md:top-24 z-10 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border border-slate-200/80 md:border-0 shadow-2xs md:shadow-none">
          <div className="hidden md:flex items-center justify-between gap-2 mb-1">
            <Link
              href={theme.dashboardHref}
              className={`inline-flex items-center gap-1.5 text-xs font-bold ${theme.primaryText} hover:underline`}
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Back to {theme.dashboardLabel}</span>
            </Link>

            {activeUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer active:scale-95"
                title="Log out of account"
              >
                <LogOut className="w-3 h-3" />
                <span>Log Out</span>
              </button>
            )}
          </div>

          {/* Role Header Banner Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${theme.badgeBg}`}
            >
              <theme.badgeIcon className="w-3.5 h-3.5" />
              <span>{theme.label}</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● Active Account
            </span>
          </div>

          <h1 className="font-heading font-extrabold text-2xl text-[#101828] mt-1 mb-0.5">
            Account & Profile
          </h1>
          <p className="text-xs text-[#667085] mb-2 leading-relaxed">
            Manage your personal credentials, identity vault, GPS location and subscription pass.
          </p>

          {/* Quick Section Tabs: Horizontal Scrollable Pill Bar on Mobile, Vertical on Desktop */}
          <div className="flex md:flex-col overflow-x-auto no-scrollbar gap-1.5 pb-2 md:pb-0 -mx-1 px-1">
            {navTabs.map((tab) => {
              const isActive = activeNavSection === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  onClick={() => setActiveNavSection(tab.id)}
                  className={`h-9 md:h-10 px-3.5 rounded-xl text-xs font-bold flex items-center shrink-0 transition ${
                    isActive
                      ? theme.activeTabClass
                      : 'bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {tab.label}
                </a>
              );
            })}
          </div>
        </aside>

        {/* Right Settings Sections */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 md:gap-6 w-full">
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center gap-2 border border-emerald-300 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. PROFILE PICTURE & BUSINESS LOGO STUDIO */}
          <section
            id="avatar-studio"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                  Profile Picture & Business Logo
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Your picture or company logo appears on all your marketplace listings, direct WhatsApp cards and quotes.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${theme.accentLight} ${theme.accentText}`}>
                Live on Profile
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              <div className="relative group shrink-0">
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 ${theme.ringColor} overflow-hidden bg-slate-100 flex items-center justify-center shadow-md`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={`text-2xl font-black ${theme.primaryText}`}>
                      {fullName ? fullName.slice(0, 2).toUpperCase() : 'SP'}
                    </span>
                  )}
                </div>

                <label
                  className={`absolute bottom-0 right-0 w-8 h-8 rounded-full ${theme.primaryBg} text-white flex items-center justify-center cursor-pointer shadow-md transition`}
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setAvatarUrl)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 flex-1 text-center sm:text-left">
                <div>
                  <h3 className="font-bold text-sm text-[#101828]">
                    Choose from preset avatars or upload custom logo
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Recommended: Square JPG or PNG, minimum 400×400 pixels.
                  </p>
                </div>

                {/* Preset Avatars */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                        avatarUrl === url
                          ? `border-sky-500 scale-110 shadow-sm ring-2 ring-offset-1`
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  <label
                    className={`h-10 px-3 rounded-full border border-dashed ${theme.accentBorder} ${theme.primaryText} hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setAvatarUrl)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* 2. PERSONAL & BUSINESS INFO (Tailored Field Titles per Role) */}
          <section
            id="profile"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                Personal & Business Information
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Official credentials associated with your {theme.label} account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Full Name *</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none focus:ring-2 focus:ring-offset-1 transition"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>{theme.businessFieldLabel}</span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={theme.businessPlaceholder}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none focus:ring-2 focus:ring-offset-1 transition"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Email Address (Optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none focus:ring-2 focus:ring-offset-1 transition"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Primary Operating City</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none bg-white cursor-pointer"
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

              <div className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Account Role</span>
                <div className="h-11 sm:h-12 px-3.5 border border-[#E4E7EC] rounded-xl bg-slate-50 font-mono font-bold text-xs text-[#475467] flex items-center justify-between">
                  <span>{activeUser?.role || 'CUSTOMER'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${theme.badgeBg}`}>
                    {theme.label}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Account Status</span>
                <div className="h-11 sm:h-12 px-3.5 border border-[#E4E7EC] rounded-xl bg-slate-50 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-xs text-emerald-800">
                    {activeUser?.kycStatus === 'VERIFIED' ? 'Verified Member' : 'Active Account'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. NATIONAL ID & DOCUMENTS VAULT (Authentic OCR & Immutable Records) */}
          <section
            id="documents"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                  National ID & Verified Document Vault
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  {theme.type === 'DRIVER'
                    ? 'Certified CNIC and commercial driving licenses ensure customer trust and direct bookings.'
                    : theme.type === 'LISTER'
                    ? 'Certified CNIC and showroom NTN/trade certificate grant certified showroom badges.'
                    : theme.type === 'MOVERS'
                    ? 'Goods transport route permit and NTN verification for intercity moving jobs.'
                    : theme.type === 'SHUTTLE'
                    ? 'Commercial passenger route permit and vehicle fitness certificates.'
                    : 'Certified National ID unlocks self-drive car bookings and certified profile status.'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SafarPK Certified Vault</span>
              </span>
            </div>

            {/* IMMUTABLE CERTIFIED IDENTITY DOSSIER CARD */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-emerald-950 flex items-center gap-1.5 flex-wrap">
                      <span>Certified Identity Dossier</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                        🔒 Locked & Immutable
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-tight">
                      Authentic data extracted from official documents. Once verified, these details cannot be modified or deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Legal Full Name</span>
                  <span className="font-extrabold text-xs text-slate-900 block mt-0.5 truncate">{cnicName || fullName || 'Tariq Mahmood'}</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">Matched with CNIC</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">National ID / CNIC</span>
                  <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">{nationalId || '35201-9821045-3'}</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">13-digit Pakistani format</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Issue</span>
                  <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">{cnicIssueDate || '2020-05-14'}</span>
                  <span className="text-[9px] text-slate-400">Authenticated record</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Expiry</span>
                  <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">{cnicExpiryDate || '2030-05-13'}</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">Valid & Active</span>
                </div>
              </div>

              {(theme.type === 'DRIVER' || licenseDoc || licenseNumber) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-emerald-200/60">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driving License #</span>
                    <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">{licenseNumber || 'LHR-DL-98210'}</span>
                    <span className="text-[9px] text-emerald-700 font-semibold">Traffic Police Endorsed</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">License Category</span>
                    <span className="font-extrabold text-xs text-slate-900 block mt-0.5">{licenseCategory || 'LTV'}</span>
                    <span className="text-[9px] text-emerald-700 font-semibold">Certified Chauffeur</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">License Issue Date</span>
                    <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">{licenseIssueDate || '2019-01-10'}</span>
                    <span className="text-[9px] text-slate-400">Authenticated record</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">License Expiry Date</span>
                    <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">{licenseExpiryDate || '2029-01-09'}</span>
                    <span className="text-[9px] text-emerald-700 font-semibold">Valid & Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input fields - Disabled & locked when documents are certified */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span className="flex items-center justify-between">
                  <span>National ID / CNIC Number</span>
                  {cnicLocked && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked on File
                    </span>
                  )}
                </span>
                <input
                  type="text"
                  value={nationalId}
                  readOnly={cnicLocked}
                  disabled={cnicLocked}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="35201-9821045-3"
                  className={`h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition ${
                    cnicLocked
                      ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed select-none font-bold'
                      : 'border-[#D0D5DD] text-[#101828] bg-white'
                  }`}
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span className="flex items-center justify-between">
                  <span>
                    {theme.type === 'DRIVER'
                      ? 'Driving License Number'
                      : theme.type === 'LISTER'
                      ? 'Showroom NTN / Business Reg #'
                      : theme.type === 'MOVERS'
                      ? 'Transport Permit / Carrier NTN'
                      : theme.type === 'SHUTTLE'
                      ? 'Route Permit / Fitness Cert #'
                      : 'Driving License / ID Number'}
                  </span>
                  {licenseLocked && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked on File
                    </span>
                  )}
                </span>
                <input
                  type="text"
                  value={licenseNumber}
                  readOnly={licenseLocked}
                  disabled={licenseLocked}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder={
                    theme.type === 'DRIVER'
                      ? 'LHR-DL-98210'
                      : theme.type === 'LISTER'
                      ? 'NTN-7819201-4'
                      : 'PERMIT-2026-X'
                  }
                  className={`h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition ${
                    licenseLocked
                      ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed select-none font-bold'
                      : 'border-[#D0D5DD] text-[#101828] bg-white'
                  }`}
                />
              </label>
            </div>

            {/* DRIVER SPECIFIC: License Category Selector */}
            {theme.type === 'DRIVER' && (
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-sky-950 block">Driving License Category</span>
                  <span className="text-sky-700 text-[11px]">
                    {licenseLocked
                      ? 'Official license category locked in verified driver dossier.'
                      : 'Select the official license category endorsed on your license.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(['LTV', 'HTV', 'PSV'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      disabled={licenseLocked}
                      onClick={() => !licenseLocked && setLicenseCategory(cat)}
                      className={`h-9 px-3.5 rounded-lg text-xs font-bold transition ${
                        licenseCategory === cat
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white border border-sky-200 text-sky-900 hover:bg-sky-100'
                      } ${licenseLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                    >
                      {cat} License {licenseLocked && licenseCategory === cat && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Upload Cards (Uniform 3-card grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Card 1: CNIC Front */}
              <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#101828]">CNIC Front</span>
                  {cnicLocked || cnicFront ? (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Certified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Required</span>
                  )}
                </div>

                <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                  {cnicFront && cnicFront.startsWith('data:image') ? (
                    <img src={cnicFront} alt="CNIC Front" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#667085]">
                      <FileText className={`w-6 h-6 ${theme.primaryText}`} />
                      <span className="text-[11px] font-bold text-[#101828]">CNIC Front Photo</span>
                      <span className="text-[9px]">High resolution</span>
                    </div>
                  )}
                </div>

                {cnicLocked ? (
                  <div className="py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-center font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locked & Certified</span>
                  </div>
                ) : (
                  <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95">
                    <span>{cnicFront ? 'Change Front Photo' : 'Upload Front'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCnicUpload(e, true)}
                    />
                  </label>
                )}
              </div>

              {/* Card 2: CNIC Back */}
              <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#101828]">CNIC Back</span>
                  {cnicLocked || cnicBack ? (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Certified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Required</span>
                  )}
                </div>

                <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                  {cnicBack && cnicBack.startsWith('data:image') ? (
                    <img src={cnicBack} alt="CNIC Back" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#667085]">
                      <FileText className={`w-6 h-6 ${theme.primaryText}`} />
                      <span className="text-[11px] font-bold text-[#101828]">CNIC Back Photo</span>
                      <span className="text-[9px]">High resolution</span>
                    </div>
                  )}
                </div>

                {cnicLocked ? (
                  <div className="py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-center font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locked & Certified</span>
                  </div>
                ) : (
                  <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95">
                    <span>{cnicBack ? 'Change Back Photo' : 'Upload Back'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCnicUpload(e, false)}
                    />
                  </label>
                )}
              </div>

              {/* Card 3: Role-Tailored Document */}
              <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#101828]">
                    {theme.type === 'DRIVER'
                      ? 'Driving License'
                      : theme.type === 'LISTER'
                      ? 'Showroom NTN / Trade'
                      : theme.type === 'MOVERS'
                      ? 'Transport Permit'
                      : theme.type === 'SHUTTLE'
                      ? 'Route Fitness Cert'
                      : 'License / ID Slip'}
                  </span>
                  {licenseLocked || licenseDoc ? (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Certified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">
                      {theme.type === 'DRIVER' ? 'Required' : 'Optional'}
                    </span>
                  )}
                </div>

                <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                  {licenseDoc && licenseDoc.startsWith('data:image') ? (
                    <img src={licenseDoc} alt="Document" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#667085]">
                      <ShieldCheck className={`w-6 h-6 ${theme.primaryText}`} />
                      <span className="text-[11px] font-bold text-[#101828]">
                        {theme.type === 'DRIVER'
                          ? 'Valid License'
                          : theme.type === 'LISTER'
                          ? 'Trade / NTN Slip'
                          : 'Official Certificate'}
                      </span>
                      <span className="text-[9px]">SafarPK Certified</span>
                    </div>
                  )}
                </div>

                {licenseLocked ? (
                  <div className="py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-center font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locked & Certified</span>
                  </div>
                ) : (
                  <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95">
                    <span>{licenseDoc ? 'Change Document' : 'Upload Certificate'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLicenseUpload(e)}
                    />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* 4. PINNED GPS LOCATION (Role Tailored: Standby Base vs Showroom vs Terminal) */}
          <section
            id="location-map"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                {theme.locationCardTitle}
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                {theme.locationCardDesc}
              </p>
            </div>

            <div className="relative h-44 sm:h-48 rounded-2xl bg-[#E8EEF0] border border-[#E4E7EC] overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative flex flex-col items-center px-4 text-center">
                <MapPin className={`w-8 h-8 sm:w-9 sm:h-9 ${theme.primaryText} fill-current drop-shadow-md`} />
                <span className="text-[11px] font-bold bg-white/95 px-3 py-1 rounded-lg shadow-xs mt-1 border border-slate-200 text-[#101828] max-w-xs truncate">
                  {showroomAddress}
                </span>
                <span className="text-[10px] text-[#667085] font-mono mt-0.5">
                  GPS: {gpsLocation}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowroomAddress('Gulberg III, Main Boulevard, Lahore');
                  setGpsLocation('31.5204° N, 74.3587° E (Lahore)');
                }}
                className="absolute right-3 bottom-3 h-8 px-3 rounded-lg bg-white shadow-md text-xs font-bold text-[#101828] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 active:scale-95 transition"
              >
                <MapPin className={`w-3.5 h-3.5 ${theme.primaryText}`} />
                <span>Use GPS Location</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>{theme.locationFieldLabel}</span>
                <input
                  type="text"
                  value={showroomAddress}
                  onChange={(e) => setShowroomAddress(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl text-xs sm:text-sm text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>GPS Coordinates / Google Maps Link</span>
                <input
                  type="text"
                  value={gpsLocation}
                  onChange={(e) => setGpsLocation(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-mono text-xs sm:text-sm text-[#101828] outline-none"
                />
              </label>
            </div>
          </section>

          {/* 5. SUBSCRIPTION & FLEET QUOTA */}
          <section
            id="subscription"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                  Subscription Pass & Publication Quota
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Your monthly membership plan and live marketplace publication status.
                </p>
              </div>

              <Link
                href="/subscription"
                className={`h-10 px-4 rounded-xl ${theme.primaryBg} text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95`}
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Upgrade / Change Plan</span>
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#667085] block font-semibold">Active Plan</span>
                <strong className="text-sm font-heading font-extrabold text-[#101828]">
                  {activeUser?.subscription?.planName || theme.planName}
                </strong>
              </div>

              <div>
                <span className="text-[#667085] block font-semibold">Subscription Status</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {activeUser?.subscription?.status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <span className="text-[#667085] block font-semibold">Listings Quota</span>
                <strong className={`text-sm font-mono ${theme.primaryText}`}>
                  {theme.quotaText}
                </strong>
              </div>
            </div>
          </section>

          {/* 6. ROLE-SPECIFIC EXCLUSIVE PREFERENCES (Zero Cross-Contamination) */}
          {theme.type === 'DRIVER' && (
            <section
              id="role-preferences"
              className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
            >
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828] flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-600" />
                  <span>Chauffeur Duty & Assignment Preferences</span>
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Configure which types of chauffeur assignments and trips you accept from passengers.
                </p>
              </div>

              <div className="flex flex-col divide-y divide-[#F0F2F4] text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Accept Customer-Provided Vehicles
                    </span>
                    <span className="text-[#667085]">
                      Receive hiring requests where customer provides their private or rented car
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={driverWithCustomerCar}
                    onChange={(e) => setDriverWithCustomerCar(e.target.checked)}
                    className="w-5 h-5 rounded accent-sky-600 cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Available for Outstation & Intercity Long Trips
                    </span>
                    <span className="text-[#667085]">
                      Accept trips across cities (e.g. Lahore to Islamabad, Murree, or Peshawar)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={driverTourOutstation}
                    onChange={(e) => setDriverTourOutstation(e.target.checked)}
                    className="w-5 h-5 rounded accent-sky-600 cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Willing to do Overnight Tours
                    </span>
                    <span className="text-[#667085]">
                      Available for multi-day trips with standard night stay & meal allowance
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={driverNightAllowance}
                    onChange={(e) => setDriverNightAllowance(e.target.checked)}
                    className="w-5 h-5 rounded accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>
            </section>
          )}

          {theme.type === 'LISTER' && (
            <section
              id="role-preferences"
              className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
            >
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828] flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#0B6B4F]" />
                  <span>Rental Showroom & Fleet Policy Preferences</span>
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Configure rental policies and showroom open hours for vehicle renters.
                </p>
              </div>

              <div className="flex flex-col divide-y divide-[#F0F2F4] text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Offer Self-Drive Vehicle Rentals
                    </span>
                    <span className="text-[#667085]">
                      Allow verified customers to rent and drive cars without a company chauffeur
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={listerSelfDrive}
                    onChange={(e) => setListerSelfDrive(e.target.checked)}
                    className="w-5 h-5 rounded accent-[#0B6B4F] cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Provide Chauffeur-Driven Option
                    </span>
                    <span className="text-[#667085]">
                      Provide verified company drivers for airport pickups and wedding conveyance
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={listerWithChauffeur}
                    onChange={(e) => setListerWithChauffeur(e.target.checked)}
                    className="w-5 h-5 rounded accent-[#0B6B4F] cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Allow Direct Showroom Walk-in Visits
                    </span>
                    <span className="text-[#667085]">
                      Show verified showroom address and welcome walk-in customers
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={listerShowroomVisits}
                    onChange={(e) => setListerShowroomVisits(e.target.checked)}
                    className="w-5 h-5 rounded accent-[#0B6B4F] cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054] text-xs max-w-sm mt-1">
                <span>Showroom Operating Hours</span>
                <input
                  type="text"
                  value={showroomHours}
                  onChange={(e) => setShowroomHours(e.target.value)}
                  placeholder="09:00 AM - 10:00 PM"
                  className="h-11 px-3.5 border border-[#D0D5DD] rounded-xl text-xs sm:text-sm text-[#101828] outline-none"
                />
              </label>
            </section>
          )}

          {theme.type === 'MOVERS' && (
            <section
              id="role-preferences"
              className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
            >
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>Movers & Cargo Operations Preferences</span>
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Configure shifting services and cargo operations handled by your fleet.
                </p>
              </div>

              <div className="flex flex-col divide-y divide-[#F0F2F4] text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Residential Home & Apartment Shifting
                    </span>
                    <span className="text-[#667085]">
                      Provide household shifting with closed container trucks and loading labor
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={moversHomeShifting}
                    onChange={(e) => setMoversHomeShifting(e.target.checked)}
                    className="w-5 h-5 rounded accent-amber-600 cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Commercial Office & Corporate Relocation
                    </span>
                    <span className="text-[#667085]">
                      Relocate corporate office furniture, IT servers, and warehouse freight
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={moversOfficeRelocation}
                    onChange={(e) => setMoversOfficeRelocation(e.target.checked)}
                    className="w-5 h-5 rounded accent-amber-600 cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Professional Packing & Crating Crew Included
                    </span>
                    <span className="text-[#667085]">
                      Bubble wrap, corrugated boxes and dismantling/carpentry services
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={moversPackingLabor}
                    onChange={(e) => setMoversPackingLabor(e.target.checked)}
                    className="w-5 h-5 rounded accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            </section>
          )}

          {theme.type === 'SHUTTLE' && (
            <section
              id="role-preferences"
              className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
            >
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828] flex items-center gap-2">
                  <Bus className="w-5 h-5 text-violet-600" />
                  <span>Commuter Route & Seating Preferences</span>
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Configure daily office and student passenger commute service standards.
                </p>
              </div>

              <div className="flex flex-col divide-y divide-[#F0F2F4] text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Daily Office Commute Routes
                    </span>
                    <span className="text-[#667085]">
                      Accept morning and evening office commuter monthly reservations
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuttleOfficeCommute}
                    onChange={(e) => setShuttleOfficeCommute(e.target.checked)}
                    className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      School, College & University Student Routes
                    </span>
                    <span className="text-[#667085]">
                      Safe door-to-door morning and afternoon student pick & drop
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuttleStudentVan}
                    onChange={(e) => setShuttleStudentVan(e.target.checked)}
                    className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
                  />
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] block">
                      Air-Conditioned Guaranteed Seat Reservation
                    </span>
                    <span className="text-[#667085]">
                      Guarantee individual seats with dual air-conditioning in all vans
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuttleACGuaranteed}
                    onChange={(e) => setShuttleACGuaranteed(e.target.checked)}
                    className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 7. COUNTRY, CURRENCY & LOCALIZATION */}
          <section
            id="region"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                Country, Currency & Localization
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Prices, phone codes and ID formats adapt to your selected country.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Country</span>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none bg-white cursor-pointer"
                >
                  <option value="PK">Pakistan (PK)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="SA">Saudi Arabia (SA)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="US">United States (US)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none bg-white cursor-pointer"
                >
                  <option value="PKR">PKR · Rs</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="GBP">GBP · £</option>
                  <option value="USD">USD · $</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-medium text-xs sm:text-sm text-[#101828] outline-none bg-white cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Urdu">اردو (Urdu)</option>
                  <option value="Arabic">العربية (Arabic)</option>
                </select>
              </label>
            </div>
          </section>

          {/* 8. WHATSAPP & DIRECT CONTACT PREFERENCES */}
          <section
            id="contact"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                WhatsApp & Direct Contact Preferences
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Booking requests and customer inquiries use this verified phone number.
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#344054] max-w-sm">
              <span>WhatsApp Phone Number</span>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl font-mono text-xs sm:text-sm text-[#101828] outline-none"
              />
            </label>

            <div className="flex flex-col divide-y divide-[#F0F2F4] text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#101828] block">
                    Receive booking requests on WhatsApp
                  </span>
                  <span className="text-[#667085]">
                    Instant notifications when a customer taps request to book
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className={`w-5 h-5 rounded cursor-pointer ${
                    theme.type === 'DRIVER' ? 'accent-sky-600' : 'accent-[#0B6B4F]'
                  }`}
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#101828] block">
                    Allow direct phone calls
                  </span>
                  <span className="text-[#667085]">
                    Show call icon on your listings for instant customer inquiries
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowCalls}
                  onChange={(e) => setAllowCalls(e.target.checked)}
                  className={`w-5 h-5 rounded cursor-pointer ${
                    theme.type === 'DRIVER' ? 'accent-sky-600' : 'accent-[#0B6B4F]'
                  }`}
                />
              </div>
            </div>
          </section>

          {/* 9. PASSWORD & SECURITY */}
          <section
            id="security"
            className="bg-white border border-[#EEF0F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#101828]">
                Password & Security
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Set a strong password for seamless login across all devices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl text-xs sm:text-sm text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                  className="h-11 sm:h-12 px-3.5 border border-[#D0D5DD] rounded-xl text-xs sm:text-sm text-[#101828] outline-none"
                />
              </label>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveProfile}
              className={`w-full sm:w-auto mt-2 h-12 px-7 rounded-xl ${theme.primaryBg} text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save All Settings & Documents</span>
            </button>
          </section>

          {/* 10. SESSION SIGN OUT CARD */}
          {activeUser && (
            <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-rose-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <span>Log Out of SafarPK</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Signed in as <span className="font-bold text-slate-900">{activeUser.name}</span> ({theme.label}). You can safely sign back in anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </section>
          )}
        </div>
      </main>

      {/* MOBILE STICKY FLOATING QUICK ACTION BAR (Visible on mobile for effortless saving) */}
      <div className="md:hidden fixed bottom-[65px] left-0 right-0 z-40 px-4 py-2 bg-white/90 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between gap-3 shadow-lg">
        <span className="text-[11px] font-bold text-slate-600 truncate">
          {activeUser ? activeUser.name : 'Account Profile'}
        </span>
        <button
          type="button"
          onClick={handleSaveProfile}
          className={`h-9 px-4 rounded-lg ${theme.primaryBg} text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Save Changes</span>
        </button>
      </div>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}
