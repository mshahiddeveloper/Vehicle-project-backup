'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { COUNTRIES, CountryInfo, resolveAnyCountry } from '@/data/countries';

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
      // Update URL search parameter dynamically
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('country', newCountry.code);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('safarpk_country_changed', { detail: newCountry }));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check explicit URL query param ?country=DE / ?country=FR / ?country=TR etc.
    const params = new URLSearchParams(window.location.search);
    const paramCountry = params.get('country');
    if (paramCountry) {
      const resolved = resolveAnyCountry(paramCountry);
      setCountry(resolved);
      setLoading(false);
      return;
    }

    // 2. Direct IP Auto-Detection via api.country.is (Works dynamically with VPN worldwide)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetch('https://api.country.is/', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        const iso2 = (data.country?.iso2 || data.country || '').toUpperCase();
        if (iso2 && iso2.length === 2) {
          const resolved = resolveAnyCountry(iso2);
          setCountry(resolved);
          setLoading(false);
          return;
        }
        detectFallback();
      })
      .catch(() => {
        clearTimeout(timeoutId);
        detectFallback();
      });

    function detectFallback() {
      // Secondary check: LocalStorage cached country
      try {
        const stored = localStorage.getItem('safarpk_selected_country');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.code) {
            setCountry(resolveAnyCountry(parsed.code));
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

      // Tertiary check: Browser Timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        let detectedCode = 'PK';
        if (tz.includes('Berlin') || tz.includes('Busingen') || tz.includes('Europe/Paris') || tz.includes('Europe/Rome') || tz.includes('Europe/Madrid')) {
          detectedCode = 'DE';
        } else if (tz.includes('London')) {
          detectedCode = 'GB';
        } else if (tz.includes('Dubai')) {
          detectedCode = 'AE';
        } else if (tz.includes('Riyadh')) {
          detectedCode = 'SA';
        } else if (tz.includes('Istanbul')) {
          detectedCode = 'TR';
        } else if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles')) {
          detectedCode = 'US';
        } else if (tz.includes('Toronto') || tz.includes('Vancouver')) {
          detectedCode = 'CA';
        }
        const resolved = resolveAnyCountry(detectedCode);
        setCountry(resolved);
      } catch (e) {
        setCountry(defaultCountry);
      } finally {
        setLoading(false);
      }
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
