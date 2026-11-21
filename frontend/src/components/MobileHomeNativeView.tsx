'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowLeft,
  Users,
  User,
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
  CITY_MOVERS_AREAS,
  matchesShuttleRoute,
  VehicleCardItem,
  DriverCardItem,
  CityRideItem,
  ShuttleItem,
  MoverItem,
} from '@/data/marketplaceData';
import { getActiveUser, RegisteredUser, getUserDashboardPath } from '@/data/userAuth';
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

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
};

export function MobileHomeNativeView() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);
  const [city, setCity] = useState<string>('Lahore');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [activeServiceIdx, setActiveServiceIdx] = useState(0); // 0: Rent car, 1: Drivers, 2: City to City, 3: Pick & drop, 4: Movers
  const [selectedCarCategory, setSelectedCarCategory] = useState(0); // 0: All cars, 1: Sedans, 2: SUVs, 3: Luxury, 4: Vans
  const [isSelfDrive, setIsSelfDrive] = useState(true);
  const [savedCarIds, setSavedCarIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFilteredResultsView, setIsFilteredResultsView] = useState(false);
  const [datePickerSheetOpen, setDatePickerSheetOpen] = useState(false);
  const [selectedTransmission, setSelectedTransmission] = useState<'All' | 'Automatic' | 'Manual'>('All');
  const [selectedPriceMax, setSelectedPriceMax] = useState<number | null>(null);
  const [transmissionSheetOpen, setTransmissionSheetOpen] = useState(false);
  const [carCategorySheetOpen, setCarCategorySheetOpen] = useState(false);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const todayDateStr = useMemo(() => getTodayDateString(), []);
  const tomorrowDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Search Sheet Specific Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchWhere, setSearchWhere] = useState('Lahore');
  const [pickupDate, setPickupDate] = useState(() => getTodayDateString());
  const [returnDate, setReturnDate] = useState('');
  const [c2cFromCity, setC2cFromCity] = useState('Lahore');
  const [c2cToCity, setC2cToCity] = useState('Islamabad');
  const [c2cSearchQuery, setC2cSearchQuery] = useState('');
  const [c2cPickerSheetOpen, setC2cPickerSheetOpen] = useState<'from' | 'to' | null>(null);

  // Shuttles corridor inputs
  const [shuttleCity, setShuttleCity] = useState('Karachi');
  const [shuttlePickupArea, setShuttlePickupArea] = useState('');
  const [shuttleDropArea, setShuttleDropArea] = useState('');
  const [shuttleAreaSearchQuery, setShuttleAreaSearchQuery] = useState('');
  const [shuttleAreaSheetOpen, setShuttleAreaSheetOpen] = useState<'pickup' | 'drop' | null>(null);

  // Movers inputs
  const [moverFromArea, setMoverFromArea] = useState('');
  const [moverToArea, setMoverToArea] = useState('');
  const [moverDate, setMoverDate] = useState('');
  const [moverAreaSheetOpen, setMoverAreaSheetOpen] = useState<'from' | 'to' | null>(null);
  const [moverAreaSearchQuery, setMoverAreaSearchQuery] = useState('');

  const syncSavedFavorites = () => {
    try {
      if (typeof window === 'undefined') return;
      const idsSet = new Set<string>();
      const rawVehicles = localStorage.getItem('safarpk_saved_vehicles');
      if (rawVehicles) {
        const parsed = JSON.parse(rawVehicles);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => idsSet.add(id));
        }
      }
      const rawItems = localStorage.getItem('safarpk_saved_items');
      if (rawItems) {
        const parsedItems = JSON.parse(rawItems);
        if (Array.isArray(parsedItems)) {
          parsedItems.forEach((it: any) => {
            if (it.id) idsSet.add(it.id);
          });
        }
      }
      setSavedCarIds(Array.from(idsSet));
    } catch (e) {}
  };

  useEffect(() => {
    setActiveUser(getActiveUser());
    const onAuth = () => setActiveUser(getActiveUser());
    window.addEventListener('safarpk_auth_state_changed', onAuth);

    syncSavedFavorites();
    window.addEventListener('safarpk_saved_updated', syncSavedFavorites);
    window.addEventListener('safarpk_favorites_updated', syncSavedFavorites);
    window.addEventListener('storage', syncSavedFavorites);

    return () => {
      window.removeEventListener('safarpk_auth_state_changed', onAuth);
      window.removeEventListener('safarpk_saved_updated', syncSavedFavorites);
      window.removeEventListener('safarpk_favorites_updated', syncSavedFavorites);
      window.removeEventListener('storage', syncSavedFavorites);
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
    const isCurrentlySaved = savedCarIds.includes(carId);
    let updated: string[];
    if (isCurrentlySaved) {
      updated = savedCarIds.filter((id) => id !== carId);
      showToast(`Removed "${carName}" from saved`);
    } else {
      updated = [...savedCarIds, carId];
      showToast(`Saved "${carName}" to your wishlist!`);
    }
    setSavedCarIds(updated);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('safarpk_saved_vehicles', JSON.stringify(updated));

        // Interlink with safarpk_saved_items for full desktop & /saved compatibility
        let storedList: any[] = [];
        const rawItems = localStorage.getItem('safarpk_saved_items');
        if (rawItems) {
          try {
            storedList = JSON.parse(rawItems);
          } catch (e) {}
        }

        if (isCurrentlySaved) {
          storedList = storedList.filter((item) => (item.id || item) !== carId);
        } else {
          const foundCar = filteredCars.find((c) => c.id === carId) || CARS_DATA.find((c) => c.id === carId);
          storedList = storedList.filter((item) => (item.id || item) !== carId);
          storedList.unshift({
            id: carId,
            title: foundCar?.name || carName,
            name: foundCar?.name || carName,
            category: 'Cars',
            specs: foundCar?.specs || 'Verified Car Rental',
            city: foundCar?.city || city,
            rate: foundCar?.price || 'PKR 12,000 / day',
            price: foundCar?.price || 'PKR 12,000 / day',
            savedAt: new Date().toISOString(),
          });
        }
        localStorage.setItem('safarpk_saved_items', JSON.stringify(storedList));
        window.dispatchEvent(new Event('safarpk_saved_updated'));
        window.dispatchEvent(new Event('safarpk_favorites_updated'));
      }
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
        href: '/cars',
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

  const curService = services[activeServiceIdx] || services[0];

  const PAK_CITIES_LOWER = useMemo(
    () => [
      'lahore',
      'karachi',
      'islamabad',
      'rawalpindi',
      'faisalabad',
      'multan',
      'peshawar',
      'quetta',
      'sialkot',
      'gujranwala',
      'hyderabad',
    ],
    []
  );

  const searchTokens = useMemo(() => {
    return searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  }, [searchQuery]);

  // Dynamic Service Datasets Filtered by Search Query & Location
  const filteredCars = useMemo(() => {
    let list = [...CARS_DATA];
    const targetCity = searchWhere || city;

    if (searchTokens.length > 0) {
      // 1. Check if user typed a specific city in the query (e.g. "corolla karachi")
      const explicitCity = searchTokens.find((t) => PAK_CITIES_LOWER.includes(t));
      if (explicitCity) {
        list = list.filter((c) => c.city.toLowerCase() === explicitCity);
        const nonCityTokens = searchTokens.filter((t) => t !== explicitCity);
        if (nonCityTokens.length > 0) {
          list = list.filter((c) => {
            const searchable = `${c.name} ${c.specs} ${c.owner} ${c.category}`.toLowerCase();
            return nonCityTokens.every((tok) => searchable.includes(tok));
          });
        }
      } else {
        // Multi-token match across name, specs, owner, category, city strictly in targetCity
        list = list.filter((c) => c.city.toLowerCase() === targetCity.toLowerCase());
        list = list.filter((c) => {
          const searchable = `${c.name} ${c.specs} ${c.owner} ${c.category} ${c.city}`.toLowerCase();
          return searchTokens.every((tok) => searchable.includes(tok));
        });
      }
    } else {
      list = list.filter((c) => c.city.toLowerCase() === targetCity.toLowerCase());
    }

    if (selectedCarCategory === 1) {
      list = list.filter((c) => c.category === 'Sedans');
    } else if (selectedCarCategory === 2) {
      list = list.filter((c) => c.category === 'SUVs & 4x4');
    } else if (selectedCarCategory === 3) {
      list = list.filter((c) => c.category === 'Luxury');
    } else if (selectedCarCategory === 4) {
      list = list.filter((c) => c.category === 'Vans & Hiace');
    }
    if (selectedTransmission !== 'All') {
      list = list.filter((c) => c.specs.toLowerCase().includes(selectedTransmission.toLowerCase()));
    }
    if (selectedPriceMax) {
      list = list.filter((c) => c.priceNum <= selectedPriceMax);
    }
    return list;
  }, [city, searchWhere, selectedCarCategory, selectedTransmission, selectedPriceMax, searchTokens, PAK_CITIES_LOWER]);

  const filteredDrivers = useMemo(() => {
    let list = [...DRIVERS_DATA];
    const targetCity = searchWhere || city;

    // 1. Strict city filter
    list = list.filter((d) => d.city.toLowerCase() === targetCity.toLowerCase());

    // 2. Strict Date Availability filter:
    // Offline drivers -> hidden
    // If effectiveDate is Today and driver is 'Busy' -> hidden
    // If driver has blocked this date in blockedDates -> hidden
    const effectiveDate = pickupDate || todayDateStr;
    list = list.filter((d) => {
      if (d.avail === 'Offline') return false;
      if (effectiveDate === todayDateStr && d.avail === 'Busy') return false;
      if (d.blockedDates && d.blockedDates.includes(effectiveDate)) return false;
      return true;
    });

    if (searchTokens.length > 0) {
      const explicitCity = searchTokens.find((t) => PAK_CITIES_LOWER.includes(t));
      if (explicitCity) {
        list = list.filter((d) => d.city.toLowerCase() === explicitCity);
        const nonCityTokens = searchTokens.filter((t) => t !== explicitCity);
        if (nonCityTokens.length > 0) {
          list = list.filter((d) => {
            const searchable = `${d.name} ${d.exp} ${d.langs} ${d.category} ${(d.tags || []).join(' ')}`.toLowerCase();
            return nonCityTokens.every((tok) => searchable.includes(tok));
          });
        }
      } else {
        list = list.filter((d) => {
          const searchable = `${d.name} ${d.exp} ${d.langs} ${d.category} ${(d.tags || []).join(' ')}`.toLowerCase();
          return searchTokens.every((tok) => searchable.includes(tok));
        });
      }
    }
    return list;
  }, [city, searchWhere, pickupDate, todayDateStr, searchTokens, PAK_CITIES_LOWER]);

  const filteredRides = useMemo(() => {
    let list = [...CITY_RIDES_DATA];
    const targetCity = searchWhere || city;

    if (searchTokens.length > 0) {
      const explicitCity = searchTokens.find((t) => PAK_CITIES_LOWER.includes(t));
      if (explicitCity) {
        list = list.filter(
          (r) =>
            r.fromCity.toLowerCase() === explicitCity ||
            r.toCity.toLowerCase() === explicitCity
        );
        const nonCityTokens = searchTokens.filter((t) => t !== explicitCity);
        if (nonCityTokens.length > 0) {
          list = list.filter((r) => {
            const searchable = `${r.fromCity} ${r.toCity} ${r.car} ${r.op} ${(r.tags || []).join(' ')}`.toLowerCase();
            return nonCityTokens.every((tok) => searchable.includes(tok));
          });
        }
      } else {
        list = list.filter(
          (r) =>
            r.fromCity.toLowerCase() === targetCity.toLowerCase() ||
            r.toCity.toLowerCase() === targetCity.toLowerCase()
        );
        list = list.filter((r) => {
          const searchable = `${r.fromCity} ${r.toCity} ${r.car} ${r.op} ${(r.tags || []).join(' ')}`.toLowerCase();
          return searchTokens.every((tok) => searchable.includes(tok));
        });
      }
    } else {
      list = list.filter(
        (r) =>
          r.fromCity.toLowerCase() === targetCity.toLowerCase() ||
          r.toCity.toLowerCase() === targetCity.toLowerCase()
      );
    }
    return list;
  }, [city, searchWhere, searchTokens, PAK_CITIES_LOWER]);

  const filteredShuttles = useMemo(() => {
    const targetCity = shuttleCity || searchWhere || city;
    // 1. Strict filter by city - NO cross-city leakage ever
    const cityList = SHUTTLES_DATA.filter(
      (s) => s.city.toLowerCase() === targetCity.toLowerCase()
    );

    if (searchTokens.length > 0) {
      const explicitCity = searchTokens.find((t) => PAK_CITIES_LOWER.includes(t));
      let baseList = cityList;
      if (explicitCity && explicitCity !== targetCity.toLowerCase()) {
        baseList = SHUTTLES_DATA.filter((s) => s.city.toLowerCase() === explicitCity);
      }
      return baseList.filter((s) => {
        const searchable = `${s.op} ${s.city} ${s.from} ${s.to} ${(s.stops || []).join(' ')} ${s.van} ${(s.tags || []).join(' ')} ${s.category}`.toLowerCase();
        return searchTokens.every((tok) => searchable.includes(tok));
      });
    }

    if (shuttlePickupArea || shuttleDropArea) {
      // Priority 1: Exact route match on both pickup and drop stops
      const exactMatches = cityList.filter((s) =>
        matchesShuttleRoute(s, shuttlePickupArea, shuttleDropArea, targetCity)
      );
      if (exactMatches.length > 0) {
        return exactMatches;
      }

      // Priority 2: If both areas selected but no single corridor covers both,
      // show corridors in THIS city that cover pickup OR drop
      if (shuttlePickupArea && shuttleDropArea) {
        const partialMatches = cityList.filter(
          (s) =>
            matchesShuttleRoute(s, shuttlePickupArea, '', targetCity) ||
            matchesShuttleRoute(s, '', shuttleDropArea, targetCity)
        );
        if (partialMatches.length > 0) {
          return partialMatches;
        }
      }

      // Priority 3: Strictly return [] (empty list) - NEVER leak SHUTTLES_DATA across Pakistan!
      return [];
    }

    return cityList;
  }, [city, searchWhere, shuttleCity, shuttlePickupArea, shuttleDropArea, searchTokens, PAK_CITIES_LOWER]);

  // Dynamic Residential & Commercial Areas for Movers (Strictly Partitioned)
  const availableMoverAreas = useMemo(() => {
    const targetCity = searchWhere || city || 'Karachi';
    const base = CITY_MOVERS_AREAS[targetCity] || CITY_MOVERS_AREAS['Karachi'] || [];
    const listingAreas: string[] = [];
    MOVERS_DATA.filter((m) => m.city.toLowerCase() === targetCity.toLowerCase()).forEach((m) => {
      if (m.name.includes('Port')) listingAreas.push('Karachi Port & Kemari');
      if (m.name.includes('Capital')) listingAreas.push('Islamabad Capital Zone');
      if (m.name.includes('Industrial')) listingAreas.push('Industrial Estate');
    });
    return Array.from(new Set([...base, ...listingAreas]));
  }, [searchWhere, city]);

  const filteredMovers = useMemo(() => {
    const targetCity = searchWhere || city;
    let list = MOVERS_DATA.filter((m) => m.city.toLowerCase() === targetCity.toLowerCase());

    if (moverFromArea || moverToArea) {
      const fromArea = (moverFromArea || '').toLowerCase().trim();
      const toArea = (moverToArea || '').toLowerCase().trim();
      const areaMatches = list.filter((m) => {
        const fullText = `${m.name} ${m.trucks} ${(m.tags || []).join(' ')} ${m.category} ${m.city}`.toLowerCase();
        return (fromArea && fullText.includes(fromArea)) || (toArea && fullText.includes(toArea));
      });
      if (areaMatches.length > 0) {
        list = areaMatches;
      }
    }

    if (searchTokens.length > 0) {
      const explicitCity = searchTokens.find((t) => PAK_CITIES_LOWER.includes(t));
      if (explicitCity && explicitCity !== targetCity.toLowerCase()) {
        list = MOVERS_DATA.filter((m) => m.city.toLowerCase() === explicitCity);
      }
      list = list.filter((m) => {
        const searchable = `${m.name} ${m.city} ${m.trucks} ${m.base} ${m.helper} ${(m.tags || []).join(' ')}`.toLowerCase();
        return searchTokens.every((tok) => searchable.includes(tok));
      });
    }
    return list;
  }, [city, searchWhere, moverFromArea, moverToArea, searchTokens, PAK_CITIES_LOWER]);

  const userInitials = useMemo(() => {
    if (!activeUser?.name?.trim()) return '';
    const parts = activeUser.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0][0] || 'U';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
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
      {!isFilteredResultsView ? (
        <header className="sticky top-0 z-40 bg-white border-b border-[#EEF0F2] px-3.5 pt-2.5 pb-2.5 flex flex-col gap-2 shadow-2xs">
          {/* Row 1: Hamburger Menu (Left) + SafarPK Logo (Center) + Bell & Avatar (Right) */}
          <div className="flex items-center justify-between gap-2 h-11">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100/90 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0 shadow-2xs border border-slate-200/60"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

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

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/inbox"
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full bg-[#F2F4F7] text-[#101828] flex items-center justify-center transition active:scale-95 hover:bg-slate-200"
              >
                <Bell className="w-4.5 h-4.5 stroke-[2] text-slate-700" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D92D20] ring-2 ring-[#F2F4F7]" />
              </Link>

              {activeUser ? (
                <Link
                  href={getUserDashboardPath(activeUser)}
                  aria-label="My account"
                  className="w-9 h-9 rounded-full bg-[#0B6B4F] text-white font-bold text-xs flex items-center justify-center shadow-xs transition active:scale-95 hover:ring-2 hover:ring-emerald-400 overflow-hidden"
                  title={activeUser.name || 'Account Dashboard'}
                >
                  {activeUser.avatarUrl ? (
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitials || 'U'}</span>
                  )}
                </Link>
              ) : (
                <Link
                  href="/login"
                  aria-label="Sign in"
                  className="w-9 h-9 rounded-full bg-[#F2F4F7] hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 border border-slate-200/80 shadow-2xs"
                  title="Sign In / Register"
                >
                  <User className="w-4.5 h-4.5 text-slate-700 stroke-[2.2]" />
                </Link>
              )}
            </div>
          </div>

          {/* Row 2: Location Selector + Universal Search Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCitySheetOpen(true)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[#E9F3EE] hover:bg-emerald-100/70 text-[#08513C] font-bold text-xs shrink-0 transition active:scale-95 cursor-pointer border border-[#D0E5DA]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0B6B4F] stroke-[2.2]" />
              <span className="max-w-[75px] truncate">{city}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {searchQuery ? (
              <div className="flex-1 flex items-center justify-between h-10 px-3 rounded-xl bg-emerald-50/80 border border-emerald-300 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSearchSheetOpen(true)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#0B6B4F] shrink-0" />
                  <span className="truncate font-bold text-emerald-950">
                    &ldquo;{searchQuery}&rdquo; in {searchWhere || city}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="w-5 h-5 rounded-full bg-emerald-200/80 hover:bg-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 ml-1 transition"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchSheetOpen(true)}
                className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl bg-[#F7F8FA] hover:bg-slate-100 border border-[#E4E7EC] text-left text-xs text-slate-500 truncate transition active:scale-[0.99] shadow-2xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate font-semibold text-slate-800">
                  Search &ldquo;Corolla&rdquo;, &ldquo;Civic&rdquo; or {curService?.title || 'Rent a Car'}...
                </span>
              </button>
            )}
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 bg-white border-b border-[#EEF0F2] px-3.5 pt-2.5 pb-2.5 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2 h-11">
            <button
              type="button"
              onClick={() => setIsFilteredResultsView(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0"
              aria-label="Back to explore"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div
              onClick={() => setSearchSheetOpen(true)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-2xs cursor-pointer active:scale-[0.99] transition text-center hover:bg-slate-50"
            >
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="font-heading font-black text-xs text-[#101828] truncate">
                  {searchQuery ? `"${searchQuery}" · ${searchWhere || city}` : (searchWhere || city)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  {activeServiceIdx === 0
                    ? `${pickupDate && returnDate ? `${pickupDate} – ${returnDate}` : 'Flexible Dates'} · ${isSelfDrive ? 'Self-drive' : 'With driver'}`
                    : activeServiceIdx === 1
                    ? `${pickupDate ? `Starting ${pickupDate}` : 'Flexible Dates'} · Certified Drivers`
                    : activeServiceIdx === 2
                    ? `${pickupDate ? `Travel ${pickupDate}` : 'Intercity Rides'} · City to City`
                    : activeServiceIdx === 3
                    ? `${shuttlePickupArea ? `${shuttlePickupArea} → ${shuttleDropArea || 'Drop'}` : 'Daily Commute Shuttles'}`
                    : `${moverDate ? `Moving on ${moverDate}` : 'Home & Office Shifting'}`}
                </span>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-1 shrink-0"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSearchSheetOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0"
              aria-label="Open search filter"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setIsSelfDrive(!isSelfDrive)}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                isSelfDrive ? 'bg-[#101828] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Self-drive
            </button>
            <button
              type="button"
              onClick={() => setSelectedTransmission(selectedTransmission === 'Automatic' ? 'All' : 'Automatic')}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedTransmission === 'Automatic' ? 'bg-[#101828] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarCategory(selectedCarCategory === 1 ? 0 : 1)}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCarCategory === 1 ? 'bg-[#101828] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Sedan
            </button>
            <button
              type="button"
              onClick={() => setSelectedCarCategory(selectedCarCategory === 2 ? 0 : 2)}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCarCategory === 2 ? 'bg-[#101828] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              SUV
            </button>
            <button
              type="button"
              onClick={() => setSelectedPriceMax(selectedPriceMax === 10000 ? null : 10000)}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedPriceMax === 10000 ? 'bg-[#101828] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Under PKR 10k
            </button>
          </div>
        </header>
      )}

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
                  ? `Cars in ${searchWhere || city}`
                  : activeServiceIdx === 1
                  ? `Chauffeurs & Drivers in ${searchWhere || city}`
                  : activeServiceIdx === 2
                  ? `City to City Rides (${searchWhere || city})`
                  : activeServiceIdx === 3
                  ? `Pick & Drop Shuttles (${shuttleCity || searchWhere || city})`
                  : `Cargo & Home Movers in ${searchWhere || city}`}
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

          {/* Active Search Filter Badge */}
          {searchQuery && (
            <div className="mx-4 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-[#0B6B4F] shrink-0" />
                <span className="text-[#08513C] truncate">
                  Searching: <strong>&ldquo;{searchQuery}&rdquo;</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[11px] font-bold border border-emerald-300 hover:bg-emerald-100 transition cursor-pointer shrink-0"
              >
                <span>Clear</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* COMPACT LISTING FEED CARDS */}
          <div className="flex flex-col gap-2.5 px-4">
            {/* 1. CAR RENTAL CARDS */}
            {activeServiceIdx === 0 &&
              (filteredCars.length > 0 ? (
                filteredCars.slice(0, 8).map((car) => {
                const isSaved = savedCarIds.includes(car.id);
                const cleanPhone = (car.phone || '').replace(/[^0-9]/g, '');

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
              })
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#101828]">
                    No cars found matching &ldquo;{searchQuery || searchWhere || city}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                    Try searching by popular models like Corolla, Civic, Yaris, or change your city.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCarCategory(0);
                    setSelectedTransmission('All');
                    setSelectedPriceMax(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs shadow-xs hover:bg-[#08513C] transition cursor-pointer"
                >
                  Reset Search & View All Cars
                </button>
              </div>
            ))}

            {/* 2. DRIVERS CARDS */}
            {activeServiceIdx === 1 &&
              (filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => {
                const cleanPhone = (driver.phone || '').replace(/[^0-9]/g, '');

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
                          <span>SafarPK Certified Chauffeur · Identity on File</span>
                        </div>
                      </div>

                      {/* Pricing & Call/WhatsApp Row */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-50">
                        <div>
                          <span className="font-heading font-extrabold text-[15px] text-[#101828]">
                            {driver.city12 || 'Rs. 2,500'}
                          </span>
                          <span className="text-[11px] text-[#667085]"> /12h</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${driver.phone || ''}`}
                            className="w-9 h-9 rounded-xl bg-[#F2F4F7] hover:bg-slate-200 text-[#101828] flex items-center justify-center transition active:scale-95"
                            title="Call Driver"
                          >
                            <Phone className="w-3.5 h-3.5 stroke-[2]" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Assalam o Alaikum, inquiring about driver duty (${driver.city12 || 'city duty'}/12h) in ${driver.city || 'Pakistan'} on SafarPK.`
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
              })
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#101828]">
                    No chauffeurs found matching &ldquo;{searchQuery || searchWhere || city}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                    Try searching by chauffeur name, language or experience tag.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs shadow-xs hover:bg-[#08513C] transition cursor-pointer"
                >
                  Reset Search & View All Drivers
                </button>
              </div>
            ))}

            {/* 3. CITY TO CITY RIDES */}
            {activeServiceIdx === 2 &&
              (filteredRides.length > 0 ? (
                filteredRides.map((ride) => {
                const cleanPhone = (ride.phone || '').replace(/[^0-9]/g, '');

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
                          href={`tel:${ride.phone || ''}`}
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
              })
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#101828]">
                    No intercity rides found matching &ldquo;{searchQuery || searchWhere || city}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                    Try searching for major corridors like Lahore to Islamabad or Karachi to Hyderabad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs shadow-xs hover:bg-[#08513C] transition cursor-pointer"
                >
                  Reset Search & View All Rides
                </button>
              </div>
            ))}

            {/* 4. PICK & DROP SHUTTLES */}
            {activeServiceIdx === 3 &&
              (filteredShuttles.length > 0 ? (
                filteredShuttles.map((shuttle) => {
                const cleanPhone = (shuttle.phone || '').replace(/[^0-9]/g, '');

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
                          href={`tel:${shuttle.phone || ''}`}
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
              })
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#101828]">
                    No shuttle routes found in {shuttleCity || searchWhere || city}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                    {shuttlePickupArea || shuttleDropArea
                      ? `No direct corridor found for ${[shuttlePickupArea, shuttleDropArea].filter(Boolean).join(' → ')}. Try selecting another area or view all corridors.`
                      : 'Try searching by area like DHA, Gulberg, Bahria Town, or Canal Road.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShuttlePickupArea('');
                    setShuttleDropArea('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs shadow-xs hover:bg-[#08513C] transition cursor-pointer"
                >
                  Reset Route & View All {shuttleCity || searchWhere || city} Shuttles
                </button>
              </div>
            ))}

            {/* 5. MOVERS */}
            {activeServiceIdx === 4 &&
              (filteredMovers.length > 0 ? (
                filteredMovers.map((mover) => {
                const cleanPhone = (mover.phone || '').replace(/[^0-9]/g, '');

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
                          href={`tel:${mover.phone || ''}`}
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
              })
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#101828]">
                    No movers found matching &ldquo;{searchQuery || searchWhere || city}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                    Try searching for Shehzore, Suzuki Ravi, or Mazda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs shadow-xs hover:bg-[#08513C] transition cursor-pointer"
                >
                  Reset Search & View All Movers
                </button>
              </div>
            ))}
          </div>

          {/* View All Button linking to respective portal */}
          <div className="px-4 pt-1">
            <Link
              href={
                curService.id === 'rent_car'
                  ? `/cars?city=${encodeURIComponent(city)}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
                  : curService.id === 'drivers'
                  ? `/drivers?city=${encodeURIComponent(city)}`
                  : curService.id === 'pick_and_drop'
                  ? `/shuttles?city=${encodeURIComponent(city)}`
                  : curService.id === 'movers'
                  ? `/movers?city=${encodeURIComponent(city)}`
                  : curService.href
              }
              className="w-full h-12 rounded-2xl border border-[#D0D5DD] bg-white text-[#101828] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-[0.99] shadow-2xs cursor-pointer"
            >
              <span>
                {activeServiceIdx === 0
                  ? `Search all cars in ${city}`
                  : curService?.goText || 'Show listings'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[2.4]" />
            </Link>
          </div>
        </section>

        {/* BOOK IN THREE STEPS */}
        <section className="flex flex-col gap-2.5 px-4">
          <h2 className="font-heading font-black text-[19px] text-[#101828]">Book in three steps</h2>
          <div className="bg-white rounded-2xl border border-[#EEF0F2] flex flex-col shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setSearchSheetOpen(true);
              }}
              className="w-full text-left flex gap-3 items-center p-3.5 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-sm text-[#101828]">Select Service</span>
                <span className="text-xs text-[#667085] truncate">Cars, Chauffeurs, City rides, Shuttles, or Movers</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            <a
              href="https://wa.me/923001234567?text=Hello%20SafarPK,%20I%20want%20to%20inquire%20about%20vehicle%20bookings"
              target="_blank"
              rel="noreferrer"
              className="w-full text-left flex gap-3 items-center p-3.5 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-sm text-[#101828]">Request on WhatsApp</span>
                <span className="text-xs text-[#667085] truncate">Direct communication with verified fleet hosts</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </a>

            <div className="flex gap-3 items-center p-3.5">
              <span className="w-8 h-8 rounded-full bg-[#0B6B4F] text-white font-heading font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="flex flex-col flex-1 min-w-0">
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
      {/* 6. SEARCH BOTTOM SHEET (Segmented 5-Col Grid & Non-Keyboard Pickers)      */}
      {/* ========================================================================= */}
      {searchSheetOpen && (
        <div className="fixed inset-0 z-[999990] bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setSearchSheetOpen(false)}
            aria-label="Close search"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-6 max-h-[92vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-0.5 shrink-0" />

            <div className="flex items-center justify-between pb-0.5">
              <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">
                {curService?.title || 'Rent a Car'}
              </h3>
              <button
                type="button"
                onClick={() => setSearchSheetOpen(false)}
                className="h-7.5 px-3 rounded-full bg-[#F2F4F7] hover:bg-slate-200 font-semibold text-xs text-slate-700 cursor-pointer transition"
              >
                Cancel
              </button>
            </div>

            {/* 5-Column Segmented Grid Switcher (Movers 100% visible, no horizontal scroll) */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-[#F4F6F8] rounded-2xl border border-[#EEF0F2]">
              {services.map((s, idx) => {
                const Icon = s.icon;
                const isSelected = activeServiceIdx === idx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveServiceIdx(idx)}
                    className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-white text-[#0B6B4F] shadow-2xs font-extrabold border border-[#DCE7E1]'
                        : 'text-[#667085] hover:text-[#101828] font-semibold'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-0.5 shrink-0 ${isSelected ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                    <span className="text-[10px] leading-[1.15] text-center tracking-tight">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Self-drive vs With Driver Segmented Toggle (Car Rental Only - At top for clarity) */}
            {activeServiceIdx === 0 && (
              <div className="grid grid-cols-2 gap-1 bg-[#F4F6F8] p-1 rounded-xl border border-[#EEF0F2]">
                <button
                  type="button"
                  onClick={() => setIsSelfDrive(true)}
                  className={`h-8.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isSelfDrive
                      ? 'bg-[#0B6B4F] text-white shadow-xs'
                      : 'text-[#475467] hover:text-[#101828]'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Self-drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSelfDrive(false)}
                  className={`h-8.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !isSelfDrive
                      ? 'bg-[#0B6B4F] text-white shadow-xs'
                      : 'text-[#475467] hover:text-[#101828]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>With driver</span>
                </button>
              </div>
            )}

            {/* Live Search & Model Keyword Input Box */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#0B6B4F] stroke-[2.2]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeServiceIdx === 0
                    ? 'Search car name, model or city (e.g. Civic, Fortuner...)'
                    : activeServiceIdx === 1
                    ? 'Search driver name, city or tag (e.g. Tariq, Executive...)'
                    : activeServiceIdx === 2
                    ? 'Search city or car (e.g. Lahore, Islamabad, Civic...)'
                    : activeServiceIdx === 3
                    ? 'Search corridor stop (e.g. DHA, Gulberg...)'
                    : 'Search truck or area (e.g. Shehzore, Johar Town...)'
                }
                className="w-full h-10.5 pl-9.5 pr-9 rounded-xl bg-[#F4F6F8] border border-[#D0D5DD] text-xs font-semibold text-[#101828] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#0B6B4F] focus:bg-white focus:ring-2 focus:ring-[#0B6B4F]/20 shadow-2xs transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Form Fields Card */}
            <div className="border border-[#E4E7EC] rounded-2xl overflow-hidden bg-white divide-y divide-[#EEF0F2]">
              {/* SERVICE 0: CAR RENTAL & SERVICE 1: DRIVERS */}
              {(activeServiceIdx === 0 || activeServiceIdx === 1) && (
                <div className="flex items-center gap-3 h-[48px] px-3.5 hover:bg-slate-50/70 transition">
                  <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setCitySheetOpen(true)}
                    className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                        {activeServiceIdx === 1 ? 'City / Location (شہر)' : 'Pick-up City'}
                      </span>
                      <span className="text-xs font-bold text-[#101828]">
                        {searchWhere || city || 'Select City'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* SERVICE 2: CITY TO CITY */}
              {activeServiceIdx === 2 && (
                <>
                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setC2cPickerSheetOpen('from')}
                      className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                          Leaving from
                        </span>
                        <span className="text-xs font-bold text-[#101828]">
                          {c2cFromCity || city}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSwapC2cCities}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Swap routes"
                      aria-label="Swap cities"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Flag className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setC2cPickerSheetOpen('to')}
                      className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                          Going to (Destination City)
                        </span>
                        <span className="text-xs font-bold text-[#101828]">
                          {c2cToCity}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </>
              )}

              {/* SERVICE 3: PICK & DROP SHUTTLES */}
              {activeServiceIdx === 3 && (
                <>
                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button type="button" onClick={() => setCitySheetOpen(true)} className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0">
                      <div>
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">Commute City</span>
                        <span className="text-xs font-bold text-[#101828]">{shuttleCity || city}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Navigation className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button type="button" onClick={() => setShuttleAreaSheetOpen('pickup')} className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">Pick-up area (Home Stop)</span>
                        <span className="text-xs font-bold text-[#101828] truncate block">{shuttlePickupArea || 'Select pickup corridor stop'}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Flag className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button type="button" onClick={() => setShuttleAreaSheetOpen('drop')} className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">Drop-off (Office or School Stop)</span>
                        <span className="text-xs font-bold text-[#101828] truncate block">{shuttleDropArea || 'Select drop-off corridor stop'}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>
                </>
              )}

              {/* SERVICE 4: MOVERS */}
              {activeServiceIdx === 4 && (
                <>
                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button type="button" onClick={() => setCitySheetOpen(true)} className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0">
                      <div>
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">City / Location</span>
                        <span className="text-xs font-bold text-[#101828]">{searchWhere || city}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Navigation className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setMoverAreaSheetOpen('from')}
                      className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                          Pickup Location (کہاں سے)
                        </span>
                        <span className={`text-xs truncate block ${moverFromArea ? 'text-[#0B6B4F] font-bold' : 'text-slate-400 font-medium'}`}>
                          {moverFromArea || 'Select pickup area'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 h-[48px] px-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Flag className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setMoverAreaSheetOpen('to')}
                      className="flex-1 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer p-0"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                          Drop-off Location (کہاں تک)
                        </span>
                        <span className={`text-xs truncate block ${moverToArea ? 'text-[#0B6B4F] font-bold' : 'text-slate-400 font-medium'}`}>
                          {moverToArea || 'Select drop area'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <label className="relative flex items-center gap-3 h-[48px] px-3.5 cursor-pointer hover:bg-slate-50/70 transition">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                        Shifting Date
                      </span>
                      <span className="text-xs font-bold text-[#101828]">
                        {moverDate ? formatDateDisplay(moverDate) : `Today (${formatDateDisplay(todayDateStr)})`}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#0B6B4F] bg-[#E9F3EE] px-2 py-0.5 rounded-md shrink-0">
                      Select Date
                    </span>
                    <input
                      type="date"
                      min={todayDateStr}
                      value={moverDate || todayDateStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && val < todayDateStr) {
                          setMoverDate(todayDateStr);
                          showToast('Past dates cannot be selected');
                        } else if (val) {
                          setMoverDate(val);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </>
              )}

              {/* SERVICE 1: DRIVERS - DUTY DATE (Clean single-tap date picker, NO bulky buttons) */}
              {activeServiceIdx === 1 && (
                <label className="relative flex items-center gap-3 h-[50px] px-3.5 cursor-pointer hover:bg-slate-50/70 transition">
                  <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                      When needed / Starting Date
                    </span>
                    <span className="text-xs font-bold text-[#101828] truncate block">
                      {/* Any Date (Flexible) */}
                      {(!pickupDate || pickupDate === todayDateStr)
                        ? `Today (${formatDateDisplay(todayDateStr)})`
                        : pickupDate === tomorrowDateStr
                        ? `Tomorrow (${formatDateDisplay(tomorrowDateStr)})`
                        : formatDateDisplay(pickupDate)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#0B6B4F] bg-[#E9F3EE] px-2 py-0.5 rounded-md shrink-0">
                    Select Date
                  </span>
                  <input
                    type="date"
                    min={todayDateStr}
                    value={pickupDate || todayDateStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && val < todayDateStr) {
                        setPickupDate(todayDateStr);
                        showToast('Past dates cannot be selected');
                      } else if (val) {
                        setPickupDate(val);
                        showToast(`Duty date set to ${formatDateDisplay(val)}`);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              )}

              {/* SERVICE 0: CAR RENTALS - PICKUP & RETURN DATES (Clean 2-Column Side-by-Side, NO bulky buttons) */}
              {activeServiceIdx === 0 && (
                <div className="grid grid-cols-2 divide-x divide-[#EEF0F2]">
                  {/* Pick-up date */}
                  <label className="relative flex items-center gap-2.5 h-[50px] px-3 cursor-pointer hover:bg-slate-50/70 transition">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                        Pick-up Date
                      </span>
                      <span className="text-xs font-bold text-[#101828] truncate block">
                        {(!pickupDate || pickupDate === todayDateStr)
                          ? `Today (${formatDateDisplay(todayDateStr)})`
                          : formatDateDisplay(pickupDate)}
                      </span>
                    </div>
                    <input
                      type="date"
                      min={todayDateStr}
                      value={pickupDate || todayDateStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && val < todayDateStr) {
                          setPickupDate(todayDateStr);
                          showToast('Past dates cannot be selected');
                        } else if (val) {
                          setPickupDate(val);
                          if (returnDate && returnDate < val) setReturnDate(val);
                          showToast(`Pick-up date: ${formatDateDisplay(val)}`);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>

                  {/* Return date */}
                  <label className="relative flex items-center gap-2.5 h-[50px] px-3 cursor-pointer hover:bg-slate-50/70 transition">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                        Return Date
                      </span>
                      <span className={`text-xs font-bold truncate block ${returnDate ? 'text-[#101828]' : 'text-slate-400'}`}>
                        {returnDate ? formatDateDisplay(returnDate) : 'Select return'}
                      </span>
                    </div>
                    <input
                      type="date"
                      min={pickupDate || todayDateStr}
                      value={returnDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const minAllowed = pickupDate || todayDateStr;
                        if (val && val < minAllowed) {
                          setReturnDate(minAllowed);
                          showToast('Return date cannot be before pickup date');
                        } else if (val) {
                          setReturnDate(val);
                          showToast(`Return date: ${formatDateDisplay(val)}`);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              )}

              {/* SERVICE 0: TRANSMISSION (Prominent Inline 3-Pill Switcher - 100% visible, never cut off) */}
              {activeServiceIdx === 0 && (
                <div className="flex items-center justify-between h-[46px] px-3.5 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <span className="text-xs font-bold text-[#344054]">Transmission</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F4F6F8] p-1 rounded-xl border border-[#EEF0F2]">
                    {(['All', 'Automatic', 'Manual'] as const).map((trans) => {
                      const isSelected = selectedTransmission === trans;
                      return (
                        <button
                          key={trans}
                          type="button"
                          onClick={() => {
                            setSelectedTransmission(trans);
                            showToast(`Transmission: ${trans === 'All' ? 'Any' : trans}`);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#0B6B4F] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {trans === 'All' ? 'Any' : trans}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SERVICE 0: VEHICLE TYPE & DAILY BUDGET (Clean 2-Column Side-by-Side) */}
              {activeServiceIdx === 0 && (
                <div className="grid grid-cols-2 divide-x divide-[#EEF0F2]">
                  <button
                    type="button"
                    onClick={() => setCarCategorySheetOpen(true)}
                    className="flex items-center gap-2 h-[48px] px-3 text-left hover:bg-slate-50/70 transition cursor-pointer border-0 bg-transparent"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Car className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                        Vehicle Type
                      </span>
                      <span className="text-xs font-bold text-[#101828] truncate block">
                        {CAR_CATEGORIES[selectedCarCategory] || 'All cars'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriceSheetOpen(true)}
                    className="flex items-center gap-2 h-[48px] px-3 text-left hover:bg-slate-50/70 transition cursor-pointer border-0 bg-transparent"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wide block leading-none mb-0.5">
                        Daily Budget
                      </span>
                      <span className="text-xs font-bold text-[#101828] truncate block">
                        {selectedPriceMax ? `< PKR ${selectedPriceMax.toLocaleString()}` : 'Any budget'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons: Reset & Show Listings */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCarCategory(0);
                  setSelectedTransmission('All');
                  setSelectedPriceMax(null);
                  setPickupDate(todayDateStr);
                  setReturnDate('');
                  setIsSelfDrive(true);
                  setShuttlePickupArea('');
                  setShuttleDropArea('');
                  setMoverFromArea('');
                  setMoverToArea('');
                  showToast('Search & filters reset');
                }}
                className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 font-bold text-xs transition cursor-pointer shrink-0"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchSheetOpen(false);
                  setIsFilteredResultsView(true);
                  const count =
                    activeServiceIdx === 0
                      ? filteredCars.length
                      : activeServiceIdx === 1
                      ? filteredDrivers.length
                      : activeServiceIdx === 2
                      ? filteredRides.length
                      : activeServiceIdx === 3
                      ? filteredShuttles.length
                      : filteredMovers.length;
                  showToast(
                    searchQuery
                      ? `Found ${count} "${searchQuery}" listings`
                      : `Found ${count} listings in ${searchWhere || city}`
                  );
                }}
                className="flex-1 h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.4]" />
                <span className="truncate">
                  {`Show listings (${
                    activeServiceIdx === 0
                      ? filteredCars.length
                      : activeServiceIdx === 1
                      ? filteredDrivers.length
                      : activeServiceIdx === 2
                      ? filteredRides.length
                      : activeServiceIdx === 3
                      ? filteredShuttles.length
                      : filteredMovers.length
                  })`}
                </span>
              </button>
            </div>

            <span className="text-center text-[11px] text-[#667085] pb-1">
              Pay the owner at pick-up · zero advance deposit
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-SHEETS (ALWAYS RENDERED IN FRONT WITH z-[1000005])                 */}
      {/* ========================================================================= */}

      {/* CITY PICKER SUB-SHEET */}
      {citySheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setCitySheetOpen(false)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCitySheetOpen(false)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">Choose your city</h3>
              </div>
              <button
                type="button"
                onClick={() => setCitySheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
              />
              {citySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCitySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {PAKISTAN_CITIES
                .filter((c) => !citySearchQuery || c.name.toLowerCase().includes(citySearchQuery.toLowerCase()))
                .map((c) => {
                  const isSelected = activeServiceIdx === 3
                    ? c.name === (shuttleCity || city)
                    : c.name === (searchWhere || city);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setCity(c.name);
                        if (activeServiceIdx === 3) {
                          setShuttleCity(c.name);
                          setShuttlePickupArea('');
                          setShuttleDropArea('');
                        } else {
                          setSearchWhere(c.name);
                        }
                        setCitySheetOpen(false);
                        setCitySearchQuery('');
                        showToast(`City set to ${c.name}`);
                      }}
                      className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                        isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                        <span>{c.name}</span>
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* CITY TO CITY PICKER SUB-SHEET */}
      {c2cPickerSheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setC2cPickerSheetOpen(null)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setC2cPickerSheetOpen(null)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">
                  {c2cPickerSheetOpen === 'from' ? 'Select Departure City' : 'Select Destination City'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setC2cPickerSheetOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={c2cSearchQuery}
                onChange={(e) => setC2cSearchQuery(e.target.value)}
                placeholder="Search city hub or terminal..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
              />
              {c2cSearchQuery && (
                <button
                  type="button"
                  onClick={() => setC2cSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {MAJOR_HUBS
                .filter((hub) => !c2cSearchQuery || hub.toLowerCase().includes(c2cSearchQuery.toLowerCase()))
                .map((hub) => {
                  const isSelected = (c2cPickerSheetOpen === 'from' ? c2cFromCity : c2cToCity) === hub;
                  return (
                    <button
                      key={hub}
                      type="button"
                      onClick={() => {
                        if (c2cPickerSheetOpen === 'from') setC2cFromCity(hub);
                        else setC2cToCity(hub);
                        setC2cPickerSheetOpen(null);
                        setC2cSearchQuery('');
                        showToast(`${c2cPickerSheetOpen === 'from' ? 'Departure' : 'Destination'} set to ${hub}`);
                      }}
                      className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                        isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                        <span>{hub}</span>
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SHUTTLE AREA PICKER SUB-SHEET */}
      {shuttleAreaSheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setShuttleAreaSheetOpen(null)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShuttleAreaSheetOpen(null)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">
                  {shuttleAreaSheetOpen === 'pickup' ? 'Select Pick-up Stop' : 'Select Drop-off Stop'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShuttleAreaSheetOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shuttleAreaSearchQuery}
                onChange={(e) => setShuttleAreaSearchQuery(e.target.value)}
                placeholder={`Search corridor stops in ${shuttleCity || city}...`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
              />
              {shuttleAreaSearchQuery && (
                <button
                  type="button"
                  onClick={() => setShuttleAreaSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {((CITY_COMMUTE_AREAS as any)[shuttleCity || city] || CITY_COMMUTE_AREAS['Karachi'] || [])
                .filter((area: string) => !shuttleAreaSearchQuery || area.toLowerCase().includes(shuttleAreaSearchQuery.toLowerCase()))
                .map((area: string) => {
                  const isSelected = (shuttleAreaSheetOpen === 'pickup' ? shuttlePickupArea : shuttleDropArea) === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        if (shuttleAreaSheetOpen === 'pickup') setShuttlePickupArea(area);
                        else setShuttleDropArea(area);
                        setShuttleAreaSheetOpen(null);
                        setShuttleAreaSearchQuery('');
                        showToast(`${shuttleAreaSheetOpen === 'pickup' ? 'Pick-up' : 'Drop-off'} stop set to ${area}`);
                      }}
                      className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                        isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Navigation className={`w-4 h-4 ${isSelected ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                        <span>{area}</span>
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MOVER AREA PICKER SUB-SHEET */}
      {moverAreaSheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setMoverAreaSheetOpen(null)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMoverAreaSheetOpen(null)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">
                  {moverAreaSheetOpen === 'from' ? 'Select Pickup Location (کہاں سے)' : 'Select Drop-off Location (کہاں تک)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoverAreaSheetOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={moverAreaSearchQuery}
                onChange={(e) => setMoverAreaSearchQuery(e.target.value)}
                placeholder="Search area, sector, housing scheme..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
              />
              {moverAreaSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMoverAreaSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Location Fallback Button when typing an unlisted area */}
            {moverAreaSearchQuery.trim() && !availableMoverAreas.some((a) => a.toLowerCase() === moverAreaSearchQuery.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  const custom = moverAreaSearchQuery.trim();
                  if (moverAreaSheetOpen === 'from') setMoverFromArea(custom);
                  else setMoverToArea(custom);
                  setMoverAreaSheetOpen(null);
                  setMoverAreaSearchQuery('');
                  showToast(`${moverAreaSheetOpen === 'from' ? 'Pickup' : 'Drop-off'} location set to "${custom}"`);
                }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B6B4F] text-left transition cursor-pointer font-bold text-xs border border-emerald-200 mt-1"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0B6B4F] shrink-0" />
                  <span>Use custom address: <strong>&ldquo;{moverAreaSearchQuery.trim()}&rdquo;</strong></span>
                </span>
                <span className="text-[11px] font-bold text-[#0B6B4F] bg-white px-2.5 py-0.5 rounded-md shadow-2xs shrink-0">
                  Select
                </span>
              </button>
            )}

            <div className="divide-y divide-slate-100 py-1 max-h-[50vh] overflow-y-auto">
              {availableMoverAreas
                .filter((area: string) => !moverAreaSearchQuery || area.toLowerCase().includes(moverAreaSearchQuery.toLowerCase()))
                .map((area: string) => {
                  const isSelected = (moverAreaSheetOpen === 'from' ? moverFromArea : moverToArea) === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        if (moverAreaSheetOpen === 'from') setMoverFromArea(area);
                        else setMoverToArea(area);
                        setMoverAreaSheetOpen(null);
                        setMoverAreaSearchQuery('');
                        showToast(`${moverAreaSheetOpen === 'from' ? 'Pickup' : 'Drop-off'} location set to ${area}`);
                      }}
                      className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                        isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Truck className={`w-4 h-4 ${isSelected ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                        <span>{area}</span>
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TRANSMISSION SUB-SHEET */}
      {transmissionSheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setTransmissionSheetOpen(false)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTransmissionSheetOpen(false)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">Select Transmission</h3>
              </div>
              <button
                type="button"
                onClick={() => setTransmissionSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {[
                { label: 'All transmissions', val: 'All' },
                { label: 'Automatic transmission', val: 'Automatic' },
                { label: 'Manual transmission', val: 'Manual' },
              ].map((opt) => {
                const isSelected = selectedTransmission === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setSelectedTransmission(opt.val as any);
                      setTransmissionSheetOpen(false);
                      showToast(`Transmission set to ${opt.label}`);
                    }}
                    className={`w-full flex items-center justify-between py-3.5 px-3 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                      isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE CATEGORY SUB-SHEET */}
      {carCategorySheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setCarCategorySheetOpen(false)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCarCategorySheetOpen(false)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">Select Vehicle Type</h3>
              </div>
              <button
                type="button"
                onClick={() => setCarCategorySheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {CAR_CATEGORIES.map((catLabel, idx) => {
                const isSelected = selectedCarCategory === idx;
                return (
                  <button
                    key={catLabel}
                    type="button"
                    onClick={() => {
                      setSelectedCarCategory(idx);
                      setCarCategorySheetOpen(false);
                      showToast(`Vehicle category set to ${catLabel}`);
                    }}
                    className={`w-full flex items-center justify-between py-3.5 px-3 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                      isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                    }`}
                  >
                    <span>{catLabel}</span>
                    {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DAILY BUDGET SUB-SHEET */}
      {priceSheetOpen && (
        <div className="fixed inset-0 z-[1000005] bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setPriceSheetOpen(false)}
            aria-label="Close"
          />
          <div className="bg-white rounded-t-[26px] p-4 pb-8 max-h-[85vh] overflow-y-auto flex flex-col gap-2.5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1.5 rounded-full bg-[#D0D5DD] mx-auto mb-1 shrink-0" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPriceSheetOpen(false)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  aria-label="Back to filter options"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Back</span>
                </button>
                <h3 className="font-heading font-extrabold text-[19px] text-[#101828]">Maximum Daily Budget</h3>
              </div>
              <button
                type="button"
                onClick={() => setPriceSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 py-1">
              {[
                { label: 'Any price', val: null },
                { label: 'Under PKR 10,000 / day', val: 10000 },
                { label: 'Under PKR 20,000 / day', val: 20000 },
                { label: 'Under PKR 35,000 / day', val: 35000 },
                { label: 'Under PKR 50,000 / day', val: 50000 },
              ].map((opt) => {
                const isSelected = selectedPriceMax === opt.val;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setSelectedPriceMax(opt.val);
                      setPriceSheetOpen(false);
                      showToast(`Budget set to ${opt.label}`);
                    }}
                    className={`w-full flex items-center justify-between py-3.5 px-3 text-left hover:bg-slate-50 transition cursor-pointer font-semibold text-[15px] rounded-lg ${
                      isSelected ? 'bg-emerald-50 text-[#0B6B4F] font-bold' : 'text-[#101828]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-[#0B6B4F] stroke-[2.6]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
