'use client';

import React, { ReactNode } from 'react';
import { CountryProvider } from './context/CountryContext';
import { SettingsProvider } from './context/SettingsContext';
import { MobileSplashScreen } from '@/components/MobileSplashScreen';
import { MobilePWAExperience } from '@/components/MobilePWAExperience';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <SettingsProvider>
        <MobileSplashScreen />
        <MobilePWAExperience />
        {children}
      </SettingsProvider>
    </CountryProvider>
  );
}

