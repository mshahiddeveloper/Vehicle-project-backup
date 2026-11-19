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
          label: 'Modules',
          href: '/admin?tab=modules',
          icon: LayoutDashboard,
          isActive: isConsole,
          tabKey: 'modules',
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
      ];
    }

    // 3. DRIVER DASHBOARD (/driver - Matching Page 24)
    if (pathname.startsWith('/driver') || activeUser?.role === 'DRIVER') {
      const isOverview = pathname === '/driver' && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab));
      const isRequests = currentTab === 'requests';
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

    // 4. MOVERS / COMMERCIAL CARGO PROVIDER (Matching Page 26)
    if (
      pathname.startsWith('/movers') ||
      (pathname.startsWith('/provider') && activeUser?.providerSubtype === 'COMMERCIAL_CARGO')
    ) {
      const isHome = pathname.startsWith('/provider') && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab));
      const isTrucks = currentTab === 'fleet' || pathname === '/movers';
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

    // 5. PICK & DROP / SHUTTLE PROVIDER (Matching Page 25)
    if (
      pathname.startsWith('/shuttles') ||
      (pathname.startsWith('/provider') && activeUser?.providerSubtype === 'PICK_AND_DROP') ||
      (pathname.startsWith('/provider') && !activeUser?.providerSubtype)
    ) {
      const isHome = pathname.startsWith('/provider') && (currentTab === 'overview' || (!searchParams.get('tab') && !runtimeTab));
      const isRoutes = currentTab === 'routes' || pathname === '/shuttles';
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

    // 6. OWNER / CAR RENTAL LISTER (/lister - Matching Page 14)
    if (pathname.startsWith('/lister') || activeUser?.role === 'LISTER' || activeUser?.role === 'OWNER') {
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
        label: 'Bookings',
        href: activeUser ? '/customer' : '/login',
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
        label: 'Profile',
        href: activeUser ? '/settings' : '/login',
        icon: User,
        isActive: pathname === '/settings' || pathname === '/login',
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
