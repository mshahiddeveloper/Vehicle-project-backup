'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { ArrowRight, Phone, MessageSquare, Calendar, Users, MapPin, Search } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

interface CityRide {
  id: string;
  op: string;
  car: string;
  bag: string;
  time: string;
  duration: string;
  one: number;
  ret: number;
  ver: boolean;
  tags: string[];
  phone: string;
  whatsapp: string;
  contacted?: string;
}

const INITIAL_RIDES: CityRide[] = [
  {
    id: 'c2c-1',
    op: 'Capital Express Intercity',
    car: 'Toyota Corolla Altis · AC · 4 seats',
    bag: '2 large bags',
    time: 'Leave any time you choose',
    duration: '4.5 hrs via M-2',
    one: 13500,
    ret: 24000,
    ver: true,
    tags: ['Motorway M-2', 'Toll included'],
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
    contacted: '✓ You sent a request · 10 Nov',
  },
  {
    id: 'c2c-2',
    op: 'Imran Khan (driver + car)',
    car: 'Honda Civic Oriel · AC · 4 seats',
    bag: '2 large bags',
    time: 'Mornings preferred',
    duration: '4.2 hrs via M-2',
    one: 15000,
    ret: 27000,
    ver: true,
    tags: ['Motorway M-2', 'Speaks English'],
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
  },
  {
    id: 'c2c-3',
    op: 'Islamabad Travel Co.',
    car: 'Toyota Hiace Grand Cabin · AC · 12 seats',
    bag: 'Roof carrier + 8 bags',
    time: 'Leave any time you choose',
    duration: '5 hrs via M-2',
    one: 26000,
    ret: 45000,
    ver: true,
    tags: ['Family / group', 'Toll extra'],
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
  },
  {
    id: 'c2c-4',
    op: 'Zaidi Executive Rentals',
    car: 'Toyota Fortuner Sigma 4 · AC · 6 seats',
    bag: '4 large bags',
    time: 'Leave any time you choose',
    duration: '4.5 hrs via M-2',
    one: 32000,
    ret: 56000,
    ver: true,
    tags: ['Executive', 'VIP Chauffeur'],
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
  },
];

