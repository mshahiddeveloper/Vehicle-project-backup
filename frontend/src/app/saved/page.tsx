'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { Heart, Trash2, ArrowRight, Car, User, Bus, Truck } from 'lucide-react';
import { CARS_DATA } from '@/data/marketplaceData';

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

  const loadSaved = () => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('safarpk_saved_items');
      let customItems: SavedItem[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          customItems = parsed.map((p: any) => {
            const cat = (p.category || '').toLowerCase();
            const mappedCat: SavedItem['category'] =
              cat.includes('driver') ? 'driver' :
              cat.includes('shuttle') || cat.includes('pick') ? 'shuttle' :
              cat.includes('mover') || cat.includes('cargo') ? 'mover' : 'car';

            return {
              id: p.id || `custom-${Date.now()}-${Math.random()}`,
              category: mappedCat,
              name: p.title || p.name || 'Saved Listing',
              sub: p.specs ? `${p.specs} · ${p.city || 'Karachi'}` : (p.sub || p.city || 'Verified Partner'),
              price: p.rate || p.price || 'PKR 10,000 / day',
              href: p.href || (p.id?.startsWith('l-') || p.id?.startsWith('car-') ? `/listing/${p.id}` : `/listing/l-1`),
              contacted: p.contacted,
            };
          });
        }
      }

      // Also resolve any vehicle IDs saved via mobile vehicle cards (safarpk_saved_vehicles)
      const rawVehicles = localStorage.getItem('safarpk_saved_vehicles');
      if (rawVehicles) {
        try {
          const vIds = JSON.parse(rawVehicles);
          if (Array.isArray(vIds)) {
            for (const vId of vIds) {
              if (!customItems.some((it) => it.id === vId)) {
                const foundCar = CARS_DATA.find((c) => c.id === vId);
                if (foundCar) {
                  customItems.unshift({
                    id: foundCar.id,
                    category: 'car',
                    name: foundCar.name,
                    sub: `${foundCar.specs} · ${foundCar.city}`,
                    price: `${foundCar.price} / day`,
                    href: `/listing/${foundCar.id}`,
                  });
                }
              }
            }
          }
        } catch (e) {}
      }

      const seen = new Set<string>();
      const merged: SavedItem[] = [];
      for (const item of [...customItems, ...INITIAL_SAVED]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
      setItems(merged);
    } catch (e) {
      setItems(INITIAL_SAVED);
    }
  };

  useEffect(() => {
    loadSaved();
    window.addEventListener('safarpk_saved_updated', loadSaved);
    window.addEventListener('safarpk_favorites_updated', loadSaved);
    window.addEventListener('storage', loadSaved);
    return () => {
      window.removeEventListener('safarpk_saved_updated', loadSaved);
      window.removeEventListener('safarpk_favorites_updated', loadSaved);
      window.removeEventListener('storage', loadSaved);
    };
  }, []);

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
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('safarpk_saved_items');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((item: any) => (item.id || item) !== id);
            localStorage.setItem('safarpk_saved_items', JSON.stringify(updated));
          }
        }
        const rawVehicles = localStorage.getItem('safarpk_saved_vehicles');
        if (rawVehicles) {
          const parsedVehicles = JSON.parse(rawVehicles);
          if (Array.isArray(parsedVehicles)) {
            const updatedVehicles = parsedVehicles.filter((vId: string) => vId !== id);
            localStorage.setItem('safarpk_saved_vehicles', JSON.stringify(updatedVehicles));
          }
        }
        window.dispatchEvent(new Event('safarpk_saved_updated'));
        window.dispatchEvent(new Event('safarpk_favorites_updated'));
      }
    } catch (e) {}
  };

  const getCategoryIcon = (cat: SavedItem['category']) => {
    switch (cat) {
      case 'car':
        return (
          <div className="w-12 h-12 rounded-2xl bg-[#E9F3EE] flex items-center justify-center shrink-0">
            <Car className="w-6 h-6 text-[#0B6B4F]" />
          </div>
        );
      case 'driver':
        return (
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3F2] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-[#B45309]" />
          </div>
        );
      case 'shuttle':
        return (
          <div className="w-12 h-12 rounded-2xl bg-[#F4EBFF] flex items-center justify-center shrink-0">
            <Bus className="w-6 h-6 text-[#6D28D9]" />
          </div>
        );
      case 'mover':
        return (
          <div className="w-12 h-12 rounded-2xl bg-[#FFECE5] flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-[#C2410C]" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col pb-20 md:pb-0">
      <AppHeader />

      <main className="flex-1 max-w-[880px] w-full mx-auto px-4 sm:px-8 py-6 md:py-10 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#101828] leading-tight">
            Saved
          </h1>
          <p className="text-xs sm:text-sm text-[#667085]">
            Saved items are kept on your account, on the app and the website.
          </p>
        </div>

        {/* Filter Chips - Matching Page 48 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {chips.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilterIdx(idx)}
              className={`h-9 px-4 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-2xs ${
                filterIdx === idx
                  ? 'bg-[#101828] text-white'
                  : 'bg-white text-[#344054] border border-[#E4E7EC] hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Items List - Matching Page 48 */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#EEF0F2] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition"
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3.5 flex-1 min-w-0"
                >
                  {getCategoryIcon(item.category)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-sm text-[#101828] truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#667085] truncate mt-0.5">{item.sub}</p>
                    <span className="font-heading font-black text-sm text-[#101828] block mt-1">
                      {item.price}
                    </span>
                    {item.contacted && (
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#EFF8FF] text-[#175CD3] text-[11px] font-bold">
                        {item.contacted}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Red Heart Toggle Button - Page 48 Exact Match */}
                <button
                  type="button"
                  aria-label={`Remove ${item.name} from saved`}
                  onClick={() => handleRemove(item.id)}
                  className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition active:scale-90 shrink-0 cursor-pointer"
                  title="Remove from saved"
                >
                  <Heart className="w-5 h-5 fill-[#D92D20] text-[#D92D20]" />
                </button>
              </div>
            ))}

            <p className="text-center text-xs text-[#667085] pt-3">
              Saved items are kept on your account, on the app and the website.
            </p>
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-[#EEF0F2] text-center flex flex-col items-center gap-3 shadow-2xs">
            <Heart className="w-10 h-10 text-slate-300" />
            <h3 className="font-heading font-extrabold text-lg text-[#101828]">
              Nothing saved in this category
            </h3>
            <p className="text-xs text-[#667085] max-w-sm">
              Tap the bookmark or heart icon on any car, driver, or shuttle listing to save it here.
            </p>
            <Link
              href="/"
              className="mt-2 h-10 px-5 rounded-xl bg-[#0B6B4F] text-white font-bold text-xs flex items-center justify-center hover:bg-[#08513C] transition"
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

