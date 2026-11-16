'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe,
  PlusCircle,
  User,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Bell,
  MessageSquare,
  Bookmark,
  Sparkles,
  UserCheck,
  Bus,
  Truck,
} from 'lucide-react';
import { COUNTRIES, CountryInfo, SUPPORTED_CURRENCIES, CurrencyInfo } from '@/data/countries';
import { getActiveUser, RegisteredUser, logoutActiveUser } from '@/data/userAuth';
import { useCountry } from '@/app/context/CountryContext';

interface AppHeaderProps {
  currentCountry?: CountryInfo;
  onCountryChange?: (c: CountryInfo) => void;
  accentColor?: string;
}

export function AppHeader({
  currentCountry,
  onCountryChange,
  accentColor = '#0B6B4F',
}: AppHeaderProps) {
  const pathname = usePathname();
  const {
    country: ctxCountry,
    setCountry: ctxSetCountry,
    currency: ctxCurrency,
    setCurrency: ctxSetCurrency,
  } = useCountry();
  const [activeUser, setActiveUserState] = useState<RegisteredUser | null>(null);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (countryMenuRef.current && !countryMenuRef.current.contains(target)) {
        setShowCountryMenu(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(target)) {
        setShowCurrencyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Sync active user
  useEffect(() => {
    setActiveUserState(getActiveUser());
    const handleAuthChange = () => {
      setActiveUserState(getActiveUser());
    };
    window.addEventListener('safarpk_auth_state_changed', handleAuthChange);
    return () => {
      window.removeEventListener('safarpk_auth_state_changed', handleAuthChange);
    };
  }, []);

  const selectedCountry = currentCountry || ctxCountry || COUNTRIES[0];
  const isPakistan = selectedCountry?.code === 'PK';

  const navLinks = [
    { label: 'Rent a car', href: '/' },
    { label: isPakistan ? 'Hire a driver' : 'Hire a chauffeur', href: '/drivers' },
    { label: 'City to city', href: '/city-to-city' },
    { label: 'Pick & drop', href: '/shuttles' },
    { label: isPakistan ? 'Home shifting' : 'Moving & cargo', href: '/movers' },
  ];

  const getDashboardHref = (role?: string) => {
    switch (role) {
      case 'LISTER':
        return '/lister';
      case 'DRIVER':
        return '/driver';
      case 'PROVIDER':
        return '/provider';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  const isCustomer = Boolean(
    activeUser &&
      (activeUser.role === 'CUSTOMER' ||
        String(activeUser.role).toUpperCase() === 'CUSTOMER')
  );

  // Dynamic Role-Aware Listing Action Button Config
  const getListingButtonConfig = () => {
    if (!activeUser) {
      return {
        label: 'List your vehicle',
        href: '/post-ad',
        icon: PlusCircle,
        visible: true,
      };
    }

    const role = (activeUser.role || '').toUpperCase();

    if (role === 'CUSTOMER') {
      return {
        label: '',
        href: '',
        icon: PlusCircle,
        visible: false,
      };
    }

    if (role === 'DRIVER') {
      return {
        label: 'Offer Driving Service',
        href: '/driver?tab=availability',
        icon: UserCheck,
        visible: true,
      };
    }

    if (role === 'PROVIDER') {
      if (activeUser.providerSubtype === 'COMMERCIAL_CARGO') {
        return {
          label: 'List Cargo Service',
          href: '/provider?mode=commercial_cargo&tab=pricing',
          icon: Truck,
          visible: true,
        };
      }
      return {
        label: 'List Pick & Drop Route',
        href: '/provider?mode=pick_and_drop&tab=routes',
        icon: Bus,
        visible: true,
      };
    }

    // Default for LISTER
    return {
      label: 'List your vehicle',
      href: '/lister?tab=add_vehicle&step=1',
      icon: PlusCircle,
      visible: true,
    };
  };

  const listingBtn = getListingButtonConfig();
  const ListingBtnIcon = listingBtn.icon;

  const getListingBtnStyle = () => {
    if (!activeUser) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100';
    }
    const role = (activeUser.role || '').toUpperCase();
    if (role === 'PROVIDER') {
      if (activeUser.providerSubtype === 'COMMERCIAL_CARGO') {
        return 'bg-orange-50 text-[#C2410C] border-orange-200/90 hover:bg-orange-100';
      }
      return 'bg-teal-50 text-teal-800 border-teal-200/90 hover:bg-teal-100';
    }
    if (role === 'DRIVER') {
      return 'bg-blue-50 text-blue-800 border-blue-200/90 hover:bg-blue-100';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs font-sans transition-all">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-17 flex items-center justify-between gap-3 lg:gap-6">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-4 lg:gap-6 xl:gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-extrabold text-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: accentColor }}
            >
              S
            </span>
            <div className="flex flex-col">
              <span className="font-heading font-black text-[20px] sm:text-[22px] tracking-tight text-[#101828] leading-none">
                {selectedCountry.code === 'PK' ? 'SafarPK' : 'Safar'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 hidden xl:block">
                Mobility Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Never Wrap Text) */}
          <nav
            aria-label="Main"
            className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 min-w-0"
          >
            {navLinks.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap px-3 lg:px-3.5 py-1.5 rounded-full text-[13px] lg:text-[14px] font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                  style={isActive ? { backgroundColor: accentColor } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 1. Country Selector Dropdown */}
          <div className="relative" ref={countryMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowCountryMenu(!showCountryMenu);
                setShowCurrencyMenu(false);
              }}
              className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-full border border-slate-200 bg-white text-xs sm:text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
              title="Select Operating Country"
            >
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="hidden lg:inline font-semibold">
                {selectedCountry.name}
              </span>
              <span className="lg:hidden font-bold text-[11px] text-slate-800">
                {selectedCountry.code}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCountryMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Country
                  </p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Global Network
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('safarpk_return_to_country');
                        }
                        if (onCountryChange) onCountryChange(c);
                        else ctxSetCountry(c);
                        setShowCountryMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition ${
                        c.code === selectedCountry.code
                          ? 'bg-[#E9F3EE] text-[#08513C] font-bold'
                          : 'text-[#344054]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      {c.isLive ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Live Fleet
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Independent Currency Selector Dropdown */}
          <div className="relative" ref={currencyMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowCurrencyMenu(!showCurrencyMenu);
                setShowCountryMenu(false);
              }}
              className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-full border border-slate-200 bg-white text-xs sm:text-[13px] font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
              title="Display Currency (Live Auto-Conversion)"
            >
              <span className="text-xs text-emerald-700 font-extrabold">{ctxCurrency.symbol}</span>
              <span className="font-mono text-[11px] font-extrabold text-slate-800">
                {ctxCurrency.code}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Currency
                  </p>
                  <span className="text-[10px] text-slate-400">Live Converted</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {SUPPORTED_CURRENCIES.map((curr) => {
                    const active = curr.code === ctxCurrency.code;
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => {
                          ctxSetCurrency(curr);
                          setShowCurrencyMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition ${
                          active ? 'bg-[#E9F3EE] text-[#08513C] font-bold' : 'text-[#344054]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{curr.flag}</span>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">
                              {curr.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {curr.code === 'PKR' ? 'Base marketplace rate' : `1 ${curr.code} ≈ Rs ${curr.rateToPkr}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {curr.symbol} {curr.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Role-Aware Listing Action Button */}
          {listingBtn.visible && (
            <Link
              href={listingBtn.href}
              className={`hidden sm:inline-flex items-center gap-2 h-9 sm:h-10 px-3.5 sm:px-4 rounded-full text-xs sm:text-[13px] font-bold border shadow-2xs transition-all whitespace-nowrap cursor-pointer hover:shadow-xs ${getListingBtnStyle()}`}
            >
              <ListingBtnIcon className="w-4 h-4 shrink-0" />
              <span>{listingBtn.label}</span>
            </Link>
          )}

          {/* User Sign In or Profile Pill */}
          {activeUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-2.5 h-9 sm:h-10 pl-3 pr-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
              >
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-[#101828] leading-tight truncate max-w-[100px]">
                    {activeUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wide">
                    {activeUser.role}
                  </p>
                </div>
                <div className="relative">
                  {activeUser.avatarUrl ? (
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.name}
                      className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full object-cover shadow-xs border border-slate-200"
                    />
                  ) : (
                    <span
                      className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      {activeUser.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-[#101828] truncate">
                      {activeUser.name}
                    </p>
                    <p className="text-xs text-slate-500">{activeUser.phone}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9F3EE] text-[#0B6B4F]">
                      {activeUser.role}
                    </span>
                  </div>

                  <Link
                    href={getDashboardHref(activeUser.role)}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#344054] hover:bg-[#F7F8FA] transition font-semibold"
                  >
                    <User className="w-4 h-4 text-[#0B6B4F]" />
                    <span>My Dashboard</span>
                  </Link>

                  <Link
                    href="/inbox"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#344054] hover:bg-[#F7F8FA] transition"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <span>Messages</span>
                  </Link>

                  <Link
                    href="/saved"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#344054] hover:bg-[#F7F8FA] transition"
                  >
                    <Bookmark className="w-4 h-4 text-slate-500" />
                    <span>Saved Items</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#344054] hover:bg-[#F7F8FA] transition"
                  >
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    <span>Settings & Profile</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      logoutActiveUser();
                      setActiveUserState(null);
                      setShowUserMenu(false);
                      window.location.href = '/';
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 h-9 sm:h-10 px-4 rounded-full bg-[#101828] text-white text-[13px] sm:text-[14px] font-semibold hover:bg-slate-800 shadow-xs transition"
            >
              <User className="w-4 h-4" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