export default function CityToCityPage() {
  const router = useRouter();
  const [fromCity, setFromCity] = useState('Lahore');
  const [toCity, setToCity] = useState('Islamabad');
  const [leaveDate, setLeaveDate] = useState('2026-11-20');
  const [returnDate, setReturnDate] = useState('2026-11-23');
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [peopleCount, setPeopleCount] = useState('1–3');
  const [sizeFilter, setSizeFilter] = useState<number>(0); // 0: All, 1: 4 seats, 2: 6+ seats
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [rides, setRides] = useState<CityRide[]>(INITIAL_RIDES);

  const formatPKR = (v: number) => `Rs. ${v.toLocaleString('en-US')}`;

  const filteredRides = rides.filter((r) => {
    if (sizeFilter === 1 && !r.car.includes('4 seats')) return false;
    if (sizeFilter === 2 && r.car.includes('4 seats')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.op.toLowerCase().includes(q) ||
        r.car.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        fromCity.toLowerCase().includes(q) ||
        toCity.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleWhatsApp = (ride: CityRide) => {
    recordLead({
      listingId: ride.id,
      listingTitle: `City-to-City: ${fromCity} to ${toCity} (${ride.car})`,
      listerPhone: ride.phone,
      type: 'WHATSAPP_CLICK',
    });
    recordClickEvent(ride.id, 'WHATSAPP');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const routeUrl = `${origin}/city-to-city/${ride.id}`;
    const fare = isReturnTrip ? ride.ret : ride.one;
    const rawMsg = `Hi, I would like to book a ride with ${ride.op} on SafarPK: Route: ${fromCity} to ${toCity} Vehicle: ${ride.car} Trip: ${
      isReturnTrip ? 'Return' : 'One-Way'
    } Date: ${leaveDate} Fare: ${formatPKR(fare)} Route Details: ${routeUrl}`;
    window.open(getWhatsAppTargetUrl(ride.whatsapp || ride.phone, rawMsg), '_blank');
  };

  const handleCall = (ride: CityRide) => {
    setRevealedPhones((prev) => ({ ...prev, [ride.id]: true }));
    recordLead({
      listingId: ride.id,
      listingTitle: `City-to-City: ${fromCity} to ${toCity} (${ride.car})`,
      listerPhone: ride.phone,
      type: 'CALL_CLICK',
    });
    recordClickEvent(ride.id, 'CALL');
    if (revealedPhones[ride.id]) {
      window.location.href = `tel:${ride.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleRequestRide = (ride: CityRide) => {
    recordLead({
      listingId: ride.id,
      listingTitle: `City-to-City: ${fromCity} to ${toCity} (${ride.car})`,
      listerPhone: ride.phone,
      type: 'BOOKING_REQUEST',
    });

    const ref = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
    const fare = isReturnTrip ? ride.ret : ride.one;

    setRides((prev) =>
      prev.map((r) =>
        r.id === ride.id ? { ...r, contacted: '✓ You sent a request · Today' } : r
      )
    );

    window.location.href = `/request-sent?type=city2city&ref=${ref}&name=${encodeURIComponent(
      ride.op
    )}&rate=${encodeURIComponent(formatPKR(fare))}&route=${encodeURIComponent(
      `${fromCity} to ${toCity}`
    )}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-6">
        {/* Heading */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#101828]">
            City to city
          </h1>
          <p className="text-[#475467] text-base">
            A private car with a verified driver, from your door to another city. One way or return.
          </p>
        </div>

        {/* Route Search Box */}
        <div className="p-4 bg-[#F7F8FA] rounded-[18px] border border-[#EEF0F2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            From
            <input
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            To
            <input
              type="text"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            Leaving
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            <span>Coming back</span>
            {isReturnTrip ? (
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsReturnTrip(true)}
                className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[14px] text-[#667085] text-left hover:text-[#101828] transition cursor-pointer"
              >
                + Add return date
              </button>
            )}
          </div>

          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            Passengers
            <select
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none cursor-pointer"
            >
              <option value="1–3">1–3 seats</option>
              <option value="4">4 seats</option>
              <option value="5–7">5–7 seats</option>
              <option value="8+">8+ seats</option>
            </select>
          </label>

          <button
            type="button"
            className="h-12 px-6 rounded-xl bg-[#0B6B4F] text-white font-bold text-[15px] hover:bg-[#08513C] transition cursor-pointer shadow-sm"
          >
            Find rides
          </button>
        </div>

        {/* Filters, Search and Counters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Internal Live Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by operator, car model, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Trip toggle */}
          <div className="flex items-center gap-1.5 bg-[#F2F4F7] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsReturnTrip(false)}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isReturnTrip ? 'bg-[#101828] text-white' : 'text-[#344054]'
              }`}
            >
              One way
            </button>
            <button
              type="button"
              onClick={() => setIsReturnTrip(true)}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isReturnTrip ? 'bg-[#101828] text-white' : 'text-[#344054]'
              }`}
            >
              Return trip
            </button>
          </div>

          <span className="w-px h-6 bg-[#E4E7EC] hidden sm:block" />

          {/* Size filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All cars', 'Sedan (4 seats)', 'SUV & Vans (6+ seats)'].map((lbl, idx) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setSizeFilter(idx)}
                className={`h-9 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  sizeFilter === idx
                    ? 'bg-[#101828] text-white border-[#101828]'
                    : 'bg-white text-[#344054] border-[#E4E7EC] hover:bg-slate-50'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <span className="sm:ml-auto text-sm font-semibold text-[#475467]">
            {filteredRides.length} available rides from {fromCity} to {toCity}
          </span>
        </div>

        {/* Rides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRides.map((r) => {
            const fare = isReturnTrip ? r.ret : r.one;
            return (
              <div
                key={r.id}
                onClick={() => router.push(`/city-to-city/${r.id}`)}
                className="border border-[#EEF0F2] rounded-[22px] p-5 flex flex-col gap-3.5 hover:shadow-md hover:border-blue-300 transition bg-white cursor-pointer group"
                title={`Click to view ride details for ${r.op}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-extrabold text-lg text-[#101828] group-hover:text-blue-600 transition">
                        {r.op}
                      </span>
                      {r.ver && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E9F3EE] text-[#08513C]">
                          ✓ Verified fleet
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#475467]">
                      {r.car} · {r.bag}
                    </p>
                  </div>
                  <div className="flex flex-col items-end whitespace-nowrap">
                    <span className="font-heading font-extrabold text-xl text-[#101828]">
                      {formatPKR(fare)}
                    </span>
                    <span className="text-xs text-[#667085]">
                      {isReturnTrip ? 'Total return trip' : 'One way fare'}
                    </span>
                  </div>
                </div>

                {/* Route Bar */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F8FA] text-sm text-[#101828]">
                  <span className="font-bold">{fromCity}</span>
                  <span className="text-[#667085]">➔</span>
                  <span className="font-bold">{toCity}</span>
                  <span className="ml-auto text-xs text-[#667085] font-medium">
                    {r.duration} · {r.time}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {r.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F2F4F7] text-[#344054]"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Contacted Badge */}
                {r.contacted && (
                  <span className="self-start px-2.5 py-1 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-xs font-bold">
                    {r.contacted}
                  </span>
                )}

                {/* Unified Single-Row Responsive CTA Action Bar */}
                <div
                  className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 1. Phone Call CTA */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCall(r);
                    }}
                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    title={revealedPhones[r.id] ? `Call ${r.op} (${r.phone})` : 'Click to show phone number'}
                  >
                    <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                    <span className="font-mono text-xs font-bold whitespace-nowrap">
                      {revealedPhones[r.id] ? r.phone : 'Call'}
                    </span>
                  </button>

                  {/* 2. WhatsApp Direct Inquiry CTA */}
                  <button
                    type="button"
                    aria-label={`WhatsApp ${r.op}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsApp(r);
                    }}
                    className="h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                    title={`Inquire with ${r.op} on WhatsApp`}
                  >
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span className="hidden sm:inline text-xs font-bold text-emerald-800">WhatsApp</span>
                  </button>

                  {/* 3. View Route Details Pill */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/city-to-city/${r.id}`);
                    }}
                    className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                    title={`View Route & Timings for ${r.op}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                      <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-blue-700 truncate">
                        View Route
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover/store:text-blue-600 group-hover/store:translate-x-0.5 transition shrink-0">
                      ➔
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[13px] text-[#667085]">
          Fares are set by the owner or driver; fuel and driver are included unless specified. SafarPK only connects you; deals are between you and the operator directly.
        </p>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

