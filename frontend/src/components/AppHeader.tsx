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
  Menu,
  X,
  Car,
  Coins,
  ArrowRight,
  Phone,
  Check,
} from 'lucide-react';
import { COUNTRIES, CountryInfo, SUPPORTED_CURRENCIES, CurrencyInfo } from '@/data/countries';
import { getActiveUser, RegisteredUser, logoutActiveUser } from '@/data/userAuth';
import { useCountry } from '@/app/context/CountryContext';
import { getSiteBranding, SiteBranding } from '@/data/branding';

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [branding, setBranding] = useState<SiteBranding>(getSiteBranding());

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

  // Sync site branding and logos
  useEffect(() => {
    setBranding(getSiteBranding());
    const handleBrandingChange = (e: any) => {
      setBranding(e.detail || getSiteBranding());
    };
    window.addEventListener('safarpk_branding_changed', handleBrandingChange);
    return () => {
      window.removeEventListener('safarpk_branding_changed', handleBrandingChange);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const selectedCountry = currentCountry || ctxCountry || COUNTRIES[0];
  const isPakistan = selectedCountry?.code === 'PK';

  const navLinks = [
    { label: 'Rent a car', href: '/', icon: Car },
    { label: isPakistan ? 'Hire a driver' : 'Hire a chauffeur', href: '/drivers', icon: UserCheck },
    { label: 'City to city', href: '/city-to-city', icon: Car },
    { label: 'Pick & drop', href: '/shuttles', icon: Bus },
    { label: isPakistan ? 'Home shifting' : 'Moving & cargo', href: '/movers', icon: Truck },
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
      {/* ========================================================================= */}
      {/* 1. DESKTOP HEADER (Screens md and above)                                 */}
      {/* ========================================================================= */}
      <div className="hidden md:flex max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-17 items-center justify-between gap-3 lg:gap-6">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-3 lg:gap-6 xl:gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            {branding.desktopLogoUrl ? (
              <img
                src={branding.desktopLogoUrl}
                alt={branding.portalName || 'SafarPK'}
                className="h-9 w-auto max-w-[200px] object-contain transition-transform duration-200 group-hover:scale-102"
              />
            ) : (
              <>
                <span
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-white flex items-center justify-center font-extrabold text-base sm:text-lg shadow-sm transition-transform duration-200 group-hover:scale-105 shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  S
                </span>
                <div className="flex flex-col shrink-0">
                  <span className="font-heading font-black text-lg sm:text-[22px] tracking-tight text-[#101828] leading-none shrink-0 whitespace-nowrap">
                    {selectedCountry.code === 'PK' ? (branding.portalName || 'SafarPK') : 'Safar'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 hidden xl:block">
                    Mobility Portal
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Main"
            className="flex items-center gap-1 lg:gap-1.5 xl:gap-2 min-w-0"
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* 1. Country Selector Dropdown */}
          <div className="relative" ref={countryMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowCountryMenu(!showCountryMenu);
                setShowCurrencyMenu(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1 sm:gap-1.5 h-8 sm:h-10 px-2 sm:px-3 rounded-full border border-slate-200 bg-white text-xs sm:text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap shrink-0"
              title="Select Operating Country"
            >
              <Globe className="w-3.5 h-3.5 text-[#0B6B4F] shrink-0" />
              <span className="hidden lg:inline font-semibold">
                {selectedCountry.name}
              </span>
              <span className="font-extrabold text-[11px] sm:text-xs text-slate-800 shrink-0">
                {selectedCountry.code}
              </span>
              <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
            </button>

            {showCountryMenu && (
              <div className="absolute top-full mt-2 left-0 w-64 max-w-[280px] bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
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
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1 sm:gap-1.5 h-8 sm:h-10 px-2 sm:px-3 rounded-full border border-slate-200 bg-white text-xs sm:text-[13px] font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap shrink-0"
              title="Display Currency (Live Auto-Conversion)"
            >
              <span className="text-xs text-emerald-700 font-extrabold shrink-0">{ctxCurrency.symbol}</span>
              <span className="font-mono text-[10px] sm:text-[11px] font-extrabold text-slate-800 shrink-0">
                {ctxCurrency.code}
              </span>
              <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
            </button>

            {showCurrencyMenu && (
              <div className="absolute top-full mt-2 left-0 w-72 max-w-[300px] bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
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
              className={`hidden sm:inline-flex items-center gap-1.5 h-8 sm:h-10 px-3 sm:px-4 rounded-full border text-xs sm:text-[13px] font-bold transition shadow-2xs whitespace-nowrap shrink-0 ${getListingBtnStyle()}`}
            >
              <ListingBtnIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{listingBtn.label}</span>
            </Link>
          )}

          {/* User Auth / Profile Dropdown (Desktop) */}
          {activeUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowCountryMenu(false);
                  setShowCurrencyMenu(false);
                }}
                className="flex items-center gap-2 h-8 sm:h-10 px-2 sm:px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-2xs transition cursor-pointer shrink-0"
              >
                <div className="relative">
                  {activeUser.avatarUrl ? (
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.name}
                      className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full object-cover shadow-xs"
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
                <span className="hidden xl:inline text-xs font-bold text-[#101828] max-w-[100px] truncate">
                  {activeUser.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full mt-2 right-0 w-56 max-w-[240px] bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
              className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-2.5 sm:px-4 rounded-full bg-[#101828] text-white text-xs sm:text-[14px] font-bold hover:bg-slate-800 shadow-xs transition shrink-0 whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE HEADER (Clean 3-Lines Icon Left, Logo Center, Account Right)    */}
      {/* ========================================================================= */}
      <div className="flex md:hidden h-15 items-center justify-between px-3 w-full">
        {/* Left: 3-lines Menu Icon Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100/90 hover:bg-slate-200 active:scale-95 text-slate-800 transition cursor-pointer shrink-0 shadow-2xs border border-slate-200/60"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        {/* Center: Brand Logo (Always perfectly centered) */}
        <Link href="/" className="flex items-center justify-center group shrink-0 max-w-[170px]">
          {branding.mobileLogoUrl ? (
            <img
              src={branding.mobileLogoUrl}
              alt={branding.portalName || 'SafarPK'}
              className="h-8 max-h-8 w-auto max-w-[140px] object-contain"
            />
          ) : branding.desktopLogoUrl ? (
            <img
              src={branding.desktopLogoUrl}
              alt={branding.portalName || 'SafarPK'}
              className="h-8 max-h-8 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                S
              </span>
              <span className="font-heading font-black text-lg tracking-tight text-[#101828] leading-none whitespace-nowrap">
                {selectedCountry.code === 'PK' ? (branding.portalName || 'SafarPK') : 'Safar'}
              </span>
            </div>
          )}
        </Link>

        {/* Right: Account or Sign In (Equal width w-9 to keep logo strictly centered) */}
        <div className="w-9 h-9 flex items-center justify-end shrink-0">
          {activeUser ? (
            <Link
              href={getDashboardHref(activeUser.role)}
              className="w-8 h-8 rounded-full text-white text-xs font-black flex items-center justify-center shadow-xs shrink-0 hover:ring-2 hover:ring-emerald-400 transition"
              style={{ backgroundColor: accentColor }}
              title="My Account"
            >
              {activeUser.name.slice(0, 2).toUpperCase()}
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-8 h-8 rounded-full bg-[#101828] text-white flex items-center justify-center shadow-xs hover:bg-slate-800 transition shrink-0"
              title="Sign in"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE SLIDING DRAWER (Glassmorphic Left Panel)                       */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-[86vw] max-w-[340px] z-50 bg-white/95 backdrop-blur-2xl border-r border-slate-200/80 shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-out ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Logo & Close Button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <Link
            href="/"
            onClick={() => setMobileDrawerOpen(false)}
            className="flex items-center gap-2 group"
          >
            {branding.mobileLogoUrl ? (
              <img
                src={branding.mobileLogoUrl}
                alt={branding.portalName || 'SafarPK'}
                className="h-7 w-auto max-w-[130px] object-contain"
              />
            ) : branding.desktopLogoUrl ? (
              <img
                src={branding.desktopLogoUrl}
                alt={branding.portalName || 'SafarPK'}
                className="h-7 w-auto max-w-[130px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-extrabold text-xs shadow-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  S
                </span>
                <span className="font-heading font-black text-base text-[#101828]">
                  {branding.portalName || 'SafarPK'}
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 flex items-center justify-center transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* User Status Card */}
          {activeUser ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-slate-50 border border-emerald-100 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs bg-[#0B6B4F]">
                    {activeUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-[#101828] truncate">
                      {activeUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {activeUser.phone}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                  {activeUser.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Link
                  href={getDashboardHref(activeUser.role)}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-center font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[#0B6B4F]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/inbox"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-center font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Messages</span>
                </Link>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <Link
                  href="/settings"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Settings & Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logoutActiveUser();
                    setActiveUserState(null);
                    setMobileDrawerOpen(false);
                    window.location.href = '/';
                  }}
                  className="text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-2.5">
              <div>
                <p className="font-extrabold text-sm text-white">Join {branding.portalName || 'SafarPK'}</p>
                <p className="text-[11px] text-slate-300">Book rides, list vehicles, or earn as a driver</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-2 px-3 rounded-xl bg-white text-[#101828] text-center font-extrabold text-xs shadow-xs hover:bg-slate-100 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-center font-extrabold text-xs transition"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* In-Menu Country Selector */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0B6B4F]" />
                <span>Operating Country</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                {selectedCountry.code}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {COUNTRIES.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('safarpk_return_to_country');
                      }
                      if (onCountryChange) onCountryChange(c);
                      else ctxSetCountry(c);
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* In-Menu Currency Selector */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>Display Currency</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {ctxCurrency.symbol} {ctxCurrency.code}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const active = curr.code === ctxCurrency.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => ctxSetCurrency(curr)}
                    className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold transition cursor-pointer border ${
                      active
                        ? 'bg-[#101828] text-white border-[#101828] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-mono text-[11px]">{curr.code}</span>
                    <span className="text-[9px] opacity-75 font-normal">{curr.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portal Services Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Explore Services
            </p>
            <div className="space-y-0.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${
                      isActive
                        ? 'bg-emerald-50 text-[#0B6B4F] border border-emerald-200/80'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Partner & Lister Portals */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Earn on {branding.portalName || 'SafarPK'}
            </p>
            <div className="space-y-1">
              <Link
                href="/lister?tab=add_vehicle&step=1"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[#0B6B4F] font-bold"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#0B6B4F]" />
                  <span>List Vehicle / Car Fleet</span>
                </div>
                <span className="text-[10px] bg-[#0B6B4F] text-white px-2 py-0.5 rounded-full font-bold">
                  Host
                </span>
              </Link>

              <Link
                href="/driver?tab=availability"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-800 font-bold"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-700" />
                  <span>Chauffeur & Driver Portal</span>
                </div>
                <span className="text-[10px] bg-sky-700 text-white px-2 py-0.5 rounded-full font-bold">
                  Driver
                </span>
              </Link>

              <Link
                href="/provider?mode=commercial_cargo&tab=pricing"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 font-bold"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-700" />
                  <span>Shuttle & Cargo Operators</span>
                </div>
                <span className="text-[10px] bg-amber-700 text-white px-2 py-0.5 rounded-full font-bold">
                  Fleet
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 shrink-0 text-slate-500 text-[11px] flex items-center justify-between">
          <Link
            href="/help"
            onClick={() => setMobileDrawerOpen(false)}
            className="hover:text-slate-800 font-semibold"
          >
            Help & Safety
          </Link>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
          >
            <Phone className="w-3 h-3" />
            <span>WhatsApp Desk</span>
          </a>
        </div>
      </div>
    </header>
  );
}
