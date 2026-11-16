'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  COUNTRIES,
  CountryInfo,
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  resolveAnyCountry,
  formatPriceWithRate,
} from '@/data/countries';

interface CountryContextValue {
  country: CountryInfo;
  setCountry: (c: CountryInfo, syncCurrency?: boolean) => void;
  currency: CurrencyInfo;
  setCurrency: (c: CurrencyInfo | string) => void;
  loading: boolean;
  formatPrice: (amount: number | string) => string;
  isCustomCurrency: boolean;
}

const defaultCountry = COUNTRIES[0]; // Pakistan
const defaultCurrency = SUPPORTED_CURRENCIES[0]; // PKR

const CountryContext = createContext<CountryContextValue>({
  country: defaultCountry,
  setCountry: () => {},
  currency: defaultCurrency,
  setCurrency: () => {},
  loading: false,
  formatPrice: (amt) => formatPriceWithRate(amt, 'PKR'),
  isCustomCurrency: false,
});

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<CountryInfo>(defaultCountry);
  const [currency, setCurrencyState] = useState<CurrencyInfo>(defaultCurrency);
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [loading, setLoading] = useState(true);

  const setCountry = (newCountry: CountryInfo, syncCurrency: boolean = true) => {
    setCountryState(newCountry);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_selected_country', JSON.stringify(newCountry));
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('country', newCountry.code);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('safarpk_country_changed', { detail: newCountry }));
    }

    // Auto-sync currency unless the user specifically picked a custom currency
    if (syncCurrency && !isCustomCurrency) {
      const matchingCurr = SUPPORTED_CURRENCIES.find((c) => c.code === newCountry.currency);
      if (matchingCurr) {
        setCurrencyState(matchingCurr);
        if (typeof window !== 'undefined') {
          localStorage.setItem('safarpk_selected_currency', matchingCurr.code);
        }
      }
    }
  };

  const setCurrency = (newCurrencyOrCode: CurrencyInfo | string) => {
    const code = typeof newCurrencyOrCode === 'string' ? newCurrencyOrCode : newCurrencyOrCode.code;
    const resolved = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
    setCurrencyState(resolved);
    setIsCustomCurrency(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safarpk_selected_currency', resolved.code);
      localStorage.setItem('safarpk_custom_currency_locked', 'true');
      window.dispatchEvent(new CustomEvent('safarpk_currency_changed', { detail: resolved }));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load custom currency lock preference
    const locked = localStorage.getItem('safarpk_custom_currency_locked') === 'true';
    setIsCustomCurrency(locked);

    const savedCurrCode = localStorage.getItem('safarpk_selected_currency');
    if (savedCurrCode) {
      const match = SUPPORTED_CURRENCIES.find((c) => c.code === savedCurrCode);
      if (match) setCurrencyState(match);
    }

    // 1. Check explicit URL query param ?country=DE / ?country=FR / ?country=PK
    const params = new URLSearchParams(window.location.search);
    const paramCountry = params.get('country');
    if (paramCountry) {
      const resolved = resolveAnyCountry(paramCountry);
      setCountry(resolved, !locked);
      setLoading(false);
      return;
    }

    // 2. Direct IP Auto-Detection via api.country.is
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetch('https://api.country.is/', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        const iso2 = (data.country?.iso2 || data.country || '').toUpperCase();
        if (iso2 && iso2.length === 2) {
          const resolved = resolveAnyCountry(iso2);
          setCountry(resolved, !locked);
          setLoading(false);
          return;
        }
        detectFallback(locked);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        detectFallback(locked);
      });

    function detectFallback(isLocked: boolean) {
      // Secondary check: LocalStorage cached country
      try {
        const stored = localStorage.getItem('safarpk_selected_country');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.code) {
            setCountry(resolveAnyCountry(parsed.code), !isLocked);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

      // Tertiary check: Browser Timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        let detectedCode = 'PK';
        if (
          tz.includes('Berlin') ||
          tz.includes('Busingen') ||
          tz.includes('Europe/Paris') ||
          tz.includes('Europe/Rome') ||
          tz.includes('Europe/Madrid')
        ) {
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
        setCountry(resolved, !isLocked);
      } catch (e) {
        setCountry(defaultCountry, !isLocked);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const formatPrice = (amountInPkr: number | string) => {
    return formatPriceWithRate(amountInPkr, currency.code);
  };

  return (
    <CountryContext.Provider
      value={{
        country,
        setCountry,
        currency,
        setCurrency,
        loading,
        formatPrice,
        isCustomCurrency,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  return useContext(CountryContext);
};
