'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  UserCheck,
  Navigation,
  Bus,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Flag,
  Search,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  Heart,
  ArrowRight,
  Sparkles,
  Download,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  X,
  Check,
  RotateCcw,
  Phone,
  Briefcase,
  Users,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MobilePWAExperience } from '@/components/MobilePWAExperience';
import { recordClickEvent, recordLead } from '@/data/activityTracker';
import { useCountry } from '@/app/context/CountryContext';
import { InternationalComingSoon } from '@/components/InternationalComingSoon';
import {
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  SERVICE_CATEGORIES,
  VehicleCardItem,
  DriverCardItem,
  CityRideItem,
  ShuttleItem,
  MoverItem,
} from '@/data/marketplaceData';
import { getFeaturedAdIds, MAX_FEATURED_ADS } from '@/data/featuredAds';
import { maskPakistaniCnic, maskPakistaniLicense } from '@/data/driverBookings';
import { getWhatsAppTargetUrl } from '@/data/chatEngine';
import { slugify, getStoreSlugForOwner } from '@/data/storefrontEngine';

export default function HomePage() {
  const router = useRouter();
  const { country, setCountry, currency, setCurrency, formatPrice } = useCountry();
  const [browseInboundPakistan, setBrowseInboundPakistan] = useState(false);

  useEffect(() => {
    if (country?.code === 'PK') {
      setBrowseInboundPakistan(false);
    }
  }, [country?.code]);

  // Active Service Tab (0: Rent a Car, 1: Hire Driver, 2: City to City, 3: Pick & Drop, 4: Movers)
  const [activeService, setActiveService] = useState<number>(0);

  // Search Fields
  const [searchWhere, setSearchWhere] = useState('');
  const [searchPickup, setSearchPickup] = useState('');
  const [searchReturn, setSearchReturn] = useState('');

  // Dropdown & Input state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const pickupDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  // Computed today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Close city dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Country-specific available cities
  const availableCities = useMemo(() => {
    if (!country?.cities || country.cities.length === 0) {
      return ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad'];
    }
    return country.cities.filter((c) => !c.toLowerCase().startsWith('all '));
  }, [country]);

  // Real-time city search filter
  const filteredCities = useMemo(() => {
    if (!searchWhere.trim()) return availableCities;
    const q = searchWhere.toLowerCase().trim();
    return availableCities.filter((city) => city.toLowerCase().includes(q));
  }, [availableCities, searchWhere]);

  // Selected Category Filter & Pagination State
  const [selectedCategory, setSelectedCategory] = useState<string>(SERVICE_CATEGORIES[0][0]);
  const [visibleCount, setVisibleCount] = useState<number>(60);

  const handleServiceChange = (idx: number) => {
    setActiveService(idx);
    const firstCat = SERVICE_CATEGORIES[idx]?.[0] || 'All';
    setSelectedCategory(firstCat);
    setVisibleCount(60);
  };

  // Featured Ads State & Priority Listener
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  useEffect(() => {
    setFeaturedIds(getFeaturedAdIds());
    const handleFeaturedUpdate = () => {
      setFeaturedIds(getFeaturedAdIds());
    };
    window.addEventListener('safarpk_featured_updated', handleFeaturedUpdate);
    return () => window.removeEventListener('safarpk_featured_updated', handleFeaturedUpdate);
  }, []);

  const handleDirectWhatsApp = (title: string, phone: string, whatsapp: string, type: string, ownerName?: string) => {
    recordClickEvent({
      clickType: 'WHATSAPP_CLICK',
      targetId: title,
      targetTitle: title,
      targetCategory: type,
      targetOwnerName: ownerName,
      city: searchWhere || 'All Cities',
    });
    recordLead({
      userId: title,
      customerName: 'Direct Marketplace Visitor',
      customerPhone: 'WhatsApp Inquiry',
      customerCity: searchWhere || 'All Cities',
      serviceType: type,
      notes: `Direct inquiry from Homepage for ${title} (${ownerName || 'Host'})`,
    });
    const cleanNum = whatsapp.replace(/\D/g, '');
    const msg = `Assalam-o-Alaikum! I saw your listing "${title}" on SafarPK. I want to inquire about availability and rates.`;
    const targetUrl = getWhatsAppTargetUrl(cleanNum, msg);
    window.open(targetUrl, '_blank');
  };

  const handleDirectCall = (title: string, phone: string, type: string = 'Car Rental', ownerName?: string) => {
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: title,
      targetTitle: title,
      targetCategory: type,
      targetOwnerName: ownerName,
      city: searchWhere || 'All Cities',
    });
    recordLead({
      userId: title,
      customerName: 'Direct Call Visitor',
      customerPhone: 'Direct Phone Dial',
      customerCity: searchWhere || 'All Cities',
      serviceType: type,
      notes: `Direct phone call initiated from marketplace for ${title} (${ownerName || 'Host'})`,
    });
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  // Revealed phone numbers state for lead-generation click-to-reveal tracking
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  const handleRevealPhone = (
    e: React.MouseEvent,
    id: string,
    name: string,
    phone: string,
    category: string,
    owner?: string
  ) => {
    e.stopPropagation();
    recordClickEvent({
      clickType: 'CALL_CLICK',
      targetId: id,
      targetTitle: name,
      targetCategory: category,
      targetOwnerName: owner,
      city: searchWhere || 'All Cities',
    });
    recordLead({
      userId: id,
      customerName: 'Direct Call Visitor',
      customerPhone: 'Direct Phone Dial',
      customerCity: searchWhere || 'All Cities',
      serviceType: category,
      notes: `Direct phone call initiated from marketplace for ${name} (${owner || 'Host'})`,
    });

    const isAlreadyRevealed = !!revealedPhones[id];
    setRevealedPhones((prev) => ({ ...prev, [id]: true }));

    if (isAlreadyRevealed || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  // Saved Wishlist Items
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Animated Rotating Hero Highlight
  const HERO_ROTATING_SERVICES = [
    { text: 'Rent a Car without Hidden Fees', icon: '🚗', badge: 'Self-Drive & Chauffeur' },
    { text: 'Hire Vetted Chauffeurs by the Day', icon: '👨‍✈️', badge: 'Verified Licences & CNIC' },
    { text: 'Book Private City-to-City Rides', icon: '🛣️', badge: 'Motorway M-2 · Fixed Fares' },
    { text: 'Safe Daily Commuter Shuttles', icon: '🚌', badge: 'School & Office Vanpools' },
    { text: 'Home & Office Cargo Shifting', icon: '📦', badge: 'Trucks with Mazdoors' },
  ];
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_ROTATING_SERVICES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('safarpk_saved_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed.map((item: any) => item.id || item));
        }
      }
    } catch (e) {}
  }, []);

  const toggleSave = (car: VehicleCardItem) => {
    try {
      let updated: string[];
      let storedList: any[] = [];
      const raw = localStorage.getItem('safarpk_saved_items');
      if (raw) {
        try {
          storedList = JSON.parse(raw);
        } catch (e) {}
      }

      if (savedIds.includes(car.id)) {
        updated = savedIds.filter((id) => id !== car.id);
        storedList = storedList.filter((item) => (item.id || item) !== car.id);
      } else {
        updated = [...savedIds, car.id];
        storedList.unshift({
          id: car.id,
          title: car.name,
          category: 'Cars',
          specs: car.specs,
          city: car.city,
          rate: car.price,
          savedAt: new Date().toISOString(),
        });
      }
      setSavedIds(updated);
      localStorage.setItem('safarpk_saved_items', JSON.stringify(storedList));
      window.dispatchEvent(new Event('safarpk_saved_updated'));
    } catch (e) {}
  };

  const serviceDefs = [
    {
      label: 'Rent a car',
      shortLabel: 'Rent Car',
      icon: Car,
      href: '/listing/l-1',
      go: 'Search cars',
      hint: 'Self-drive or with driver · pay the owner at pick-up, nothing online',
    },
    {
      label: 'Hire a driver',
      shortLabel: 'Drivers',
      icon: UserCheck,
      href: '/drivers',
      go: 'Find drivers',
      hint: 'Experienced private & commercial chauffeurs for city or outstation',
    },
    {
      label: 'City to city',
      shortLabel: 'Intercity',
      icon: Navigation,
      href: '/city-to-city',
      go: 'Find rides',
      hint: 'Car with driver between cities · one way or return',
    },
    {
      label: 'Pick & drop',
      shortLabel: 'Pick & Drop',
      icon: Bus,
      href: '/shuttles',
      go: 'Find routes',
      hint: 'Monthly seats for school, college and corporate office routes',
    },
    {
      label: 'Home shifting',
      shortLabel: 'Movers',
      icon: Truck,
      href: '/movers',
      go: 'Find movers',
      hint: 'Trucks with helpers · compare and send your move quote to 3 movers',
    },
  ];

  const currentService = serviceDefs[activeService];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resultsEl = document.getElementById('listings-results') || document.getElementById('cars-results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to prioritize featured ads at the top, ordered strictly by featuredIds priority
  const sortByFeatured = (aId: string, bId: string) => {
    const idxA = featuredIds.indexOf(aId);
    const idxB = featuredIds.indexOf(bId);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  };

  // 1. Real-time cars filter
  const filteredCars = useMemo(() => {
    return CARS_DATA.filter((car) => {
      if (selectedCategory !== 'All cars') {
        if (selectedCategory === 'Economy') {
          if (car.category !== 'Economy' && car.priceNum > 5000) return false;
        } else if (car.category !== selectedCategory) {
          return false;
        }
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = car.city.toLowerCase().includes(q);
        const matchName = car.name.toLowerCase().includes(q);
        const matchOwner = car.owner.toLowerCase().includes(q);
        if (!matchCity && !matchName && !matchOwner) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  // 2. Real-time drivers filter
  const filteredDrivers = useMemo(() => {
    return DRIVERS_DATA.filter((driver) => {
      if (selectedCategory !== 'All drivers') {
        if (driver.category !== selectedCategory) return false;
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = driver.city.toLowerCase().includes(q);
        const matchName = driver.name.toLowerCase().includes(q);
        const matchTags = driver.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCity && !matchName && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  // 3. Real-time city rides filter
  const filteredRides = useMemo(() => {
    return CITY_RIDES_DATA.filter((ride) => {
      if (selectedCategory !== 'All routes') {
        if (ride.category !== selectedCategory) return false;
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchFrom = ride.fromCity.toLowerCase().includes(q);
        const matchTo = ride.toCity.toLowerCase().includes(q);
        const matchOp = ride.op.toLowerCase().includes(q);
        const matchTags = ride.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchFrom && !matchTo && !matchOp && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  // 4. Real-time shuttles filter
  const filteredShuttles = useMemo(() => {
    return SHUTTLES_DATA.filter((shuttle) => {
      if (selectedCategory !== 'All shuttles') {
        if (shuttle.category !== selectedCategory) return false;
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = shuttle.city.toLowerCase().includes(q);
        const matchFrom = shuttle.from.toLowerCase().includes(q);
        const matchTo = shuttle.to.toLowerCase().includes(q);
        const matchOp = shuttle.op.toLowerCase().includes(q);
        const matchTags = shuttle.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCity && !matchFrom && !matchTo && !matchOp && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  // 5. Real-time movers filter
  const filteredMovers = useMemo(() => {
    return MOVERS_DATA.filter((mover) => {
      if (selectedCategory !== 'All movers') {
        if (mover.category !== selectedCategory) return false;
      }
      if (searchWhere.trim()) {
        const q = searchWhere.toLowerCase().trim();
        const matchCity = mover.city.toLowerCase().includes(q);
        const matchName = mover.name.toLowerCase().includes(q);
        const matchTrucks = mover.trucks.toLowerCase().includes(q);
        const matchTags = mover.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCity && !matchName && !matchTrucks && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => sortByFeatured(a.id, b.id));
  }, [selectedCategory, searchWhere, featuredIds]);

  const currentTotal = useMemo(() => {
    switch (activeService) {
      case 1:
        return filteredDrivers.length;
      case 2:
        return filteredRides.length;
      case 3:
        return filteredShuttles.length;
      case 4:
        return filteredMovers.length;
      case 0:
      default:
        return filteredCars.length;
    }
  }, [activeService, filteredCars.length, filteredDrivers.length, filteredRides.length, filteredShuttles.length, filteredMovers.length]);

  const serviceMeta = [
    {
      title: 'Cars available this weekend',
      sub: searchWhere
        ? `Showing vehicles available in "${searchWhere}" (${selectedCategory})`
        : `From local fleet partners and private vehicle owners in ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all cars',
      viewAllHref: '/listing/l-1',
      emptyIcon: Car,
      emptyLabel: 'vehicles',
      resetLabel: 'Show All Available Cars',
    },
    {
      title: 'Professional chauffeurs & drivers',
      sub: searchWhere
        ? `Showing professional chauffeurs in "${searchWhere}" (${selectedCategory})`
        : `CNIC and driving licence on file across ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all drivers',
      viewAllHref: '/drivers',
      emptyIcon: UserCheck,
      emptyLabel: 'drivers',
      resetLabel: 'Show All Available Drivers',
    },
    {
      title: 'City to city intercity rides',
      sub: searchWhere
        ? `Showing intercity rides connected with "${searchWhere}" (${selectedCategory})`
        : `Fixed-rate private cars, cabins and vans across ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all rides',
      viewAllHref: '/city-to-city',
      emptyIcon: Navigation,
      emptyLabel: 'intercity rides',
      resetLabel: 'Show All Available Rides',
    },
    {
      title: 'Pick & drop commuter shuttles',
      sub: searchWhere
        ? `Showing monthly routes in "${searchWhere}" (${selectedCategory})`
        : `School, college and corporate office vanpools in ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all shuttles',
      viewAllHref: '/shuttles',
      emptyIcon: Bus,
      emptyLabel: 'shuttles',
      resetLabel: 'Show All Available Shuttles',
    },
    {
      title: 'Home & office cargo movers',
      sub: searchWhere
        ? `Showing movers and trucks in "${searchWhere}" (${selectedCategory})`
        : `Covered containers, Shehzore & Mazda trucks with helpers across ${country?.name || 'Pakistan'}`,
      viewAllText: 'View all movers',
      viewAllHref: '/movers',
      emptyIcon: Truck,
      emptyLabel: 'movers',
      resetLabel: 'Show All Available Movers',
    },
  ];

  const currentMeta = serviceMeta[activeService] || serviceMeta[0];
  const currentCategories = SERVICE_CATEGORIES[activeService] || SERVICE_CATEGORIES[0];

  return (
    <div className="min-h-screen bg-white font-sans text-[#101828] flex flex-col antialiased">
      {/* 1. Global Navigation Header */}
      <AppHeader currentCountry={country} onCountryChange={setCountry} />

      {/* 2. Hero Section - Sleek Minimal, Animated & Mobile App-Like */}
      <section className="bg-gradient-to-b from-[#F9FBFA] via-[#F4F7F5] to-white border-b border-[#EEF0F2]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-3 sm:pt-5 md:pt-6 pb-6 sm:pb-8 flex flex-col gap-3.5 sm:gap-4">
          {/* Minimal Animated Header Copy */}
          <div className="flex flex-col gap-1.5 sm:gap-2 max-w-[820px]">
            {/* Animated Pill Badge */}
            <div className="self-start inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] sm:text-xs font-bold text-slate-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#0B6B4F] animate-pulse shrink-0" />
              <span className="text-[#0B6B4F] font-extrabold uppercase tracking-wider text-[10px]">Direct Mobility</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-semibold truncate">{HERO_ROTATING_SERVICES[heroIdx].badge}</span>
            </div>

            {/* Punchy, Minimal Headline with Animated Rotating Tag */}
            <div className="space-y-0.5">
              <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl tracking-tight text-[#101828] leading-tight">
                Move freely across Pakistan —{' '}
                <span className="text-[#0B6B4F] inline-block transition-all duration-300 ease-in-out">
                  {HERO_ROTATING_SERVICES[heroIdx].text}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed max-w-[620px] font-medium hidden sm:block">
                Direct connections with verified vehicle owners, private chauffeurs, daily shuttles, and cargo movers. Zero middleman fees.
              </p>
            </div>
          </div>

          {/* Search Card Container */}
          <div className="relative bg-white border border-[#E4E7EC] rounded-2xl sm:rounded-3xl shadow-[0_2px_4px_rgba(16,24,40,0.04),0_20px_48px_rgba(16,24,40,0.10)] overflow-visible z-30">
            {/* Mobile 5-Service Compact Segmented Selector (All 5 options visible at a glance without cutoff) */}
            <div className="md:hidden p-1 sm:p-1.5 bg-[#F4F6F8] rounded-2xl m-2 border border-[#EEF0F2]">
              <div
                role="tablist"
                aria-label="What do you need?"
                className="grid grid-cols-5 gap-1"
              >
                {serviceDefs.map((srv, idx) => {
                  const Icon = srv.icon;
                  const active = activeService === idx;
                  return (
                    <button
                      key={srv.label}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleServiceChange(idx)}
                      className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer select-none ${
                        active
                          ? 'bg-white text-[#0B6B4F] shadow-2xs font-extrabold border border-[#DCE7E1]'
                          : 'text-[#667085] hover:text-[#101828] font-bold'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 shrink-0 ${active ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                      <span className="text-[10px] leading-[1.15] text-center tracking-tight">
                        {srv.shortLabel || srv.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Tabs (Clean horizontal tab bar on md+) */}
            <div
              role="tablist"
              aria-label="What do you need?"
              className="hidden md:flex gap-1 px-4 pt-2 border-b border-[#EEF0F2] overflow-x-auto overflow-y-hidden no-scrollbar"
            >
              {serviceDefs.map((srv, idx) => {
                const Icon = srv.icon;
                const active = activeService === idx;
                return (
                  <button
                    key={srv.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleServiceChange(idx)}
                    className={`flex items-center gap-2 h-12 px-4 border-b-[3px] -mb-px text-sm whitespace-nowrap transition cursor-pointer font-bold ${
                      active
                        ? 'border-[#0B6B4F] text-[#101828]'
                        : 'border-transparent text-[#667085] hover:text-[#101828]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                    <span>{srv.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="p-2 sm:p-3 md:p-4 grid grid-cols-12 gap-2 sm:gap-2.5 items-stretch"
            >
              {/* Field 1: Where / City Combobox with Country-Specific Dropdown & Write/Search Option */}
              <div
                ref={cityDropdownRef}
                className="col-span-12 md:col-span-4 flex items-center gap-2.5 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-3 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative cursor-text"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1">
                    Where
                  </span>
                  <input
                    type="text"
                    placeholder={`City or area, e.g. ${availableCities[0] || 'Karachi'}`}
                    value={searchWhere}
                    onFocus={() => setShowCityDropdown(true)}
                    onChange={(e) => {
                      setSearchWhere(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent placeholder:text-slate-400"
                  />
                </div>

                {searchWhere ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchWhere('');
                      setShowCityDropdown(true);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCityDropdown(!showCityDropdown);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}

                {/* Country-Specific City Dropdown Menu */}
                {showCityDropdown && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Cities in {country?.name || 'Pakistan'} {country?.flag}</span>
                      <span className="text-emerald-700 font-mono font-semibold">
                        {filteredCities.length} found
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((cityName) => {
                          const isSelected =
                            searchWhere.toLowerCase() === cityName.toLowerCase();
                          return (
                            <button
                              key={cityName}
                              type="button"
                              onClick={() => {
                                setSearchWhere(cityName);
                                setShowCityDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-between hover:bg-[#F4F7F5] transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E9F3EE] text-[#0B6B4F] font-bold'
                                  : 'text-[#344054]'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                                <span>{cityName}</span>
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#0B6B4F]" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3.5 py-3 text-center text-xs text-slate-500">
                          <p>No preset city named &ldquo;{searchWhere}&rdquo;</p>
                          <button
                            type="button"
                            onClick={() => setShowCityDropdown(false)}
                            className="mt-1.5 text-xs font-bold text-[#0B6B4F] hover:underline"
                          >
                            Use &ldquo;{searchWhere}&rdquo; as custom location
                          </button>
                        </div>
                      )}
                    </div>

                    {searchWhere &&
                      filteredCities.length > 0 &&
                      !filteredCities.some((c) => c.toLowerCase() === searchWhere.toLowerCase()) && (
                        <div className="border-t border-slate-100 px-3.5 py-2 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => setShowCityDropdown(false)}
                            className="w-full text-left text-xs font-bold text-[#0B6B4F] hover:underline flex items-center gap-1.5"
                          >
                            <span>Search in:</span>
                            <span className="truncate text-slate-900">&ldquo;{searchWhere}&rdquo;</span>
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Fields 2 & 3: Compact Side-by-Side Dates on Mobile, Balanced Columns on Desktop */}
              <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-2 md:gap-2.5">
                {/* Pick-up Date (Calendar popup, past dates disabled) */}
                <div
                  onClick={() => pickupDateRef.current?.showPicker?.() || pickupDateRef.current?.focus()}
                  className="flex items-center gap-2 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                      Pick-up Date
                    </span>
                    <input
                      ref={pickupDateRef}
                      type="date"
                      min={todayStr}
                      value={searchPickup}
                      onChange={(e) => {
                        setSearchPickup(e.target.value);
                        if (searchReturn && e.target.value > searchReturn) {
                          setSearchReturn(e.target.value);
                        }
                      }}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent cursor-pointer"
                    />
                  </div>
                  {searchPickup && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchPickup('');
                      }}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs shrink-0"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>

                {/* Return Date (Calendar popup, past dates disabled) */}
                <div
                  onClick={() => returnDateRef.current?.showPicker?.() || returnDateRef.current?.focus()}
                  className="flex items-center gap-2 sm:gap-3 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] cursor-pointer hover:bg-white hover:border-[#0B6B4F] focus-within:bg-white focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/10 transition relative group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white border border-[#EAECF0] text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#475467] leading-none mb-0.5 sm:mb-1 truncate">
                      Return Date
                    </span>
                    <input
                      ref={returnDateRef}
                      type="date"
                      min={searchPickup || todayStr}
                      value={searchReturn}
                      onChange={(e) => setSearchReturn(e.target.value)}
                      className="w-full border-0 outline-none p-0 text-xs sm:text-sm font-semibold text-[#101828] bg-transparent cursor-pointer"
                    />
                  </div>
                  {searchReturn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchReturn('');
                      }}
                      className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs shrink-0"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="col-span-12 md:col-span-2 min-h-[46px] sm:min-h-[52px] md:min-h-[60px] px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>{currentService.go}</span>
              </button>
            </form>

            {/* Hint bar */}
            <div className="flex items-center gap-2 px-3.5 sm:px-5 pb-3 sm:pb-3.5 text-[11px] sm:text-xs text-[#475467]">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B6B4F] shrink-0" />
              <span className="truncate">{currentService.hint}</span>
            </div>
          </div>

          {/* Popular Cities in Active Country */}
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
            <span className="text-[#475467] font-semibold mr-1">Popular in {country?.name || 'Pakistan'}:</span>
            {availableCities.slice(0, 5).map((cityName) => (
              <button
                key={cityName}
                type="button"
                onClick={() => {
                  setSearchWhere(cityName);
                  setVisibleCount(60);
                }}
                className={`px-3.5 py-1.5 rounded-full border transition cursor-pointer font-semibold ${
                  searchWhere.toLowerCase() === cityName.toLowerCase()
                    ? 'bg-[#0B6B4F] text-white border-[#0B6B4F] shadow-xs'
                    : 'bg-white border-[#E4E7EC] text-[#344054] hover:border-slate-400'
                }`}
              >
                {cityName}
              </button>
            ))}
            {searchWhere && (
              <button
                type="button"
                onClick={() => {
                  setSearchWhere('');
                  setVisibleCount(60);
                }}
                className="px-2.5 py-1 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset city</span>
              </button>
            )}
          </div>

          {/* Simple, Transparent 3-Step Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B6B4F] font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                1
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs text-slate-900">Find What You Need</h4>
                <p className="text-[11px] text-slate-500 truncate">Cars, private drivers, shuttles, or home movers.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B6B4F] font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                2
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs text-slate-900">Connect with Host</h4>
                <p className="text-[11px] text-slate-500 truncate">Chat on WhatsApp or in-app to confirm trip details.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B6B4F] font-heading font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                3
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs text-slate-900">Inspect & Settle Directly</h4>
                <p className="text-[11px] text-slate-500 truncate">Review vehicle in person and pay host at handover.</p>
              </div>
            </div>
          </div>

          {/* Trust Value Pillars */}
          <div className="flex gap-6 sm:gap-8 flex-wrap text-xs sm:text-sm text-[#344054] font-semibold pt-1">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0B6B4F]" />
              Independent local hosts & fleet partners
            </span>
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#0B6B4F]" />
              Direct WhatsApp & In-App messaging
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0B6B4F]" />
              Direct handover — inspect vehicle and settle with host
            </span>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Service Listings OR International Coming Soon & Pre-Registration */}
      <section id="listings-results" className="py-12 md:py-16">
        <div id="cars-results" className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-7">
          {country && country.code !== 'PK' && !browseInboundPakistan ? (
            <InternationalComingSoon
              country={country}
              currency={currency}
              onBrowsePakistanInbound={() => setBrowseInboundPakistan(true)}
            />
          ) : (
            <>
              {/* If viewing Pakistan from an international country */}
              {country && country.code !== 'PK' && browseInboundPakistan && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇵🇰</span>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <span>Viewing Pakistan Fleet from {country.name} {country.flag}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                          Converted to {currency.code} ({currency.symbol})
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-700">
                        All vehicle rental rates and fuel calculations are live-converted from PKR to your local {currency.name}.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrowseInboundPakistan(false)}
                    className="px-4 py-2 text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-100 transition shadow-2xs shrink-0 cursor-pointer"
                  >
                    ← Back to {country.name} Launch Hub
                  </button>
                </div>
              )}

              <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
                  {currentMeta.title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E9F3EE] text-[#0B6B4F] text-xs font-bold">
                  {currentTotal} available
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#475467]">
                {currentMeta.sub}
              </p>
            </div>
            <Link
              href={currentMeta.viewAllHref}
              className="text-xs sm:text-sm font-bold text-[#0B6B4F] hover:underline flex items-center gap-1"
            >
              <span>{currentMeta.viewAllText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category Chips (Real-Time Filter) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {currentCategories.map((c) => {
              const active = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c);
                    setVisibleCount(60);
                  }}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#101828] text-white shadow-xs'
                      : 'bg-white border border-[#E4E7EC] text-[#344054] hover:bg-slate-50'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* SERVICE 0: CAR RENTALS */}
          {activeService === 0 && (
            filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.slice(0, visibleCount).map((car) => {
                  const isSaved = savedIds.includes(car.id);
                  const isFeatured = featuredIds.includes(car.id);
                  const slotIdx = featuredIds.indexOf(car.id);
                  return (
                    <div
                      key={car.id}
                      onClick={() => router.push(`/listing/${car.id}`)}
                      className={`flex flex-col gap-3 group bg-white rounded-3xl p-2.5 transition-all duration-200 relative cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-slate-300'
                      }`}
                    >
                      {/* Photo with Overlay Pills */}
                      <Link
                        href={`/listing/${car.id}`}
                        className="relative block aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100"
                      >
                        <img
                          src={car.image}
                          alt={car.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Prominent Featured Top Ad Badge */}
                        {isFeatured && (
                          <span className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md">
                            <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Top Ad</span>
                            <span className="text-[10px] opacity-90 font-bold bg-black/20 px-1.5 py-0.2 rounded-full">#{slotIdx + 1}</span>
                          </span>
                        )}

                        {/* City Badge */}
                        <span className={`absolute ${isFeatured ? 'bottom-3 left-3' : 'top-3 left-3'} flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-[#101828] shadow-xs`}>
                          <MapPin className="w-3 h-3 text-[#0B6B4F]" />
                          <span>{car.city}</span>
                        </span>

                        {/* Wishlist Heart */}
                        <button
                          type="button"
                          aria-label="Save vehicle"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSave(car);
                          }}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xs transition hover:scale-110 cursor-pointer ${
                            isSaved ? 'text-rose-500 fill-rose-500' : 'text-[#101828]'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </Link>

                      {/* Vehicle Info */}
                      <Link href={`/listing/${car.id}`} className="flex flex-col gap-1 px-2">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] truncate">
                            {car.name}
                          </h3>
                          <span className="text-xs text-[#475467] whitespace-nowrap">
                            <strong className="text-sm font-extrabold text-[#101828]">
                              {formatPrice(car.priceNum)}
                            </strong>{' '}
                            /day
                          </span>
                        </div>

                        <span className="text-xs text-[#475467] font-medium">{car.specs}</span>
                      </Link>

                      {/* Direct Host Contact Action Row (Instant Call & WhatsApp without login) */}
                      <div className="flex flex-col gap-2 pt-2.5 px-2 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {/* Call / Phone Button: Masked until click to track every lead - Full number legible */}
                          <button
                            type="button"
                            onClick={(e) => handleRevealPhone(e, car.id, car.name, car.phone, 'Car Rental', car.owner)}
                            className="flex-1 h-9.5 px-3 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                            title={revealedPhones[car.id] ? `Call ${car.owner} (${car.phone})` : 'Click to show phone number'}
                          >
                            <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-mono text-xs font-bold whitespace-nowrap">
                              {revealedPhones[car.id] ? car.phone : 'Show Number'}
                            </span>
                          </button>

                          {/* WhatsApp Direct Chat Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectWhatsApp(car.name, car.phone, car.whatsapp, 'Car Rental', car.owner);
                            }}
                            className="h-9.5 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95 text-xs font-bold whitespace-nowrap"
                            title={`Chat with ${car.owner} on WhatsApp`}
                            aria-label="Direct WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
                            <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                          </button>
                        </div>

                        {/* Host Badge / Logo - Links to Public Store */}
                        <Link
                          href={`/store/${getStoreSlugForOwner(car.owner)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-8.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white flex items-center justify-center text-xs font-heading font-bold shadow-2xs transition gap-1"
                          title={`Hosted by ${car.owner} · View Store`}
                        >
                          <span className="truncate">View {car.owner} Fleet & Store</span>
                          <span className="text-slate-400">→</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* SERVICE 1: HIRE A DRIVER */}
          {activeService === 1 && (
            filteredDrivers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.slice(0, visibleCount).map((driver) => {
                  const isFeatured = featuredIds.includes(driver.id);
                  const slotIdx = featuredIds.indexOf(driver.id);
                  return (
                    <div
                      key={driver.id}
                      onClick={() => router.push(`/driver/${slugify(driver.name)}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-emerald-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Chauffeur</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3.5">
                        {/* Driver Header - Links to Driver Profile */}
                        <Link
                          href={`/driver/${slugify(driver.name)}`}
                          className="flex items-center gap-3 group/d cursor-pointer"
                          title={`View ${driver.name}'s Profile`}
                        >
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base text-[#101828] shadow-2xs shrink-0 group-hover/d:scale-105 transition"
                            style={{ backgroundColor: driver.tint }}
                          >
                            {driver.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/d:text-emerald-700 transition truncate">
                                {driver.name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9F3EE] text-[#0B6B4F]">
                                {driver.avail}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#475467] font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
                              <span>{driver.city}</span>
                              <span>·</span>
                              <span>{driver.exp}</span>
                            </div>
                          </div>
                        </Link>

                      {/* Languages & Certified badge */}
                      <div className="flex items-center justify-between text-xs text-[#475467] py-1 border-y border-slate-100">
                        <span className="font-medium truncate">{driver.langs}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#0B6B4F] shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Direct Chauffeur
                        </span>
                      </div>

                      {/* Verified Masked ID & Licence (Pattern Preserved, Unlocks on Booking Confirmation) */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0B6B4F]" />
                            <span>CNIC:</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {maskPakistaniCnic(driver.cnic)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0B6B4F]" />
                            <span>Licence:</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {maskPakistaniLicense(driver.licenseNumber)}
                          </span>
                        </div>
                      </div>

                      {/* Rates Matrix */}
                      <div className="grid grid-cols-3 gap-2 bg-[#F7F8FA] p-2.5 rounded-2xl text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">City 12h</span>
                          <span className="text-xs font-black text-[#101828]">{formatPrice(driver.city12Num || driver.city12)}</span>
                        </div>
                        <div className="border-x border-slate-200/80">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Outstation</span>
                          <span className="text-xs font-black text-[#101828]">{formatPrice((driver as any).outNum || driver.out)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Monthly</span>
                          <span className="text-xs font-black text-[#0B6B4F]">{formatPrice((driver as any).monthlyNum || driver.monthly)}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {driver.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Direct Contact Action Row (Instant Call & WhatsApp without login) */}
                    <div
                      className="flex flex-col gap-2 pt-2.5 mt-2 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        {/* Call / Phone Button: Masked until click - Full number legible */}
                        <button
                          type="button"
                          onClick={(e) => handleRevealPhone(e, driver.id, driver.name, driver.phone, 'Driver', driver.name)}
                          className="flex-1 h-9.5 px-3 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                          title={revealedPhones[driver.id] ? `Call ${driver.name} (${driver.phone})` : 'Click to show phone number'}
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-mono text-xs font-bold whitespace-nowrap">
                            {revealedPhones[driver.id] ? driver.phone : 'Show Number'}
                          </span>
                        </button>

                        {/* WhatsApp Direct Chat Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectWhatsApp(driver.name, driver.phone, driver.whatsapp, 'Driver', driver.name);
                          }}
                          className="h-9.5 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95 text-xs font-bold whitespace-nowrap"
                          title={`Chat with ${driver.name} on WhatsApp`}
                          aria-label="Direct WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
                          <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                        </button>
                      </div>

                      <Link
                        href={`/driver/${slugify(driver.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-8.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white flex items-center justify-center text-xs font-heading font-bold shadow-2xs transition gap-1"
                        title={`View ${driver.name}'s Profile`}
                      >
                        <span className="truncate">View {driver.name}'s Driver Profile</span>
                        <span className="text-slate-400">→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : null
          )}

          {/* SERVICE 2: CITY TO CITY */}
          {activeService === 2 && (
            filteredRides.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRides.slice(0, visibleCount).map((ride) => {
                  const isFeatured = featuredIds.includes(ride.id);
                  const slotIdx = featuredIds.indexOf(ride.id);
                  return (
                    <div
                      key={ride.id}
                      onClick={() => router.push(`/city-to-city/${ride.id}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-blue-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Intercity Route</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Route Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E0EAFF] text-[#1D3A8A]">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{ride.fromCity} ➔ {ride.toCity}</span>
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {ride.duration}
                          </span>
                        </div>

                        {/* Vehicle Model & Operator - Links to Route Details */}
                        <Link href={`/city-to-city/${ride.id}`} className="block group/c2c cursor-pointer">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/c2c:text-blue-700 transition">
                            {ride.car}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#0B6B4F] font-bold mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{ride.op}</span>
                          </div>
                        </Link>

                        {/* Baggage & Schedule */}
                        <div className="flex items-center justify-between text-xs text-[#475467] py-2 border-y border-slate-100">
                          <span className="font-medium">{ride.bag}</span>
                          <span className="font-medium text-slate-500">{ride.time}</span>
                        </div>

                        {/* Rates */}
                        <div className="grid grid-cols-2 gap-2 bg-[#F7F8FA] p-3 rounded-2xl text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">One-Way Fare</span>
                            <span className="text-sm font-black text-[#101828]">{formatPrice(ride.one)}</span>
                          </div>
                          <div className="border-l border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Return Fare</span>
                            <span className="text-sm font-black text-[#0B6B4F]">{formatPrice(ride.ret)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {ride.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Direct Contact Action Row (Instant Call & WhatsApp without login) */}
                      <div
                        className="flex flex-col gap-2 pt-2.5 mt-2 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {/* Call / Phone Button: Masked until click - Full number legible */}
                          <button
                            type="button"
                            onClick={(e) => handleRevealPhone(e, ride.id, `${ride.fromCity} ➔ ${ride.toCity}`, ride.phone, 'CityToCity', ride.op)}
                            className="flex-1 h-9.5 px-3 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                            title={revealedPhones[ride.id] ? `Call ${ride.op} (${ride.phone})` : 'Click to show phone number'}
                          >
                            <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-mono text-xs font-bold whitespace-nowrap">
                              {revealedPhones[ride.id] ? ride.phone : 'Show Number'}
                            </span>
                          </button>

                          {/* WhatsApp Direct Chat Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectWhatsApp(`${ride.fromCity} to ${ride.toCity} (${ride.car})`, ride.phone, ride.whatsapp, 'CityToCity', ride.op);
                            }}
                            className="h-9.5 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95 text-xs font-bold whitespace-nowrap"
                            title={`WhatsApp operator (${ride.op})`}
                            aria-label="Direct WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
                            <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                          </button>
                        </div>

                        <Link
                          href={`/store/${getStoreSlugForOwner(ride.op)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-8.5 rounded-xl bg-slate-900 hover:bg-blue-800 text-white flex items-center justify-center text-xs font-heading font-bold shadow-2xs transition gap-1"
                          title={`Operated by ${ride.op} · View Store`}
                        >
                          <span className="truncate">View {ride.op} Store & Schedule</span>
                          <span className="text-slate-400">→</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* SERVICE 3: PICK & DROP SHUTTLES */}
          {activeService === 3 && (
            filteredShuttles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShuttles.slice(0, visibleCount).map((shuttle) => {
                  const isFeatured = featuredIds.includes(shuttle.id);
                  const slotIdx = featuredIds.indexOf(shuttle.id);
                  return (
                    <div
                      key={shuttle.id}
                      onClick={() => router.push(`/shuttles/${shuttle.id}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-purple-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Shuttle Route</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Route Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FEF3C7] text-[#92400E]">
                            <Bus className="w-3.5 h-3.5" />
                            <span>Monthly Seat Route</span>
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {shuttle.seats} seats available
                          </span>
                        </div>

                        {/* Route Details - Links to Shuttle Details */}
                        <Link href={`/shuttles/${shuttle.id}`} className="block group/sht cursor-pointer">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/sht:text-teal-700 transition">
                            {shuttle.from} ➔ {shuttle.to}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#0B6B4F] font-bold mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{shuttle.op} ({shuttle.city})</span>
                          </div>
                        </Link>

                        {/* Vehicle & Timings */}
                        <div className="bg-[#F7F8FA] p-3 rounded-2xl flex flex-col gap-1.5 text-xs">
                          <div className="flex justify-between items-center text-[#344054]">
                            <span className="font-medium">Van:</span>
                            <span className="font-bold text-[#101828]">{shuttle.van}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#344054]">
                            <span className="font-medium">Timings:</span>
                            <span className="font-semibold text-[#101828]">{shuttle.pick} pickup · {shuttle.back} return</span>
                          </div>
                          <div className="flex justify-between items-center text-[#344054]">
                            <span className="font-medium">Operating Days:</span>
                            <span className="font-bold text-[#0B6B4F]">{shuttle.days}</span>
                          </div>
                        </div>

                        {/* Monthly Fare */}
                        <div className="flex justify-between items-baseline px-1">
                          <span className="text-xs font-semibold text-[#475467]">Monthly Reserved Fare:</span>
                          <span className="text-lg font-extrabold text-[#101828]">{formatPrice(shuttle.fareNum || shuttle.fare)}<span className="text-xs font-medium text-slate-500"> /month</span></span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {shuttle.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Direct Contact Action Row (Instant Call & WhatsApp without login) */}
                      <div
                        className="flex flex-col gap-2 pt-2.5 mt-2 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {/* Call / Phone Button: Masked until click - Full phone number legible */}
                          <button
                            type="button"
                            onClick={(e) => handleRevealPhone(e, shuttle.id, `${shuttle.from} ➔ ${shuttle.to}`, shuttle.phone, 'Shuttle', shuttle.op)}
                            className="flex-1 h-9.5 px-3 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                            title={revealedPhones[shuttle.id] ? `Call ${shuttle.op} (${shuttle.phone})` : 'Click to show phone number'}
                          >
                            <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-mono text-xs font-bold whitespace-nowrap">
                              {revealedPhones[shuttle.id] ? shuttle.phone : 'Show Number'}
                            </span>
                          </button>

                          {/* WhatsApp Direct Chat Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectWhatsApp(`Seat Request for ${shuttle.from} to ${shuttle.to}`, shuttle.phone, shuttle.whatsapp, 'Shuttle', shuttle.op);
                            }}
                            className="h-9.5 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95 text-xs font-bold whitespace-nowrap"
                            title={`WhatsApp operator (${shuttle.op})`}
                            aria-label="Direct WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
                            <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                          </button>
                        </div>

                        <Link
                          href={`/store/${getStoreSlugForOwner(shuttle.op)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-8.5 rounded-xl bg-slate-900 hover:bg-teal-800 text-white flex items-center justify-center text-xs font-heading font-bold shadow-2xs transition gap-1"
                          title={`Operated by ${shuttle.op} · View Store`}
                        >
                          <span className="truncate">View {shuttle.op} Store & Schedule</span>
                          <span className="text-slate-400">→</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* SERVICE 4: HOME SHIFTING MOVERS */}
          {activeService === 4 && (
            filteredMovers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMovers.slice(0, visibleCount).map((mover) => {
                  const isFeatured = featuredIds.includes(mover.id);
                  const slotIdx = featuredIds.indexOf(mover.id);
                  return (
                    <div
                      key={mover.id}
                      onClick={() => router.push(`/movers/${mover.id}`)}
                      className={`flex flex-col justify-between group bg-white rounded-3xl p-5 transition-all duration-200 cursor-pointer ${
                        isFeatured
                          ? 'border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-xl bg-gradient-to-b from-amber-50/40 via-white to-white'
                          : 'border border-slate-100 hover:shadow-lg hover:border-orange-200'
                      }`}
                    >
                      {/* Prominent Featured Top Badge */}
                      {isFeatured && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white uppercase tracking-wider shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-current text-yellow-200 animate-pulse" />
                            <span>Featured Home Mover</span>
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            ★ Slot #{slotIdx + 1}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {/* Mover Header - Links to Mover Details */}
                        <Link href={`/movers/${mover.id}`} className="flex items-center justify-between gap-2 group/mov cursor-pointer">
                          <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover/mov:text-purple-700 transition truncate">
                            {mover.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#0B6B4F]">
                            <MapPin className="w-3 h-3" />
                            <span>{mover.city}</span>
                          </span>
                        </Link>

                        {/* Trucks Available */}
                        <div className="text-xs text-[#475467] font-medium leading-relaxed">
                          <span className="font-bold text-[#101828]">Fleet: </span>{mover.trucks}
                        </div>

                        {/* Rates Matrix */}
                        <div className="grid grid-cols-3 gap-2 bg-[#F7F8FA] p-2.5 rounded-2xl text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Base Moving</span>
                            <span className="text-xs font-black text-[#101828]">{formatPrice((mover as any).baseFareNum || mover.base)}</span>
                          </div>
                          <div className="border-x border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Per KM</span>
                            <span className="text-xs font-black text-[#101828]">{formatPrice((mover as any).perKmNum || mover.km)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Helpers</span>
                            <span className="text-xs font-black text-[#0B6B4F]">{formatPrice((mover as any).helperNum || mover.helper)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {mover.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Direct Contact Action Row (Instant Call & WhatsApp without login) */}
                      <div
                        className="flex flex-col gap-2 pt-2.5 mt-2 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {/* Call / Phone Button: Masked until click - Full phone number legible */}
                          <button
                            type="button"
                            onClick={(e) => handleRevealPhone(e, mover.id, mover.name, mover.phone, 'Mover', mover.name)}
                            className="flex-1 h-9.5 px-3 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                            title={revealedPhones[mover.id] ? `Call ${mover.name} (${mover.phone})` : 'Click to show phone number'}
                          >
                            <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-mono text-xs font-bold whitespace-nowrap">
                              {revealedPhones[mover.id] ? mover.phone : 'Show Number'}
                            </span>
                          </button>

                          {/* WhatsApp Direct Chat Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectWhatsApp(`Move Quote Request for ${mover.name}`, mover.phone, mover.whatsapp, 'Mover', mover.name);
                            }}
                            className="h-9.5 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 active:scale-95 text-xs font-bold whitespace-nowrap"
                            title={`WhatsApp mover (${mover.name})`}
                            aria-label="Direct WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
                            <span className="text-xs font-bold text-emerald-800">WhatsApp</span>
                          </button>
                        </div>

                        <Link
                          href={`/store/${getStoreSlugForOwner(mover.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-8.5 rounded-xl bg-slate-900 hover:bg-purple-800 text-white flex items-center justify-center text-xs font-heading font-bold shadow-2xs transition gap-1"
                          title={`Operated by ${mover.name} · View Store`}
                        >
                          <span className="truncate">View {mover.name} Moving Profile</span>
                          <span className="text-slate-400">→</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}

          {/* Empty State when no results match filter */}
          {currentTotal === 0 && (
            <div className="py-14 text-center bg-[#F7F8FA] rounded-3xl border border-[#EEF0F2] p-8 space-y-3">
              {React.createElement(currentMeta.emptyIcon, { className: 'w-10 h-10 text-slate-400 mx-auto' })}
              <h3 className="text-base font-bold text-slate-800">
                No {currentMeta.emptyLabel} found for &ldquo;{searchWhere || selectedCategory}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active listings match this specific category or city filter right now. Try resetting
                filters to explore the full available network.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(currentCategories[0]);
                  setSearchWhere('');
                  setVisibleCount(60);
                }}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs hover:bg-[#08513C] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{currentMeta.resetLabel}</span>
              </button>
            </div>
          )}

              {/* Read More Pagination (Shown when total items > visibleCount) */}
              {currentTotal > visibleCount && (
                <div className="flex justify-center pt-8">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 60)}
                    className="px-8 py-3.5 rounded-2xl bg-[#101828] text-white text-xs sm:text-sm font-extrabold hover:bg-[#0B6B4F] transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Read more ({currentTotal - visibleCount} more available)</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4. One App for Every Way You Move */}
      <section className="py-12 md:py-16 bg-[#F7F8FA] border-y border-[#EEF0F2]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-7">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              One app for every way you move
            </h2>
            <p className="text-sm sm:text-base text-[#475467]">
              Five services, one open direct transport marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Rent a car',
                text: 'Self-drive sedans, SUVs and luxury cars by the day.',
                icon: Car,
                href: '/listing/l-1',
              },
              {
                title: 'Hire a driver',
                text: 'Licensed chauffeurs for a day, an event or outstation trip.',
                icon: UserCheck,
                href: '/drivers',
              },
              {
                title: 'City to city',
                text: `Comfortable intercity rides between major ${country?.name || 'Pakistani'} cities.`,
                icon: Navigation,
                href: '/city-to-city',
              },
              {
                title: 'Pick & drop',
                text: 'Monthly school and office commuter routes you can rely on.',
                icon: Bus,
                href: '/shuttles',
              },
              {
                title: 'Home shifting',
                text: 'Cargo trucks and loaders for houses, flats and offices.',
                icon: Truck,
                href: '/movers',
              },
            ].map((sc) => {
              const ScIcon = sc.icon;
              return (
                <Link
                  key={sc.title}
                  href={sc.href}
                  className="flex flex-col gap-3 p-5 rounded-2xl bg-white border border-[#EEF0F2] text-[#101828] hover:border-[#0B6B4F] hover:shadow-md transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F4F7F5] border border-[#E4E7EC] text-[#0B6B4F] flex items-center justify-center group-hover:bg-[#0B6B4F] group-hover:text-white transition">
                    <ScIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-extrabold text-base">{sc.title}</h3>
                  <p className="text-xs text-[#475467] leading-relaxed flex-1">{sc.text}</p>
                  <span className="text-xs font-bold text-[#0B6B4F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Book in Three Steps */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-8">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
            Book in three steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#101828]">Search & compare</h3>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Filter by city, dates, car type and self-drive or chauffeur. Prices are shown per
                day, 100% upfront.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#101828]">
                Request on WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Tap &ldquo;Request to book&rdquo; and your trip details go straight to the owner on
                WhatsApp. They confirm with you there.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#EEF0F2] flex flex-col gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-heading font-extrabold text-lg text-[#101828]">Pick up & go</h3>
              <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                Meet at the agreed spot, inspect the car together and pay the owner directly. Zero
                online payment needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Cities */}
      <section className="py-10 md:py-14 bg-[#F7F8FA] border-t border-[#EEF0F2]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-6">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
            Popular cities across {country?.name || 'Pakistan'}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {availableCities.slice(0, 4).map((cityName, idx) => {
              const cityImgs = [
                'https://images.unsplash.com/photo-1572455857811-045fb4255b5d?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=400&auto=format&fit=crop&q=80',
              ];
              return (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => {
                    setSearchWhere(cityName);
                    const el = document.getElementById('cars-results');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#EEF0F2] text-left hover:border-[#0B6B4F] transition cursor-pointer group"
                >
                  <img
                    src={cityImgs[idx % cityImgs.length]}
                    alt={cityName}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-sm text-[#101828] truncate">{cityName}</span>
                    <span className="text-[11px] text-[#667085]">Cars · Drivers · Shuttles</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Become a Partner & Get App Dual Banners */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* For Partners */}
          <div className="bg-[#101828] text-white rounded-3xl p-8 sm:p-10 flex flex-col gap-4 justify-between shadow-md">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#F5B547] tracking-wider uppercase">
                For owners, drivers & movers
              </span>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl leading-snug">
                List your vehicle or service. Connect directly with customers.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                Create your profile, set your own rates and receive inquiries directly on WhatsApp or in-app chat.
              </p>
            </div>

            <Link
              href="/register"
              className="self-start h-12 px-6 rounded-full bg-white text-[#101828] font-extrabold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-100 transition shadow-sm mt-3"
            >
              Become a partner
            </Link>
          </div>

          {/* Get App / PWA */}
          <div className="bg-[#E9F3EE] rounded-3xl p-8 sm:p-10 flex flex-col gap-4 justify-between border border-[#DCE7E1]">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#0B6B4F] tracking-wider uppercase">
                Get the app
              </span>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl leading-snug text-[#101828]">
                Your trips, chats and bookings in your pocket.
              </h3>
              <p className="text-xs sm:text-sm text-[#344054] leading-relaxed max-w-md">
                Instant booking updates, live chat with owners and saved vehicles on iOS and
                Android.
              </p>
            </div>

            <div className="flex gap-2.5 flex-wrap mt-3">
              <Link
                href="/register"
                className="h-11 px-5 rounded-xl bg-[#101828] text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition"
              >
                <Smartphone className="w-4 h-4 text-[#F5B547]" />
                <span>Install Mobile PWA</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('safarpk_trigger_pwa_install'));
                  }
                }}
                className="h-11 px-5 rounded-xl bg-white border border-[#D0D5DD] text-[#101828] font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0B6B4F]" />
                <span>Download App</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Global Footer */}
      <AppFooter />

      {/* 9. Mobile Bottom Navigation & PWA Experience */}
      <MobileNavBar />
      <MobilePWAExperience />
    </div>
  );
}
