'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Search,
  Users,
  PlusCircle,
  HelpCircle,
  LogIn,
  CalendarCheck,
  Heart,
  MessageSquare,
  User,
  LayoutDashboard,
  Car,
  Truck,
  FileText,
  Calendar,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';

interface NavTabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isAction?: boolean;
}

export function MobileNavBar() {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    setActiveUser(getActiveUser());
    const handleAuth = () => setActiveUser(getActiveUser());
    window.addEventListener('safarpk_auth_state_changed', handleAuth);
    return () => window.removeEventListener('safarpk_auth_state_changed', handleAuth);
  }, []);

  // Generate dynamic tabs based strictly on user authentication status and role
  const getTabs = (): NavTabItem[] => {
    // 1. GUEST / LOGGED OUT USER (Never show logged-in customer menus)
    if (!activeUser) {
      return [
        {
          label: 'Explore',
          href: '/',
          icon: Search,
          isActive: pathname === '/' || pathname.startsWith('/listing'),
        },
        {
          label: 'Drivers',
          href: '/drivers',
          icon: Users,
          isActive: pathname.startsWith('/drivers'),
        },
        {
          label: 'List Car',
          href: '/post-ad',
          icon: PlusCircle,
          isAction: true,
          isActive: pathname === '/post-ad' || pathname === '/register',
        },
        {
          label: 'Help',
          href: '/help',
          icon: HelpCircle,
          isActive: pathname === '/help',
        },
        {
          label: 'Sign In',
          href: '/login',
          icon: LogIn,
          isActive: pathname === '/login',
        },
      ];
    }

    const role = (activeUser.role || '').toUpperCase();

    // 2. LOGGED IN CAR RENTAL LISTER / HOST
    if (role === 'LISTER') {
      return [
        {
          label: 'Dashboard',
          href: '/lister',
          icon: LayoutDashboard,
          isActive: pathname === '/lister',
        },
        {
          label: 'My Fleet',
          href: '/lister',
          icon: Car,
          isActive: pathname === '/lister',
        },
        {
          label: '+ Add Car',
          href: '/post-ad',
          icon: PlusCircle,
          isAction: true,
          isActive: pathname === '/post-ad',
        },
        {
          label: 'Bookings',
          href: '/lister',
          icon: CalendarCheck,
          isActive: pathname === '/lister',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 3. LOGGED IN COMMERCIAL TRANSPORT PROVIDER / VENDOR
    if (role === 'PROVIDER') {
      return [
        {
          label: 'Fleet Hub',
          href: '/provider',
          icon: LayoutDashboard,
          isActive: pathname === '/provider',
        },
        {
          label: 'Vehicles',
          href: '/provider',
          icon: Truck,
          isActive: pathname === '/provider',
        },
        {
          label: 'Quotes',
          href: '/provider',
          icon: FileText,
          isActive: pathname === '/provider',
        },
        {
          label: 'Bookings',
          href: '/provider',
          icon: CalendarCheck,
          isActive: pathname === '/provider',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 4. LOGGED IN PROFESSIONAL DRIVER / CHAUFFEUR
    if (role === 'DRIVER') {
      return [
        {
          label: 'Duty Hub',
          href: '/driver',
          icon: ShieldCheck,
          isActive: pathname === '/driver',
        },
        {
          label: 'My Trips',
          href: '/driver',
          icon: CalendarCheck,
          isActive: pathname === '/driver',
        },
        {
          label: 'Schedule',
          href: '/driver',
          icon: Calendar,
          isActive: pathname === '/driver',
        },
        {
          label: 'Earnings',
          href: '/driver',
          icon: Wallet,
          isActive: pathname === '/driver',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 5. LOGGED IN AGENT
    if (role === 'AGENT') {
      return [
        {
          label: 'Agent Desk',
          href: '/agent',
          icon: LayoutDashboard,
          isActive: pathname === '/agent',
        },
        {
          label: 'Leads',
          href: '/agent',
          icon: FileText,
          isActive: pathname === '/agent',
        },
        {
          label: 'Clients',
          href: '/agent',
          icon: Users,
          isActive: pathname === '/agent',
        },
        {
          label: 'Earnings',
          href: '/agent',
          icon: Wallet,
          isActive: pathname === '/agent',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 6. LOGGED IN ADMIN / SUPER ADMIN
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return [
        {
          label: 'Console',
          href: '/admin',
          icon: LayoutDashboard,
          isActive: pathname === '/admin',
        },
        {
          label: 'Approvals',
          href: '/admin',
          icon: ShieldCheck,
          isActive: pathname === '/admin',
        },
        {
          label: 'Users',
          href: '/admin',
          icon: Users,
          isActive: pathname === '/admin',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
        {
          label: 'Explore',
          href: '/',
          icon: Compass,
          isActive: pathname === '/',
        },
      ];
    }

    // 7. DEFAULT: LOGGED IN CUSTOMER / RENTER
    return [
      {
        label: 'Explore',
        href: '/',
        icon: Search,
        isActive: pathname === '/' || pathname.startsWith('/listing'),
      },
      {
        label: 'Bookings',
        href: '/customer',
        icon: CalendarCheck,
        isActive: pathname === '/customer',
      },
      {
        label: 'Saved',
        href: '/saved',
        icon: Heart,
        isActive: pathname === '/saved',
      },
      {
        label: 'Inbox',
        href: '/inbox',
        icon: MessageSquare,
        isActive: pathname === '/inbox',
      },
      {
        label: 'Account',
        href: '/settings',
        icon: User,
        isActive: pathname === '/settings',
      },
    ];
  };

  const tabs = getTabs();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-1 sm:px-2 pt-1.5 pb-safe shadow-[0_-8px_32px_rgba(15,23,42,0.08)] grid grid-cols-5 transition-all"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isAction = tab.isAction;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[46px] rounded-xl transition-all duration-150 active:scale-95 ${
              tab.isActive
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div
              className={`relative flex items-center justify-center transition ${
                isAction
                  ? 'w-8 h-8 rounded-full bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100 hover:bg-emerald-700'
                  : tab.isActive
                  ? 'p-1 rounded-xl bg-emerald-50 text-emerald-700'
                  : 'p-1'
              }`}
            >
              <Icon className={`${isAction ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.2]`} />
              {tab.isActive && !isAction && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </div>
            <span
              className={`text-[10px] leading-tight tracking-tight font-heading truncate max-w-[64px] ${
                isAction ? 'text-emerald-700 font-bold' : ''
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
