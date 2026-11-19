'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Car,
  Compass,
  Bus,
  Truck,
  ShieldCheck,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Heart,
  X,
  Check,
  Flag,
  Share2,
  Navigation,
  ArrowRight,
  Users,
} from 'lucide-react';
import { CARS_DATA, VehicleCardItem } from '@/data/marketplaceData';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';
import { formatPKR, maskPhone } from '@/lib/api';
import { getStoreSlugForOwner } from '@/data/storefrontEngine';

const PAKISTAN_CITIES = [
  { name: 'Lahore', tint: '#F3E6D3' },
  { name: 'Karachi', tint: '#DCEBE3' },
  { name: 'Islamabad', tint: '#DDE6F3' },
  { name: 'Rawalpindi', tint: '#EADFEF' },
  { name: 'Peshawar', tint: '#F1E9DF' },
  { name: 'Faisalabad', tint: '#E5ECE3' },
  { name: 'Multan', tint: '#F2E4DC' },
  { name: 'Hyderabad', tint: '#EAF0EC' },
  { name: 'Quetta', tint: '#EFF1EE' },
  { name: 'Sialkot', tint: '#ECEEF3' },
];

const TRUST_TAGS = [
  { label: 'Verified owners & drivers', icon: ShieldCheck },
  { label: 'Pay at pick-up', icon: Clock },
  { label: 'Zero commission', icon: Check },
  { label: 'Book on WhatsApp', icon: MessageCircle },
];

const CAR_CATEGORIES = ['All cars', 'Sedans', 'SUVs & 4×4', 'Luxury', 'Vans & HiAce'];

