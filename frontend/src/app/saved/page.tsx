'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { Heart, Trash2, ArrowRight, Car, User, Bus, Truck } from 'lucide-react';

interface SavedItem {
  id: string;
  category: 'car' | 'driver' | 'shuttle' | 'mover';
  name: string;
  sub: string;
  price: string;
  href: string;
  contacted?: string;
}

const INITIAL_SAVED: SavedItem[] = [
  {
    id: 's-1',
    category: 'car',
    name: 'Honda Civic Oriel Turbo 2024',
    sub: 'Kashif Motors · Islamabad',
    price: 'PKR 14,000 / day',
    href: '/listing/l-1',
    contacted: '✓ Request sent · Today',
  },
  {
    id: 's-2',
    category: 'driver',
    name: 'Imran Khan (Professional Chauffeur)',
    sub: '12 years exp · Motorway M-2 expert',
    price: 'Rs. 2,500 / 12 hours',
    href: '/drivers',
  },
  {
    id: 's-3',
    category: 'shuttle',
    name: 'Noor Shuttles (Girls School Route)',
    sub: 'DHA Phase 5 ➔ Gulberg III · 2 seats left',
    price: 'Rs. 9,500 / month',
    href: '/shuttles',
  },
  {
    id: 's-4',
    category: 'mover',
    name: 'Al-Makkah Shifting Transport',
    sub: 'Hyundai Shehzore & Mazda · Covered container',
    price: 'Rs. 4,500 base fare',
    href: '/movers',
  },
];

export default function SavedItemsPage() {
  const [filterIdx, setFilterIdx] = useState<number>(0); // 0: All, 1: Cars, 2: Drivers, 3: Shuttles, 4: Movers
  const [items, setItems] = useState<SavedItem[]>(INITIAL_SAVED);

  const chips = ['All', 'Cars', 'Drivers', 'Pick & drop', 'Movers'];

  const filtered = items.filter((item) => {
    if (filterIdx === 1) return item.category === 'car';
    if (filterIdx === 2) return item.category === 'driver';
    if (filterIdx === 3) return item.category === 'shuttle';
    if (filterIdx === 4) return item.category === 'mover';
    return true;
  });

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const getCategoryIcon = (cat: SavedItem['category']) => {
    switch (cat) {
      case 'car':
        return <Car className="w-5 h-5 text-[#0B6B4F]" />;
      case 'driver':
        return <User className="w-5 h-5 text-[#B45309]" />;
      case 'shuttle':
        return <Bus className="w-5 h-5 text-[#6D28D9]" />;
      case 'mover':
        return <Truck className="w-5 h-5 text-[#C2410C]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[880px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-extrabold text-lg sm:text-2xl md:text-3xl text-[#101828] leading-tight">
            Saved items
          </h1>
          <p className="text-xs sm:text-sm text-[#475467]">
            Vehicles, drivers and routes you have saved for easy comparison and booking.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {chips.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilterIdx(idx)}
              className={`h-10 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
                filterIdx === idx
                  ? 'bg-[#101828] text-white border-[#101828]'
                  : 'bg-white text-[#344054] border-[#E4E7EC] hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Items List */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#EEF0F2] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition"
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3.5 flex-1 min-w-0"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#101828] truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#667085] truncate">{item.sub}</p>
                    <span className="font-extrabold text-xs text-[#101828] block mt-0.5">
                      {item.price}
                    </span>
                    {item.contacted && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#1D3A8A] text-[10px] font-bold">
                        {item.contacted}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={item.href}
                    className="h-9 px-3.5 rounded-xl bg-[#101828] text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800 transition"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => handleRemove(item.id)}
                    className="w-9 h-9 rounded-xl bg-[#FEF3F2] text-[#D92D20] flex items-center justify-center hover:bg-red-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-[#EEF0F2] text-center flex flex-col items-center gap-3">
            <Heart className="w-10 h-10 text-slate-300" />
            <h3 className="font-heading font-extrabold text-lg text-[#101828]">
              Nothing saved in this category
            </h3>
            <p className="text-xs text-[#667085] max-w-sm">
              Tap the bookmark or heart icon on any car, driver, or shuttle listing to save it here.
            </p>
            <Link
              href="/"
              className="mt-2 h-10 px-5 rounded-xl bg-[#101828] text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800"
            >
              Explore Listings
            </Link>
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

