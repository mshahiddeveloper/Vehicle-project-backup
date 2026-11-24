'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { Heart, Trash2, ArrowRight, Car, User, Bus, Truck, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { CARS_DATA } from '@/data/marketplaceData';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';
// Integrates with safarpk_saved_vehicles and safarpk_saved_items via @/data/wishlist
import { getSavedWishlistItems, removeWishlistItem } from '@/data/wishlist';

interface SavedItem {
  id: string;
  category: 'car' | 'driver' | 'shuttle' | 'mover';
  name: string;
  sub: string;
  price: string;
  href: string;
  contacted?: string;
}

export default function SavedItemsPage() {
  const [filterIdx, setFilterIdx] = useState<number>(0); // 0: All, 1: Cars, 2: Drivers, 3: Shuttles, 4: Movers
  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const mapCategory = (cat: string): SavedItem['category'] => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('driver')) return 'driver';
    if (lower.includes('shuttle') || lower.includes('pick')) return 'shuttle';
    if (lower.includes('mover') || lower.includes('cargo')) return 'mover';
    return 'car';
  };

  const loadSaved = () => {
    try {
      if (typeof window === 'undefined') return;
      let user = getActiveUser();
      setActiveUser(user);

      if (!user) {
        fetch('/api/auth/me')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.authenticated && data?.user) {
              setActiveUser(data.user);
              user = data.user;
              // Re-run load once user hydrated
              window.dispatchEvent(new CustomEvent('safarpk_auth_state_changed', { detail: data.user }));
            }
          })
          .catch(() => {});
      }

      // Logged out visitors without cookie: show login prompt
      if (!user) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // DB-first: fetch from Neon DB as the primary source
      fetch('/api/wishlist')
        .then((r) => (r.ok ? r.json() : null))
        .then((dbData) => {
          if (dbData && dbData.success && Array.isArray(dbData.items)) {
            const dbMapped: SavedItem[] = dbData.items.map((v: any) => ({
              id: v.vehicle_id,
              category: mapCategory(v.category),
              name: v.title || 'Saved Listing',
              sub: v.specs ? `${v.specs} · ${v.city || 'Pakistan'}` : (v.city || 'Pakistan'),
              price: v.price || 'PKR 5,000 / day',
              href: `/listing/${v.vehicle_id}`,
            }));
            setItems(dbMapped);
          } else {
            // DB returned no items — fall back to localStorage
            const savedList = getSavedWishlistItems();
            const mapped: SavedItem[] = savedList.map((p) => ({
              id: p.id,
              category: mapCategory(p.category || ''),
              name: p.title || p.name || 'Saved Listing',
              sub: p.specs ? `${p.specs} · ${p.city || 'Karachi'}` : (p.sub || p.city || 'Verified Partner'),
              price: p.rate || p.price || 'PKR 10,000 / day',
              href: p.href || (p.id?.startsWith('l-') || p.id?.startsWith('car-') ? `/listing/${p.id}` : `/listing/l-1`),
              contacted: p.contacted,
            }));
            setItems(mapped);
          }
          setIsLoading(false);
        })
        .catch(() => {
          // API call failed — fall back to localStorage
          const savedList = getSavedWishlistItems();
          const mapped: SavedItem[] = savedList.map((p) => ({
            id: p.id,
            category: mapCategory(p.category || ''),
            name: p.title || p.name || 'Saved Listing',
            sub: p.specs ? `${p.specs} · ${p.city || 'Karachi'}` : (p.sub || p.city || 'Verified Partner'),
            price: p.rate || p.price || 'PKR 10,000 / day',
            href: p.href || (p.id?.startsWith('l-') || p.id?.startsWith('car-') ? `/listing/${p.id}` : `/listing/l-1`),
            contacted: p.contacted,
          }));
          setItems(mapped);
          setIsLoading(false);
        });
    } catch (e) {
      setItems([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
    window.addEventListener('safarpk_saved_updated', loadSaved);
    window.addEventListener('safarpk_favorites_updated', loadSaved);
    window.addEventListener('safarpk_auth_state_changed', loadSaved);
    window.addEventListener('storage', loadSaved);
    return () => {
      window.removeEventListener('safarpk_saved_updated', loadSaved);
      window.removeEventListener('safarpk_favorites_updated', loadSaved);
      window.removeEventListener('safarpk_auth_state_changed', loadSaved);
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
    removeWishlistItem(id);
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

        {/* Wishlist Content Section */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#EEF0F2] rounded-2xl p-4 flex items-center gap-3 shadow-2xs animate-pulse"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
              </div>
            ))}
          </div>
        ) : !activeUser ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#EEF0F2] text-center flex flex-col items-center gap-5 shadow-sm mt-1">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-50 to-pink-100 border border-rose-200/60 flex items-center justify-center text-rose-500 shadow-sm">
              <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
            </div>
            <div className="max-w-md flex flex-col gap-2">
              <h2 className="font-heading font-black text-2xl text-[#101828]">
                Sign in to view your Saved items
              </h2>
              <p className="text-sm text-[#475467] leading-relaxed">
                Your saved vehicles, verified chauffeurs, and commuter routes sync in real time across the app and website.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
              <Link
                href="/login?returnUrl=/saved"
                className="w-full sm:flex-1 h-12 px-6 rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-bold text-sm flex items-center justify-center shadow-md hover:shadow-lg transition-all gap-2 cursor-pointer active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register?returnUrl=/saved"
                className="w-full sm:flex-1 h-12 px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-heading font-bold text-sm flex items-center justify-center transition-all gap-2 cursor-pointer active:scale-[0.99]"
              >
                <UserPlus className="w-4 h-4 text-[#0B6B4F] stroke-[2.5]" />
                <span>Create Free Account</span>
              </Link>
            </div>
            <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Fast access with phone number or email</span>
            </div>
          </div>
        ) : filtered.length > 0 ? (
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
          <div className="p-12 rounded-3xl bg-white border border-[#EEF0F2] text-center flex flex-col items-center gap-3 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-black text-xl text-[#101828]">
              Nothing saved in this category
            </h3>
            <p className="text-sm text-[#667085] max-w-sm">
              Tap the heart icon on any car, driver, or shuttle listing across the site to save it to your wishlist.
            </p>
            <Link
              href="/cars"
              className="mt-3 h-12 px-6 rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-bold text-sm flex items-center justify-center shadow-md hover:shadow-lg transition gap-2 active:scale-[0.99]"
            >
              <Car className="w-4 h-4" />
              <span>Explore Car Listings</span>
            </Link>
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

