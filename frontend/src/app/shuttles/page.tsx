'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { Phone, MessageSquare, ArrowRight, ShieldCheck, MapPin, Search } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

interface ShuttleRoute {
  id: string;
  op: string;
  ver: string;
  from: string;
  to: string;
  pick: string;
  back: string;
  van: string;
  days: string;
  seats: number;
  total: number;
  fare: string;
  tags: string[];
  phone: string;
  whatsapp: string;
  contacted?: string;
}

const INITIAL_SHUTTLES: ShuttleRoute[] = [
  {
    id: 'sht-1',
    op: 'Noor Shuttles',
    ver: '✓ Verified operator',
    from: 'DHA Phase 5',
    to: 'Gulberg III (Main Boulevard)',
    pick: '7:10 AM',
    back: '2:15 PM',
    van: 'Toyota Hiace · AC',
    days: 'Mon–Sat',
    seats: 2,
    total: 14,
    fare: 'Rs. 9,500',
    tags: ['School & College', 'Girls only', 'Female attendant on board'],
    phone: '+92 300 9876543',
    whatsapp: '923009876543',
    contacted: '✓ You sent a request · 9 Nov',
  },
  {
    id: 'sht-2',
    op: 'Metro Executive Pick & Drop',
    ver: '✓ Verified operator',
    from: 'DHA Phase 5',
    to: 'Gulberg III (IT Park / Kalma Chowk)',
    pick: '8:00 AM',
    back: '5:30 PM',
    van: 'Suzuki APV GLX · Dual AC',
    days: 'Mon–Fri',
    seats: 4,
    total: 7,
    fare: 'Rs. 11,000',
    tags: ['Corporate Office', 'Mixed Passengers', 'Punctual GPS Tracked'],
    phone: '+92 321 8877665',
    whatsapp: '923218877665',
  },
  {
    id: 'sht-3',
    op: 'Safe Ride School Vans',
    ver: '✓ Verified operator',
    from: 'DHA Phase 6',
    to: 'Gulberg III (Beaconhouse & LGS)',
    pick: '6:55 AM',
    back: '1:45 PM',
    van: 'Toyota Hiace Grand Cabin · AC',
    days: 'Mon–Sat',
    seats: 0,
    total: 14,
    fare: 'Rs. 8,800',
    tags: ['School', 'Boys only', 'First Aid Trained'],
    phone: '+92 333 4455667',
    whatsapp: '923334455667',
  },
  {
    id: 'sht-4',
    op: 'Al-Rehman Commuter Transport',
    ver: 'Documents in review',
    from: 'Cantt / Saddar',
    to: 'Gulberg II / Garden Town',
    pick: '7:30 AM',
    back: '3:00 PM',
    van: 'Hiace · non-AC',
    days: 'Mon–Sat',
    seats: 6,
    total: 15,
    fare: 'Rs. 6,500',
    tags: ['College', 'Mixed', 'Budget Friendly'],
    phone: '+92 345 1122334',
    whatsapp: '923451122334',
  },
];

