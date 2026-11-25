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
  Clock,
} from 'lucide-react';
import { getActiveUser, RegisteredUser, getUserDashboardPath } from '@/data/userAuth';

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

  // Generate dynamic tabs based strictly on user authentication status, role, and current screen route
  const getTabs = (): NavTabItem[] => {
    // 1. ADMIN / SUPER ADMIN VIEW (/admin, /admin/console, etc. - Matching Page 42)
    if (pathname.startsWith('/admin') || activeUser?.role === 'SUPER_ADMIN') {
      const isConsole = pathname === '/admin/console' || currentTab === 'directory' || currentTab === 'modules';
      const isApprovals = currentTab === 'plans';
      const isHome = (pathname === '/admin' && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab))) && !isConsole && !isApprovals;

      return [
        {
          label: 'Home',
          href: '/admin?tab=overview',
          icon: Home,
          isActive: isHome,
          tabKey: 'overview',
        },
        {
          label: 'Approvals',
          href: '/admin?tab=plans',
          icon: ShieldCheck,
          isActive: isApprovals,
          tabKey: 'plans',
        },
        {
          label: 'Directory',
          href: '/admin/console',
          icon: Users,
          isActive: pathname === '/admin/console',
        },
        {
          label: 'Modules',
          href: '/admin?tab=modules',
          icon: LayoutDashboard,
          isActive: isConsole,
          tabKey: 'modules',
        },
        {
          label: 'Profile',
          href: '/settings',
          icon: User,
          isActive: pathname === '/settings',
        },
      ];
    }

    // 2. STAFF AGENT DESK (/agent - Matching Page 28)
    if (pathname.startsWith('/agent') || activeUser?.role === 'AGENT') {
      const isTickets = currentTab === 'tickets';
      const isCaller = currentTab === 'overview' || currentTab === 'caller' || (!searchParams.get('tab') && !runtimeTab);

      return [
        {
          label: 'Tickets',
          href: '/agent?tab=tickets',
          icon: FileText,
          isActive: isTickets,
          tabKey: 'tickets',
        },
        {
          label: 'Caller lookup',
          href: '/agent?tab=overview',
          icon: Search,
          isActive: isCaller,
          tabKey: 'overview',
        },
        {
          label: 'Directory',
          href: '/agent?tab=directory',
          icon: Users,
          isActive: currentTab === 'directory',
          tabKey: 'directory',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: pathname === '/inbox',
        },
        {
          label: 'Profile',
          href: '/settings',
          icon: User,
          isActive: pathname === '/settings',
        },
      ];
    }

    // 3. DRIVER DASHBOARD (/driver - Matching Page 24)
    // Only apply driver portal tabs when explicitly on /driver, not when browsing public driver profiles (/driver/[slug] or /drivers)
    if (pathname === '/driver') {
      const isOverview = currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab);
      const isRequests = currentTab === 'requests';
      const isDuty = currentTab === 'availability';
      const isInbox = pathname === '/inbox';
      const isProfile = pathname === '/settings' || currentTab === 'profile';

      return [
        {
          label: 'Home',
          href: '/driver?tab=overview',
          icon: Home,
          isActive: isOverview,
          tabKey: 'overview',
        },
        {
          label: 'Requests',
          href: '/driver?tab=requests',
          icon: CalendarCheck,
          isActive: isRequests,
          tabKey: 'requests',
        },
        {
          label: 'Duty',
          href: '/driver?tab=availability',
          icon: Clock,
          isActive: isDuty,
          tabKey: 'availability',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: isInbox,
        },
        {
          label: 'Profile',
          href: '/settings',
          icon: User,
          isActive: isProfile,
        },
      ];
    }

    // 4. MOVERS / COMMERCIAL CARGO PROVIDER (/provider - Matching Page 26)
    // Only apply provider portal tabs when on /provider with commercial cargo subtype
    if (
      pathname.startsWith('/provider') &&
      activeUser?.providerSubtype === 'COMMERCIAL_CARGO'
    ) {
      const isHome = currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab);
      const isTrucks = currentTab === 'fleet';
      const isPricing = currentTab === 'pricing';
      const isInbox = pathname === '/inbox';
      const isAccount = pathname === '/settings';

      return [
        {
          label: 'Home',
          href: '/provider?tab=overview',
          icon: Home,
          isActive: isHome,
          tabKey: 'overview',
        },
        {
          label: 'Trucks',
          href: '/provider?tab=fleet',
          icon: Truck,
          isActive: isTrucks,
          tabKey: 'fleet',
        },
        {
          label: 'Rates',
          href: '/provider?tab=pricing',
          icon: Wallet,
          isActive: isPricing,
          tabKey: 'pricing',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: isInbox,
        },
        {
          label: 'Profile',
          href: '/settings',
          icon: User,
          isActive: isAccount,
        },
      ];
    }

    // 5. PICK & DROP / SHUTTLE PROVIDER (/provider - Matching Page 25)
    // Only apply provider portal tabs when on /provider
    if (
      pathname.startsWith('/provider') &&
      (activeUser?.providerSubtype === 'PICK_AND_DROP' || !activeUser?.providerSubtype)
    ) {
      const isHome = currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab);
      const isRoutes = currentTab === 'routes';
      const isTimings = currentTab === 'pricing';
      const isInbox = pathname === '/inbox';
      const isAccount = pathname === '/settings';

      return [
        {
          label: 'Home',
          href: '/provider?tab=overview',
          icon: Home,
          isActive: isHome,
          tabKey: 'overview',
        },
        {
          label: 'Routes',
          href: '/provider?tab=routes',
          icon: Navigation,
          isActive: isRoutes,
          tabKey: 'routes',
        },
        {
          label: 'Timings',
          href: '/provider?tab=pricing',
          icon: Clock,
          isActive: isTimings,
          tabKey: 'pricing',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: isInbox,
        },
        {
          label: 'Profile',
          href: '/settings',
          icon: User,
          isActive: isAccount,
        },
      ];
    }

    // 6. OWNER / CAR RENTAL LISTER (/lister - Matching Page 14)
    if (pathname.startsWith('/lister')) {
      const isLister = pathname === '/lister';
      const isDashboard = isLister && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab));
      const isRequests = isLister && currentTab === 'requests';
      const isCars = isLister && (currentTab === 'fleet' || currentTab === 'add_vehicle');
      const isInbox = pathname === '/inbox';
      const isAccount = pathname === '/settings';

      return [
        {
          label: 'Dashboard',
          href: '/lister?tab=overview',
          icon: LayoutDashboard,
          isActive: isDashboard,
          tabKey: 'overview',
        },
        {
          label: 'Requests',
          href: '/lister?tab=requests',
          icon: CalendarCheck,
          isActive: isRequests,
          tabKey: 'requests',
        },
        {
          label: 'My cars',
          href: '/lister?tab=fleet',
          icon: Car,
          isActive: isCars,
          tabKey: 'fleet',
        },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: MessageSquare,
          isActive: isInbox,
        },
        {
          label: 'Account',
          href: '/settings',
          icon: User,
          isActive: isAccount,
        },
      ];
    }

    // 7. DEFAULT: CUSTOMER / VISITOR (Matching Page 6, 7, 10, 11, 13, 48)
    return [
      {
        label: 'Explore',
        href: '/',
        icon: Compass,
        isActive: pathname === '/' || pathname.startsWith('/listing'),
      },
      {
        label: activeUser ? (activeUser.role === 'CUSTOMER' ? 'Bookings' : 'Dashboard') : 'Bookings',
        href: activeUser ? getUserDashboardPath(activeUser) : '/login?returnUrl=/customer',
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
        href: activeUser ? '/inbox' : '/login?returnUrl=/inbox',
        icon: MessageSquare,
        isActive: pathname === '/inbox',
      },
      {
        label: 'Profile',
        href: activeUser ? '/settings' : '/login?returnUrl=/settings',
        icon: User,
        isActive: pathname === '/settings' || pathname === '/login',
      },
    ];
  };

  const tabs = getTabs();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-2.5 left-3 right-3 z-50 rounded-full bg-[#0B6B4F] text-white px-2 py-1.5 shadow-[0_12px_32px_rgba(11,107,79,0.38)] border border-emerald-700/40 flex items-center justify-between gap-1 transition-all"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isAction = tab.isAction;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            title={tab.label}
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
            className={`flex items-center justify-center gap-1.5 rounded-full transition-all duration-150 active:scale-95 min-h-[42px] ${
              tab.isActive
                ? 'bg-white text-[#0B6B4F] font-extrabold px-3.5 py-2 shadow-sm shrink-0'
                : 'flex-1 text-emerald-100/90 hover:text-white hover:bg-white/10 px-2 py-2'
            }`}
          >
            <Icon className={`${isAction && !tab.isActive ? 'w-5 h-5 text-emerald-200' : 'w-4.5 h-4.5'} stroke-[2.2] shrink-0`} />
            {tab.isActive && (
              <span className="text-[11px] leading-tight tracking-tight font-heading truncate max-w-[76px]">
                {tab.label}
              </span>
            )}
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
