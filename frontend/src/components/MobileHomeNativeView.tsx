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
  Menu,
  ArrowUpDown,
  Building2,
  Star,
} from 'lucide-react';
import {
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  MAJOR_HUBS,
  INTERCITY_CITIES,
  CITY_COMMUTE_AREAS,
  matchesShuttleRoute,
  VehicleCardItem,
  DriverCardItem,
  CityRideItem,
  ShuttleItem,
  MoverItem,
} from '@/data/marketplaceData';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';
import { formatPKR, maskPhone } from '@/lib/api';
import { getStoreSlugForOwner } from '@/data/storefrontEngine';
import { MobileNavigationDrawer } from '@/components/AppHeader';

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [activeServiceIdx, setActiveServiceIdx] = useState(0); // 0: Rent car, 1: Drivers, 2: City to City, 3: Pick & drop, 4: Movers
  const [selectedCarCategory, setSelectedCarCategory] = useState(0); // 0: All cars, 1: Sedans, 2: SUVs, 3: Luxury, 4: Vans
  const [isSelfDrive, setIsSelfDrive] = useState(true);
  const [savedCarIds, setSavedCarIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search Sheet Specific Inputs
  const [searchWhere, setSearchWhere] = useState('Lahore');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [c2cFromCity, setC2cFromCity] = useState('Lahore');
  const [c2cToCity, setC2cToCity] = useState('Islamabad');
  const [c2cPickerSheetOpen, setC2cPickerSheetOpen] = useState<'from' | 'to' | null>(null);

  // Shuttles corridor inputs
  const [shuttleCity, setShuttleCity] = useState('Karachi');
  const [shuttlePickupArea, setShuttlePickupArea] = useState('');
  const [shuttleDropArea, setShuttleDropArea] = useState('');
  const [shuttleAreaSheetOpen, setShuttleAreaSheetOpen] = useState<'pickup' | 'drop' | null>(null);

  // Movers inputs
  const [moverFromArea, setMoverFromArea] = useState('');
  const [moverToArea, setMoverToArea] = useState('');
  const [moverDate, setMoverDate] = useState('');
  const [moverAreaSheetOpen, setMoverAreaSheetOpen] = useState<'from' | 'to' | null>(null);

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

  // Sync shuttleCity with selected main city if supported
  useEffect(() => {
    if (CITY_COMMUTE_AREAS[city]) {
      setShuttleCity(city);
    }
    setC2cFromCity(city);
  }, [city]);

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

  const handleSwapC2cCities = () => {
    const temp = c2cFromCity;
    setC2cFromCity(c2cToCity);
    setC2cToCity(temp);
    showToast(`Swapped: ${c2cToCity} ⇄ ${temp}`);
  };

  // 5 Services Configuration
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

  // Dynamic Service Datasets Filtered by Location
  const filteredCars = useMemo(() => {
    let list = [...CARS_DATA];
    const cityMatches = list.filter((c) => c.city.toLowerCase() === city.toLowerCase());
    if (cityMatches.length > 0) list = cityMatches;
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
  }, [city, selectedCarCategory]);

  const filteredDrivers = useMemo(() => {
    const list = [...DRIVERS_DATA];
    const cityMatches = list.filter((d) => d.city.toLowerCase() === city.toLowerCase());
    return cityMatches.length > 0 ? cityMatches : list;
  }, [city]);

  const filteredRides = useMemo(() => {
    const list = [...CITY_RIDES_DATA];
    const cityMatches = list.filter(
      (r) =>
        r.fromCity.toLowerCase() === city.toLowerCase() ||
        r.toCity.toLowerCase() === city.toLowerCase()
    );
    return cityMatches.length > 0 ? cityMatches : list;
  }, [city]);

  const filteredShuttles = useMemo(() => {
    let list = [...SHUTTLES_DATA];
    if (shuttlePickupArea || shuttleDropArea) {
      list = list.filter((s) =>
        matchesShuttleRoute(s, shuttlePickupArea, shuttleDropArea, shuttleCity || city)
      );
    } else {
      const cityMatches = list.filter(
        (s) => s.city.toLowerCase() === (shuttleCity || city).toLowerCase()
      );
      if (cityMatches.length > 0) list = cityMatches;
    }
    return list.length > 0 ? list : SHUTTLES_DATA;
  }, [city, shuttleCity, shuttlePickupArea, shuttleDropArea]);

  const filteredMovers = useMemo(() => {
    const list = [...MOVERS_DATA];
    const cityMatches = list.filter((m) => m.city.toLowerCase() === city.toLowerCase());
    return cityMatches.length > 0 ? cityMatches : list;
  }, [city]);

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
      {/* 1. TOP APP BAR (Native Mobile Clean Header matching AppHeader)             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEF0F2] px-3.5 pt-2.5 pb-2.5 flex flex-col gap-2 shadow-2xs">
        {/* Row 1: Hamburger Menu (Left) + SafarPK Logo (Center) + Bell & Avatar (Right) */}
        <div className="flex items-center justify-between gap-2 h-11">
          {/* Hamburger Menu Icon */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100/90 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0 shadow-2xs border border-slate-200/60"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>

          {/* Centered SafarPK Brand Logo */}
          <Link href="/" className="flex items-center justify-center group shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                S
              </span>
              <span className="font-heading font-black text-lg tracking-tight text-[#101828] leading-none whitespace-nowrap">
                SafarPK
              </span>
            </div>
          </Link>

          {/* Right Action Buttons: Notification Bell + User Profile Initials */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/inbox"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-[#F2F4F7] text-[#101828] flex items-center justify-center transition active:scale-95 hover:bg-slate-200"
            >
              <Bell className="w-4.5 h-4.5 stroke-[2] text-slate-700" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D92D20] ring-2 ring-[#F2F4F7]" />
            </Link>

            <Link
              href={activeUser ? '/customer' : '/login'}
              aria-label="My account"
              className="w-9 h-9 rounded-full bg-[#0B6B4F] text-white font-bold text-xs flex items-center justify-center shadow-xs transition active:scale-95 hover:ring-2 hover:ring-emerald-400"
            >
              {userInitials}
            </Link>
          </div>
        </div>

        {/* Row 2: Origin City Selector Pill + Universal Search Bar */}
        <div className="flex items-center gap-2">
          {/* Origin City Click-to-Change Selector (Prevents Soft Keyboard) */}
          <button
            type="button"
            onClick={() => setCitySheetOpen(true)}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100/70 text-[#08513C] font-bold text-xs shrink-0 transition active:scale-95 cursor-pointer border border-[#D0E5DA]"
          >
            <MapPin className="w-3.5 h-3.5 text-[#0B6B4F] stroke-[2.2]" />
            <span className="max-w-[75px] truncate">{city}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Universal Search Bar Opener */}
          <button
            type="button"
            onClick={() => setSearchSheetOpen(true)}
            className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl bg-[#F7F8FA] hover:bg-slate-100 border border-[#E4E7EC] text-left text-xs text-slate-500 truncate transition active:scale-[0.99] shadow-2xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate font-semibold text-slate-800">
              {curService.title} in {city}...
            </span>
          </button>
        </div>
      </header>

      {/* Slide-out Sidebar Drawer with Accordions & Role Badge */}
      <MobileNavigationDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeUser={activeUser}
      />

      {/* ========================================================================= */}
      {/* 2. SCROLLING CONTENT                                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-5 pt-3">
        {/* SERVICES GRID (5 Equal Columns, fitting cleanly on-screen without cutoff) */}
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
                }}
                className="flex flex-col items-center gap-1 py-1 px-0.5 border-0 bg-transparent cursor-pointer transition active:scale-95"
              >
                <span
                  className={`w-full max-w-[52px] aspect-square rounded-[18px] flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#0B6B4F] text-white shadow-[0_6px_14px_rgba(11,107,79,0.28)] scale-105'
                      : 'bg-white text-[#101828] border border-[#E4E7EC]'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.9]" />
                </span>
                <span
                  className={`text-[10px] leading-[1.1] text-center tracking-tight w-full break-words ${
                    isSelected ? 'font-bold text-[#0B6B4F]' : 'font-semibold text-[#344054]'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* TRUST STRIP (Horizontal Scrolling Badges) */}
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

        {/* ======================================================================= */}
        {/* DYNAMIC SERVICE INVENTORY LISTINGS (Switches with Service Tab Selection) */}
        {/* ======================================================================= */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-4">
            <div>
              <h2 className="font-heading font-black text-[19px] text-[#101828]">
                {activeServiceIdx === 0
                  ? `Cars in ${city}`
                  : activeServiceIdx === 1
                  ? `Chauffeurs & Drivers in ${city}`
                  : activeServiceIdx === 2
                  ? `City to City Rides (${city})`
                  : activeServiceIdx === 3
                  ? `Pick & Drop Shuttles (${city})`
                  : `Cargo & Home Movers in ${city}`}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Direct verified fleet with ratings & instant contact
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#E9F3EE] text-[#08513C] text-xs font-bold shrink-0">
              {activeServiceIdx === 0
                ? `${filteredCars.length} available`
                : activeServiceIdx === 1
                ? `${filteredDrivers.length} active`
                : activeServiceIdx === 2
                ? `${filteredRides.length} routes`
                : activeServiceIdx === 3
                ? `${filteredShuttles.length} corridors`
                : `${filteredMovers.length} movers`}
            </span>
          </div>

          {/* Service 0: Car Rental Category Filters */}
          {activeServiceIdx === 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
              {CAR_CATEGORIES.map((catLabel, idx) => {
                const active = selectedCarCategory === idx;
                return (
                  <button
                    key={catLabel}
                    type="button"
                    onClick={() => setSelectedCarCategory(idx)}
                    className={`shrink-0 h-[36px] px-3.5 rounded-full font-semibold text-xs transition cursor-pointer ${
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
          )}

          {/* COMPACT LISTING FEED CARDS */}
          <div className="flex flex-col gap-2.5 px-4">
            {/* 1. CAR RENTAL CARDS */}
            {activeServiceIdx === 0 &&
              filteredCars.slice(0, 8).map((car) => {
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

                        {/* Rating & Verified Owner Row */}
                        <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200/80">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{car.rating ? car.rating.toFixed(1) : '4.9'}</span>
                          </span>
                          <span className="text-[#0B6B4F] truncate text-[11px] font-bold">
                            {car.owner}
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Call/WhatsApp Row */}
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

            {/* 2. DRIVERS CARDS */}
            {activeServiceIdx === 1 &&
              filteredDrivers.map((driver) => {
                const cleanPhone = driver.phone.replace(/[^0-9]/g, '');

                return (
                  <div
                    key={driver.id}
                    className="bg-white rounded-[18px] p-3 flex gap-3 border border-[#EEF0F2] shadow-2xs transition hover:border-slate-300"
                  >
                    {/* Driver Avatar */}
                    <Link
                      href={`/drivers/${driver.id}`}
                      className="w-20 h-20 shrink-0 rounded-2xl flex flex-col items-center justify-center shadow-xs font-black text-xl text-slate-800"
                      style={{ backgroundColor: driver.tint }}
                    >
                      <span>{driver.initials}</span>
                      <span className="text-[9px] font-bold text-slate-600 mt-0.5">{driver.city}</span>
                    </Link>

                    {/* Driver Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <Link href={`/drivers/${driver.id}`} className="min-w-0 flex-1">
                            <h3 className="font-heading font-bold text-[15px] text-[#101828] leading-snug truncate">
                              {driver.name}
                            </h3>
                            <p className="text-xs text-[#667085] truncate mt-0.5">{driver.exp}</p>
                          </Link>

                          {/* Star Rating Badge */}
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200/80 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{driver.rating ? driver.rating.toFixed(1) : '4.9'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[#0B6B4F] mt-1 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 stroke-[2.4]" />
                          <span>Police Verified & NADRA CNIC</span>
                        </div>
                      </div>

                      {/* Pricing & Call/WhatsApp Row */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-50">
                        <div>
                          <span className="font-heading font-extrabold text-[15px] text-[#101828]">
                            {driver.city12}
                          </span>
                          <span className="text-[11px] text-[#667085]"> /12h</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${driver.phone}`}
                            className="w-9 h-9 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                            title="Call Driver"
                          >
                            <Phone className="w-3.5 h-3.5 stroke-[2]" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Assalam o Alaikum, inquiring about driver duty (${driver.city12}/12h) in ${driver.city} on SafarPK.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100 text-[#0B6B4F] flex items-center justify-center transition active:scale-95"
                            title="WhatsApp Driver"
                          >
                            <MessageCircle className="w-4 h-4 stroke-[2]" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* 3. CITY TO CITY RIDES */}
            {activeServiceIdx === 2 &&
              filteredRides.map((ride) => {
                const cleanPhone = ride.phone.replace(/[^0-9]/g, '');

                return (
                  <div
                    key={ride.id}
                    className="bg-white rounded-[18px] p-3 flex flex-col gap-2.5 border border-[#EEF0F2] shadow-2xs transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/city-to-city/${ride.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-heading font-extrabold text-[15px] text-[#101828]">
                          <span>{ride.fromCity}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#0B6B4F]" />
                          <span>{ride.toCity}</span>
                        </div>
                        <p className="text-xs text-[#667085] truncate mt-0.5">{ride.car}</p>
                      </Link>

                      {/* Rating Badge */}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200/80 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{ride.rating ? ride.rating.toFixed(1) : '4.8'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl">
                      <span>{ride.duration}</span>
                      <span>{ride.time}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <div>
                        {ride.pricePerSeat ? (
                          <>
                            <span className="font-heading font-extrabold text-[15px] text-[#0B6B4F]">
                              Rs. {ride.pricePerSeat.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-[#667085]"> /seat</span>
                          </>
                        ) : (
                          <>
                            <span className="font-heading font-extrabold text-[15px] text-[#101828]">
                              Rs. {ride.one.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-[#667085]"> /car</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${ride.phone}`}
                          className="w-9 h-9 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                          title="Call Operator"
                        >
                          <Phone className="w-3.5 h-3.5 stroke-[2]" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Assalam o Alaikum, inquiring about City-to-City ride from ${ride.fromCity} to ${ride.toCity} on SafarPK.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100 text-[#0B6B4F] flex items-center justify-center transition active:scale-95"
                          title="WhatsApp Operator"
                        >
                          <MessageCircle className="w-4 h-4 stroke-[2]" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* 4. PICK & DROP SHUTTLES */}
            {activeServiceIdx === 3 &&
              filteredShuttles.map((shuttle) => {
                const cleanPhone = shuttle.phone.replace(/[^0-9]/g, '');

                return (
                  <div
                    key={shuttle.id}
                    className="bg-white rounded-[18px] p-3 flex flex-col gap-2.5 border border-[#EEF0F2] shadow-2xs transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/shuttles/${shuttle.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-heading font-extrabold text-[14px] text-[#101828]">
                          <span className="truncate">{shuttle.from}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#0B6B4F] shrink-0" />
                          <span className="truncate">{shuttle.to}</span>
                        </div>
                        <p className="text-xs text-[#667085] truncate mt-0.5">{shuttle.op} · {shuttle.van}</p>
                      </Link>

                      {/* Rating Badge */}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200/80 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{shuttle.rating ? shuttle.rating.toFixed(1) : '4.8'}</span>
                      </span>
                    </div>

                    {shuttle.stops && shuttle.stops.length > 0 && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        <span className="font-semibold text-slate-700">Via stops: </span>
                        {shuttle.stops.slice(0, 4).join(', ')}...
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl">
                      <span>Pick: {shuttle.pick} · Return: {shuttle.back}</span>
                      <span className="font-semibold text-emerald-800">{shuttle.seats} seats open</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <div>
                        <span className="font-heading font-extrabold text-[15px] text-[#0B6B4F]">
                          {shuttle.fare}
                        </span>
                        <span className="text-[11px] text-[#667085]"> /month</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${shuttle.phone}`}
                          className="w-9 h-9 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                          title="Call Shuttle Service"
                        >
                          <Phone className="w-3.5 h-3.5 stroke-[2]" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Assalam o Alaikum, inquiring about Shuttle Route (${shuttle.from} to ${shuttle.to}) on SafarPK.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100 text-[#0B6B4F] flex items-center justify-center transition active:scale-95"
                          title="WhatsApp Shuttle Service"
                        >
                          <MessageCircle className="w-4 h-4 stroke-[2]" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* 5. MOVERS */}
            {activeServiceIdx === 4 &&
              filteredMovers.map((mover) => {
                const cleanPhone = mover.phone.replace(/[^0-9]/g, '');

                return (
                  <div
                    key={mover.id}
                    className="bg-white rounded-[18px] p-3 flex flex-col gap-2.5 border border-[#EEF0F2] shadow-2xs transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/movers/${mover.id}`} className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-[15px] text-[#101828] leading-snug truncate">
                          {mover.name}
                        </h3>
                        <p className="text-xs text-[#667085] truncate mt-0.5">{mover.trucks}</p>
                      </Link>

                      {/* Rating Badge */}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200/80 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{mover.rating ? mover.rating.toFixed(1) : '4.9'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl">
                      <span>Rate: {mover.km}</span>
                      <span>Labor: {mover.helper}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <div>
                        <span className="font-heading font-extrabold text-[15px] text-[#101828]">
                          {mover.base}
                        </span>
                        <span className="text-[11px] text-[#667085]"> base fare</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${mover.phone}`}
                          className="w-9 h-9 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                          title="Call Mover"
                        >
                          <Phone className="w-3.5 h-3.5 stroke-[2]" />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Assalam o Alaikum, inquiring about shifting/moving service (${mover.name}) in ${mover.city} on SafarPK.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100 text-[#0B6B4F] flex items-center justify-center transition active:scale-95"
                          title="WhatsApp Mover"
                        >
                          <MessageCircle className="w-4 h-4 stroke-[2]" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* View All Button linking to respective portal */}
          <div className="px-4 pt-1">
            <Link
              href={curService.href}
              className="w-full h-12 rounded-2xl border border-[#D0D5DD] bg-white text-[#101828] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-[0.99] shadow-2xs"
            >
              <span>{curService.goText}</span>
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
                <span className="font-bold text-sm text-[#101828]">Select Service</span>
                <span className="text-xs text-[#667085]">Cars, Chauffeurs, City rides, Shuttles, or Movers</span>
              </div>
            </div>
            <div className="flex gap-3 items-center p-3.5 border-b border-slate-100">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#101828]">Request on WhatsApp</span>
                <span className="text-xs text-[#667085]">Direct communication with verified fleet hosts</span>
              </div>
            </div>
            <div className="flex gap-3 items-center p-3.5">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#101828]">Pay on trip</span>
                <span className="text-xs text-[#667085]">Zero advance deposit, inspect and pay directly</span>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR CITIES (Clean city badges, blank color boxes removed) */}
        <section className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline px-4">
            <h2 className="font-heading font-black text-[19px] text-[#101828]">Popular cities</h2>
            <button
              type="button"
              onClick={() => setCitySheetOpen(true)}
              className="text-sm font-bold text-[#0B6B4F] hover:underline cursor-pointer"
            >
              Explore all hubs
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto px-4 no-scrollbar">
            {PAKISTAN_CITIES.map((c) => {
              const active = c.name === city;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCity(c.name);
                    setSearchWhere(c.name);
                    showToast(`Switched city to ${c.name}`);
                  }}
                  className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white text-left cursor-pointer transition shadow-2xs ${
                    active
                      ? 'border-2 border-[#0B6B4F] bg-emerald-50/40'
                      : 'border border-[#EEF0F2] hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0 font-bold text-xs">
                    <Building2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#101828] truncate">{c.name}</span>
                    <span className="text-[10px] text-[#667085]">Hub · Active Fleet</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 3. CITY PICKER BOTTOM SHEET (Native Modal, No Soft Keyboard)               */}
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
                      showToast(`City set to ${c.name}`);
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
      {/* 4. CITY TO CITY MAJOR HUBS PICKER SHEET                                   */}
      {/* ========================================================================= */}
      {c2cPickerSheetOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setC2cPickerSheetOpen(null)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[82vh] overflow-y-auto flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-[18px] text-[#101828]">
                {c2cPickerSheetOpen === 'from' ? 'Select Departure City' : 'Select Destination City'}
              </h3>
              <button
                type="button"
                onClick={() => setC2cPickerSheetOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Major Hubs
              </span>
              <div className="grid grid-cols-2 gap-2">
                {MAJOR_HUBS.map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => {
                      if (c2cPickerSheetOpen === 'from') setC2cFromCity(hub);
                      else setC2cToCity(hub);
                      setC2cPickerSheetOpen(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                      (c2cPickerSheetOpen === 'from' ? c2cFromCity : c2cToCity) === hub
                        ? 'border-[#0B6B4F] bg-[#E9F3EE] text-[#08513C]'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {hub}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Other Connected Cities
              </span>
              {INTERCITY_CITIES.filter((c) => !MAJOR_HUBS.includes(c as any)).map((hub) => (
                <button
                  key={hub}
                  type="button"
                  onClick={() => {
                    if (c2cPickerSheetOpen === 'from') setC2cFromCity(hub);
                    else setC2cToCity(hub);
                    setC2cPickerSheetOpen(null);
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-2 text-left font-semibold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{hub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SHUTTLES CORRIDOR AREA PICKER SHEET                                     */}
      {/* ========================================================================= */}
      {shuttleAreaSheetOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setShuttleAreaSheetOpen(null)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[82vh] overflow-y-auto flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-extrabold text-[18px] text-[#101828]">
                  {shuttleAreaSheetOpen === 'pickup' ? 'Select Pick-up Stop' : 'Select Drop-off Stop'}
                </h3>
                <span className="text-xs text-slate-500">Corridor stops in {shuttleCity}</span>
              </div>
              <button
                type="button"
                onClick={() => setShuttleAreaSheetOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {(CITY_COMMUTE_AREAS[shuttleCity] || CITY_COMMUTE_AREAS['Karachi']).map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => {
                    if (shuttleAreaSheetOpen === 'pickup') setShuttlePickupArea(area);
                    else setShuttleDropArea(area);
                    setShuttleAreaSheetOpen(null);
                  }}
                  className="w-full flex items-center justify-between py-3 px-2 text-left font-semibold text-xs text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{area}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SEARCH BOTTOM SHEET (Segmented 5-Col Grid & Non-Keyboard Pickers)      */}
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
              <h3 className="font-heading font-extrabold text-[20px] text-[#101828]">
                {curService.title}
              </h3>
              <button
                type="button"
                onClick={() => setSearchSheetOpen(false)}
                className="h-8 px-3 rounded-full bg-[#F2F4F7] font-semibold text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* 5-Column Segmented Grid Switcher (100% visible, no horizontal scroll, Movers never cut off) */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-[#F4F6F8] rounded-2xl border border-[#EEF0F2]">
              {services.map((s, idx) => {
                const Icon = s.icon;
                const isSelected = activeServiceIdx === idx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveServiceIdx(idx)}
                    className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-white text-[#0B6B4F] shadow-2xs font-extrabold border border-[#DCE7E1]'
                        : 'text-[#667085] hover:text-[#101828] font-semibold'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 shrink-0 ${isSelected ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                    <span className="text-[10px] leading-[1.15] text-center tracking-tight">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Form Fields Card */}
            <div className="border border-[#E4E7EC] rounded-2xl overflow-hidden bg-white divide-y divide-[#EEF0F2]">
              {/* SERVICE 0: CAR RENTAL & SERVICE 1: DRIVERS (City Selector without soft keyboard) */}
              {(activeServiceIdx === 0 || activeServiceIdx === 1) && (
                <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setCitySheetOpen(true)}
                    className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                  >
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                      {activeServiceIdx === 1 ? 'Duty City' : 'Where / Pick-up City'}
                    </span>
                    <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                      <span>{searchWhere || city || 'Select City'}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </span>
                  </button>
                </div>
              )}

              {/* SERVICE 2: CITY TO CITY (Leaving from & Going to major hubs + swap button) */}
              {activeServiceIdx === 2 && (
                <>
                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setC2cPickerSheetOpen('from')}
                      className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Leaving from
                      </span>
                      <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                        <span>{c2cFromCity || city}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSwapC2cCities}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Swap routes"
                      aria-label="Swap cities"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Flag className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setC2cPickerSheetOpen('to')}
                      className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Going to (Destination City)
                      </span>
                      <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                        <span>{c2cToCity}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* SERVICE 3: PICK & DROP SHUTTLES (Corridor pickup & drop stops, no single date picker) */}
              {activeServiceIdx === 3 && (
                <>
                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setCitySheetOpen(true)}
                      className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Commute City
                      </span>
                      <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                        <span>{shuttleCity || city}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setShuttleAreaSheetOpen('pickup')}
                      className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Pick-up area (Home Stop)
                      </span>
                      <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                        <span>{shuttlePickupArea || 'Select pickup corridor stop'}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Flag className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setShuttleAreaSheetOpen('drop')}
                      className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Drop-off (Office or School Stop)
                      </span>
                      <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                        <span>{shuttleDropArea || 'Select drop-off corridor stop'}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* SERVICE 4: MOVERS (Current area, destination area, and shifting date picker) */}
              {activeServiceIdx === 4 && (
                <>
                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setCitySheetOpen(true)}
                      className="flex-1 flex flex-col justify-center text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Moving City
                      </span>
                      <span className="flex items-center justify-between text-sm font-bold text-[#101828]">
                        <span>{searchWhere || city}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <span className="flex-1 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Moving from (Current Area)
                      </span>
                      <input
                        type="text"
                        value={moverFromArea}
                        onChange={(e) => setMoverFromArea(e.target.value)}
                        placeholder="e.g. Gulberg, Johar Town"
                        className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                      />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Flag className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <span className="flex-1 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Moving to (Destination Area)
                      </span>
                      <input
                        type="text"
                        value={moverToArea}
                        onChange={(e) => setMoverToArea(e.target.value)}
                        placeholder="e.g. DHA Phase 6, Bahria Town"
                        className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                      />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-h-[58px] px-3.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <span className="flex-1 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                        Shifting Date
                      </span>
                      <input
                        type="date"
                        value={moverDate}
                        onChange={(e) => setMoverDate(e.target.value)}
                        className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                      />
                    </span>
                  </div>
                </>
              )}

              {/* DATE PICKERS: Cars (Pick-up & Return), Drivers (Duty Date Only) */}
              {(activeServiceIdx === 0 || activeServiceIdx === 1) && (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                      {activeServiceIdx === 1 ? 'Duty Date' : 'Pick-up date'}
                    </span>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="border-0 outline-none p-0 text-sm font-semibold text-[#101828] bg-transparent"
                    />
                  </span>
                </label>
              )}

              {/* Return Date for Cars Only */}
              {activeServiceIdx === 0 && (
                <label className="flex items-center gap-3 min-h-[58px] px-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <span className="flex-1 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#667085] leading-none mb-1">
                      Return date
                    </span>
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

            {/* Self-drive vs With Driver Toggle (Car Rental Only) */}
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
                showToast(`Filtered listings for ${curService.label}`);
              }}
              className="h-[54px] rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2.5 transition shadow-md cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-[2.4]" />
              <span>{curService.goText}</span>
            </button>

            <span className="text-center text-xs text-[#667085]">
              Pay the owner at pick-up · zero advance deposit
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
