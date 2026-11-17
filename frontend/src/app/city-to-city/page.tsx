'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { recordLead, recordClickEvent } from '@/data/activityTracker';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import {
  ArrowRight,
  ArrowLeftRight,
  Phone,
  MessageSquare,
  Calendar,
  Users,
  MapPin,
  Search,
  Car,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import {
  CityRideItem,
  CITY_RIDES_DATA,
  getCustomCityRides,
} from '@/data/marketplaceData';

const INTERCITY_CITIES = [
  'Karachi',
  'Hyderabad',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Sukkur',
  'Abbottabad',
  'Sialkot',
  'Gujranwala',
  'Bahawalpur',
  'Quetta',
];

export default function CityToCityPage() {
  const router = useRouter();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [rideTypeFilter, setRideTypeFilter] = useState<'ALL' | 'SEAT_SHARING' | 'FULL_CAR'>('ALL');
  const [sizeFilter, setSizeFilter] = useState<number>(0); // 0: All, 1: 4 seats, 2: 6+ seats
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const [customRides, setCustomRides] = useState<CityRideItem[]>([]);

  useEffect(() => {
    setCustomRides(getCustomCityRides());
    const onUpdated = () => setCustomRides(getCustomCityRides());
    window.addEventListener('safarpk_city_rides_updated', onUpdated);
    return () => window.removeEventListener('safarpk_city_rides_updated', onUpdated);
  }, []);

  const allRides: CityRideItem[] = [...customRides, ...CITY_RIDES_DATA];

  const formatPKR = (v: number) => `Rs. ${v.toLocaleString('en-US')}`;

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const filteredRides = allRides.filter((r) => {
    // City match
    if (fromCity.trim()) {
      const qFrom = fromCity.toLowerCase().trim();
      const rFrom = (r.fromCity || '').toLowerCase();
      if (!rFrom.includes(qFrom)) return false;
    }
    if (toCity.trim()) {
      const qTo = toCity.toLowerCase().trim();
      const rTo = (r.toCity || '').toLowerCase();
      if (!rTo.includes(qTo)) return false;
    }

    // Ride Type filter (Carpool / Seat sharing vs Full Car)
    if (rideTypeFilter === 'SEAT_SHARING') {
      if (r.rideType !== 'SEAT_SHARING' && r.rideType !== 'BOTH') return false;
    } else if (rideTypeFilter === 'FULL_CAR') {
      if (r.rideType !== 'FULL_CAR' && r.rideType !== 'BOTH') return false;
    }

    // Size filter
    if (sizeFilter === 1 && !r.car.toLowerCase().includes('4 seat') && !r.car.toLowerCase().includes('corolla') && !r.car.toLowerCase().includes('civic') && !r.car.toLowerCase().includes('yaris') && !r.car.toLowerCase().includes('city')) {
      return false;
    }
    if (sizeFilter === 2 && (r.car.toLowerCase().includes('4 seat') || r.car.toLowerCase().includes('corolla') || r.car.toLowerCase().includes('civic') || r.car.toLowerCase().includes('yaris') || r.car.toLowerCase().includes('city'))) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.op.toLowerCase().includes(q) ||
        r.car.toLowerCase().includes(q) ||
        (r.fromCity && r.fromCity.toLowerCase().includes(q)) ||
        (r.toCity && r.toCity.toLowerCase().includes(q)) ||
        (r.pickupPoint && r.pickupPoint.toLowerCase().includes(q)) ||
        (r.dropPoint && r.dropPoint.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleWhatsApp = (ride: CityRideItem) => {
    recordLead({
      listingId: ride.id,
      listingTitle: `City-to-City: ${ride.fromCity || 'Route'} to ${ride.toCity || ''} (${ride.car})`,
      listerPhone: ride.phone,
      type: 'WHATSAPP_CLICK',
    });
    recordClickEvent(ride.id, 'WHATSAPP');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safar.pk';
    const isCarpool = ride.rideType === 'SEAT_SHARING';
    const fareText = isCarpool && ride.pricePerSeat
      ? `Rs. ${ride.pricePerSeat.toLocaleString()} per seat (${ride.availableSeats || 1} seat available)`
      : isReturnTrip
      ? `Rs. ${ride.ret.toLocaleString()} (Return Trip)`
      : `Rs. ${ride.one.toLocaleString()} (One-Way Full Car)`;

    const rawMsg = `Hi, I found your intercity route listing on SafarPK:\n• Operator: ${ride.op}\n• Route: ${ride.fromCity} ➔ ${ride.toCity}\n• Vehicle: ${ride.car}\n• Booking Type: ${isCarpool ? '1 Shared Seat' : isReturnTrip ? 'Private Car (Return)' : 'Private Car (One-Way)'}\n• Expected Fare: ${fareText}${leaveDate ? `\n• Travel Date: ${leaveDate}` : ''}\n• Pickup: ${ride.pickupPoint || 'Pickup spot'}\nIs this seat/vehicle still available?`;
    window.open(getWhatsAppTargetUrl(ride.whatsapp || ride.phone, rawMsg), '_blank');
  };

  const handleCall = (ride: CityRideItem) => {
    setRevealedPhones((prev) => ({ ...prev, [ride.id]: true }));
    recordLead({
      listingId: ride.id,
      listingTitle: `City-to-City: ${ride.fromCity} to ${ride.toCity} (${ride.car})`,
      listerPhone: ride.phone,
      type: 'CALL_CLICK',
    });
    recordClickEvent(ride.id, 'CALL');
    if (revealedPhones[ride.id]) {
      window.location.href = `tel:${ride.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-6">
        {/* Heading & Live Explainer */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0B6B4F] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intercity Route Matching · Carpool & Private Vehicles</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight text-[#101828] leading-tight">
              City to City Routes & Carpools
            </h1>
            <p className="text-[#475467] text-xs sm:text-sm md:text-base leading-relaxed mt-1">
              Find someone traveling on your route. Join a verified shared seat (carpool) or book the entire private vehicle with driver.
            </p>
          </div>

          <Link
            href="/lister?tab=intercity"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-98"
          >
            <span>+ List Your Route / Share Seats</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dynamic Route Search Box with From, To, Swap, Date and Carpool Filter */}
        <div className="p-3.5 sm:p-5 bg-white rounded-2xl sm:rounded-[22px] border border-slate-200/90 shadow-sm flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            {/* From City */}
            <div className="lg:col-span-3 flex flex-col gap-1 text-xs sm:text-[13px] font-semibold text-[#344054]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                From (Departure City)
              </span>
              <div className="relative">
                <input
                  type="text"
                  list="c2c-from-cities"
                  placeholder="e.g. Karachi or Lahore"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 border border-slate-200 rounded-xl bg-slate-50/60 font-bold text-xs sm:text-sm text-[#101828] outline-none focus:bg-white focus:border-[#0B6B4F] transition"
                />
                <datalist id="c2c-from-cities">
                  {INTERCITY_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* City Swap Button */}
            <div className="hidden lg:flex lg:col-span-1 justify-center pt-5">
              <button
                type="button"
                onClick={handleSwapCities}
                title="Swap departure and destination cities"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-[#0B6B4F] transition shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To City */}
            <div className="lg:col-span-3 flex flex-col gap-1 text-xs sm:text-[13px] font-semibold text-[#344054]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                To (Destination City)
              </span>
              <div className="relative">
                <input
                  type="text"
                  list="c2c-to-cities"
                  placeholder="e.g. Hyderabad or Islamabad"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 border border-slate-200 rounded-xl bg-slate-50/60 font-bold text-xs sm:text-sm text-[#101828] outline-none focus:bg-white focus:border-[#0B6B4F] transition"
                />
                <datalist id="c2c-to-cities">
                  {INTERCITY_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Travel Date */}
            <div className="lg:col-span-3 flex flex-col gap-1 text-xs sm:text-[13px] font-semibold text-[#344054]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Travel Date
              </span>
              <input
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-11 sm:h-12 px-3 border border-slate-200 rounded-xl bg-slate-50/60 font-bold text-xs sm:text-sm text-[#101828] outline-none focus:bg-white focus:border-[#0B6B4F] transition"
              />
            </div>

            {/* Reset / Search Actions */}
            <div className="lg:col-span-2 flex items-center gap-2 pt-1 lg:pt-5">
              <button
                type="button"
                onClick={() => {
                  setFromCity('');
                  setToCity('');
                  setLeaveDate('');
                  setRideTypeFilter('ALL');
                }}
                className="flex-1 h-11 sm:h-12 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                className="flex-1 h-11 sm:h-12 px-4 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-extrabold text-xs sm:text-sm transition cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Quick Route Shortcuts & Booking Model Filters */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Booking Type:</span>
              <button
                type="button"
                onClick={() => setRideTypeFilter('ALL')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  rideTypeFilter === 'ALL'
                    ? 'bg-[#101828] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Rides
              </button>
              <button
                type="button"
                onClick={() => setRideTypeFilter('SEAT_SHARING')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  rideTypeFilter === 'SEAT_SHARING'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>👥 Seat Sharing (Carpool)</span>
              </button>
              <button
                type="button"
                onClick={() => setRideTypeFilter('FULL_CAR')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  rideTypeFilter === 'FULL_CAR'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>🚗 Private Car (Full Vehicle)</span>
              </button>
            </div>

            {/* Popular Route Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 font-semibold hidden md:inline">Popular:</span>
              <button
                type="button"
                onClick={() => {
                  setFromCity('Karachi');
                  setToCity('Hyderabad');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
              >
                Karachi ➔ Hyderabad
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromCity('Lahore');
                  setToCity('Islamabad');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
              >
                Lahore ➔ Islamabad
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromCity('Islamabad');
                  setToCity('Peshawar');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
              >
                Islamabad ➔ Peshawar
              </button>
            </div>
          </div>
        </div>

        {/* Live Filter Bar & Counter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by driver, landmark, or vehicle model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 sm:h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B6B4F] transition shadow-2xs"
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

          <span className="sm:ml-auto text-xs sm:text-sm font-bold text-[#475467] px-1 sm:px-0">
            {filteredRides.length} routes matching {fromCity && toCity ? `${fromCity} ➔ ${toCity}` : 'all locations'}
          </span>
        </div>

        {/* Rides Grid */}
        {filteredRides.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center flex flex-col items-center gap-3">
            <MapPin className="w-10 h-10 text-slate-300" />
            <h3 className="font-heading font-bold text-lg text-slate-800">
              No matching intercity rides found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              We couldn't find an exact ride for {fromCity || 'selected area'} ➔ {toCity || 'destination'}. Try switching cities or post your route as a lister.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setFromCity('');
                  setToCity('');
                  setRideTypeFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                View all Pakistan routes
              </button>
              <Link
                href="/lister?tab=intercity"
                className="px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white text-xs font-bold"
              >
                Post this route
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredRides.map((r) => {
              const isCarpool = r.rideType === 'SEAT_SHARING';
              const isFullCar = r.rideType === 'FULL_CAR';
              const isBoth = r.rideType === 'BOTH';

              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/city-to-city/${r.id}`)}
                  className="border border-[#EEF0F2] rounded-[22px] p-5 flex flex-col gap-3.5 hover:shadow-md hover:border-emerald-300 transition bg-white cursor-pointer group"
                  title={`Click to view route details for ${r.op}`}
                >
                  {/* Top Bar: Driver/Fleet info & Badges */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-extrabold text-base sm:text-lg text-[#101828] group-hover:text-emerald-700 transition">
                          {r.op}
                        </span>
                        {r.ver && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E9F3EE] text-[#08513C]">
                            ✓ Verified Partner
                          </span>
                        )}
                        {/* Booking Type Pill */}
                        {isCarpool && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Carpool · {r.availableSeats || 1} seat left</span>
                          </span>
                        )}
                        {isFullCar && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            <span>Private Car</span>
                          </span>
                        )}
                        {isBoth && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
                            Seat Share or Full Car
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#475467] font-medium">
                        {r.car} · {r.bag}
                      </p>
                    </div>

                    {/* Price Matrix */}
                    <div className="flex flex-col items-end whitespace-nowrap">
                      {isCarpool && r.pricePerSeat ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="font-heading font-extrabold text-xl text-emerald-700">
                              {formatPKR(r.pricePerSeat)}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">/ seat</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                            {r.availableSeats || 1} seat open
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-heading font-extrabold text-xl text-[#101828]">
                            {formatPKR(isReturnTrip ? r.ret : r.one)}
                          </span>
                          <span className="text-xs text-[#667085]">
                            {isReturnTrip ? 'Return whole car' : 'One way private'}
                          </span>
                          {r.pricePerSeat && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Or {formatPKR(r.pricePerSeat)}/seat shared
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Route Bar with visual connecting line */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-[#101828]">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-emerald-700">{r.fromCity || 'Origin'}</span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-blue-700">{r.toCity || 'Destination'}</span>
                    </div>
                    <div className="text-xs text-[#667085] font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.duration}</span>
                    </div>
                  </div>

                  {/* Pickup & Drop Details */}
                  {(r.pickupPoint || r.dropPoint) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-[#F7F8FA] p-2.5 rounded-lg border border-slate-100">
                      {r.pickupPoint && (
                        <div className="truncate">
                          <strong className="text-slate-800">Pickup:</strong> {r.pickupPoint}
                        </div>
                      )}
                      {r.dropPoint && (
                        <div className="truncate">
                          <strong className="text-slate-800">Drop:</strong> {r.dropPoint}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {r.departureTime && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                        🕒 {r.departureTime}
                      </span>
                    )}
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F2F4F7] text-[#344054]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Unified Action Bar */}
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 pt-2.5 px-1 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Call CTA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(r);
                      }}
                      className="h-9 px-3 rounded-xl border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                      title={revealedPhones[r.id] ? `Call ${r.op} (${r.phone})` : 'Click to show phone number'}
                    >
                      <Phone className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20 shrink-0" />
                      <span className="font-mono text-xs font-bold whitespace-nowrap">
                        {revealedPhones[r.id] ? r.phone : 'Call'}
                      </span>
                    </button>

                    {/* WhatsApp CTA */}
                    <button
                      type="button"
                      aria-label={`WhatsApp ${r.op}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(r);
                      }}
                      className="h-9 px-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                      title={isCarpool ? 'Inquire to join shared seat on WhatsApp' : 'Book full car on WhatsApp'}
                    >
                      <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">
                        {isCarpool ? 'Join Seat via WhatsApp' : 'WhatsApp'}
                      </span>
                    </button>

                    {/* View Route Details Pill */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/city-to-city/${r.id}`);
                      }}
                      className="flex-1 min-w-0 h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 flex items-center justify-between gap-1 transition shadow-2xs group/store cursor-pointer"
                      title={`View route details for ${r.op}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-heading font-extrabold text-[11px] sm:text-xs text-slate-800 group-hover/store:text-emerald-700 truncate">
                          View Details
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
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Are you traveling between cities with empty car seats or offer private intercity fleet?
          </span>
          <Link
            href="/lister?tab=intercity"
            className="text-[#0B6B4F] font-bold hover:underline shrink-0"
          >
            List your intercity carpool route for free ➔
          </Link>
        </div>
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}