export function MobileHomeNativeView() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);
  const [city, setCity] = useState<string>('Lahore');
  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [activeServiceIdx, setActiveServiceIdx] = useState(0); // 0: Rent car, 1: Drivers, 2: City to City, 3: Pick & drop, 4: Movers
  const [selectedCarCategory, setSelectedCarCategory] = useState(0); // 0: All cars, 1: Sedans, 2: SUVs, 3: Luxury, 4: Vans
  const [isSelfDrive, setIsSelfDrive] = useState(true);
  const [savedCarIds, setSavedCarIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search Sheet Inputs
  const [searchWhere, setSearchWhere] = useState('Lahore');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [c2cToCity, setC2cToCity] = useState('Islamabad');
  const [shuttleDropArea, setShuttleDropArea] = useState('');
  const [moverToArea, setMoverToArea] = useState('');

  useEffect(() => {
    setActiveUser(getActiveUser());
    const onAuth = () => setActiveUser(getActiveUser());
    window.addEventListener('safarpk_auth_state_changed', onAuth);

    // Load saved favorites
    try {
      const stored = localStorage.getItem('safarpk_saved_vehicles');
      if (stored) setSavedCarIds(JSON.parse(stored));
    } catch (e) {}

    return () => {
      window.removeEventListener('safarpk_auth_state_changed', onAuth);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSaveCar = (carId: string, carName: string) => {
    let updated: string[];
    if (savedCarIds.includes(carId)) {
      updated = savedCarIds.filter((id) => id !== carId);
      showToast(`Removed "${carName}" from saved`);
    } else {
      updated = [...savedCarIds, carId];
      showToast(`Saved "${carName}" to your wishlist!`);
    }
    setSavedCarIds(updated);
    try {
      localStorage.setItem('safarpk_saved_vehicles', JSON.stringify(updated));
      window.dispatchEvent(new Event('safarpk_favorites_updated'));
    } catch (e) {}
  };

  // 5 Services Configuration (Note: intercity explicitly changed to "City to City")
  const services = useMemo(
    () => [
      {
        id: 'rent_car',
        label: 'Rent car',
        icon: Car,
        title: 'Rent a car',
        goText: 'Search cars',
        href: '/#listings-results',
      },
      {
        id: 'drivers',
        label: 'Drivers',
        icon: Users,
        title: 'Hire a driver',
        goText: 'Find drivers',
        href: '/drivers',
      },
      {
        id: 'city_to_city',
        label: 'City to City',
        icon: Navigation,
        title: 'City to city',
        goText: 'Find rides',
        href: '/city-to-city',
      },
      {
        id: 'pick_and_drop',
        label: 'Pick & drop',
        icon: Bus,
        title: 'Pick & drop',
        goText: 'Find routes',
        href: '/shuttles',
      },
      {
        id: 'movers',
        label: 'Movers',
        icon: Truck,
        title: 'Home shifting',
        goText: 'Find movers',
        href: '/movers',
      },
    ],
    []
  );

  const curService = services[activeServiceIdx];

  // Featured Cars (Prioritizing active city or top verified fleet)
  const featuredCars = useMemo(() => {
    const list = [...CARS_DATA];
    const cityMatches = list.filter((c) => c.city.toLowerCase() === city.toLowerCase());
    const pool = cityMatches.length >= 2 ? cityMatches : list;
    return pool.slice(0, 3);
  }, [city]);

  // Filtered Nearby Cars
  const filteredCars = useMemo(() => {
    let list = [...CARS_DATA];
    // Category filter
    if (selectedCarCategory === 1) {
      list = list.filter((c) => c.category === 'Sedans');
    } else if (selectedCarCategory === 2) {
      list = list.filter((c) => c.category === 'SUVs & 4x4');
    } else if (selectedCarCategory === 3) {
      list = list.filter((c) => c.category === 'Luxury');
    } else if (selectedCarCategory === 4) {
      list = list.filter((c) => c.category === 'Vans & Hiace');
    }
    return list;
  }, [selectedCarCategory]);

  const userInitials = useMemo(() => {
    if (!activeUser || !activeUser.name) return 'HA';
    const parts = activeUser.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [activeUser]);

  return (
    <div className="w-full bg-[#F5F6F8] text-[#101828] font-sans flex flex-col pb-28 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-slate-900/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Native iOS/Android Clean Header)                           */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEF0F2] px-4 pt-3 pb-3 flex flex-col gap-2.5 shadow-2xs">
        {/* Row 1: City Selector + Notification Bell + User Profile Avatar */}
        <div className="flex items-center justify-between gap-2.5">
          {/* City Button */}
          <button
            type="button"
            onClick={() => setCitySheetOpen(true)}
            className="flex-1 min-w-0 flex items-center gap-2 h-11 p-0 border-0 bg-transparent cursor-pointer text-left"
          >
            <span className="w-9 h-9 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 stroke-[2.2]" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-[#667085] leading-none mb-0.5">Your city</span>
              <span className="flex items-center gap-1 font-heading font-black text-[17px] text-[#101828] leading-tight truncate">
                <span>{city}</span>
                <ChevronDown className="w-4 h-4 text-slate-500 stroke-[2.4]" />
              </span>
            </span>
          </button>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <Link
              href="/inbox"
              aria-label="Notifications"
              className="relative w-11 h-11 rounded-full bg-[#F2F4F7] text-[#101828] flex items-center justify-center transition active:scale-95"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#D92D20] ring-2 ring-[#F2F4F7]" />
            </Link>

            {/* User Profile Avatar */}
            <Link
              href={activeUser ? '/customer' : '/login'}
              aria-label="My account"
              className="w-11 h-11 rounded-full bg-[#0B6B4F] text-white font-bold text-sm flex items-center justify-center shadow-xs transition active:scale-95"
            >
              {userInitials}
            </Link>
          </div>
        </div>

        {/* Row 2: Universal Native Search Bar */}
        <button
          type="button"
          onClick={() => setSearchSheetOpen(true)}
          className="flex items-center gap-3 h-[54px] px-3.5 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] cursor-pointer text-left transition active:scale-[0.99] shadow-2xs"
        >
          <Search className="w-5 h-5 text-[#101828] stroke-[2.2] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <span className="text-[14px] font-bold text-[#101828] leading-none truncate">
              {curService.title} in {city}
            </span>
            <span className="text-[12px] text-[#667085] leading-none truncate">
              {activeServiceIdx === 0
                ? `Any dates · ${isSelfDrive ? 'Self-drive' : 'With driver'} · pay at pick-up`
                : activeServiceIdx === 2
                ? 'City to city carpool or full car · M-9, M-2'
                : 'Tap to add trip details'}
            </span>
          </div>
          <span className="w-9 h-9 rounded-xl bg-white border border-[#E4E7EC] flex items-center justify-center shrink-0 shadow-2xs">
            <SlidersHorizontal className="w-4 h-4 text-[#101828] stroke-[2]" />
          </span>
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 2. SCROLLING CONTENT                                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-5 pt-3">
        {/* SERVICES GRID (5 Equal Columns, Exactly matching reference artboard) */}
        <div
          role="tablist"
          aria-label="Services"
          className="grid grid-cols-5 gap-1 px-2.5 pt-1"
        >
          {services.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = activeServiceIdx === idx;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveServiceIdx(idx);
                  setSearchSheetOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 py-1 px-0.5 border-0 bg-transparent cursor-pointer transition active:scale-95"
              >
                <span
                  className={`w-14 h-14 rounded-[18px] flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#0B6B4F] text-white shadow-[0_6px_14px_rgba(11,107,79,0.28)]'
                      : 'bg-white text-[#101828] border border-[#E4E7EC]'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[1.9]" />
                </span>
                <span
                  className={`text-[11px] leading-tight text-center tracking-tight truncate w-full ${
                    isSelected ? 'font-bold text-[#0B6B4F]' : 'font-semibold text-[#344054]'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* TRUST STRIP (Horizontal Scrolling Pills) */}
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {TRUST_TAGS.map((t) => {
            const Icon = t.icon;
            return (
              <span
                key={t.label}
                className="shrink-0 flex items-center gap-1.5 h-[34px] px-3 rounded-full bg-white border border-[#E4E7EC] text-xs font-semibold text-[#344054] shadow-2xs"
              >
                <Icon className="w-3.5 h-3.5 text-[#0B6B4F] stroke-[2.4]" />
                <span>{t.label}</span>
              </span>
            );
          })}
        </div>

        {/* FEATURED CAROUSEL ("Featured in {city}") */}
        <section className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline px-4">
            <h2 className="font-heading font-black text-[19px] text-[#101828]">Featured in {city}</h2>
            <Link href="/#listings-results" className="text-sm font-bold text-[#0B6B4F] hover:underline">
              See all
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar snap-x snap-mandatory">
            {featuredCars.map((car, idx) => {
              const rank = `#${idx + 1}`;
              const cleanPhone = car.phone.replace(/[^0-9]/g, '');
              const storeSlug = getStoreSlugForOwner(car.owner);

              return (
                <div
                  key={car.id}
                  className="shrink-0 w-[290px] snap-start bg-white rounded-[22px] overflow-hidden border-2 border-[#F5B547] flex flex-col shadow-xs"
                >
                  {/* Photo / Thumbnail Area */}
                  <Link
                    href={`/listing/${car.id}`}
                    className="relative h-[164px] bg-[#EEF1F4] flex items-center justify-center overflow-hidden"
                  >
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200">
                        <Car className="w-20 h-20 text-slate-400 stroke-[1.5]" />
                      </div>
                    )}

                    {/* Featured Rank Badge */}
                    <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5B547] text-[#101828] text-[11px] font-black tracking-wider uppercase shadow-xs">
                      FEATURED · {rank}
                    </span>

                    {/* City Location Badge */}
                    <span className="absolute left-2.5 bottom-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-[#101828] text-xs font-semibold backdrop-blur-xs shadow-2xs">
                      <MapPin className="w-3 h-3 text-[#0B6B4F] stroke-[2.6]" />
                      <span>{car.city}</span>
                    </span>

                    {/* Photo Label */}
                    <span className="absolute right-2.5 bottom-2.5 text-[10px] font-semibold text-[#667085] bg-white/90 px-2 py-0.5 rounded shadow-2xs">
                      Vehicle photo
                    </span>
                  </Link>

                  {/* Body & Specs */}
                  <div className="p-3.5 flex flex-col gap-2.5">
                    <Link href={`/listing/${car.id}`} className="flex justify-between items-start gap-2 text-[#101828]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-heading font-bold text-[16px] leading-tight truncate">
                          {car.name}
                        </span>
                        <span className="text-xs text-[#667085] truncate">{car.specs}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-heading font-extrabold text-[16px] text-[#101828] block">
                          {car.price}
                        </span>
                        <span className="text-[11px] text-[#667085] block">per day</span>
                      </div>
                    </Link>

                    {/* 3-Col Action Grid: Call + WhatsApp + Owner Chip */}
                    <div className="grid grid-cols-[44px_44px_minmax(0,1fr)] gap-2">
                      {/* Call Button */}
                      <a
                        href={`tel:${car.phone}`}
                        aria-label={`Call ${car.owner}`}
                        className="h-11 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                      >
                        <Phone className="w-4 h-4 stroke-[2]" />
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Assalam o Alaikum, inquiring about ${car.name} (${car.price}/day) in ${car.city} listed on SafarPK.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${car.owner}`}
                        className="h-11 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100 text-[#0B6B4F] flex items-center justify-center transition active:scale-95"
                      >
                        <MessageCircle className="w-5 h-5 stroke-[2]" />
                      </a>

                      {/* Verified Owner Chip */}
                      <Link
                        href={`/store/${storeSlug}`}
                        className="h-11 px-3 rounded-xl border border-[#E4E7EC] bg-white text-[#101828] flex items-center gap-1.5 text-xs font-semibold min-w-0 hover:bg-slate-50 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#12B76A] shrink-0 animate-pulse" />
                        <span className="flex-1 truncate">{car.owner}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.2] shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* NEARBY CARS LIST (With Category Selector) */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-4">
            <h2 className="font-heading font-black text-[19px] text-[#101828]">Cars available</h2>
            <span className="px-2.5 py-1 rounded-full bg-[#E9F3EE] text-[#08513C] text-xs font-bold">
              {filteredCars.length} available
            </span>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {CAR_CATEGORIES.map((catLabel, idx) => {
              const active = selectedCarCategory === idx;
              return (
                <button
                  key={catLabel}
                  type="button"
                  onClick={() => setSelectedCarCategory(idx)}
                  className={`shrink-0 h-[38px] px-4 rounded-full font-semibold text-xs transition cursor-pointer ${
                    active
                      ? 'bg-[#101828] text-white border border-[#101828] shadow-xs'
                      : 'bg-white text-[#344054] border border-[#E4E7EC] hover:bg-slate-50'
                  }`}
                >
                  {catLabel}
                </button>
              );
            })}
          </div>

          {/* Cars Vertical Stack Cards (Horizontal Layout inside card) */}
          <div className="flex flex-col gap-2.5 px-4">
            {filteredCars.slice(0, 8).map((car) => {
              const isSaved = savedCarIds.includes(car.id);
              const cleanPhone = car.phone.replace(/[^0-9]/g, '');

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-[18px] p-2.5 flex gap-3 border border-[#EEF0F2] shadow-2xs transition hover:border-slate-300"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/listing/${car.id}`}
                    className="relative w-28 h-28 shrink-0 rounded-2xl bg-[#F7F8FA] flex items-center justify-center overflow-hidden"
                  >
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Car className="w-12 h-12 text-slate-300 stroke-[1.8]" />
                    )}
                    <span className="absolute left-1.5 bottom-1.5 px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-[#101828] shadow-2xs">
                      {car.city}
                    </span>
                  </Link>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/listing/${car.id}`} className="min-w-0 flex-1">
                          <h3 className="font-heading font-bold text-[15px] text-[#101828] leading-snug truncate">
                            {car.name}
                          </h3>
                          <p className="text-xs text-[#667085] truncate mt-0.5">{car.specs}</p>
                        </Link>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={() => toggleSaveCar(car.id, car.name)}
                          className="w-8 h-8 -mr-1 -mt-1 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 cursor-pointer transition active:scale-90"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isSaved ? 'text-[#D92D20] fill-[#D92D20]' : 'text-slate-400'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Verified Owner Row */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B6B4F] mt-1 truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0B6B4F] shrink-0 stroke-[2.4]" />
                        <span className="truncate">{car.owner}</span>
                      </div>

                      {car.contacted && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-[10px] font-bold">
                          {car.contacted}
                        </span>
                      )}
                    </div>

                    {/* Bottom Pricing & Call/WhatsApp Row */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-50">
                      <div>
                        <span className="font-heading font-extrabold text-[15px] text-[#101828]">
                          {car.price}
                        </span>
                        <span className="text-[11px] text-[#667085]"> /day</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${car.phone}`}
                          className="w-9 h-9 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                          title="Call Owner"
                        >
                          <Phone className="w-3.5 h-3.5 stroke-[2]" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Assalam o Alaikum, inquiring about ${car.name} (${car.price}/day) in ${car.city} on SafarPK.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100 text-[#0B6B4F] flex items-center justify-center transition active:scale-95"
                          title="WhatsApp Owner"
                        >
                          <MessageCircle className="w-4 h-4 stroke-[2]" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Button */}
          <div className="px-4 pt-1">
            <Link
              href="/#listings-results"
              className="w-full h-12 rounded-2xl border border-[#D0D5DD] bg-white text-[#101828] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-[0.99] shadow-2xs"
            >
              <span>View all vehicles</span>
              <ArrowRight className="w-4 h-4 stroke-[2.4]" />
            </Link>
          </div>
        </section>

        {/* BOOK IN THREE STEPS */}
        <section className="flex flex-col gap-2.5 px-4">
          <h2 className="font-heading font-black text-[19px] text-[#101828]">Book in three steps</h2>
          <div className="bg-white rounded-2xl border border-[#EEF0F2] flex flex-col shadow-2xs overflow-hidden">
            <div className="flex gap-3 items-center p-3.5 border-b border-slate-100">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#101828]">Search</span>
                <span className="text-xs text-[#667085]">Filter by city, dates and car type</span>
              </div>
            </div>
            <div className="flex gap-3 items-center p-3.5 border-b border-slate-100">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#101828]">Request on WhatsApp</span>
                <span className="text-xs text-[#667085]">Your trip details go straight to the owner</span>
              </div>
            </div>
            <div className="flex gap-3 items-center p-3.5">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#101828]">Pay on trip</span>
                <span className="text-xs text-[#667085]">Meet, check the car and pay the owner</span>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR CITIES */}
        <section className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline px-4">
            <h2 className="font-heading font-black text-[19px] text-[#101828]">Popular cities</h2>
            <button
              type="button"
              onClick={() => setCitySheetOpen(true)}
              className="text-sm font-bold text-[#0B6B4F] hover:underline cursor-pointer"
            >
              Explore hubs
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto px-4 no-scrollbar">
            {PAKISTAN_CITIES.slice(0, 5).map((c) => {
              const active = c.name === city;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCity(c.name);
                    setSearchWhere(c.name);
                  }}
                  className={`shrink-0 w-32 p-0 rounded-2xl bg-white overflow-hidden text-left cursor-pointer transition shadow-2xs ${
                    active ? 'border-2 border-[#0B6B4F]' : 'border border-[#EEF0F2]'
                  }`}
                >
                  <span className="block h-16 w-full" style={{ backgroundColor: c.tint }} />
                  <div className="p-2.5 flex flex-col gap-0.5">
                    <span className="font-bold text-sm text-[#101828] truncate">{c.name}</span>
                    <span className="text-[11px] text-[#667085]">Cars · Drivers</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* PARTNER BANNER */}
        <div className="px-4">
          <div className="p-4.5 rounded-3xl bg-[#101828] text-white flex flex-col gap-3.5 shadow-lg">
            <div className="space-y-1">
              <span className="text-[11px] font-black tracking-wider uppercase text-[#F5B547] block">
                FOR OWNERS, DRIVERS &amp; MOVERS
              </span>
              <h3 className="font-heading font-bold text-[16px] leading-snug">
                List your vehicle or service. Customers contact you directly.
              </h3>
            </div>
            <Link
              href="/post-ad"
              className="self-start h-10 px-4 rounded-full bg-white text-[#101828] font-bold text-xs flex items-center justify-center hover:bg-slate-100 transition"
            >
              Become a partner
            </Link>
          </div>
          <p className="text-center text-xs text-[#98A2B3] leading-relaxed mt-4 px-2">
            SafarPK connects you directly with verified owners, drivers and movers. Zero middleman fees.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CITY PICKER BOTTOM SHEET (Native Modal)                                 */}
      {/* ========================================================================= */}
      {citySheetOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setCitySheetOpen(false)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[82vh] overflow-y-auto flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-[20px] text-[#101828]">Choose your city</h3>
              <button
                type="button"
                onClick={() => setCitySheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {PAKISTAN_CITIES.map((c) => {
                const isSelected = c.name === city;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setCity(c.name);
                      setSearchWhere(c.name);
                      setCitySheetOpen(false);
                      showToast(`City changed to ${c.name}`);
                    }}
                    className="w-full flex items-center justify-between py-3.5 px-2 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[16px]"
                  >
                    <span className={isSelected ? 'text-[#0B6B4F] font-bold' : 'text-[#101828]'}>
                      {c.name}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SEARCH BOTTOM SHEET (Native Modal with 5 Service Switcher Chips)       */}
      {/* ========================================================================= */}
      {searchSheetOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setSearchSheetOpen(false)}
            aria-label="Close search"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[88vh] overflow-y-auto flex flex-col gap-3.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />

            <div className="flex items-center justify-between pb-1">
              <h3 className="font-heading font-extrabold text-[20px] text-[#101828]">{curService.title}</h3>
              <button
                type="button"
                onClick={() => setSearchSheetOpen(false)}
                className="h-8 px-3 rounded-full bg-[#F2F4F7] font-semibold text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Service Chips Switcher (Note: City to City) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              {services.map((s, idx) => {
                const isSelected = activeServiceIdx === idx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveServiceIdx(idx)}
                    className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'border border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C] font-bold'
                        : 'border border-[#E4E7EC] bg-white text-[#344054]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Form Fields Card */}
            <div className="border border-[#E4E7EC] rounded-2xl overflow-hidden bg-white divide-y divide-[#EEF0F2]">
              {/* Field 1: Where / Pick-up */}
              <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 stroke-[2.2]" />
                </span>
                <span className="flex-1 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                    {activeServiceIdx === 2
                      ? 'Leaving from'
                      : activeServiceIdx === 3
                      ? 'Pick-up area (Home)'
                      : activeServiceIdx === 4
                      ? 'Moving from (Current Area)'
                      : 'Where'}
                  </span>
                  <input
                    type="text"
                    value={searchWhere}
                    onChange={(e) => setSearchWhere(e.target.value)}
                    placeholder="City or area, e.g. Lahore"
                    className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                  />
                </span>
              </label>

              {/* Field 2: Date or Destination */}
              {activeServiceIdx === 2 ? (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">Going to (Destination City)</span>
                    <input
                      type="text"
                      value={c2cToCity}
                      onChange={(e) => setC2cToCity(e.target.value)}
                      placeholder="e.g. Islamabad, Hyderabad"
                      className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                    />
                  </span>
                </label>
              ) : activeServiceIdx === 3 ? (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">Drop-off (Office or School)</span>
                    <input
                      type="text"
                      value={shuttleDropArea}
                      onChange={(e) => setShuttleDropArea(e.target.value)}
                      placeholder="e.g. Blue Area, I.I. Chundrigar"
                      className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                    />
                  </span>
                </label>
              ) : activeServiceIdx === 4 ? (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">Moving to (New Area)</span>
                    <input
                      type="text"
                      value={moverToArea}
                      onChange={(e) => setMoverToArea(e.target.value)}
                      placeholder="e.g. DHA, Bahria Town"
                      className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                    />
                  </span>
                </label>
              ) : (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">Pick-up date</span>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                    />
                  </span>
                </label>
              )}

              {/* Field 3: Return Date (For Car Rental) */}
              {activeServiceIdx === 0 && (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">Return date</span>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                    />
                  </span>
                </label>
              )}
            </div>

            {/* Self-drive vs With Driver Toggle (For Car Rental) */}
            {activeServiceIdx === 0 && (
              <div className="grid grid-cols-2 gap-1.5 bg-[#F2F4F7] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setIsSelfDrive(true)}
                  className={`h-11 rounded-xl text-sm font-bold transition cursor-pointer ${
                    isSelfDrive
                      ? 'bg-white text-[#101828] shadow-xs'
                      : 'text-[#475467] hover:text-[#101828]'
                  }`}
                >
                  Self-drive
                </button>
                <button
                  type="button"
                  onClick={() => setIsSelfDrive(false)}
                  className={`h-11 rounded-xl text-sm font-bold transition cursor-pointer ${
                    !isSelfDrive
                      ? 'bg-white text-[#101828] shadow-xs'
                      : 'text-[#475467] hover:text-[#101828]'
                  }`}
                >
                  With driver
                </button>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="button"
              onClick={() => {
                setSearchSheetOpen(false);
                if (curService.href.startsWith('/#')) {
                  const el = document.getElementById('listings-results');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  router.push(curService.href);
                }
              }}
              className="h-[54px] rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2.5 transition shadow-md cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-[2.4]" />
              <span>{curService.goText}</span>
            </button>

            <span className="text-center text-xs text-[#667085]">
              Pay the owner at pick-up · nothing paid online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

