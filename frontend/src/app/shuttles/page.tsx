'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import {
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Search,
  Navigation,
  Bus,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  Clock,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  SHUTTLES_DATA,
  ShuttleItem,
  CITY_COMMUTE_AREAS,
  matchesShuttleRoute,
} from '@/data/marketplaceData';
import { isListingPaused } from '@/data/userAuth';

const POPULAR_COMMUTE_CORRIDORS: Record<string, { from: string; to: string; label: string }[]> = {
  Karachi: [
    { from: 'Malir Cantt', to: 'Clifton', label: 'Malir ➔ Clifton' },
    { from: 'Gulshan-e-Iqbal', to: 'I.I. Chundrigar Road', label: 'Gulshan ➔ I.I. Chundrigar' },
    { from: 'Gulistan-e-Johar', to: 'Saddar', label: 'Johar ➔ Saddar' },
    { from: 'North Nazimabad', to: 'DHA (Defence)', label: 'North Nazimabad ➔ DHA' },
    { from: 'Drigh Road', to: 'Metropole', label: 'Drigh Road ➔ Metropole' },
    { from: 'Bahria Town Karachi', to: 'FTC (Shahrah-e-Faisal)', label: 'Bahria Town ➔ FTC' },
    { from: 'Karsaz', to: 'Baloch Colony', label: 'Karsaz ➔ Baloch Colony' },
  ],
  Lahore: [
    { from: 'Johar Town', to: 'Gulberg', label: 'Johar Town ➔ Gulberg' },
    { from: 'DHA Phase 5', to: 'Kalma Chowk', label: 'DHA Phase 5 ➔ Kalma Chowk' },
    { from: 'Wapda Town', to: 'Mall Road', label: 'Wapda Town ➔ Mall Road' },
    { from: 'Bahria Town', to: 'Canal Road', label: 'Bahria Town ➔ Canal Road' },
  ],
  Islamabad: [
    { from: 'Rawalpindi Saddar', to: 'Blue Area', label: 'Saddar ➔ Blue Area' },
    { from: 'Bahria Town Phase 7', to: 'Blue Area', label: 'Bahria Town ➔ Blue Area' },
    { from: 'Faizabad', to: 'Pak Secretariat', label: 'Faizabad ➔ Secretariat' },
    { from: 'G-11 Markaz', to: 'F-8 Markaz', label: 'G-11 ➔ F-8' },
  ],
  Rawalpindi: [
    { from: 'Saddar', to: 'Blue Area Islamabad', label: 'Saddar ➔ Blue Area' },
    { from: 'Bahria Town Phase 4', to: 'Faizabad', label: 'Bahria Town ➔ Faizabad' },
  ],
};

