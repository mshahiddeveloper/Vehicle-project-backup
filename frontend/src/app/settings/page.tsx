'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import {
  getActiveUser,
  setActiveUser,
  logoutActiveUser,
  RegisteredUser,
  sanitizePakistaniPhone,
  markUserPhoneVerified,
} from '@/data/userAuth';
import {
  isDocActiveForRole,
  isDocMandatoryForRole,
  getRoleActiveDocList,
  getRoleDocRequirement,
} from '@/data/docRules';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { WhatsAppOtpModal } from '@/components/WhatsAppOtpModal';
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
  const [ntnNumber, setNtnNumber] = useState('');
  const [ntnDoc, setNtnDoc] = useState('');
  const [ownerCardNumber, setOwnerCardNumber] = useState('');
  const [ownerCardDoc, setOwnerCardDoc] = useState('');
  const [docRulesVersion, setDocRulesVersion] = useState(0);

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

  // Phone verification states
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Active section tab tracking for pill highlighting
  const [activeNavSection, setActiveNavSection] = useState('avatar-studio');

  const todayStr = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '2026-11-20';

  useEffect(() => {
    const handleRulesUpdate = () => {
      setDocRulesVersion((v) => v + 1);
    };
    window.addEventListener('safarpk_doc_rules_updated', handleRulesUpdate);
    return () => {
      window.removeEventListener('safarpk_doc_rules_updated', handleRulesUpdate);
    };
  }, []);

  useEffect(() => {
    const u = getActiveUser();
    if (u) {
      setActiveUserState(u);
      setFullName(u.name || '');
      setBusinessName(u.businessName || '');
      setEmail(u.email || '');
      setCity(u.city || 'Lahore');
      setCountryCode(u.countryCode || 'PK');

      const sanitizedPhone = sanitizePakistaniPhone(u.phone || '');
      setWhatsappNumber(sanitizedPhone.display || u.phone || '');
      setPhoneVerified(Boolean(u.phoneVerified));
      setPhoneLocked(Boolean(u.phoneLocked));

      // Authentic Document Credentials (no fake dummy fallbacks for new registered users)
      setNationalId(u.cnicNumber || u.nationalId || '');
      setCnicName(u.cnicName || u.name || '');
      setCnicIssueDate(u.cnicIssueDate || '');
      setCnicExpiryDate(u.cnicExpiryDate || '');
      setCnicLocked(Boolean(u.cnicLocked));

      setLicenseNumber(u.licenseNumber || '');
      setLicenseName(u.licenseName || u.name || '');
      setLicenseIssueDate(u.licenseIssueDate || '');
      setLicenseExpiryDate(u.licenseExpiryDate || '');
      setLicenseLocked(Boolean(u.licenseLocked));

      setNtnNumber(u.ntnNumber || '');
      setNtnDoc(u.ntnUrl || '');
      setOwnerCardNumber(u.carOwnerCardRegNumber || '');
      setOwnerCardDoc(u.carOwnerCardUrl || '');

      setAvatarUrl(u.avatarUrl || '');
      setCnicFront(u.cnicFrontUrl || '');
      setCnicBack(u.cnicBackUrl || '');
      setLicenseDoc(u.licenseUrl || '');
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

  const handlePhoneChange = (raw: string) => {
    if (phoneLocked) return;
    const sanitized = sanitizePakistaniPhone(raw);
    setWhatsappNumber(sanitized.display);
    if (phoneVerified) setPhoneVerified(false);
  };

  const handlePhoneVerified = (verifiedPhone: string) => {
    const sanitized = sanitizePakistaniPhone(verifiedPhone);
    setWhatsappNumber(sanitized.display);
    setPhoneVerified(true);
    setPhoneLocked(true);

    const u = getActiveUser();
    if (u) {
      u.phone = sanitized.standard;
      u.phoneVerified = true;
      u.phoneLocked = true;
      setActiveUser(u);
      setActiveUserState({ ...u });
      window.dispatchEvent(new Event('safarpk_auth_state_changed'));
    }

    setToastMessage('✓ WhatsApp phone number verified & locked permanently!');
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleCnicUpload = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const u = getActiveUser();

        if (isFront) {
          setCnicFront(dataUrl);
          const cleanName = fullName.trim() || u?.name || '';
          if (!cnicName) setCnicName(cleanName);
          if (u) {
            u.cnicFrontUrl = dataUrl;
            u.cnicFrontUploaded = true;
            if (cleanName && !u.cnicName) u.cnicName = cleanName;
            setActiveUser(u);
            setActiveUserState({ ...u });
            window.dispatchEvent(new Event('safarpk_auth_state_changed'));
          }
          setToastMessage('✓ CNIC Front photo uploaded! Please now upload the CNIC Back photo.');
        } else {
          setCnicBack(dataUrl);
          if (u) {
            u.cnicBackUrl = dataUrl;
            u.cnicBackUploaded = true;
            setActiveUser(u);
            setActiveUserState({ ...u });
            window.dispatchEvent(new Event('safarpk_auth_state_changed'));
          }
          setToastMessage('✓ CNIC Back photo uploaded! Review your details below and click "Confirm & Lock Documents".');
        }
        setTimeout(() => setToastMessage(''), 4500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLicenseDoc(dataUrl);

        const cleanName = fullName.trim() || activeUser?.name || '';
        if (!licenseName) setLicenseName(cleanName);

        const u = getActiveUser();
        if (u) {
          u.licenseUrl = dataUrl;
          u.licenseUploaded = true;
          if (cleanName && !u.licenseName) u.licenseName = cleanName;
          if (!u.licenseCategory) u.licenseCategory = licenseCategory;
          setActiveUser(u);
          setActiveUserState({ ...u });
          window.dispatchEvent(new Event('safarpk_auth_state_changed'));
        }

        setToastMessage('✓ License / Document uploaded! Review details and confirm when ready.');
        setTimeout(() => setToastMessage(''), 4500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNtnUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setNtnDoc(dataUrl);
        const u = getActiveUser();
        if (u) {
          u.ntnUrl = dataUrl;
          u.ntnUploaded = true;
          if (ntnNumber) u.ntnNumber = ntnNumber;
          setActiveUser(u);
          setActiveUserState({ ...u });
          window.dispatchEvent(new Event('safarpk_auth_state_changed'));
        }
        setToastMessage('✓ Business FBR NTN document uploaded successfully!');
        setTimeout(() => setToastMessage(''), 4500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOwnerCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setOwnerCardDoc(dataUrl);
        const u = getActiveUser();
        if (u) {
          u.carOwnerCardUrl = dataUrl;
          u.carOwnerCardUploaded = true;
          if (ownerCardNumber) u.carOwnerCardRegNumber = ownerCardNumber;
          setActiveUser(u);
          setActiveUserState({ ...u });
          window.dispatchEvent(new Event('safarpk_auth_state_changed'));
        }
        setToastMessage('✓ Car Owner Excise Smart Card uploaded successfully!');
        setTimeout(() => setToastMessage(''), 4500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLockDocuments = () => {
    const userRole = activeUser?.role || 'CUSTOMER';
    const isCnicMandatory = isDocMandatoryForRole(userRole, 'cnic', countryCode);
    const isLicenseMandatory = isDocMandatoryForRole(userRole, 'license', countryCode);

    if (isCnicMandatory && (!cnicFront || !cnicBack)) {
      setToastMessage('⚠️ Please upload both CNIC Front and CNIC Back photos before certifying.');
      setTimeout(() => setToastMessage(''), 4500);
      return;
    }

    const cleanCnic = nationalId.trim();
    if (isCnicMandatory && (!cleanCnic || cleanCnic.replace(/\D/g, '').length < 13)) {
      setToastMessage('⚠️ Please enter a valid 13-digit CNIC number (e.g. 35201-1234567-1).');
      setTimeout(() => setToastMessage(''), 4500);
      return;
    }

    if (isLicenseMandatory && !licenseDoc && !licenseNumber) {
      setToastMessage('⚠️ Please upload your Driving License before certifying.');
      setTimeout(() => setToastMessage(''), 4500);
      return;
    }

    const cleanName = cnicName.trim() || fullName.trim() || activeUser?.name || '';
    const issue = cnicIssueDate || '2021-06-15';
    const expiry = cnicExpiryDate || '2031-06-14';

    setCnicLocked(true);
    setLicenseLocked(true);

    const u = getActiveUser();
    if (u) {
      u.cnicFrontUrl = cnicFront;
      u.cnicBackUrl = cnicBack;
      u.cnicNumber = cleanCnic;
      u.nationalId = cleanCnic;
      u.cnicName = cleanName;
      u.cnicIssueDate = issue;
      u.cnicExpiryDate = expiry;
      u.cnicLocked = true;
      u.cnicFrontUploaded = Boolean(cnicFront);
      u.cnicBackUploaded = Boolean(cnicBack);

      if (licenseDoc || licenseNumber) {
        u.licenseUrl = licenseDoc;
        u.licenseNumber = licenseNumber.trim();
        u.licenseName = licenseName.trim() || cleanName;
        u.licenseCategory = licenseCategory;
        u.licenseIssueDate = licenseIssueDate || '2020-04-10';
        u.licenseExpiryDate = licenseExpiryDate || '2030-04-09';
        u.licenseLocked = true;
        u.licenseUploaded = true;
      }

      if (ntnDoc || ntnNumber) {
        u.ntnUrl = ntnDoc;
        u.ntnNumber = ntnNumber;
        u.ntnUploaded = true;
      }

      if (ownerCardDoc || ownerCardNumber) {
        u.carOwnerCardUrl = ownerCardDoc;
        u.carOwnerCardRegNumber = ownerCardNumber;
        u.carOwnerCardUploaded = true;
        u.carOwnerCardLocked = true;
      }

      u.kycStatus = 'VERIFIED';
      setActiveUser(u);
      setActiveUserState({ ...u });
      window.dispatchEvent(new Event('safarpk_auth_state_changed'));
    }

    setToastMessage('🔒 Documents authenticated & permanently locked in SafarPK Secure Vault!');
    setTimeout(() => setToastMessage(''), 5000);
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

      const sanitizedWa = sanitizePakistaniPhone(whatsappNumber);
      u.phone = sanitizedWa.standard || whatsappNumber.trim();
      u.phoneVerified = phoneVerified;
      u.phoneLocked = phoneLocked;

      if (!cnicLocked) {
        u.nationalId = nationalId.trim() || undefined;
        u.cnicNumber = nationalId.trim() || undefined;
        u.cnicName = cnicName.trim() || fullName.trim() || undefined;
        u.cnicIssueDate = cnicIssueDate || undefined;
        u.cnicExpiryDate = cnicExpiryDate || undefined;
      }

      if (!licenseLocked) {
        u.licenseNumber = licenseNumber.trim() || undefined;
        u.licenseName = licenseName.trim() || fullName.trim() || undefined;
        u.licenseCategory = licenseCategory;
        u.licenseIssueDate = licenseIssueDate || undefined;
        u.licenseExpiryDate = licenseExpiryDate || undefined;
      }

      u.avatarUrl = avatarUrl || undefined;
      u.cnicFrontUrl = cnicFront || undefined;
      u.cnicBackUrl = cnicBack || undefined;
      u.licenseUrl = licenseDoc || undefined;
      u.tradeLicenseUrl = tradeLicenseDoc || undefined;
      if (ntnDoc || ntnNumber) {
        u.ntnUrl = ntnDoc || undefined;
        u.ntnNumber = ntnNumber.trim() || undefined;
        u.ntnUploaded = Boolean(ntnDoc);
      }
      if (ownerCardDoc || ownerCardNumber) {
        u.carOwnerCardUrl = ownerCardDoc || undefined;
        u.carOwnerCardRegNumber = ownerCardNumber.trim() || undefined;
        u.carOwnerCardUploaded = Boolean(ownerCardDoc);
      }
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

  // Dynamic Document Requirements per Super Admin Configuration
  const userRole = activeUser?.role || 'CUSTOMER';
  const isCustomer = userRole === 'CUSTOMER';

  const isCnicActive = isDocActiveForRole(userRole, 'cnic', countryCode, activeUser?.providerSubtype);
  const isLicenseActive = isDocActiveForRole(userRole, 'license', countryCode, activeUser?.providerSubtype);
  const isNtnActive = isDocActiveForRole(userRole, 'ntn', countryCode, activeUser?.providerSubtype);
  const isOwnerCardActive = isDocActiveForRole(userRole, 'owner_card', countryCode, activeUser?.providerSubtype);
  const hasAnyActiveDoc = isCnicActive || isLicenseActive || isNtnActive || isOwnerCardActive;

  // Checklist Calculations
  const isPhoneVerified = Boolean(phoneVerified || activeUser?.phoneVerified);
  const isCnicFrontDone = Boolean(cnicFront || activeUser?.cnicFrontUrl);
  const isCnicBackDone = Boolean(cnicBack || activeUser?.cnicBackUrl);
  const isLicenseDone = Boolean(licenseDoc || activeUser?.licenseUrl);
  const isNtnDone = Boolean(ntnDoc || activeUser?.ntnUrl || activeUser?.ntnUploaded);
  const isOwnerCardDone = Boolean(ownerCardDoc || activeUser?.carOwnerCardUrl || activeUser?.carOwnerCardUploaded);
  const isVaultCertified = Boolean(cnicLocked || activeUser?.cnicLocked);

  // Dynamic checklist based strictly on Super Admin document rules
  const checklistItems: { label: string; done: boolean; docId?: string }[] = [];
  checklistItems.push({ label: 'WhatsApp Phone Verified', done: isPhoneVerified });

  if (isCnicActive) {
    checklistItems.push({ label: 'CNIC Front Photo Uploaded', done: isCnicFrontDone, docId: 'cnic' });
    checklistItems.push({ label: 'CNIC Back Photo Uploaded', done: isCnicBackDone, docId: 'cnic' });
  }
  if (isLicenseActive) {
    checklistItems.push({
      label: theme.type === 'DRIVER' ? 'Driving License Uploaded' : 'Driving License / Verification',
      done: isLicenseDone,
      docId: 'license',
    });
  }
  if (isNtnActive) {
    checklistItems.push({
      label: 'Business FBR NTN Uploaded',
      done: isNtnDone,
      docId: 'ntn',
    });
  }
  if (isOwnerCardActive) {
    checklistItems.push({
      label: 'Car Owner Smart Card Uploaded',
      done: isOwnerCardDone,
      docId: 'owner_card',
    });
  }
  if (hasAnyActiveDoc) {
    checklistItems.push({ label: 'Official Vault Certification Locked', done: isVaultCertified });
  }

  const checklistCompletedCount = checklistItems.filter((i) => i.done).length;
  const checklistTotalCount = Math.max(checklistItems.length, 1);
  const isAllChecklistCompleted = checklistCompletedCount === checklistTotalCount;

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col pb-32 md:pb-0">
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

          {/* ONBOARDING CHECKLIST: Only for Partners/Vendors (Hidden completely for CUSTOMER) */}
          {!isCustomer && (
            <section className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-800/40 space-y-4">
              {!hasAnyActiveDoc ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Instant Access Active
                      </span>
                    </div>
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-white mt-1">
                      Direct Operational Clearance · Zero Document Blockers
                    </h3>
                    <p className="text-xs sm:text-sm text-white font-medium mt-1.5 max-w-xl leading-relaxed">
                      Super Admin has currently set document requirements to <strong>OFF</strong> for this role. You are authorized to list vehicles, post routes, and accept customer bookings immediately!
                    </p>
                  </div>
                  <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-xs">
                      <div className="font-extrabold">100% Unblocked</div>
                      <div className="text-[10px] text-emerald-300/80">No documents required</div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          Verification Checklist
                        </span>
                        <span className="text-xs text-emerald-300/80 font-mono font-bold">
                          {checklistCompletedCount} of {checklistTotalCount} Completed ({Math.round((checklistCompletedCount / checklistTotalCount) * 100)}%)
                        </span>
                      </div>
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-white mt-1">
                        Partner Verification & Compliance Checklist
                      </h3>
                      <p className="text-xs text-emerald-100/80 max-w-xl">
                        Complete these required document steps to earn the SafarPK Certified badge and activate direct customer booking leads.
                      </p>
                    </div>

                    {isAllChecklistCompleted ? (
                      <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="text-xs">
                          <div className="font-extrabold">100% Certified Member</div>
                          <div className="text-[10px] text-emerald-300/80">All records locked & valid</div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div className="text-xs">
                          <div className="font-extrabold">Verification Incomplete</div>
                          <div className="text-[10px] text-amber-200/80">{checklistTotalCount - checklistCompletedCount} item(s) pending</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                      style={{ width: `${(checklistCompletedCount / checklistTotalCount) * 100}%` }}
                    />
                  </div>

                  {/* Dynamic Checklist Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {checklistItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                          item.done
                            ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                            : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {idx === 0 ? (
                            <WhatsAppIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-bold text-white text-[11px] truncate">
                              {idx + 1}. {item.label}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.done ? '✓ Done' : 'Action needed'}
                            </div>
                          </div>
                        </div>
                        {item.done ? (
                          <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                            ✓ Done
                          </span>
                        ) : idx === 0 ? (
                          <button
                            type="button"
                            onClick={() => setIsOtpModalOpen(true)}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                          >
                            Verify WA
                          </button>
                        ) : (
                          <a href="#documents" className="text-[10px] font-bold text-teal-400 hover:underline shrink-0">
                            Upload
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
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
                  Official identity records for your SafarPK profile verification and compliance.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                hasAnyActiveDoc
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{hasAnyActiveDoc ? 'SafarPK Certified Vault' : 'Verification Unblocked'}</span>
              </span>
            </div>

            {!hasAnyActiveDoc ? (
              <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-emerald-950">
                  Instant Operational Status · No Documents Required
                </h4>
                <p className="text-xs text-emerald-900/80 max-w-lg mx-auto leading-relaxed">
                  Super Admin has configured document requirements to <strong>OFF</strong> for your role. You are free to list vehicles, manage services, and accept bookings immediately without uploading documents.
                </p>
              </div>
            ) : (
              <>
                {/* IMMUTABLE CERTIFIED IDENTITY DOSSIER CARD */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-heading font-extrabold text-sm text-emerald-950 flex items-center gap-1.5 flex-wrap">
                          <span>Identity & Verification Dossier</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            cnicLocked || (isCnicActive ? (cnicFront && cnicBack) : true)
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {cnicLocked || (isCnicActive ? (cnicFront && cnicBack) : true)
                              ? '✓ Documents Submitted'
                              : 'Pending Verification'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-emerald-800 leading-tight">
                          Official identification records for your SafarPK profile verification and compliance.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Legal Full Name</span>
                      <span className="font-extrabold text-xs text-slate-900 block mt-0.5 truncate">
                        {cnicName || fullName || 'Pending Entry'}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-semibold">
                        {cnicName ? 'Matched with Records' : 'From Registration'}
                      </span>
                    </div>

                    {isCnicActive && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">National ID / CNIC</span>
                        <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">
                          {nationalId || 'Pending Entry'}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold">
                          {nationalId ? '13-digit Pakistani format' : 'Enter 13-digit CNIC'}
                        </span>
                      </div>
                    )}

                    {isCnicActive && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CNIC Expiry</span>
                        <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                          {cnicExpiryDate || 'Pending Entry'}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold">
                          {cnicExpiryDate ? 'Valid & Active' : 'Select expiry date'}
                        </span>
                      </div>
                    )}

                    {isLicenseActive && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driving License #</span>
                        <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">
                          {licenseNumber || 'Pending Entry'}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold">
                          {licenseNumber ? 'Official License' : 'Action needed'}
                        </span>
                      </div>
                    )}

                    {isNtnActive && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FBR NTN #</span>
                        <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">
                          {ntnNumber || 'Pending Entry'}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold">
                          {ntnNumber ? 'Tax Registered' : 'Enter FBR NTN'}
                        </span>
                      </div>
                    )}

                    {isOwnerCardActive && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Excise Smart Card</span>
                        <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">
                          {ownerCardNumber || 'Pending Entry'}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold">
                          {ownerCardNumber ? 'Ownership Record' : 'Enter Reg Number'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input fields - Render strictly when document is active */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {isCnicActive && (
                    <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                      <span>National ID / CNIC Number</span>
                      <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="35201-1234567-1"
                        className="h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition border-[#D0D5DD] text-[#101828] bg-white focus:border-emerald-600"
                      />
                    </label>
                  )}

                  {isCnicActive && (
                    <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                      <span>CNIC Date of Issue</span>
                      <input
                        type="date"
                        max={todayStr}
                        value={cnicIssueDate}
                        onChange={(e) => setCnicIssueDate(e.target.value)}
                        className="h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition border-[#D0D5DD] text-[#101828] bg-white focus:border-emerald-600"
                      />
                    </label>
                  )}

                  {isCnicActive && (
                    <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                      <span>CNIC Date of Expiry</span>
                      <input
                        type="date"
                        min={todayStr}
                        value={cnicExpiryDate}
                        onChange={(e) => setCnicExpiryDate(e.target.value)}
                        className="h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition border-[#D0D5DD] text-[#101828] bg-white focus:border-emerald-600"
                      />
                    </label>
                  )}

                  {isLicenseActive && (
                    <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                      <span>Driving License #</span>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="LHR-DL-12345"
                        className="h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition border-[#D0D5DD] text-[#101828] bg-white focus:border-emerald-600"
                      />
                    </label>
                  )}

                  {isNtnActive && (
                    <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                      <span>Business FBR NTN #</span>
                      <input
                        type="text"
                        value={ntnNumber}
                        onChange={(e) => setNtnNumber(e.target.value)}
                        placeholder="7819201-4"
                        className="h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition border-[#D0D5DD] text-[#101828] bg-white focus:border-emerald-600"
                      />
                    </label>
                  )}

                  {isOwnerCardActive && (
                    <label className="flex flex-col gap-1.5 font-semibold text-[#344054]">
                      <span>Car Owner Smart Card / Reg #</span>
                      <input
                        type="text"
                        value={ownerCardNumber}
                        onChange={(e) => setOwnerCardNumber(e.target.value)}
                        placeholder="LEA-24-9988"
                        className="h-11 sm:h-12 px-3.5 border rounded-xl font-mono text-xs sm:text-sm outline-none transition border-[#D0D5DD] text-[#101828] bg-white focus:border-emerald-600"
                      />
                    </label>
                  )}
                </div>

                {/* DRIVER SPECIFIC: License Category Selector */}
                {theme.type === 'DRIVER' && isLicenseActive && (
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-sky-950 block">Driving License Category</span>
                      <span className="text-sky-700 text-[11px]">
                        Select the official license category endorsed on your license.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(['LTV', 'HTV', 'PSV'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setLicenseCategory(cat)}
                          className={`h-9 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            licenseCategory === cat
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white border border-sky-200 text-sky-900 hover:bg-sky-100'
                          }`}
                        >
                          {cat} License {licenseCategory === cat && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Upload Cards (Uniform Grid - Only Active Docs Rendered) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {/* Card 1: CNIC Front */}
                  {isCnicActive && (
                    <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101828]">CNIC Front</span>
                        {cnicFront ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Required
                          </span>
                        )}
                      </div>

                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                        {cnicFront ? (
                          <img src={cnicFront} alt="CNIC Front" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#667085]">
                            <FileText className={`w-6 h-6 ${theme.primaryText}`} />
                            <span className="text-[11px] font-bold text-[#101828]">CNIC Front Photo</span>
                            <span className="text-[9px]">High resolution</span>
                          </div>
                        )}
                      </div>

                      <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95 shadow-2xs">
                        <span>{cnicFront ? 'Change Front Photo' : 'Upload Front'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCnicUpload(e, true)}
                        />
                      </label>
                    </div>
                  )}

                  {/* Card 2: CNIC Back */}
                  {isCnicActive && (
                    <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101828]">CNIC Back</span>
                        {cnicBack ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Required
                          </span>
                        )}
                      </div>

                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                        {cnicBack ? (
                          <img src={cnicBack} alt="CNIC Back" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#667085]">
                            <FileText className={`w-6 h-6 ${theme.primaryText}`} />
                            <span className="text-[11px] font-bold text-[#101828]">CNIC Back Photo</span>
                            <span className="text-[9px]">High resolution</span>
                          </div>
                        )}
                      </div>

                      <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95 shadow-2xs">
                        <span>{cnicBack ? 'Change Back Photo' : 'Upload Back'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCnicUpload(e, false)}
                        />
                      </label>
                    </div>
                  )}

                  {/* Card 3: Driving License */}
                  {isLicenseActive && (
                    <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101828]">Driving License</span>
                        {licenseDoc ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">
                            {isDocMandatoryForRole(userRole, 'license', countryCode) ? 'Required' : 'Optional'}
                          </span>
                        )}
                      </div>

                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                        {licenseDoc ? (
                          <img src={licenseDoc} alt="Document" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#667085]">
                            <ShieldCheck className={`w-6 h-6 ${theme.primaryText}`} />
                            <span className="text-[11px] font-bold text-[#101828]">Valid License</span>
                            <span className="text-[9px]">Traffic Authority</span>
                          </div>
                        )}
                      </div>

                      <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95 shadow-2xs">
                        <span>{licenseDoc ? 'Change Document' : 'Upload License'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLicenseUpload}
                        />
                      </label>
                    </div>
                  )}

                  {/* Card 4: Business FBR NTN */}
                  {isNtnActive && (
                    <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101828]">Business FBR NTN</span>
                        {ntnDoc ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">
                            {isDocMandatoryForRole(userRole, 'ntn', countryCode) ? 'Required' : 'Optional'}
                          </span>
                        )}
                      </div>

                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                        {ntnDoc ? (
                          <img src={ntnDoc} alt="FBR NTN" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#667085]">
                            <Building2 className={`w-6 h-6 ${theme.primaryText}`} />
                            <span className="text-[11px] font-bold text-[#101828]">FBR Certificate</span>
                            <span className="text-[9px]">Tax Compliance</span>
                          </div>
                        )}
                      </div>

                      <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95 shadow-2xs">
                        <span>{ntnDoc ? 'Change NTN Slip' : 'Upload NTN Slip'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleNtnUpload}
                        />
                      </label>
                    </div>
                  )}

                  {/* Card 5: Car Owner Smart Card */}
                  {isOwnerCardActive && (
                    <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101828]">Car Owner Smart Card</span>
                        {ownerCardDoc ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500">
                            {isDocMandatoryForRole(userRole, 'owner_card', countryCode) ? 'Required' : 'Optional'}
                          </span>
                        )}
                      </div>

                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                        {ownerCardDoc ? (
                          <img src={ownerCardDoc} alt="Excise Smart Card" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#667085]">
                            <Car className={`w-6 h-6 ${theme.primaryText}`} />
                            <span className="text-[11px] font-bold text-[#101828]">Excise Smart Card</span>
                            <span className="text-[9px]">Registration Book</span>
                          </div>
                        )}
                      </div>

                      <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition active:scale-95 shadow-2xs">
                        <span>{ownerCardDoc ? 'Change Smart Card' : 'Upload Smart Card'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleOwnerCardUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Dedicated Action to Lock and Certify Official Vault Documents */}
                {!cnicLocked && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 block text-sm">
                        🔒 Ready to Certify & Lock Official Documents?
                      </span>
                      <span className="text-emerald-800 text-[11px]">
                        Once locked, your details and uploaded documents are permanently safeguarded in the SafarPK Secure Vault to guarantee customer trust and fraud prevention.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLockDocuments}
                      className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock & Certify Documents</span>
                    </button>
                  </div>
                )}
              </>
            )}
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

            <div className="flex flex-col gap-1.5 text-xs font-semibold text-[#344054] max-w-md">
              <div className="flex items-center justify-between">
                <span>WhatsApp Phone Number</span>
                {phoneLocked || phoneVerified ? (
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5 text-emerald-700" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    Verification Required
                  </span>
                )}
              </div>

              <div className="flex items-stretch gap-2">
                <div className={`flex flex-1 items-center h-11 border rounded-xl overflow-hidden bg-white transition ${
                  phoneLocked ? 'bg-slate-100 border-slate-200' : 'border-[#D0D5DD] focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20'
                }`}>
                  <div className="h-full px-3 bg-slate-50 border-r border-slate-200 flex items-center gap-1.5 shrink-0 text-slate-700 font-bold text-xs select-none">
                    <span>🇵🇰</span>
                    <span>+92</span>
                  </div>

                  <input
                    type="tel"
                    disabled={phoneLocked}
                    readOnly={phoneLocked}
                    value={whatsappNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="300 1234567"
                    className={`w-full h-full px-3 text-xs sm:text-sm font-mono outline-none ${
                      phoneLocked ? 'bg-slate-100 text-slate-700 cursor-not-allowed select-none font-bold' : 'text-[#101828]'
                    }`}
                  />
                </div>

                {!phoneLocked ? (
                  <button
                    type="button"
                    disabled={!sanitizePakistaniPhone(whatsappNumber).isValid}
                    onClick={() => setIsOtpModalOpen(true)}
                    className="px-3.5 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                    title="Verify via WhatsApp OTP"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>Verify WA</span>
                  </button>
                ) : (
                  <div className="px-3 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

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

      <div className="hidden md:block">
        <AppFooter />
      </div>
      <MobileNavBar />

      {/* WhatsApp OTP Verification Modal */}
      <WhatsAppOtpModal
        isOpen={isOtpModalOpen}
        phone={whatsappNumber}
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={handlePhoneVerified}
      />
    </div>
  );
}