export default function ShuttlesPage() {
  const router = useRouter();
  const [fromArea, setFromArea] = useState('DHA Phase 5, Lahore');
  const [toArea, setToArea] = useState('Gulberg III');
  const [targetType, setTargetType] = useState('Both');
  const [audienceFilter, setAudienceFilter] = useState('Any');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [shuttles, setShuttles] = useState<ShuttleRoute[]>(INITIAL_SHUTTLES);

  const filteredShuttles = shuttles.filter((r) => {
    if (audienceFilter === 'Girls' && !r.tags.some((t) => t.toLowerCase().includes('girl'))) return false;
    if (audienceFilter === 'Boys' && !r.tags.some((t) => t.toLowerCase().includes('boy'))) return false;
    if (targetType === 'School' && !r.tags.some((t) => t.toLowerCase().includes('school') || t.toLowerCase().includes('college'))) return false;
    if (targetType === 'Office' && !r.tags.some((t) => t.toLowerCase().includes('office') || t.toLowerCase().includes('corporate'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.op.toLowerCase().includes(q) ||
        r.van.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleWhatsApp = (shuttle: ShuttleRoute) => {
    recordLead({
      listingId: shuttle.id,
      listingTitle: `Pick & Drop Route: ${shuttle.from} to ${shuttle.to}`,
      listerPhone: shuttle.phone,
      type: 'WHATSAPP_CLICK',
    });
    recordClickEvent(shuttle.id, 'WHATSAPP');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const routeUrl = `${origin}/shuttles/${shuttle.id}`;
    const rawMsg = `Hi, I would like to reserve a monthly seat with ${shuttle.op} on SafarPK: Route: ${shuttle.from} to ${shuttle.to} Vehicle: ${shuttle.van} Fare: ${shuttle.fare}/month Seats Available: ${shuttle.seats} Route Details: ${routeUrl}`;
    window.open(getWhatsAppTargetUrl(shuttle.whatsapp || shuttle.phone, rawMsg), '_blank');
  };

  const handleCall = (shuttle: ShuttleRoute) => {
    setRevealedPhones((prev) => ({ ...prev, [shuttle.id]: true }));
    recordLead({
      listingId: shuttle.id,
      listingTitle: `Pick & Drop Route: ${shuttle.from} to ${shuttle.to}`,
      listerPhone: shuttle.phone,
      type: 'CALL_CLICK',
    });
    recordClickEvent(shuttle.id, 'CALL');
    if (revealedPhones[shuttle.id]) {
      window.location.href = `tel:${shuttle.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleRequestSeat = (shuttle: ShuttleRoute) => {
    recordLead({
      listingId: shuttle.id,
      listingTitle: `Pick & Drop Route: ${shuttle.from} to ${shuttle.to}`,
      listerPhone: shuttle.phone,
      type: 'BOOKING_REQUEST',
    });

    const ref = `SF-${Math.floor(10000 + Math.random() * 90000)}`;

    setShuttles((prev) =>
      prev.map((s) =>
        s.id === shuttle.id ? { ...s, contacted: '✓ You sent a request · Today' } : s
      )
    );

    window.location.href = `/request-sent?type=shuttle&ref=${ref}&name=${encodeURIComponent(
      shuttle.op
    )}&rate=${encodeURIComponent(shuttle.fare)}&route=${encodeURIComponent(
      `${shuttle.from} to ${shuttle.to}`
    )}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#101828]">
            Pick & drop commuter routes
          </h1>
          <p className="text-[#475467] text-base">
            Monthly seats for school, college and office. Find a van that already runs your daily route.
          </p>
        </div>

        {/* Route Finder Form */}
        <div className="p-4 bg-[#F7F8FA] rounded-[18px] border border-[#EEF0F2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            Pick-up area
            <input
              type="text"
              value={fromArea}
              onChange={(e) => setFromArea(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            Drop-off area / institution
            <input
              type="text"
              value={toArea}
              onChange={(e) => setToArea(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            For
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none cursor-pointer"
            >
              <option value="Both">School, College & Office</option>
              <option value="School">School / College</option>
              <option value="Office">Corporate Office</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#344054]">
            Passengers
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-medium text-[15px] text-[#101828] outline-none cursor-pointer"
            >
              <option value="Any">Any gender</option>
              <option value="Girls">Girls only</option>
              <option value="Boys">Boys only</option>
            </select>
          </label>

          <button
            type="button"
            className="h-12 px-6 rounded-xl bg-[#6D28D9] text-white font-bold text-[15px] hover:bg-[#5b21b6] transition cursor-pointer shadow-sm"
          >
            Find routes
          </button>
        </div>

        {/* Search & Filter Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Internal Live Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by operator, van model, or area (e.g. DHA, Gulberg)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 transition"
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

          <span className="text-sm font-semibold text-[#475467]">
            {filteredShuttles.length} active commuter routes matching your search
          </span>
        </div>

        {/* Route Cards */}
        <div className="flex flex-col gap-4">
          {filteredShuttles.map((r) => {
            const seatsLeftBadge =
              r.seats === 0 ? (
                <span className="self-start px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE4E2] text-[#B42318]">
                  Waiting list · van full
                </span>
              ) : r.seats <= 2 ? (
                <span className="self-start px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3E2] text-[#8A4B00]">
                  Only {r.seats} seats left
                </span>
              ) : (
                <span className="self-start px-2.5 py-1 rounded-full text-xs font-bold bg-[#E9F3EE] text-[#08513C]">
                  {r.seats} of {r.total} seats vacant
                </span>
              );

            return (
              <div
                key={r.id}
                onClick={() => router.push(`/shuttles/${r.id}`)}
                className="border border-[#EEF0F2] rounded-[22px] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_290px] gap-6 items-center hover:shadow-md hover:border-purple-300 transition bg-white cursor-pointer group"
                title={`Click to view route details for ${r.op}`}
              >
                {/* Col 1: Route line */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-heading font-extrabold text-lg text-[#101828] group-hover:text-purple-700 transition">
                      {r.op}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF4FF] text-[#1D3A8A]">
                      {r.ver}
                    </span>
                  </div>

                  <div className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center py-1">
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-[#6D28D9]" />
                      <span className="flex-1 w-0.5 bg-[#DDD6FE] my-0.5" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6D28D9]" />
                    </div>
                    <div className="flex flex-col gap-2.5 text-[15px]">
                      <div>
                        <strong className="text-[#101828]">{r.from}</strong> · pick-up {r.pick}
                      </div>
                      <div>
                        <strong className="text-[#101828]">{r.to}</strong> · return {r.back}
                      </div>
                    </div>
                  </div>

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
                </div>

                {/* Col 2: Van info, seats, fare */}
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-[#667085]">
                    {r.van} · {r.days}
                  </span>
                  {seatsLeftBadge}
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading font-extrabold text-2xl text-[#101828]">
                      {r.fare}
                    </span>
                    <span className="text-sm text-[#667085]">/ month per seat</span>
                  </div>
                  {r.contacted && (
                    <span className="self-start px-2.5 py-1 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-xs font-bold">
                      {r.contacted}
                    </span>
                  )}
                </div>

                {/* Col 3: Responsive Action Bar */}
                <div
                  className="flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Purple Click-to-Reveal Phone Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(r);
                      }}
                      className="flex-1 h-9 px-2.5 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs whitespace-nowrap cursor-pointer active:scale-95"
                      title={revealedPhones[r.id] ? `Call ${r.op} (${r.phone})` : 'Click to show phone number'}
                    >
                      <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                      <span className="font-mono text-xs font-bold whitespace-nowrap">
                        {revealedPhones[r.id] ? r.phone : 'Call'}
                      </span>
                    </button>

                    {/* Emerald WhatsApp Button with official SVG icon */}
                    <button
                      type="button"
                      aria-label={`WhatsApp ${r.op}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(r);
                      }}
                      className="h-9 px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition shadow-2xs shrink-0 cursor-pointer active:scale-95 text-xs font-bold whitespace-nowrap"
                      title={`Chat with ${r.op} on WhatsApp`}
                    >
                      <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                    </button>
                  </div>

                  {/* Primary Seat Request / Detail Link Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/shuttles/${r.id}`);
                    }}
                    className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span>Request a Seat</span>
                    <span className="text-[10px] text-slate-400">➔</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[13px] text-[#667085]">
          SafarPK only connects you with the van operator; fees, seat booking, and schedule agreements are made directly with them.
        </p>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

