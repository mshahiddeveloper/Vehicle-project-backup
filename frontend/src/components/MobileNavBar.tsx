'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Calendar, Heart, MessageSquare, User } from 'lucide-react';
import { getActiveUser, RegisteredUser } from '@/data/userAuth';

export function MobileNavBar() {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    setActiveUser(getActiveUser());
    const handleAuth = () => setActiveUser(getActiveUser());
    window.addEventListener('safarpk_auth_state_changed', handleAuth);
    return () => window.removeEventListener('safarpk_auth_state_changed', handleAuth);
  }, []);

  const getProfileLink = () => {
    if (!activeUser) return '/login';
    if (activeUser.role === 'LISTER') return '/lister';
    if (activeUser.role === 'DRIVER') return '/driver';
    if (activeUser.role === 'PROVIDER') return '/provider';
    return '/customer';
  };

  const getSecondTab = () => {
    if (!activeUser || activeUser.role === 'CUSTOMER') {
      return {
        label: 'Bookings',
        href: '/customer',
        icon: Calendar,
        isActive: pathname === '/customer',
      };
    }
    if (activeUser.role === 'DRIVER') {
      return {
        label: 'My Drives',
        href: '/driver',
        icon: Calendar,
        isActive: pathname === '/driver',
      };
    }
    if (activeUser.role === 'PROVIDER') {
      return {
        label: 'Services',
        href: '/provider',
        icon: Calendar,
        isActive: pathname === '/provider',
      };
    }
    return {
      label: 'My Fleet',
      href: '/lister',
      icon: Calendar,
      isActive: pathname === '/lister',
    };
  };

  const tabs = [
    {
      label: 'Explore',
      href: '/',
      icon: Search,
      isActive: pathname === '/' || pathname.startsWith('/drivers') || pathname.startsWith('/city-to-city') || pathname.startsWith('/shuttles') || pathname.startsWith('/movers') || pathname.startsWith('/listing'),
    },
    getSecondTab(),
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
      href: getProfileLink(),
      icon: User,
      isActive: pathname === '/settings' || pathname === '/lister' || pathname === '/driver' || pathname === '/provider' || pathname === '/customer',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 pt-2 pb-safe shadow-[0_-8px_32px_rgba(15,23,42,0.08)] grid grid-cols-5 transition-all"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 min-h-[46px] rounded-xl transition-all duration-150 active:scale-95 ${
              tab.isActive
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition ${tab.isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
              {tab.isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] leading-tight tracking-tight font-heading">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
