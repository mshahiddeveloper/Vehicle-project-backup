'use client';

import React, { ReactNode } from 'react';
import { CountryProvider } from './context/CountryContext';
import { SettingsProvider } from './context/SettingsContext';
import { MobileSplashScreen } from '@/components/MobileSplashScreen';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { MobilePWAExperience } from '@/components/MobilePWAExperience';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <SettingsProvider>
        <MobileSplashScreen />
        <OfflineStatusBanner />
        <MobilePullToRefresh />
        <MobilePWAExperience />
        {children}
      </SettingsProvider>
    </CountryProvider>
  );
}

