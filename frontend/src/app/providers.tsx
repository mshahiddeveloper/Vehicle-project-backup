'use client';

import React, { ReactNode } from 'react';
import { CountryProvider } from './context/CountryContext';
import { SettingsProvider } from './context/SettingsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CountryProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </CountryProvider>
  );
}

