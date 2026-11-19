'use client';

import React, { ReactNode } from 'react';
import { CountryProvider } from './context/CountryContext';
import { SettingsProvider } from './context/SettingsContext';
import { MobileSplashScreen } from '@/components/MobileSplashScreen';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';
import { MobilePWAExperience } from '@/components/MobilePWAExperience';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <SettingsProvider>
        <MobileSplashScreen />
        <OfflineStatusBanner />
        <MobilePWAExperience />
        {children}
      </SettingsProvider>
    </CountryProvider>
  );
}

