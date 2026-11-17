'use client';

import { useState, useEffect } from 'react';
import {
  CARS_DATA,
  DRIVERS_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  CITY_RIDES_DATA,
} from './marketplaceData';

const CACHE_KEY = 'safarpk_offline_marketplace_cache';

export interface OfflineMarketplaceCache {
  vehicles: typeof CARS_DATA;
  drivers: typeof DRIVERS_DATA;
  shuttles: typeof SHUTTLES_DATA;
  movers: typeof MOVERS_DATA;
  cityRides: typeof CITY_RIDES_DATA;
  cachedAt: string;
}

/**
 * Initializes and warms up browser localStorage with all marketplace data.
 * If user disconnects from internet, the app continues to display all listings and profiles.
 */
export function initOfflineDataCache(): OfflineMarketplaceCache {
  if (typeof window === 'undefined') {
    return {
      vehicles: CARS_DATA,
      drivers: DRIVERS_DATA,
      shuttles: SHUTTLES_DATA,
      movers: MOVERS_DATA,
      cityRides: CITY_RIDES_DATA,
      cachedAt: new Date().toISOString(),
    };
  }

  try {
    const existing = localStorage.getItem(CACHE_KEY);
    if (!existing) {
      const payload: OfflineMarketplaceCache = {
        vehicles: CARS_DATA,
        drivers: DRIVERS_DATA,
        shuttles: SHUTTLES_DATA,
        movers: MOVERS_DATA,
        cityRides: CITY_RIDES_DATA,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      return payload;
    }
    return JSON.parse(existing);
  } catch (err) {
    console.warn('Offline storage error:', err);
    return {
      vehicles: CARS_DATA,
      drivers: DRIVERS_DATA,
      shuttles: SHUTTLES_DATA,
      movers: MOVERS_DATA,
      cityRides: CITY_RIDES_DATA,
      cachedAt: new Date().toISOString(),
    };
  }
}

/**
 * Custom React hook to monitor network connection (online / offline / low connection)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
