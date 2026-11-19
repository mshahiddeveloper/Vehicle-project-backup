'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
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
  Navigation,
} from 'lucide-react';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';

interface NavTabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isAction?: boolean;
  tabKey?: string;
}

function MobileNavBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);
  const [runtimeTab, setRuntimeTab] = useState<string | null>(null);

  useEffect(() => {
    setActiveUser(getActiveUser());
    const handleAuth = () => setActiveUser(getActiveUser());
    window.addEventListener('safarpk_auth_state_changed', handleAuth);
    return () => window.removeEventListener('safarpk_auth_state_changed', handleAuth);
  }, []);

  useEffect(() => {
    const handleTabEvt = (e: any) => {
      if (e.detail?.tab) setRuntimeTab(e.detail.tab);
    };
    window.addEventListener('safarpk_active_tab_changed', handleTabEvt);
    return () => window.removeEventListener('safarpk_active_tab_changed', handleTabEvt);
  }, []);

  // Reset runtimeTab when top-level route changes
  useEffect(() => {
    setRuntimeTab(null);
  }, [pathname]);

  const currentTab = runtimeTab || searchParams.get('tab') || 'overview';

  // Generate dynamic tabs based strictly on user authentication status and role
  const getTabs = (): NavTabItem[] => {
    // 1. GUEST / LOGGED OUT USER
    if (!activeUser) {
      return [
        {
          label: 'Home',
          href: '/',
          icon: Home,
          isActive: pathname === '/' || pathname.startsWith('/listing'),
        },
        {
          label: 'Saved',
          href: '/saved',
          icon: Heart,
          isActive: pathname === '/saved',
        },
        {
          label: 'Bookings',
          href: '/login',
          icon: CalendarCheck,
          isActive: pathname === '/customer',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
        {
          label: 'Account',
          href: '/login',
          icon: User,
          isActive: pathname === '/login',
        },
      ];
    }

    const role = (activeUser.role || '').toUpperCase();

    // 2. LOGGED IN CAR RENTAL LISTER / HOST
    if (role === 'LISTER') {
      const isLister = pathname === '/lister';
      return [
        {
          label: 'Dashboard',
          href: '/lister?tab=overview',
          icon: LayoutDashboard,
          isActive: isLister && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab)),
          tabKey: 'overview',
        },
        {
          label: 'My Fleet',
          href: '/lister?tab=fleet',
          icon: Car,
          isActive: isLister && currentTab === 'fleet',
          tabKey: 'fleet',
        },
        {
          label: '+ Add Car',
          href: '/lister?tab=add_vehicle',
          icon: PlusCircle,
          isAction: true,
          isActive: isLister && currentTab === 'add_vehicle',
          tabKey: 'add_vehicle',
        },
        {
          label: 'Bookings',
          href: '/lister?tab=requests',
          icon: CalendarCheck,
          isActive: isLister && currentTab === 'requests',
          tabKey: 'requests',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 3. LOGGED IN CITY TO CITY OPERATOR
    if (role === 'PROVIDER' && activeUser.providerSubtype === 'CITY_TO_CITY') {
      const isIntercity = pathname === '/intercity';
      return [
        {
          label: 'Routes',
          href: '/intercity?tab=routes',
          icon: Navigation,
          isActive: isIntercity && (currentTab === 'routes' || (!searchParams.get('tab') && !runtimeTab)),
          tabKey: 'routes',
        },
        {
          label: 'Requests',
          href: '/intercity?tab=inquiries',
          icon: Users,
          isActive: isIntercity && currentTab === 'inquiries',
          tabKey: 'inquiries',
        },
        {
          label: '+ Route',
          href: '/intercity?action=new',
          icon: PlusCircle,
          isAction: true,
          isActive: isIntercity && searchParams.get('action') === 'new',
        },
        {
          label: 'Fleet',
          href: '/intercity?tab=fleet',
          icon: Car,
          isActive: isIntercity && currentTab === 'fleet',
          tabKey: 'fleet',
        },
        {
          label: 'Pass & Bill',
          href: '/intercity?tab=billing',
          icon: Wallet,
          isActive: isIntercity && currentTab === 'billing',
          tabKey: 'billing',
        },
      ];
    }

    // 4. LOGGED IN COMMERCIAL TRANSPORT PROVIDER (Shuttles / Cargo Movers)
    if (role === 'PROVIDER') {
      const isProvider = pathname === '/provider';
      return [
        {
          label: 'Fleet Hub',
          href: '/provider',
          icon: LayoutDashboard,
          isActive: isProvider && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab)),
          tabKey: 'overview',
        },
        {
          label: activeUser.providerSubtype === 'COMMERCIAL_CARGO' ? 'Vehicles' : 'Routes',
          href: activeUser.providerSubtype === 'COMMERCIAL_CARGO' ? '/provider?tab=fleet' : '/provider?tab=routes',
          icon: activeUser.providerSubtype === 'COMMERCIAL_CARGO' ? Truck : Navigation,
          isActive: isProvider && (currentTab === 'routes' || currentTab === 'fleet'),
          tabKey: activeUser.providerSubtype === 'COMMERCIAL_CARGO' ? 'fleet' : 'routes',
        },
        {
          label: 'Quotes',
          href: '/provider?tab=quotes',
          icon: FileText,
          isActive: isProvider && currentTab === 'quotes',
          tabKey: 'quotes',
        },
        {
          label: 'Bookings',
          href: '/provider?tab=bookings',
          icon: CalendarCheck,
          isActive: isProvider && currentTab === 'bookings',
          tabKey: 'bookings',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 5. LOGGED IN PROFESSIONAL DRIVER / CHAUFFEUR
    if (role === 'DRIVER') {
      const isDriver = pathname === '/driver';
      const isOverview = isDriver && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab));
      const isRequests = isDriver && currentTab === 'requests';
      const isAvailability = isDriver && currentTab === 'availability';
      const isSubscription = isDriver && currentTab === 'subscription';
      const isChats = pathname === '/inbox' || (isDriver && currentTab === 'chats');

      return [
        {
          label: 'Duty Hub',
          href: '/driver?tab=overview',
          icon: ShieldCheck,
          isActive: isOverview,
          tabKey: 'overview',
        },
        {
          label: 'My Trips',
          href: '/driver?tab=requests',
          icon: CalendarCheck,
          isActive: isRequests,
          tabKey: 'requests',
        },
        {
          label: 'Schedule',
          href: '/driver?tab=availability',
          icon: Calendar,
          isActive: isAvailability,
          tabKey: 'availability',
        },
        {
          label: 'Earnings',
          href: '/driver?tab=subscription',
          icon: Wallet,
          isActive: isSubscription,
          tabKey: 'subscription',
        },
        {
          label: 'Inbox',
          href: '/driver?tab=chats',
          icon: MessageSquare,
          isActive: isChats,
          tabKey: 'chats',
        },
      ];
    }

    // 6. LOGGED IN AGENT
    if (role === 'AGENT') {
      const isAgent = pathname === '/agent';
      return [
        {
          label: 'Agent Desk',
          href: '/agent?tab=overview',
          icon: LayoutDashboard,
          isActive: isAgent && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab)),
          tabKey: 'overview',
        },
        {
          label: 'Leads',
          href: '/agent?tab=leads',
          icon: FileText,
          isActive: isAgent && currentTab === 'leads',
          tabKey: 'leads',
        },
        {
          label: 'Clients',
          href: '/agent?tab=clients',
          icon: Users,
          isActive: isAgent && currentTab === 'clients',
          tabKey: 'clients',
        },
        {
          label: 'Earnings',
          href: '/agent?tab=earnings',
          icon: Wallet,
          isActive: isAgent && currentTab === 'earnings',
          tabKey: 'earnings',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
      ];
    }

    // 7. LOGGED IN ADMIN / SUPER ADMIN
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      const isAdmin = pathname === '/admin';
      return [
        {
          label: 'Console',
          href: '/admin',
          icon: LayoutDashboard,
          isActive: isAdmin,
        },
        {
          label: 'Approvals',
          href: '/admin',
          icon: ShieldCheck,
          isActive: false,
        },
        {
          label: 'Users',
          href: '/admin',
          icon: Users,
          isActive: false,
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

    // 8. DEFAULT: LOGGED IN CUSTOMER / RENTER
    return [
      {
        label: 'Home',
        href: '/',
        icon: Home,
        isActive: pathname === '/' || pathname.startsWith('/listing'),
      },
      {
        label: 'Saved',
        href: '/saved',
        icon: Heart,
        isActive: pathname === '/saved',
      },
      {
        label: 'Bookings',
        href: '/customer',
        icon: CalendarCheck,
        isActive: pathname === '/customer',
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
            onClick={() => {
              if (tab.tabKey) {
                setRuntimeTab(tab.tabKey);
                if (pathname === '/driver') {
                  window.dispatchEvent(new CustomEvent('safarpk_driver_switch_tab', { detail: { tab: tab.tabKey } }));
                } else if (pathname === '/lister') {
                  window.dispatchEvent(new CustomEvent('safarpk_lister_switch_tab', { detail: { tab: tab.tabKey } }));
                }
              }
            }}
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

export function MobileNavBar() {
  return (
    <Suspense fallback={null}>
      <MobileNavBarContent />
    </Suspense>
  );
}
