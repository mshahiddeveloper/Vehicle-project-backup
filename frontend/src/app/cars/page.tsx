'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Car,
  Search,
  MapPin,
  ChevronDown,
  Filter,
  ArrowLeft,
  Phone,
  Heart,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavBar } from '@/components/MobileNavBar';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { CARS_DATA, VehicleCardItem } from '@/data/marketplaceData';
import { isListingPaused } from '@/data/userAuth';
import { formatPKR } from '@/lib/api';

const PAK_CITIES = [
  'All Cities',
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Peshawar',
  'Multan',
  'Faisalabad',
  'Quetta',
  'Sialkot',
  'Gujranwala',
];

const CAR_CATEGORIES = [
  'All Cars',
  'Sedans',
  'SUVs & 4x4',
  'Economy',
  'Luxury',
  'Vans & Hiace',
];

function CarsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial params
  const paramCity = searchParams?.get('city') || '';
  const paramSearch = searchParams?.get('search') || '';
  const paramCat = searchParams?.get('category') || '';
  const paramTrans = searchParams?.get('transmission') || '';

  // State
  const [selectedCity, setSelectedCity] = useState(paramCity || 'All Cities');
  const [searchQuery, setSearchQuery] = useState(paramSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(paramCat || 'All Cars');
  const [selectedTransmission, setSelectedTransmission] = useState(paramTrans || 'All');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'rating'>('recommended');
  const [savedCarIds, setSavedCarIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Sync with params if they change
  useEffect(() => {
    if (paramCity && paramCity !== selectedCity) setSelectedCity(paramCity);
    if (paramSearch && paramSearch !== searchQuery) setSearchQuery(paramSearch);
  }, [paramCity, paramSearch]);

  // Load saved vehicles from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('safarpk_saved_cars');
      if (saved) setSavedCarIds(JSON.parse(saved));
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSaveCar = (carId: string, carName: string) => {
    let next: string[];
    if (savedCarIds.includes(carId)) {
      next = savedCarIds.filter((id) => id !== carId);
      showToast(`Removed "${carName}" from wishlist`);
    } else {
      next = [...savedCarIds, carId];
      showToast(`Added "${carName}" to wishlist ❤️`);
    }
    setSavedCarIds(next);
    try {
      localStorage.setItem('safarpk_saved_cars', JSON.stringify(next));
    } catch {}
  };

  // Filtered & Sorted Cars
  const filteredCars = useMemo(() => {
    return CARS_DATA.filter((car) => {
      // Exclude paused listings
      if (isListingPaused(car.id)) return false;

      // City filter
      if (selectedCity && selectedCity !== 'All Cities') {
        if (car.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory && selectedCategory !== 'All Cars') {
        if (selectedCategory === 'Economy') {
          if (car.category !== 'Economy' && !car.specs.toLowerCase().includes('fuel') && car.priceNum > 5000) {
            return false;
          }
        } else if (car.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Transmission filter
      if (selectedTransmission !== 'All') {
        const isAuto = car.specs.toLowerCase().includes('auto') || car.specs.toLowerCase().includes('cvt') || car.specs.toLowerCase().includes('ags');
        if (selectedTransmission === 'Automatic' && !isAuto) return false;
        if (selectedTransmission === 'Manual' && isAuto) return false;
      }

      // Keyword query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = car.name.toLowerCase().includes(q);
        const matchesOwner = car.owner.toLowerCase().includes(q);
        const matchesSpecs = car.specs.toLowerCase().includes(q);
        const matchesCity = car.city.toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesSpecs && !matchesCity) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.priceNum - b.priceNum;
      if (sortBy === 'price_high') return b.priceNum - a.priceNum;
      if (sortBy === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
      return 0; // recommended default
    });
  }, [selectedCity, selectedCategory, selectedTransmission, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#101828] font-sans flex flex-col antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#101828] text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-fade-in border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 stroke-[2.4]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden md:block">
        <AppHeader />
      </div>

      {/* Mobile Top Header (App Look) */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#EEF0F2] px-3.5 pt-2.5 pb-2.5 flex flex-col gap-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Search Box in Header */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Corolla, Civic, Yaris, Prado..."
              className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-1 h-10 px-2.5 rounded-xl bg-[#E9F3EE] text-[#08513C] font-bold text-xs shrink-0 border border-[#D0E5DA] cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0B6B4F]" />
              <span className="max-w-[70px] truncate">{selectedCity === 'All Cities' ? 'Pakistan' : selectedCity}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute right-0 top-12 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-60 overflow-y-auto">
                {PAK_CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c);
                      setCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold transition flex items-center justify-between ${
                      selectedCity === c ? 'bg-emerald-50 text-[#0B6B4F]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c}</span>
                    {selectedCity === c && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Filter Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CAR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#101828] text-white shadow-xs'
                  : 'bg-white border border-[#E4E7EC] text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="w-px h-5 bg-slate-200 shrink-0 mx-1" />
          {['All', 'Automatic', 'Manual'].map((tr) => (
            <button
              key={tr}
              type="button"
              onClick={() => setSelectedTransmission(tr)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                selectedTransmission === tr
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-[#E4E7EC] text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-8 flex-1 flex flex-col gap-5">
        {/* Desktop Breadcrumb & Heading */}
        <div className="hidden md:flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-[#667085] font-semibold">
            <Link href="/" className="hover:text-[#0B6B4F]">Home</Link>
            <span>/</span>
            <span className="text-[#101828]">Rent a Car</span>
            {selectedCity !== 'All Cities' && (
              <>
                <span>/</span>
                <span className="text-emerald-700 font-bold">{selectedCity}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#101828]">
                {selectedCity === 'All Cities' ? 'Car Rentals in Pakistan' : `Rent a Car in ${selectedCity}`}
              </h1>
              <p className="text-xs sm:text-sm text-[#475467] mt-1">
                Browse verified direct fleet rentals. Zero advance holding, direct WhatsApp & phone contact with owners.
              </p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
              {filteredCars.length} Verified Cars Available
            </span>
          </div>
        </div>

        {/* Results Count & Sort Bar */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-700">
            Showing <strong className="text-emerald-800 font-extrabold">{filteredCars.length}</strong> vehicles
            {selectedCity !== 'All Cities' && ` in ${selectedCity}`}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-800 outline-none cursor-pointer shadow-2xs"
            >
              <option value="recommended">Recommended</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Top Rated (4.8+)</option>
            </select>
          </div>
        </div>

        {/* CARS GRID / LISTING CARDS */}
        {filteredCars.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4 my-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mx-auto">
              🚗
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-black text-lg text-slate-900">
                No vehicles matched your search
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No cars found in {selectedCity} for &ldquo;{searchQuery || selectedCategory}&rdquo;. Try clearing filters or exploring other major cities.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCity('All Cities');
                setSelectedCategory('All Cars');
                setSelectedTransmission('All');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-bold text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Reset Filters & View All Pakistan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredCars.map((car) => {
              const isSaved = savedCarIds.includes(car.id);
              const cleanPhone = (car.phone || '').replace(/[^0-9]/g, '');
              const waMessage = encodeURIComponent(
                `Hello ${car.owner}, I found your ${car.name} (${car.city}) on SafarPK. Is it available for rent?`
              );

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-[20px] p-3 flex flex-col gap-3 border border-[#EEF0F2] shadow-2xs hover:shadow-md hover:border-emerald-300 transition group"
                >
                  {/* Image & Badges */}
                  <div className="relative w-full h-44 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                    <Link href={`/listing/${car.id}`} className="block w-full h-full">
                      {car.image ? (
                        <img
                          src={car.image}
                          alt={car.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🚗
                        </div>
                      )}
                    </Link>

                    {/* City Badge */}
                    <span className="absolute left-2.5 bottom-2.5 px-2.5 py-1 rounded-full bg-white/95 text-[11px] font-bold text-[#101828] shadow-xs backdrop-blur-xs">
                      {car.city}
                    </span>

                    {/* Category Badge */}
                    <span className="absolute left-2.5 top-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
                      {car.category}
                    </span>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={() => toggleSaveCar(car.id, car.name)}
                      className="absolute right-2.5 top-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-rose-600 flex items-center justify-center shadow-xs transition active:scale-90 cursor-pointer"
                      title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'text-rose-600 fill-rose-600' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 flex flex-col justify-between gap-2.5">
                    <div>
                      <Link href={`/listing/${car.id}`}>
                        <h3 className="font-heading font-extrabold text-base text-[#101828] group-hover:text-emerald-700 transition leading-snug">
                          {car.name}
                        </h3>
                        <p className="text-xs text-[#667085] mt-0.5">{car.specs}</p>
                      </Link>

                      {/* Host & Rating */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs">
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                          ★ {car.rating || 4.8}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-emerald-800 truncate">
                          {car.owner}
                        </span>
                      </div>
                    </div>

                    {/* Rate & Direct Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Daily Rent</span>
                        <span className="font-heading font-black text-base text-[#101828]">
                          PKR {formatPKR(car.priceNum)}
                          <span className="text-xs font-normal text-slate-500"> /day</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Call Button */}
                        <a
                          href={`tel:${cleanPhone}`}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
                          title={`Call ${car.owner}`}
                        >
                          <Phone className="w-4 h-4" />
                        </a>

                        {/* Direct WhatsApp Button */}
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#075E54] flex items-center justify-center transition active:scale-95 cursor-pointer border border-[#25D366]/30"
                          title="WhatsApp Owner directly"
                        >
                          <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile App Bottom Nav Bar (No footer on mobile) */}
      <div className="md:hidden">
        <MobileNavBar />
      </div>
    </div>
  );
}

export default function CarsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs font-bold text-slate-400">
          Loading SafarPK Cars Directory...
        </div>
      }
    >
      <CarsDirectoryContent />
    </Suspense>
  );
}