export default function ShuttlesPage() {
  const router = useRouter();

  // Route & Commuter search state (Route-First with Intermediate Stops Matching)
  const [selectedCity, setSelectedCity] = useState<string>('Karachi');
  const [fromArea, setFromArea] = useState<string>('');
  const [toArea, setToArea] = useState<string>('');
  const [targetType, setTargetType] = useState('Both');
  const [audienceFilter, setAudienceFilter] = useState('Any');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [requestedIds, setRequestedIds] = useState<Record<string, boolean>>({});

  // Dropdown states for autocompletion
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [showToMenu, setShowToMenu] = useState(false);

  // Available areas for current city
  const cityAreas = useMemo(() => {
    return CITY_COMMUTE_AREAS[selectedCity] || CITY_COMMUTE_AREAS['Karachi'] || [];
  }, [selectedCity]);

  // Intermediate Stop Corridor Matching & Filtering
  const filteredShuttles = useMemo(() => {
    return SHUTTLES_DATA.filter((shuttle) => {
      if (isListingPaused(shuttle.id, shuttle.phone)) return false;
      // 1. Audience / Gender filter
      if (audienceFilter === 'Girls' && !shuttle.tags.some((t) => t.toLowerCase().includes('girl'))) {
        return false;
      }
      if (audienceFilter === 'Boys' && !shuttle.tags.some((t) => t.toLowerCase().includes('boy'))) {
        return false;
      }

      // 2. Category filter
      if (
        targetType === 'School' &&
        !shuttle.tags.some((t) => t.toLowerCase().includes('school') || t.toLowerCase().includes('college'))
      ) {
        return false;
      }
      if (
        targetType === 'Office' &&
        !shuttle.tags.some((t) => t.toLowerCase().includes('office') || t.toLowerCase().includes('corporate'))
      ) {
        return false;
      }

      // 3. Sub-route Corridor Matching
      const matchesRoute = matchesShuttleRoute(shuttle, fromArea, toArea, selectedCity);
      if (!matchesRoute) return false;

      // 4. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          shuttle.op.toLowerCase().includes(q) ||
          shuttle.van.toLowerCase().includes(q) ||
          shuttle.from.toLowerCase().includes(q) ||
          shuttle.to.toLowerCase().includes(q) ||
          (shuttle.stops || []).some((st) => st.toLowerCase().includes(q)) ||
          shuttle.tags.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [selectedCity, fromArea, toArea, targetType, audienceFilter, searchQuery]);

  const handleWhatsApp = (shuttle: ShuttleItem) => {
    recordLead({
      listingId: shuttle.id,
      listingTitle: `Pick & Drop Route: ${shuttle.from} to ${shuttle.to}`,
      listerPhone: shuttle.phone,
      type: 'WHATSAPP_CLICK',
    });
    recordClickEvent(shuttle.id, 'WHATSAPP');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const routeUrl = `${origin}/shuttles/${shuttle.id}`;
    const rawMsg = `Hi, I would like to reserve a monthly seat with ${shuttle.op} on SafarPK: Route: ${shuttle.from} to ${shuttle.to} (${shuttle.city}) Vehicle: ${shuttle.van} Monthly Fare: Rs. ${(shuttle.fareNum || shuttle.fare).toLocaleString()}/month Route Details: ${routeUrl}`;
    window.open(getWhatsAppTargetUrl(shuttle.whatsapp || shuttle.phone, rawMsg), '_blank');
  };

  const handleCall = (shuttle: ShuttleItem) => {
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

  const handleRequestSeat = (shuttle: ShuttleItem) => {
    recordLead({
      listingId: shuttle.id,
      listingTitle: `Pick & Drop Route: ${shuttle.from} to ${shuttle.to}`,
      listerPhone: shuttle.phone,
      type: 'BOOKING_REQUEST',
    });

    const ref = `SF-${Math.floor(10000 + Math.random() * 90000)}`;
    setRequestedIds((prev) => ({ ...prev, [shuttle.id]: true }));

    router.push(
      `/request-sent?type=shuttle&ref=${ref}&name=${encodeURIComponent(
        shuttle.op
      )}&rate=${encodeURIComponent(`Rs. ${(shuttle.fareNum || shuttle.fare).toLocaleString()}`)}&route=${encodeURIComponent(
        `${shuttle.from} to ${shuttle.to}`
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-6 pb-32 sm:pb-12">
        {/* Title & Commuter Subheading */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
              <Bus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Route & Sub-Route Matching</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              No dates required · Monthly seats along fixed corridors
            </span>
          </div>
          <h1 className="font-heading font-black text-xl sm:text-3xl md:text-4xl tracking-tight text-[#101828] leading-tight">
            Pick & drop commuter routes
          </h1>
          <p className="text-[#475467] text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl">
            Find registered school, college, and office vanpools running along your daily commute.
            Select any two points along a van&apos;s corridor to view matching seats.
          </p>
        </div>

        {/* City Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">City Hub:</span>
          {Object.keys(CITY_COMMUTE_AREAS).map((cityName) => (
            <button
              key={cityName}
              type="button"
              onClick={() => {
                setSelectedCity(cityName);
                setFromArea('');
                setToArea('');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer shrink-0 ${
                selectedCity === cityName
                  ? 'bg-[#0B6B4F] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cityName}
            </button>
          ))}
        </div>

        {/* Route Finder Form: Responsive App-Like Grid (NO DATES) */}
        <div className="p-3 sm:p-5 bg-[#F7F8FA] rounded-2xl sm:rounded-3xl border border-[#EEF0F2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end shadow-2xs relative">
          {/* Pick-up Area / Stop */}
          <div className="relative flex flex-col gap-1 text-xs sm:text-[13px] font-bold text-[#344054]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Pick-up area / Stop (From)</span>
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder={`e.g. ${cityAreas[0] || 'Malir'}`}
                value={fromArea}
                onFocus={() => setShowFromMenu(true)}
                onChange={(e) => {
                  setFromArea(e.target.value);
                  setShowFromMenu(true);
                }}
                className="w-full h-11 sm:h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-bold text-xs sm:text-sm text-[#101828] outline-none shadow-2xs focus:border-[#0B6B4F]"
              />
              {fromArea && (
                <button
                  type="button"
                  onClick={() => setFromArea('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {showFromMenu && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[240px] max-h-56 overflow-y-auto no-scrollbar bg-white border border-[#E4E7EC] rounded-2xl shadow-xl py-1.5 z-50">
                <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                  {selectedCity} Areas & Stops
                </div>
                {cityAreas
                  .filter((a) => !fromArea || a.toLowerCase().includes(fromArea.toLowerCase()))
                  .map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setFromArea(area);
                        setShowFromMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{area}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Drop-off Area / Institution */}
          <div className="relative flex flex-col gap-1 text-xs sm:text-[13px] font-bold text-[#344054]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Drop-off / Hub (To)</span>
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder={`e.g. ${cityAreas[1] || 'Clifton'}`}
                value={toArea}
                onFocus={() => setShowToMenu(true)}
                onChange={(e) => {
                  setToArea(e.target.value);
                  setShowToMenu(true);
                }}
                className="w-full h-11 sm:h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-bold text-xs sm:text-sm text-[#101828] outline-none shadow-2xs focus:border-[#0B6B4F]"
              />
              {toArea && (
                <button
                  type="button"
                  onClick={() => setToArea('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {showToMenu && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[240px] max-h-56 overflow-y-auto no-scrollbar bg-white border border-[#E4E7EC] rounded-2xl shadow-xl py-1.5 z-50">
                <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                  {selectedCity} Drop-offs & Hubs
                </div>
                {cityAreas
                  .filter((a) => !toArea || a.toLowerCase().includes(toArea.toLowerCase()))
                  .map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setToArea(area);
                        setShowToMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-purple-50 hover:text-purple-800 transition flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{area}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Category */}
          <label className="flex flex-col gap-1 text-xs sm:text-[13px] font-bold text-[#344054]">
            <span>Category</span>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="h-11 sm:h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-bold text-xs sm:text-sm text-[#101828] outline-none cursor-pointer shadow-2xs"
            >
              <option value="Both">School, College & Office</option>
              <option value="School">School / College</option>
              <option value="Office">Corporate Office</option>
            </select>
          </label>

          {/* Passengers */}
          <label className="flex flex-col gap-1 text-xs sm:text-[13px] font-bold text-[#344054]">
            <span>Passengers</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="h-11 sm:h-12 px-3 border border-[#E4E7EC] rounded-xl bg-white font-bold text-xs sm:text-sm text-[#101828] outline-none cursor-pointer shadow-2xs"
            >
              <option value="Any">Any gender</option>
              <option value="Girls">Girls only</option>
              <option value="Boys">Boys only</option>
            </select>
          </label>

          {/* Submit */}
          <button
            type="button"
            onClick={() => {
              setShowFromMenu(false);
              setShowToMenu(false);
            }}
            className="h-11 sm:h-12 px-6 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-extrabold text-xs sm:text-sm transition cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Find routes</span>
          </button>
        </div>

        {/* Quick Popular Corridors for Active City */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs flex-nowrap">
          <span className="text-[#0B6B4F] font-bold shrink-0 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>Popular {selectedCity} Corridors:</span>
          </span>
          {(POPULAR_COMMUTE_CORRIDORS[selectedCity] || POPULAR_COMMUTE_CORRIDORS['Karachi']).map((corr) => {
            const active =
              fromArea.toLowerCase().includes(corr.from.toLowerCase()) &&
              toArea.toLowerCase().includes(corr.to.toLowerCase());
            return (
              <button
                key={corr.label}
                type="button"
                onClick={() => {
                  setFromArea(corr.from);
                  setToArea(corr.to);
                }}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border transition cursor-pointer font-bold shrink-0 text-xs ${
                  active
                    ? 'bg-[#0B6B4F] text-white border-[#0B6B4F] shadow-xs'
                    : 'bg-white border-[#E4E7EC] text-[#344054] hover:border-emerald-600 hover:text-emerald-700'
                }`}
              >
                {corr.label}
              </button>
            );
          })}
          {(fromArea || toArea) && (
            <button
              type="button"
              onClick={() => {
                setFromArea('');
                setToArea('');
              }}
              className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
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
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
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
            {filteredShuttles.length} active commuter routes serving {selectedCity}
          </span>
        </div>

        {/* Route Cards */}
        <div className="flex flex-col gap-4">
          {filteredShuttles.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-3xl p-6">
              <Bus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-heading font-extrabold text-base text-slate-900 mb-1">
                No active commuter routes found along this exact corridor
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Try broadening your search or selecting a popular corridor above. Operators frequently
                add intermediate stops on request.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFromArea('');
                  setToArea('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[#0B6B4F] text-white rounded-xl text-xs font-bold hover:bg-[#08513C] transition"
              >
                View all {selectedCity} routes
              </button>
            </div>
          ) : (
            filteredShuttles.map((r) => {
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
                  className="border border-[#EEF0F2] rounded-[22px] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_290px] gap-6 items-center hover:shadow-md hover:border-emerald-300 transition bg-white cursor-pointer group"
                  title={`Click to view route details for ${r.op}`}
                >
                  {/* Col 1: Route corridor & intermediate waypoints */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-heading font-extrabold text-lg text-[#101828] group-hover:text-emerald-700 transition">
                        {r.op}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF4FF] text-[#1D3A8A]">
                        {r.ver}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                        {r.city}
                      </span>
                    </div>

                    <div className="flex items-stretch gap-3">
                      <div className="flex flex-col items-center py-1">
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-[#0B6B4F]" />
                        <span className="flex-1 w-0.5 bg-emerald-200 my-0.5" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0B6B4F]" />
                      </div>
                      <div className="flex flex-col gap-2 text-[14px]">
                        <div>
                          <strong className="text-[#101828]">{r.from}</strong> · pick-up {r.pick}
                        </div>
                        <div>
                          <strong className="text-[#101828]">{r.to}</strong> · return {r.back}
                        </div>
                      </div>
                    </div>

                    {/* Intermediate Corridor Waypoint Pills */}
                    {r.stops && r.stops.length > 0 && (
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-emerald-700" />
                            <span>Serves {r.stops.length} Intermediate Stops</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Sub-route matching active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 leading-snug">
                          <span className="font-bold text-slate-800">{r.from}</span>
                          <span className="text-emerald-700 font-bold mx-1">➔</span>
                          {r.stops.map((stop, i) => {
                            const isMatch =
                              (fromArea && stop.toLowerCase().includes(fromArea.toLowerCase())) ||
                              (toArea && stop.toLowerCase().includes(toArea.toLowerCase()));
                            return (
                              <React.Fragment key={i}>
                                <span
                                  className={
                                    isMatch
                                      ? 'font-black text-emerald-900 bg-emerald-200/90 px-1 py-0.5 rounded shadow-2xs'
                                      : 'font-medium text-slate-700'
                                  }
                                >
                                  {stop}
                                </span>
                                {i < r.stops!.length - 1 && (
                                  <span className="text-slate-400 mx-1">➔</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <span className="text-emerald-700 font-bold mx-1">➔</span>
                          <span className="font-bold text-slate-800">{r.to}</span>
                        </div>
                      </div>
                    )}

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
                        Rs. {(r.fareNum || r.fare).toLocaleString()}
                      </span>
                      <span className="text-sm text-[#667085]">/ month per seat</span>
                    </div>
                    {requestedIds[r.id] && (
                      <span className="self-start px-2.5 py-1 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-xs font-bold">
                        ✓ Seat inquiry submitted
                      </span>
                    )}
                  </div>

                  {/* Col 3: Responsive Action Bar */}
                  <div
                    className="flex flex-col gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Click-to-Reveal Phone Button */}
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

                      {/* Emerald WhatsApp Button */}
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
            })
          )}
        </div>

        <p className="text-[13px] text-[#667085]">
          SafarPK connects you with registered local commuter van operators. Monthly fee agreements, specific stop timings, and seat allocations are confirmed directly with the operator.
        </p>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}
