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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EEF0F2] px-2 py-1.5 pb-6 shadow-lg grid grid-cols-5"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              tab.isActive ? 'text-[#0B6B4F] font-bold' : 'text-[#667085] hover:text-[#101828]'
            }`}
          >
            <Icon className="w-5 h-5 stroke-[2]" />
            <span className="text-[11px] leading-none font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
