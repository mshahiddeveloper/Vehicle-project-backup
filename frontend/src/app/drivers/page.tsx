'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { ShieldCheck, Phone, MessageSquare, Check, ArrowRight, UserCheck, Lock, Search } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { maskPakistaniCnic, maskPakistaniLicense, createDriverBooking } from '@/data/driverBookings';
import { getActiveUser } from '@/data/userAuth';
import { startOrOpenConversation, getWhatsAppTargetUrl } from '@/data/chatEngine';
import { slugify } from '@/data/storefrontEngine';
import { useCountry } from '@/app/context/CountryContext';

interface DriverItem {
  id: string;
  name: string;
  initials: string;
  tint: string;
  exp: string;
  city: string;
  avail: 'Available' | 'Busy' | 'Offline';
  langs: string;
  city12: string;
  out: string;
  monthly: string;
  tags: string[];
  police: boolean;
  trips: number[]; // 0: City, 1: Outstation, 2: Monthly
  phone: string;
  whatsapp: string;
  contacted?: string;
  cnic?: string;
  licenseNumber?: string;
}

const INITIAL_DRIVERS: DriverItem[] = [
  {
    id: 'drv-1',
    name: 'Imran Khan',
    initials: 'IK',
    tint: '#FEF3E2',
    exp: '12 years',
    city: 'Lahore',
    avail: 'Available',
    langs: 'Urdu, English, Punjabi',
    city12: 'Rs. 2,500',
    out: 'Rs. 3,500',
    monthly: 'Rs. 45,000',
    tags: ['M-2 / GT Road expert', 'Family trips'],
    police: true,
    trips: [0, 1],
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
    contacted: '✓ You sent a request · 10 Nov',
    cnic: '35201-2123456-1',
    licenseNumber: 'LHR-DL-98210',
  },
  {
    id: 'drv-2',
    name: 'Waqar Ahmed',
    initials: 'WA',
    tint: '#DDE6F3',
    exp: '8 years',
    city: 'Lahore',
    avail: 'Available',
    langs: 'Urdu, Punjabi',
    city12: 'Rs. 2,200',
    out: 'Rs. 3,200',
    monthly: 'Rs. 42,000',
    tags: ['VIP executive', 'Airport runs'],
    police: true,
    trips: [0, 2],
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
    cnic: '35201-8912045-7',
    licenseNumber: 'LHR-LTV-44120',
  },
  {
    id: 'drv-3',
    name: 'Shahzad Ali',
    initials: 'SA',
    tint: '#E6F2EC',
    exp: '15 years',
    city: 'Lahore',
    avail: 'Busy',
    langs: 'Urdu, English',
    city12: 'Rs. 3,000',
    out: 'Rs. 4,000',
    monthly: 'Rs. 50,000',
    tags: ['M-2 / GT Road expert', 'Northern areas'],
    police: true,
    trips: [1],
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
    cnic: '35202-3312098-3',
    licenseNumber: 'LHR-HTV-81204',
  },
  {
    id: 'drv-4',
    name: 'Naveed Iqbal',
    initials: 'NI',
    tint: '#F1EAFE',
    exp: '5 years',
    city: 'Lahore',
    avail: 'Available',
    langs: 'Urdu',
    city12: 'Rs. 2,000',
    out: 'Rs. 3,000',
    monthly: 'Rs. 38,000',
    tags: ['Family trips'],
    police: false,
    trips: [0, 1, 2],
    phone: '+92 345 8899201',
    whatsapp: '923458899201',
    cnic: '35201-4412098-5',
    licenseNumber: 'ISB-DL-49201',
  },
  {
    id: 'drv-5',
    name: 'Tariq Mehmood',
    initials: 'TM',
    tint: '#FDECE4',
    exp: '20 years',
    city: 'Lahore',
    avail: 'Offline',
    langs: 'Urdu, Pashto',
    city12: 'Rs. 2,800',
    out: 'Rs. 3,800',
    monthly: 'Rs. 48,000',
    tags: ['Hill driving expert', 'VIP Protocol'],
    police: true,
    trips: [1],
    phone: '+92 312 9988771',
    whatsapp: '923129988771',
    cnic: '35201-4412098-5',
    licenseNumber: 'LHR-LTV-99210',
  },
  {
    id: 'drv-6',
    name: 'Asif Raza',
    initials: 'AR',
    tint: '#EEF1F4',
    exp: '6 years',
    city: 'Lahore',
    avail: 'Available',
    langs: 'Urdu, English',
    city12: 'Rs. 2,300',
    out: 'Rs. 3,300',
    monthly: 'Rs. 40,000',
    tags: ['Monthly office', 'Sedan & SUV'],
    police: true,
    trips: [2],
    phone: '+92 301 2233445',
    whatsapp: '923012233445',
    cnic: '35201-7788910-1',
    licenseNumber: 'LHR-DL-67210',
  },
];

