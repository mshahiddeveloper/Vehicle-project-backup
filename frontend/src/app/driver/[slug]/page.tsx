'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import {
  getDriverProfileBySlug,
  DriverProfileData,
  slugify,
} from '@/data/storefrontEngine';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { useCountry } from '@/app/context/CountryContext';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Car,
  Award,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  FileCheck,
  Lock,
  Heart,
} from 'lucide-react';

export default function PublicDriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { country, formatPrice } = useCountry();
  const isPakistan = !country || country.code === 'PK';

  const driver: DriverProfileData | null = useMemo(() => {
    return getDriverProfileBySlug(slug);
  }, [slug]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<'city' | 'outstation' | 'monthly'>('city');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [licenceOpen, setLicenceOpen] = useState(false);
  const [fleetOpen, setFleetOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!driver) return;
    try {
      const raw = localStorage.getItem('safarpk_saved_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some((it: any) => it.id === driver.id || it.name === driver.name)) {
          setIsSaved(true);
        }
      }
    } catch {}
  }, [driver]);

  const handleToggleSaveDriver = () => {
    if (!driver) return;
    try {
      const raw = localStorage.getItem('safarpk_saved_items');
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      const already = list.some((it: any) => it.id === driver.id || it.name === driver.name);
      if (already) {
        list = list.filter((it: any) => it.id !== driver.id && it.name !== driver.name);
        setIsSaved(false);
      } else {
        list.unshift({
          id: driver.id,
          category: 'driver',
          name: `${driver.name} (Professional Chauffeur)`,
          sub: `${driver.experience} · ${driver.city}`,
          price: formatPrice(driver.dailyRate12h) + ' / 12h',
          href: `/driver/${driver.slug}`,
          savedAt: new Date().toISOString(),
        });
        setIsSaved(true);
      }
      localStorage.setItem('safarpk_saved_items', JSON.stringify(list));
      window.dispatchEvent(new Event('safarpk_saved_updated'));
      window.dispatchEvent(new Event('safarpk_favorites_updated'));
    } catch {}
  };

  const scrollToBooking = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('driver-booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <AppHeader />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto text-2xl font-bold">
            👤
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">
            Driver Profile Not Found
          </h1>
          <p className="text-sm text-slate-600">
            The driver link you visited may have changed or the profile is private.
          </p>
          <Link
            href="/drivers"
            className="inline-block px-5 py-2.5 bg-[#0B6B4F] text-white rounded-xl font-bold text-xs"
          >
            Browse Available Drivers
          </Link>
        </main>
        <AppFooter />
        <MobileNavBar />
      </div>
    );
  }

  const currentProfileUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://safar.pk/driver/${driver.slug}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentProfileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out ${driver.name}'s ${isPakistan ? 'verified driver profile' : 'professional chauffeur profile'} on SafarPK! View rates, licence categories, and hire directly: ${currentProfileUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCall = () => {
    setPhoneRevealed(true);
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: driver.id,
      targetTitle: driver.name,
      targetCategory: 'DRIVER_PROFILE',
      targetOwnerName: driver.name,
      city: driver.city,
    });
    recordLead({
      userId: driver.id,
      customerName: 'Direct Chauffeur Caller',
      customerPhone: 'Phone Dial',
      customerCity: driver.city,
      serviceType: 'Hire a Driver',
      notes: `Direct call to chauffeur ${driver.name}`,
    });
    if (phoneRevealed) {
      window.location.href = `tel:${driver.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const currentRateDisplay =
    selectedDuty === 'city'
      ? formatPrice(driver.dailyRate12h) + ' (12h)'
      : selectedDuty === 'outstation'
      ? formatPrice(driver.outstationDailyRate) + ' /day'
      : formatPrice(driver.monthlySalaryEstimate) + ' /mo';

  const handleWhatsApp = () => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: driver.id,
      targetTitle: driver.name,
      targetCategory: 'DRIVER_PROFILE',
      targetOwnerName: driver.name,
      city: driver.city,
    });
    recordLead({
      userId: driver.id,
      customerName: 'Chauffeur WhatsApp Inquirer',
      customerPhone: 'WhatsApp Chat',
      customerCity: driver.city,
      serviceType: 'Hire a Driver',
      notes: `WhatsApp hire request for driver ${driver.name} (${selectedDuty} duty)`,
    });

    const dutyLabel =
      selectedDuty === 'city'
        ? 'Daily City Duty (12 Hours)'
        : selectedDuty === 'outstation'
        ? 'Outstation Tour'
        : isPakistan
        ? 'Monthly Dedicated Driver / Captain'
        : 'Monthly Dedicated Chauffeur';

    const text = `Assalam-o-Alaikum ${driver.name},\n\nI want to hire you as a ${isPakistan ? 'verified driver' : 'professional chauffeur'} via SafarPK:\n• Duty Type: ${dutyLabel}\n• Starting Date: ${startDate}\n• Estimated Rate: ${currentRateDisplay}\n\nPlease let me know if you are available and confirm your rate.`;
    const waUrl = getWhatsAppTargetUrl(driver.whatsapp || driver.phone, text);
    window.open(waUrl, '_blank');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordLead({
      userId: driver.id,
      customerName: 'Chauffeur Inquiry Lead',
      customerPhone: 'Online Request',
      customerCity: driver.city,
      serviceType: 'Hire a Driver',
      notes: `Hiring request for ${driver.name} starting ${startDate} (${selectedDuty})`,
    });
    setBookingSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#101828] flex flex-col justify-between">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-[#667085]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#101828]">
              Home
            </Link>
            <span>/</span>
            <Link href="/drivers" className="hover:text-[#101828]">
              Hire a Driver
            </Link>
            <span>/</span>
            <span className="text-[#101828] font-semibold">{driver.name}</span>
          </nav>

          {/* Share profile buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSaveDriver}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                isSaved
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-600 fill-rose-600' : 'text-slate-500'}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Driver Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-heading font-black text-2xl sm:text-3xl text-slate-900 shrink-0 shadow-inner"
              style={{ backgroundColor: driver.tint }}
            >
              {driver.initials}
              <span
                className={`absolute right-1 bottom-1 w-5 h-5 rounded-full border-2 border-white ${
                  driver.avail === 'Available'
                    ? 'bg-emerald-500'
                    : driver.avail === 'Busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={driver.avail}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-black text-lg sm:text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight">
                  {driver.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isPakistan ? 'Verified Driver / Captain' : 'Experienced Chauffeur'}</span>
                </span>
              </div>

              <p className="text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">{driver.exp}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {driver.city}
                </span>
                <span>·</span>
                <span
                  className={`font-bold ${
                    driver.avail === 'Available' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  ● {driver.avail}
                </span>
              </p>

              <p className="text-xs text-slate-500 pt-0.5">
                Speaks: <span className="font-medium text-slate-700">{driver.langs.join(', ')}</span> · {driver.joinedDate}
              </p>
            </div>
          </div>

          {/* Quick Direct Actions on Header */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Purple Click-to-Reveal Phone Button */}
            <button
              type="button"
              onClick={handleCall}
              className="flex-1 md:flex-initial h-11 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              title={phoneRevealed ? `Call: ${driver.phone}` : 'Click to show phone number'}
            >
              <Phone className="w-3.5 h-3.5 text-purple-600" />
              <span>
                {phoneRevealed ? (
                  <>Call: <strong className="font-mono">{driver.phone}</strong></>
                ) : (
                  'Show Number'
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex-1 md:flex-initial h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white/20" />
              <span>WhatsApp Chat</span>
            </button>
          </div>
        </div>

        {/* Quick Mobile Action Bar: Check Rates & Hire */}
        <div className="lg:hidden flex items-center gap-2 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-2xs">
          <button
            type="button"
            onClick={scrollToBooking}
            className="flex-1 h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-200 shrink-0" />
            <span>Check Rates & Hire Driver</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="h-11 px-3.5 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* 2-Column Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start pt-2">
          {/* Left Column: Driver Credentials, Experience & Vehicles */}
          <div className="space-y-4">
            {/* Bio / Summary */}
            <div className="p-5 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                About {driver.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{driver.bio}</p>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {driver.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Driving Licence & Certification Categories (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setLicenceOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Licence & Driving Categories</span>
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {driver.licenceNumberMasked}
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600 font-medium">
                    {driver.licenceCategories.slice(0, 3).map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {licenceOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${licenceOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {licenceOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {driver.licenceCategories.map((cat) => (
                      <div
                        key={cat}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center gap-2 text-xs font-bold text-slate-900"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100/70 text-[11px] text-slate-600 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      Original CNIC and licence cards are physically verified upon duty start.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Types Can Drive (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setFleetOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span>Vehicle Fleet Experience</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {driver.vehicleTypesCanDrive.length} Types
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    {driver.vehicleTypesCanDrive.slice(0, 3).map((v, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 truncate max-w-[130px]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {fleetOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${fleetOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {fleetOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700 animate-in fade-in">
                  {driver.vehicleTypesCanDrive.map((v) => (
                    <div
                      key={v}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Services Offered (Mobile Accordion) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition">
              <button
                type="button"
                onClick={() => setServicesOpen((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Services Offered</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Standard Coverage
                    </span>
                  </div>
                  {/* Summary preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5 text-[11px] text-slate-600">
                    {driver.servicesOffered.slice(0, 2).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 truncate max-w-[150px]">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <span className="text-[11px] font-bold hidden sm:inline text-slate-500">
                    {servicesOpen ? 'Collapse' : 'View all'}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {servicesOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-slate-800 animate-in fade-in">
                  {driver.servicesOffered.map((srv) => (
                    <div
                      key={srv}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{srv}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Rates Matrix & Hire Inquiry */}
          <aside id="driver-booking-section" className="sticky top-24 border border-slate-200/90 rounded-3xl p-6 bg-white shadow-lg space-y-5 scroll-mt-24">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Standard Rates Matrix
            </h3>

            {/* Duty selector tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedDuty('city')}
                className={`h-8 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center ${
                  selectedDuty === 'city'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                City 12h
              </button>
              <button
                type="button"
                onClick={() => setSelectedDuty('outstation')}
                className={`h-8 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center ${
                  selectedDuty === 'outstation'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Outstation
              </button>
              <button
                type="button"
                onClick={() => setSelectedDuty('monthly')}
                className={`h-8 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center ${
                  selectedDuty === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Rate Display */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-center space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                {selectedDuty === 'city'
                  ? 'Daily City Duty (12 Hours)'
                  : selectedDuty === 'outstation'
                  ? 'Outstation Tour (Per Day)'
                  : 'Monthly Full-Time Salary'}
              </span>
              <div className="font-heading font-black text-3xl text-emerald-950">
                {selectedDuty === 'city'
                  ? formatPrice(driver.dailyRate12h)
                  : selectedDuty === 'outstation'
                  ? formatPrice(driver.outstationDailyRate)
                  : formatPrice(driver.monthlySalaryEstimate)}
              </div>
              <p className="text-[11px] text-emerald-700">
                {selectedDuty === 'city'
                  ? 'Local city driving in your car'
                  : selectedDuty === 'outstation'
                  ? 'Excludes food/lodging allowances if overnight'
                  : 'Based on 6 days a week schedule'}
              </p>
            </div>

            {/* Direct Contact Buttons (Publicly accessible without login) */}
            <div className="space-y-2 pt-1">
              {/* Instant WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-white/20" />
                <span>Chat on WhatsApp</span>
              </button>

              {/* Direct Call Button (Click-to-Reveal Pattern) */}
              <button
                type="button"
                onClick={handleCall}
                className="w-full h-10 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                title={phoneRevealed ? `Call driver directly: ${driver.phone}` : 'Click to show phone number'}
              >
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {phoneRevealed ? (
                    <>Call {isPakistan ? 'Driver' : 'Chauffeur'}: <span className="font-mono font-bold">{driver.phone}</span></>
                  ) : (
                    'Show Phone Number'
                  )}
                </span>
              </button>
            </div>

            {/* Inquiry Form */}
            {bookingSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-heading font-bold text-sm text-emerald-900">
                  Hiring Request Sent!
                </h4>
                <p className="text-xs text-emerald-700">
                  {driver.name} has received your inquiry and will contact you directly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">
                  Or Send Hire Request
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Duty Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Send Inquiry to {driver.name.split(' ')[0]}
                </button>
              </form>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 shadow-xl flex items-center gap-2 z-40">
        <button
          type="button"
          onClick={handleCall}
          className="flex-1 h-11 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Phone className="w-3.5 h-3.5 text-purple-600" />
          <span>{phoneRevealed ? driver.phone : 'Show Number'}</span>
        </button>
        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
          <span>WhatsApp</span>
        </button>
      </div>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

