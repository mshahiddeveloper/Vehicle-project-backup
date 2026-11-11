'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';

export type CardUploadPolicy = 'REQUIRED' | 'OPTIONAL' | 'HIDDEN';

export interface CountryVerificationRule {
  cardUploadPolicy: CardUploadPolicy; // REQUIRED, OPTIONAL, or HIDDEN
  requireNationalId: boolean;
  requireDrivingLicense: boolean;
  enabledCategories: {
    carRental: boolean;
    pickAndDrop: boolean;
    cityToCity: boolean;
    homeShifting: boolean;
    hireDriver: boolean;
  };
}

export interface PlatformSettings {
  globalCardUploadPolicy: CardUploadPolicy;
  countryRules: Record<string, CountryVerificationRule>;
  categorySwitches: {
    carRental: boolean;
    pickAndDrop: boolean;
    cityToCity: boolean;
    homeShifting: boolean;
    hireDriver: boolean;
  };
  announcement: {
    heading: string;
    message: string;
    badge: string;
    style: 'MARQUEE_TICKER' | 'BANNER_STRIP' | 'POPUP_MODAL';
    enabled: boolean;
  };
}

const DEFAULT_SETTINGS: PlatformSettings = {
  globalCardUploadPolicy: 'REQUIRED',
  countryRules: {
    PK: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: {
        carRental: true,
        pickAndDrop: true,
        cityToCity: true,
        homeShifting: true,
        hireDriver: true,
      },
    },
    DE: {
      cardUploadPolicy: 'OPTIONAL',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: {
        carRental: true,
        pickAndDrop: true,
        cityToCity: true,
        homeShifting: false,
        hireDriver: true,
      },
    },
    AE: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: {
        carRental: true,
        pickAndDrop: true,
        cityToCity: true,
        homeShifting: true,
        hireDriver: true,
      },
    },
    GB: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: {
        carRental: true,
        pickAndDrop: true,
        cityToCity: true,
        homeShifting: true,
        hireDriver: true,
      },
    },
    US: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: {
        carRental: true,
        pickAndDrop: true,
        cityToCity: true,
        homeShifting: true,
        hireDriver: true,
      },
    },
    CA: {
      cardUploadPolicy: 'REQUIRED',
      requireNationalId: true,
      requireDrivingLicense: true,
      enabledCategories: {
        carRental: true,
        pickAndDrop: true,
        cityToCity: true,
        homeShifting: true,
        hireDriver: true,
      },
    },
  },
  categorySwitches: {
    carRental: true,
    pickAndDrop: true,
    cityToCity: true,
    homeShifting: true,
    hireDriver: true,
  },
  announcement: {
    heading: '🔥 SafarPK Global Launch: 0% Platform Fee & Direct Booking Now Live',
    message: 'Direct connections with verified fleet owners, chauffeurs, commuter shuttles, and cargo movers. Zero middleman commissions.',
    badge: '⚡ FLASH ANNOUNCEMENT',
    style: 'MARQUEE_TICKER',
    enabled: true,
  },
};

interface SettingsContextValue {
  settings: PlatformSettings;
  getCardPolicy: (countryCode?: string) => CardUploadPolicy;
  setCardPolicy: (countryCode: string, policy: CardUploadPolicy) => void;
  isCategoryActive: (category: keyof PlatformSettings['categorySwitches'], countryCode?: string) => boolean;
  toggleCategory: (category: keyof PlatformSettings['categorySwitches']) => void;
  updateAnnouncement: (announcement: Partial<PlatformSettings['announcement']>) => void;
  getSetting: (key: string, countryCode?: string) => any;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  getCardPolicy: () => 'REQUIRED',
  setCardPolicy: () => {},
  isCategoryActive: () => true,
  toggleCategory: () => {},
  updateAnnouncement: () => {},
  getSetting: () => true,
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('safarpk_country_settings');
      if (stored) {
        setSettingsState((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (e) {}

    const handleSync = () => {
      try {
        const updated = localStorage.getItem('safarpk_country_settings');
        if (updated) setSettingsState((prev) => ({ ...prev, ...JSON.parse(updated) }));
      } catch (e) {}
    };

    window.addEventListener('safarpk_country_settings_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('safarpk_country_settings_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveSettings = (newSettings: PlatformSettings) => {
    setSettingsState(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_country_settings', JSON.stringify(newSettings));
      window.dispatchEvent(new CustomEvent('safarpk_country_settings_changed', { detail: newSettings }));
    }
  };

  const getCardPolicy = (countryCode?: string): CardUploadPolicy => {
    if (countryCode && settings.countryRules[countryCode.toUpperCase()]) {
      return settings.countryRules[countryCode.toUpperCase()].cardUploadPolicy;
    }
    return settings.globalCardUploadPolicy;
  };

  const setCardPolicy = (countryCode: string, policy: CardUploadPolicy) => {
    const code = countryCode.toUpperCase();
    const updated = { ...settings };
    if (!updated.countryRules[code]) {
      updated.countryRules[code] = {
        cardUploadPolicy: policy,
        requireNationalId: true,
        requireDrivingLicense: true,
        enabledCategories: { ...updated.categorySwitches },
      };
    } else {
      updated.countryRules[code] = {
        ...updated.countryRules[code],
        cardUploadPolicy: policy,
      };
    }
    saveSettings(updated);
  };

  const isCategoryActive = (category: keyof PlatformSettings['categorySwitches'], countryCode?: string): boolean => {
    // 1. Master global switch
    if (!settings.categorySwitches[category]) return false;
    // 2. Country-specific switch
    if (countryCode && settings.countryRules[countryCode.toUpperCase()]) {
      return settings.countryRules[countryCode.toUpperCase()].enabledCategories[category] ?? true;
    }
    return true;
  };

  const toggleCategory = (category: keyof PlatformSettings['categorySwitches']) => {
    const updated = {
      ...settings,
      categorySwitches: {
        ...settings.categorySwitches,
        [category]: !settings.categorySwitches[category],
      },
    };
    saveSettings(updated);
  };

  const updateAnnouncement = (patch: Partial<PlatformSettings['announcement']>) => {
    const updated = {
      ...settings,
      announcement: {
        ...settings.announcement,
        ...patch,
      },
    };
    saveSettings(updated);
  };

  const getSetting = (key: string, countryCode?: string): any => {
    if (key === 'showCardUpload' || key === 'cardUploadPolicy') {
      const policy = getCardPolicy(countryCode);
      return policy !== 'HIDDEN';
    }
    if (key in settings.categorySwitches) {
      return isCategoryActive(key as keyof PlatformSettings['categorySwitches'], countryCode);
    }
    return true;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        getCardPolicy,
        setCardPolicy,
        isCategoryActive,
        toggleCategory,
        updateAnnouncement,
        getSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return useContext(SettingsContext);
};
