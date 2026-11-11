'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { COUNTRIES, CountryInfo } from '@/data/countries';

interface CountryContextValue {
  country: CountryInfo;
  setCountry: (c: CountryInfo) => void;
  loading: boolean;
  formatPrice: (amount: number | string) => string;
}

const defaultCountry = COUNTRIES[0];

const CountryContext = createContext<CountryContextValue>({
  country: defaultCountry,
  setCountry: () => {},
  loading: false,
  formatPrice: (amt) => `Rs ${Number(amt || 0).toLocaleString()}`,
});

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<CountryInfo>(defaultCountry);
  const [loading, setLoading] = useState(true);

  const setCountry = (newCountry: CountryInfo) => {
    setCountryState(newCountry);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_selected_country', JSON.stringify(newCountry));
      window.dispatchEvent(new CustomEvent('safarpk_country_changed', { detail: newCountry }));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check URL query param ?country=DE / ?country=AE etc.
    const params = new URLSearchParams(window.location.search);
    const paramCountry = params.get('country');
    if (paramCountry) {
      const match = COUNTRIES.find((c) => c.code.toUpperCase() === paramCountry.toUpperCase());
      if (match) {
        setCountry(match);
        setLoading(false);
        return;
      }
    }

    // 2. Check localStorage
    const stored = localStorage.getItem('safarpk_selected_country');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CountryInfo;
        const matched = COUNTRIES.find((c) => c.code === parsed.code) || parsed;
        setCountryState(matched);
        setLoading(false);
        return;
      } catch (e) {}
    }

    // 3. Auto-detect via IP
    fetch('https://api.country.is/')
      .then((res) => res.json())
      .then((data) => {
        const iso2 = data.country?.iso2 || data.country || '';
        if (iso2) {
          const match = COUNTRIES.find((c) => c.code.toUpperCase() === String(iso2).toUpperCase());
          if (match) {
            setCountry(match);
            return;
          }
        }
        // Fallback to timezone
        detectByTimezone();
      })
      .catch(() => {
        detectByTimezone();
      })
      .finally(() => setLoading(false));

    function detectByTimezone() {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        let detected = COUNTRIES[0];
        if (tz.includes('Berlin') || tz.includes('Europe/Busingen')) {
          detected = COUNTRIES.find((c) => c.code === 'DE') || detected;
        } else if (tz.includes('London')) {
          detected = COUNTRIES.find((c) => c.code === 'GB') || detected;
        } else if (tz.includes('Dubai')) {
          detected = COUNTRIES.find((c) => c.code === 'AE') || detected;
        } else if (tz.includes('Riyadh')) {
          detected = COUNTRIES.find((c) => c.code === 'SA') || detected;
        } else if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles')) {
          detected = COUNTRIES.find((c) => c.code === 'US') || detected;
        } else if (tz.includes('Toronto') || tz.includes('Vancouver')) {
          detected = COUNTRIES.find((c) => c.code === 'CA') || detected;
        }
        setCountry(detected);
      } catch (e) {}
    }
  }, []);

  const formatPrice = (amount: number | string) => {
    const num = Number(amount) || 0;
    return `${country.symbol} ${num.toLocaleString()}`;
  };

  return (
    <CountryContext.Provider value={{ country, setCountry, loading, formatPrice }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  return useContext(CountryContext);
};
