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
  Globe,
  Phone,
  Bell,
  ShieldCheck,
  Lock,
  Check,
  AlertCircle,
  ArrowLeft,
  Upload,
  Camera,
  MapPin,
  CreditCard,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  LogOut,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
];

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

  // Identity & Documents Vault
  const [nationalId, setNationalId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cnicFront, setCnicFront] = useState('');
  const [cnicBack, setCnicBack] = useState('');
  const [licenseDoc, setLicenseDoc] = useState('');
  const [tradeLicenseDoc, setTradeLicenseDoc] = useState('');

  // Showroom & Map Location
  const [showroomAddress, setShowroomAddress] = useState('Gulberg III, Main Boulevard, Lahore');
  const [gpsLocation, setGpsLocation] = useState('31.5204° N, 74.3587° E (Lahore)');

  // Toggles
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);
  const [inboxAlerts, setInboxAlerts] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');

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
      setNationalId(u.nationalId || '35202-9847192-3');
      setLicenseNumber(u.licenseNumber || 'LHR-DL-49201');
      setAvatarUrl(u.avatarUrl || '');
      setCnicFront(u.cnicFrontUrl || 'cnic_front_verified.jpg');
      setCnicBack(u.cnicBackUrl || 'cnic_back_verified.jpg');
      setLicenseDoc(u.licenseUrl || 'license_verified.jpg');
      setTradeLicenseDoc(u.tradeLicenseUrl || '');
      if (u.showroomAddress) setShowroomAddress(u.showroomAddress);
      if (u.gpsLocation) setGpsLocation(u.gpsLocation);
    }
  }, []);

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
      window.dispatchEvent(new Event('safarpk_auth_state_changed'));
    }

    setToastMessage('✓ Settings, profile picture and documents saved successfully!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const getDashboardHref = () => {
    if (activeUser?.role === 'LISTER') return '/lister';
    if (activeUser?.role === 'DRIVER') return '/driver';
    if (activeUser?.role === 'PROVIDER') return '/provider';
    return '/customer';
  };

  const handleLogout = () => {
    logoutActiveUser();
    setActiveUserState(null);
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-4 sm:px-8 py-6 md:py-12 flex flex-col md:flex-row gap-6 md:gap-8 items-start pb-28 md:pb-12">
        {/* Left Nav Menu - Static on mobile to prevent overlapping cards, Sticky on desktop */}
        <aside className="w-full md:w-64 flex flex-col gap-1.5 shrink-0 static md:sticky md:top-24 z-10">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Link
              href={getDashboardHref()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6B4F] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Back to Dashboard</span>
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

          <h1 className="font-heading font-extrabold text-2xl text-[#101828] mb-0.5">
            Account & Profile
          </h1>
          <p className="text-xs text-[#667085] mb-2.5">
            Manage your public profile, pictures, identity documents and subscription.
          </p>

          {/* Quick Section Tabs: Horizontal Scrollable on Mobile, Vertical Stack on Desktop */}
          <div className="flex md:flex-col overflow-x-auto no-scrollbar gap-1.5 pb-2 md:pb-0 -mx-1 px-1">
            <a
              href="#avatar-studio"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white border border-[#EEF0F2] text-xs font-bold text-[#101828] flex items-center shrink-0 shadow-2xs hover:bg-slate-50 transition"
            >
              Profile Picture & Logo
            </a>
            <a
              href="#profile"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              Business & Personal Info
            </a>
            <a
              href="#documents"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              CNIC & Document Vault
            </a>
            <a
              href="#showroom-map"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              Showroom & GPS Location
            </a>
            <a
              href="#subscription"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              Subscription & Fleet Quota
            </a>
            <a
              href="#region"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              Country & Currency
            </a>
            <a
              href="#contact"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              WhatsApp & Contact
            </a>
            <a
              href="#security"
              className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl bg-white md:bg-transparent border border-slate-200/80 md:border-transparent text-xs font-semibold text-[#475467] hover:text-[#101828] hover:bg-white flex items-center shrink-0 transition"
            >
              Password & Security
            </a>
          </div>
        </aside>

        {/* Right Settings Sections */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-[#E9F3EE] text-[#08513C] font-bold text-xs flex items-center gap-2 border border-[#0B6B4F]/30 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#0B6B4F] shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. PROFILE PICTURE & BUSINESS LOGO STUDIO */}
          <section
            id="avatar-studio"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#101828]">
                  Profile Picture & Business Logo
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Your picture or company logo appears on all your marketplace listings, direct WhatsApp cards and quotes.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E9F3EE] text-[#0B6B4F]">
                Live on Profile
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#0B6B4F]/20 overflow-hidden bg-slate-100 flex items-center justify-center shadow-md">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-[#0B6B4F]">
                      {fullName ? fullName.slice(0, 2).toUpperCase() : 'SP'}
                    </span>
                  )}
                </div>

                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-[#08513C] transition">
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
                    Recommended: Square JPG or PNG, minimum 400x400 pixels.
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
                          ? 'border-[#0B6B4F] scale-110 shadow-sm'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  <label className="h-10 px-3 rounded-full border border-dashed border-[#0B6B4F] text-[#0B6B4F] hover:bg-[#E9F3EE] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition">
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

          {/* 2. BUSINESS & PERSONAL INFO */}
          <section
            id="profile"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <h2 className="font-heading font-bold text-lg text-[#101828]">
              Personal & Business Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Full Name *
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-sm text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Business / Showroom / Fleet Title
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Salman Rent a Car / Al-Makkah Movers"
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-sm text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Email Address (Optional)
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-sm text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Primary Operating City
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-sm text-[#101828] outline-none bg-white cursor-pointer"
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

              <div className="flex flex-col gap-1 font-semibold text-[#344054]">
                <span>Account Role</span>
                <input
                  type="text"
                  value={activeUser?.role || 'CUSTOMER'}
                  readOnly
                  className="h-11 px-3 border border-[#E4E7EC] rounded-xl bg-slate-50 font-mono font-bold text-xs text-[#667085] cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1 font-semibold text-[#344054]">
                <span>Account Status</span>
                <div className="h-11 px-3 border border-[#E4E7EC] rounded-xl bg-slate-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-xs text-emerald-800">
                    {activeUser?.kycStatus === 'VERIFIED' ? 'Verified Member' : 'Active Account'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CNIC & DOCUMENT VAULT */}
          <section
            id="documents"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg text-[#101828]">
                  Identity & Verification Documents Vault
                </h2>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Credentials</span>
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Verified CNIC and driving/trade licenses unlock trusted badges and boost customer bookings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                National ID / CNIC Number
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="35202-XXXXXXX-X"
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-mono text-xs text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Driving License / NTN Number
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="LHR-DL-XXXXX or NTN"
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-mono text-xs text-[#101828] outline-none"
                />
              </label>
            </div>

            {/* Document Upload Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* CNIC Front */}
              <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#101828]">CNIC Front</span>
                  {cnicFront ? (
                    <span className="text-[10px] font-extrabold text-[#0B6B4F] bg-[#E9F3EE] px-2 py-0.5 rounded">
                      Uploaded
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
                      <FileText className="w-6 h-6 text-[#0B6B4F]" />
                      <span className="text-[11px] font-bold text-[#101828]">CNIC Front Photo</span>
                      <span className="text-[9px]">High resolution</span>
                    </div>
                  )}
                </div>

                <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition">
                  <span>{cnicFront ? 'Change Front Photo' : 'Upload Front'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCnicFront)}
                  />
                </label>
              </div>

              {/* CNIC Back */}
              <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#101828]">CNIC Back</span>
                  {cnicBack ? (
                    <span className="text-[10px] font-extrabold text-[#0B6B4F] bg-[#E9F3EE] px-2 py-0.5 rounded">
                      Uploaded
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
                      <FileText className="w-6 h-6 text-[#0B6B4F]" />
                      <span className="text-[11px] font-bold text-[#101828]">CNIC Back Photo</span>
                      <span className="text-[9px]">High resolution</span>
                    </div>
                  )}
                </div>

                <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition">
                  <span>{cnicBack ? 'Change Back Photo' : 'Upload Back'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCnicBack)}
                  />
                </label>
              </div>

              {/* License / Trade Document */}
              <div className="p-4 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#101828]">
                    {activeUser?.role === 'DRIVER' ? 'Driving License' : 'Trade License / NTN'}
                  </span>
                  {licenseDoc ? (
                    <span className="text-[10px] font-extrabold text-[#0B6B4F] bg-[#E9F3EE] px-2 py-0.5 rounded">
                      Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Optional</span>
                  )}
                </div>

                <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 overflow-hidden text-center">
                  {licenseDoc && licenseDoc.startsWith('data:image') ? (
                    <img src={licenseDoc} alt="License" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#667085]">
                      <ShieldCheck className="w-6 h-6 text-[#0B6B4F]" />
                      <span className="text-[11px] font-bold text-[#101828]">
                        {activeUser?.role === 'DRIVER' ? 'Valid License' : 'SECP / NTN Slip'}
                      </span>
                      <span className="text-[9px]">Verified certificate</span>
                    </div>
                  )}
                </div>

                <label className="py-2 px-3 rounded-xl bg-white border border-[#D0D5DD] hover:bg-slate-50 text-center font-bold text-xs text-[#344054] cursor-pointer transition">
                  <span>{licenseDoc ? 'Change Document' : 'Upload Certificate'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setLicenseDoc)}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* 4. SHOWROOM & GPS LOCATION */}
          <section
            id="showroom-map"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-lg text-[#101828]">
                Showroom, Garage & Pinned GPS Location
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Customers and passengers use this location to visit your showroom or arrange vehicle handover.
              </p>
            </div>

            <div className="relative h-48 rounded-2xl bg-[#E8EEF0] border border-[#E4E7EC] overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0B6B4F_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative flex flex-col items-center">
                <MapPin className="w-9 h-9 text-[#0B6B4F] fill-[#0B6B4F] drop-shadow-md" />
                <span className="text-[11px] font-bold bg-white/95 px-2.5 py-1 rounded-lg shadow-xs mt-1 border border-slate-200 text-[#101828]">
                  {showroomAddress}
                </span>
                <span className="text-[10px] text-[#667085] font-mono mt-0.5">
                  GPS: {gpsLocation}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowroomAddress('Plaza 14, Main Boulevard, Gulberg III, Lahore');
                  setGpsLocation('31.5204° N, 74.3587° E (Gulberg GPS)');
                }}
                className="absolute right-3 bottom-3 h-8 px-3 rounded-lg bg-white shadow-md text-xs font-bold text-[#101828] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                <span>Use GPS Location</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Showroom / Operating Address
                <input
                  type="text"
                  value={showroomAddress}
                  onChange={(e) => setShowroomAddress(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl text-xs text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                GPS Coordinates / Google Maps Link
                <input
                  type="text"
                  value={gpsLocation}
                  onChange={(e) => setGpsLocation(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-mono text-xs text-[#101828] outline-none"
                />
              </label>
            </div>
          </section>

          {/* 5. SUBSCRIPTION & FLEET QUOTA */}
          <section
            id="subscription"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-heading font-bold text-lg text-[#101828]">
                  Subscription Pass & Listing Quota
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Your monthly membership plan and live marketplace publication status.
                </p>
              </div>

              <Link
                href="/subscription"
                className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white text-xs font-bold hover:bg-[#08513C] transition shadow-xs flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Upgrade / Change Plan</span>
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#667085] block font-semibold">Active Plan</span>
                <strong className="text-sm font-heading font-extrabold text-[#101828]">
                  {activeUser?.subscription?.planName || 'Starter Fleet Pass'}
                </strong>
              </div>

              <div>
                <span className="text-[#667085] block font-semibold">Subscription Status</span>
                <span
                  className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    activeUser?.subscription?.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeUser?.subscription?.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activeUser?.subscription?.status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <span className="text-[#667085] block font-semibold">Listings Quota</span>
                <strong className="text-sm font-mono text-[#0B6B4F]">
                  {activeUser?.subscription?.usedQuota || 0} / {activeUser?.subscription?.quota || 15} live
                </strong>
              </div>
            </div>
          </section>

          {/* 6. COUNTRY & CURRENCY SECTION */}
          <section
            id="region"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-lg text-[#101828]">
                Country, Currency & Localization
              </h2>
              <p className="text-xs text-[#667085]">
                Prices, phone codes and ID formats adapt to your selected country.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Country
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-xs text-[#101828] outline-none bg-white"
                >
                  <option value="PK">Pakistan (PK)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="SA">Saudi Arabia (SA)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="US">United States (US)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Currency
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-xs text-[#101828] outline-none bg-white"
                >
                  <option value="PKR">PKR · Rs</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="GBP">GBP · £</option>
                  <option value="USD">USD · $</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-medium text-xs text-[#101828] outline-none bg-white"
                >
                  <option value="English">English</option>
                  <option value="Urdu">اردو (Urdu)</option>
                  <option value="Arabic">العربية (Arabic)</option>
                </select>
              </label>
            </div>
          </section>

          {/* 7. WHATSAPP & CONTACT PREFERENCES */}
          <section
            id="contact"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-lg text-[#101828]">
                WhatsApp & Direct Contact Preferences
              </h2>
              <p className="text-xs text-[#667085]">
                Booking requests and customer inquiries use this verified phone number.
              </p>
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[#344054] max-w-sm">
              WhatsApp Phone Number
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="h-11 px-3 border border-[#D0D5DD] rounded-xl font-mono text-sm text-[#101828] outline-none"
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
                  className="w-5 h-5 rounded accent-[#0B6B4F]"
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
                  className="w-5 h-5 rounded accent-[#0B6B4F]"
                />
              </div>
            </div>
          </section>

          {/* 8. PASSWORD & SECURITY */}
          <section
            id="security"
            className="bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-7 flex flex-col gap-4 shadow-xs"
          >
            <div>
              <h2 className="font-heading font-bold text-lg text-[#101828]">
                Password & Security
              </h2>
              <p className="text-xs text-[#667085]">
                Set a strong password for seamless login across all devices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl text-sm text-[#101828] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 font-semibold text-[#344054]">
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                  className="h-11 px-3 border border-[#D0D5DD] rounded-xl text-sm text-[#101828] outline-none"
                />
              </label>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveProfile}
              className="self-start mt-2 h-12 px-7 rounded-xl bg-[#0B6B4F] text-white font-bold text-sm hover:bg-[#08513C] transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save All Settings & Documents</span>
            </button>
          </section>

          {/* SECTION 9: SESSION SIGN OUT */}
          {activeUser && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <span>Log Out of SafarPK</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Signed in as <span className="font-bold text-slate-900">{activeUser.name}</span> ({activeUser.role} account). You can safely sign back in anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </section>
          )}
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}