export default function DriversPage() {
  const router = useRouter();
  const { country, formatPrice } = useCountry();
  const isPakistan = !country || country.code === 'PK';
  const [tripType, setTripType] = useState<number>(0); // 0: City, 1: Outstation, 2: Monthly
  const [availOnly, setAvailOnly] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>('Lahore');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [drivers, setDrivers] = useState<DriverItem[]>(INITIAL_DRIVERS);
  const [requestModalDriver, setRequestModalDriver] = useState<DriverItem | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestDate, setRequestDate] = useState('2026-11-20');

  const tripLabels = ['City · by the day', 'Outstation', 'Monthly'];

  const filteredDrivers = drivers.filter((d) => {
    if (!d.trips.includes(tripType)) return false;
    if (availOnly && d.avail !== 'Available') return false;
    if (selectedCity && d.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = d.name.toLowerCase().includes(q);
      const matchCity = d.city.toLowerCase().includes(q);
      const matchLangs = d.langs.toLowerCase().includes(q);
      const matchTags = d.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchCity && !matchLangs && !matchTags) return false;
    }
    return true;
  });

  const handleWhatsAppClick = (driver: DriverItem) => {
    recordLead({
      listingId: driver.id,
      listingTitle: `Driver: ${driver.name}`,
      listerPhone: driver.phone,
      type: 'WHATSAPP_CLICK',
    });
    recordClickEvent(driver.id, 'WHATSAPP');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const profileUrl = `${origin}/driver/${slugify(driver.name)}`;
    const dutyStr = tripLabels[tripType];
    const serviceTitle = isPakistan ? 'Verified Driver & Captain' : 'Professional Chauffeur';
    const msg = `Hi, I would like to hire ${driver.name} listed on SafarPK: Service: ${serviceTitle} Duty: ${dutyStr} City: ${driver.city} Rates: City: ${driver.city12}/day | Outstation: ${driver.out}/day | Monthly: ${driver.monthly} Profile: ${profileUrl}`;
    const cleanNum = (driver.whatsapp || driver.phone).replace(/\D/g, '');
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleCallClick = (driver: DriverItem) => {
    recordLead({
      listingId: driver.id,
      listingTitle: `Chauffeur Hire: ${driver.name}`,
      listerPhone: driver.phone,
      type: 'CALL_CLICK',
    });
    recordClickEvent(driver.id, 'CALL_CLICK');
    const isAlreadyRevealed = !!revealedPhones[driver.id];
    setRevealedPhones((prev) => ({ ...prev, [driver.id]: true }));
    if (isAlreadyRevealed || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      window.location.href = `tel:${driver.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleConfirmRequest = (driver: DriverItem) => {
    recordLead({
      listingId: driver.id,
      listingTitle: `Chauffeur Hire: ${driver.name}`,
      listerPhone: driver.phone,
      type: 'BOOKING_REQUEST',
    });

    // Mark as contacted in local state
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driver.id
          ? { ...d, contacted: `✓ You sent a request · Today` }
          : d
      )
    );

    const ref = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
    const user = getActiveUser();

    // Create synchronized hiring booking
    createDriverBooking({
      bookingRef: ref,
      customerName: user?.name || 'Customer Guest',
      customerPhone: user?.phone || '+92 300 0000000',
      customerCity: user?.city || driver.city,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverCnic: driver.cnic || '35201-2123456-1',
      driverLicense: driver.licenseNumber || 'LHR-DL-98210',
      dutyType: tripLabels[tripType],
      destination: requestNote.trim() || `${tripLabels[tripType]} conveyance in ${driver.city}`,
      vehicleProvided: 'Customer Vehicle',
      startDate: requestDate,
      days: tripType === 0 ? 1 : tripType === 1 ? 2 : 30,
      totalFare: tripType === 0 ? 2500 : tripType === 1 ? 3500 : 45000,
    });

    const rateStr = tripType === 0 ? driver.city12 : tripType === 1 ? driver.out : driver.monthly;
    const waText = `Assalam-o-Alaikum ${driver.name},\n\nI want to hire you as a chauffeur via SafarPK (Ref: *${ref}*).\n\n• Duty Type: ${tripLabels[tripType]}\n• Date: ${requestDate}\n• Rate: ${rateStr}\n• Customer: ${user?.name || 'Customer'} (${user?.phone || 'Provided at booking'})\n${requestNote ? `• Note: ${requestNote}\n` : ''}\nPlease confirm your availability.`;

    const waUrl = getWhatsAppTargetUrl(driver.whatsapp || driver.phone, waText);
    window.open(waUrl, '_blank');

    setRequestModalDriver(null);
    window.location.href = `/request-sent?type=driver&ref=${ref}&name=${encodeURIComponent(
      driver.name
    )}&rate=${encodeURIComponent(rateStr)}`;
  };

  const handleChatInInbox = (driver: DriverItem) => {
    const ref = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
    const user = getActiveUser() || {
      id: 'usr-customer-active',
      name: 'Customer Guest',
      phone: '+92 300 0000000',
      city: driver.city,
      countryCode: 'PK',
      role: 'CUSTOMER' as const,
      registeredAt: new Date().toISOString(),
      subscription: { status: 'UNSUBSCRIBED' as const, quota: 0, usedQuota: 0 },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
      activities: [],
    };

    createDriverBooking({
      bookingRef: ref,
      customerName: user.name,
      customerPhone: user.phone,
      customerCity: user.city || driver.city,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverCnic: driver.cnic || '35201-2123456-1',
      driverLicense: driver.licenseNumber || 'LHR-DL-98210',
      dutyType: tripLabels[tripType],
      destination: requestNote.trim() || `${tripLabels[tripType]} conveyance in ${driver.city}`,
      vehicleProvided: 'Customer Vehicle',
      startDate: requestDate,
      days: tripType === 0 ? 1 : tripType === 1 ? 2 : 30,
      totalFare: tripType === 0 ? 2500 : tripType === 1 ? 3500 : 45000,
    });

    const rateStr = tripType === 0 ? driver.city12 : tripType === 1 ? driver.out : driver.monthly;
    const durationStr = tripType === 0 ? '1 Day (12h)' : tripType === 1 ? 'Outstation Trip' : 'Monthly Dedicated';

    const convId = startOrOpenConversation({
      currentUser: user,
      partnerId: driver.id,
      partnerName: driver.name,
      partnerRole: 'DRIVER',
      partnerPhone: driver.phone,
      about: `Chauffeur Hire · ${tripLabels[tripType]} (${driver.name})`,
      bookingRef: ref,
      bookingMetadata: {
        category: 'driver',
        customerName: user.name,
        customerPhone: user.phone,
        customerCity: user.city || driver.city,
        providerName: driver.name,
        providerManager: driver.name,
        providerPhone: driver.phone,
        itemName: `Chauffeur Hire · ${tripLabels[tripType]}`,
        pickupDate: requestDate,
        duration: durationStr,
        totalEstimate: rateStr,
        serviceMode: 'Client Vehicle Duty',
        bookingRef: ref,
      },
    });

    setRequestModalDriver(null);
    window.location.href = `/inbox?conv=${convId}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-6">
        {/* Title & Tagline */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#101828]">
            {isPakistan ? 'Hire a verified driver & captain' : 'Hire a professional chauffeur'}
          </h1>
          <p className="text-[#475467] text-base">
            {isPakistan
              ? 'Experienced verified drivers and captains for a day in the city, an outstation trip, or monthly driving.'
              : 'Experienced chauffeurs for a day in the city, an outstation trip, or monthly driving.'}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="p-3 bg-[#F7F8FA] rounded-[18px] border border-[#EEF0F2] flex flex-wrap items-center gap-2.5">
          {/* City Selector */}
          <label className="flex items-center gap-2 h-11 px-3 rounded-xl bg-white border border-[#E4E7EC] text-sm font-semibold text-[#101828]">
            <span>City</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Filter by city"
              className="border-0 bg-transparent text-sm font-semibold text-[#101828] outline-none cursor-pointer"
            >
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
            </select>
          </label>

          {/* Trip Type Radiogroup */}
          <div
            role="radiogroup"
            aria-label="Trip type"
            className="flex items-center gap-1.5 overflow-x-auto"
          >
            {tripLabels.map((label, idx) => {
              const checked = tripType === idx;
              return (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setTripType(idx)}
                  className={`h-11 px-4 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                    checked
                      ? 'bg-[#101828] text-white border border-[#101828]'
                      : 'bg-white text-[#344054] border border-[#E4E7EC] hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Available now toggle */}
          <button
            type="button"
            aria-pressed={availOnly}
            onClick={() => setAvailOnly(!availOnly)}
            className={`h-11 px-4 rounded-xl text-sm font-semibold transition cursor-pointer border ${
              availOnly
                ? 'bg-[#E9F3EE] text-[#08513C] border-[#0B6B4F]'
                : 'bg-white text-[#344054] border-[#E4E7EC] hover:bg-slate-50'
            }`}
          >
            Available now
          </button>

          {/* Live Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search driver by name, language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-3 border border-[#E4E7EC] rounded-xl text-sm bg-white outline-none focus:border-[#0B6B4F]"
            />
          </div>

          {/* Count Indicator */}
          <span className="sm:ml-auto text-sm font-semibold text-[#475467]">
            {filteredDrivers.length} available drivers in {selectedCity}
          </span>
        </div>

        {/* Drivers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrivers.map((d) => {
            const availColors: Record<string, string> = {
              Available: '#0B6B4F',
              Busy: '#E08A00',
              Offline: '#98A2B3',
            };

            return (
              <div
                key={d.id}
                onClick={() => router.push(`/driver/${slugify(d.name)}`)}
                className="border border-[#EEF0F2] rounded-[22px] p-5 flex flex-col gap-3.5 hover:shadow-md hover:border-emerald-300 transition bg-white cursor-pointer group"
                title={isPakistan ? `Click to view driver profile for ${d.name}` : `Click to view chauffeur profile for ${d.name}`}
              >
                {/* Header: Avatar, Name, Experience - Links to Driver Profile */}
                <Link
                  href={`/driver/${slugify(d.name)}`}
                  className="flex items-center gap-3.5 group cursor-pointer"
                  title={`View ${d.name}'s Public Profile`}
                >
                  <div
                    className="relative w-15 h-15 rounded-full flex items-center justify-center font-heading font-extrabold text-xl text-[#101828] shrink-0 group-hover:scale-105 transition"
                    style={{ backgroundColor: d.tint }}
                  >
                    {d.initials}
                    <span
                      className="absolute right-0 bottom-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: availColors[d.avail] }}
                      title={d.avail}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-extrabold text-lg text-[#101828] group-hover:text-emerald-700 transition truncate">
                        {d.name}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        Profile ➔
                      </span>
                    </div>
                    <p className="text-[13px] text-[#475467]">
                      {d.exp} · {d.city} ·{' '}
                      <span
                        className="font-semibold"
                        style={{ color: availColors[d.avail] }}
                      >
                        {d.avail}
                      </span>
                    </p>
                  </div>
                </Link>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9F3EE] text-[#0B6B4F] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isPakistan ? 'Verified Driver / Captain' : 'Experienced Chauffeur'}
                  </span>
                  {d.police && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF4FF] text-[#1D3A8A]">
                      Active Driver
                    </span>
                  )}
                  {d.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3E2] text-[#8A4B00]"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Masked Credentials Pattern */}
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0B6B4F]" />
                      <span>Driver CNIC (Masked):</span>
                    </span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {maskPakistaniCnic(d.cnic)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0B6B4F]" />
                      <span>Licence (Masked):</span>
                    </span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {maskPakistaniLicense(d.licenseNumber)}
                    </span>
                  </div>
                  <p className="text-[10px] font-sans text-slate-400 leading-tight pt-0.5">
                    Original physical CNIC and driving licence are verified in person at duty handover.
                  </p>
                </div>

                {/* Language Tag */}
                <p className="text-[13px] text-[#344054]">
                  Speaks <span className="font-medium">{d.langs}</span>
                </p>

                {/* Rates Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#F7F8FA] flex flex-col">
                    <span className="text-[11px] font-semibold text-[#667085]">
                      City · 12 hours
                    </span>
                    <span className="font-heading font-extrabold text-base text-[#101828]">
                      {d.city12}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F8FA] flex flex-col">
                    <span className="text-[11px] font-semibold text-[#667085]">
                      Outstation / day
                    </span>
                    <span className="font-heading font-extrabold text-base text-[#101828]">
                      {d.out}
                    </span>
                  </div>
                </div>

                {/* Contacted Badge */}
                {d.contacted && (
                  <span className="self-start px-2.5 py-1 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-xs font-bold">
                    {d.contacted}
                  </span>
                )}

                {/* Unified Single-Row Responsive CTA Action Bar */}
                <div
                  className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 1. Phone Call CTA */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallClick(d);
                    }}
                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    title={revealedPhones[d.id] ? `Call ${d.name} (${d.phone})` : 'Click to show phone number'}
                  >
                    <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                    <span className="font-mono text-xs font-bold whitespace-nowrap">
                      {revealedPhones[d.id] ? d.phone : 'Call'}
                    </span>
                  </button>

                  {/* 2. WhatsApp Direct Inquiry CTA */}
                  <button
                    type="button"
                    aria-label={`WhatsApp ${d.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsAppClick(d);
                    }}
                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    title={`Inquire with ${d.name} on WhatsApp`}
                  >
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                  </button>

                  {/* 3. Driver Profile & Hire Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRequestModalDriver(d);
                    }}
                    className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                    title={`Hire ${d.name} or View Profile`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Available Driver" />
                      <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                        {isPakistan ? 'Hire Captain' : 'Hire Chauffeur'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover/store:text-emerald-600 group-hover/store:translate-x-0.5 transition shrink-0">
                      ➔
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer connector model note */}
        <p className="text-[13px] text-[#667085]">
          SafarPK connects you directly with the driver; all terms and payments are settled directly between you and the driver.
        </p>
      </main>

      {/* Request to Hire Modal */}
      {requestModalDriver && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-xl text-[#101828]">
                Hire {requestModalDriver.name}
              </h3>
              <button
                type="button"
                onClick={() => setRequestModalDriver(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#475467]">
              Send your booking request to {requestModalDriver.name} for{' '}
              <strong className="text-[#101828]">{tripLabels[tripType]}</strong> in{' '}
              {requestModalDriver.city}.
            </p>

            <div className="p-3 bg-[#F7F8FA] rounded-xl flex justify-between items-center text-sm">
              <span className="text-[#667085]">Estimated Rate:</span>
              <span className="font-heading font-extrabold text-[#101828] text-base">
                {tripType === 0
                  ? requestModalDriver.city12
                  : tripType === 1
                  ? requestModalDriver.out
                  : requestModalDriver.monthly}
              </span>
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[#344054]">
              Trip Date
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="h-11 px-3 border border-[#E4E7EC] rounded-xl font-sans text-sm text-[#101828] outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-[#344054]">
              Trip Details / Pick-up Address
              <textarea
                rows={2}
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="e.g. Need driver from 9am in Gulberg to Lahore Airport"
                className="p-3 border border-[#E4E7EC] rounded-xl font-sans text-sm text-[#101828] outline-none resize-none"
              />
            </label>

            {/* Driver Identity & Verification Info */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Chauffeur Documents on File</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-900 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>CNIC: <strong>{maskPakistaniCnic(requestModalDriver.cnic)}</strong></span>
                <span>·</span>
                <span>Licence: <strong>{maskPakistaniLicense(requestModalDriver.licenseNumber)}</strong></span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-tight">
                Once {requestModalDriver.name} confirms your booking from their dashboard, the full unmasked CNIC and Driving Licence will automatically unlock in your Customer portal.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmRequest(requestModalDriver)}
                className="h-12 rounded-xl bg-[#0B6B4F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#08513C] transition cursor-pointer shadow-md"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Confirm & Send on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleChatInInbox(requestModalDriver)}
                className="h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#0B6B4F]" />
                <span>Chat in In-App Inbox</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

