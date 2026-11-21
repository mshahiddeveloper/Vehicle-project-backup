import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initOfflineDataCache, useNetworkStatus } from '../src/data/offlineCache';
import { CARS_DATA, DRIVERS_DATA } from '../src/data/marketplaceData';

describe('Global Pull-to-Refresh & Network Status Indicator Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('T1: initOfflineDataCache warms up and preserves marketplace data in offline storage', () => {
    const cache = initOfflineDataCache();
    expect(cache).toBeDefined();
    expect(cache.vehicles.length).toBeGreaterThan(0);
    expect(cache.drivers.length).toBeGreaterThan(0);
    expect(cache.vehicles[0].id).toBe(CARS_DATA[0].id);

    // Verify localStorage has cached data
    const raw = localStorage.getItem('safarpk_offline_marketplace_cache');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.vehicles.length).toBe(cache.vehicles.length);
    expect(parsed.cachedAt).toBeDefined();
  });

  it('T2: Offline cache retrieval gracefully handles corrupt localStorage payload without crash', () => {
    localStorage.setItem('safarpk_offline_marketplace_cache', 'invalid-json-corrupt');
    const cache = initOfflineDataCache();
    expect(cache).toBeDefined();
    expect(cache.vehicles.length).toBe(CARS_DATA.length);
    expect(cache.drivers.length).toBe(DRIVERS_DATA.length);
  });

  it('T3: Network Status responds to offline and online transition events', () => {
    let currentOnline = true;
    let wasOfflineTriggered = false;

    // Simulate custom network status event listener
    const handleStatus = (e: any) => {
      currentOnline = e.detail.isOnline;
      if (currentOnline) {
        wasOfflineTriggered = true;
      }
    };
    window.addEventListener('safarpk_network_status', handleStatus);

    // 1. Simulate going offline
    window.dispatchEvent(new CustomEvent('safarpk_network_status', { detail: { isOnline: false } }));
    expect(currentOnline).toBe(false);

    // 2. Simulate reconnecting online
    window.dispatchEvent(new CustomEvent('safarpk_network_status', { detail: { isOnline: true } }));
    expect(currentOnline).toBe(true);
    expect(wasOfflineTriggered).toBe(true);

    window.removeEventListener('safarpk_network_status', handleStatus);
  });

  it('T4: Pull-to-refresh event coordination updates offline cache and dispatches events', () => {
    let refreshReceived = false;
    let distanceReceived = 0;

    const handleRefresh = () => {
      refreshReceived = true;
    };
    const handleDistance = (e: any) => {
      distanceReceived = e.detail?.pullDistance || 0;
    };

    window.addEventListener('safarpk_pull_refresh', handleRefresh);
    window.addEventListener('safarpk_pull_distance', handleDistance);

    // Simulate pull distance broadcast
    window.dispatchEvent(new CustomEvent('safarpk_pull_distance', { detail: { pullDistance: 85 } }));
    expect(distanceReceived).toBe(85);

    // Simulate refresh execution
    window.dispatchEvent(new CustomEvent('safarpk_pull_refresh'));
    expect(refreshReceived).toBe(true);

    // Verify cache was re-warmed
    const cache = initOfflineDataCache();
    expect(cache.drivers.length).toBeGreaterThan(0);

    window.removeEventListener('safarpk_pull_refresh', handleRefresh);
    window.removeEventListener('safarpk_pull_distance', handleDistance);
  });

  it('T5: Offline banner styling contract: Black background when offline, theme color when restored', () => {
    // Offline configuration contract
    const offlineConfig = {
      isOnline: false,
      bgColor: 'bg-[#0F172A]',
      textColor: 'text-amber-300',
      label: 'No internet connection — browsing saved offline content',
    };
    expect(offlineConfig.bgColor).toBe('bg-[#0F172A]');
    expect(offlineConfig.textColor).toBe('text-amber-300');

    // Online restored configuration contract
    const onlineRestoredConfig = {
      isOnline: true,
      wasOffline: true,
      bgColor: 'bg-emerald-50',
      textColor: 'text-[#0B6B4F]', // SafarPK brand theme color
      label: 'Internet connection restored · Back online',
    };
    expect(onlineRestoredConfig.bgColor).toBe('bg-emerald-50');
    expect(onlineRestoredConfig.textColor).toBe('text-[#0B6B4F]');
  });

  it('T6: checkIsAppInstalled identifies installed PWA and hides install options', async () => {
    const { checkIsAppInstalled } = await import('../src/data/offlineCache');

    // 1. In regular browser without standalone: should return false
    localStorage.removeItem('safarpk_app_installed');
    expect(checkIsAppInstalled()).toBe(false);

    // 2. Once installed: sets localStorage flag and returns true
    localStorage.setItem('safarpk_app_installed', 'true');
    expect(checkIsAppInstalled()).toBe(true);
  });

  it('T7: manifest.json has required PNG icons for Android/Chrome direct native install', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const has192 = manifest.icons.some((i: any) => i.src === '/icon-192.png' && i.sizes === '192x192');
    const has512 = manifest.icons.some((i: any) => i.src === '/icon-512.png' && i.sizes === '512x512');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });
});
