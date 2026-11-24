import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  isProviderSubscriptionActive,
  isOwnerSubscriptionActive,
  isListingPaused,
  RegisteredUser,
} from '../src/data/userAuth';
import {
  getStoreDataBySlug,
  getDriverProfileBySlug,
  getStoreSecureToken,
} from '../src/data/storefrontEngine';

describe('Subscription Enforcement & Zero-Demo Leakage Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('User Role Subscription Policy', () => {
    it('grants 100% free lifetime access to CUSTOMER accounts without subscription requirement', () => {
      const customer: RegisteredUser = {
        id: 'usr-cust-101',
        name: 'Ali Khan',
        phone: '+92 300 1112233',
        city: 'Karachi',
        countryCode: 'PK',
        role: 'CUSTOMER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED', quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      expect(isProviderSubscriptionActive(customer)).toBe(true);
      expect(isOwnerSubscriptionActive(customer.id)).toBe(true);
    });

    it('requires ACTIVE subscription for LISTER (Rent a Car)', () => {
      const unsubscribedLister: RegisteredUser = {
        id: 'usr-unsub-lister',
        name: 'New Host Motors',
        phone: '+92 321 9998877',
        city: 'Lahore',
        countryCode: 'PK',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED', quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      expect(isProviderSubscriptionActive(unsubscribedLister)).toBe(false);

      const activeLister: RegisteredUser = {
        ...unsubscribedLister,
        subscription: {
          status: 'ACTIVE',
          planName: 'Enterprise Fleet Pass',
          quota: 25,
          usedQuota: 2,
          expiresAt: '2027-12-31T23:59:59.000Z',
        },
      };

      expect(isProviderSubscriptionActive(activeLister)).toBe(true);
    });

    it('requires ACTIVE subscription for DRIVER (Chauffeur)', () => {
      const unsubDriver: RegisteredUser = {
        id: 'usr-unsub-driver',
        name: 'Tariq Chauffeur',
        phone: '+92 333 4445566',
        city: 'Islamabad',
        countryCode: 'PK',
        role: 'DRIVER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED', quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      expect(isProviderSubscriptionActive(unsubDriver)).toBe(false);

      const activeDriver: RegisteredUser = {
        ...unsubDriver,
        subscription: {
          status: 'ACTIVE',
          planName: 'Driver Pro Pass',
          quota: 1,
          usedQuota: 1,
        },
      };

      expect(isProviderSubscriptionActive(activeDriver)).toBe(true);
    });

    it('requires ACTIVE subscription for PROVIDER (Pick & Drop / Shifting)', () => {
      const unsubProvider: RegisteredUser = {
        id: 'usr-unsub-provider',
        name: 'Express Shifting & Transport',
        phone: '+92 345 6677889',
        city: 'Rawalpindi',
        countryCode: 'PK',
        role: 'PROVIDER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED', quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      expect(isProviderSubscriptionActive(unsubProvider)).toBe(false);
    });
  });

  describe('Storefront Engine & Security Token Enforcement', () => {
    it('never injects demo vehicles or demo data into an unsubscribed lister storefront', () => {
      const listerId = 'usr-fresh-lister-99';
      const unsubLister: RegisteredUser = {
        id: listerId,
        name: 'Prime Car Rental Hub',
        phone: '+92 300 7788990',
        city: 'Karachi',
        countryCode: 'PK',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED', quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      localStorage.setItem('safarpk_registered_users_v2', JSON.stringify([unsubLister]));

      const store = getStoreDataBySlug(listerId);
      expect(store).not.toBeNull();
      expect(store?.isSubscriptionActive).toBe(false);
      expect(store?.subscriptionStatus).toBe('UNSUBSCRIBED');
      // Crucial verification: must be empty array, NOT Suzuki Alto or Fortuner from another host!
      expect(store?.cars).toEqual([]);
      expect(store?.shuttles).toEqual([]);
      expect(store?.movers).toEqual([]);
      expect(store?.totalListingsCount).toBe(0);
    });

    it('generates encrypted secure token links and successfully resolves storefronts through token', () => {
      const listerId = 'usr-active-vendor-44';
      const secureToken = getStoreSecureToken(listerId);
      expect(secureToken.startsWith('sp-')).toBe(true);

      const activeLister: RegisteredUser = {
        id: listerId,
        name: 'Apex Luxury Fleet',
        businessName: 'Apex Luxury Fleet',
        phone: '+92 300 5544332',
        city: 'Islamabad',
        countryCode: 'PK',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'ACTIVE', quota: 10, usedQuota: 1 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      localStorage.setItem('safarpk_registered_users_v2', JSON.stringify([activeLister]));

      // Resolve store using the encrypted token
      const storeByToken = getStoreDataBySlug(secureToken);
      expect(storeByToken).not.toBeNull();
      expect(storeByToken?.name).toBe('Apex Luxury Fleet');
      expect(storeByToken?.isSubscriptionActive).toBe(true);
      expect(storeByToken?.secureToken).toBe(secureToken);
    });

    it('returns strict null (404) for unknown store slugs without fallback to demo store', () => {
      const nonExistentStore = getStoreDataBySlug('non-existent-random-store-123456');
      expect(nonExistentStore).toBeNull();
    });

    it('returns strict null (404) for unknown driver slugs without fallback to demo driver', () => {
      const nonExistentDriver = getDriverProfileBySlug('unknown-fake-driver-999');
      expect(nonExistentDriver).toBeNull();
    });
  });

  describe('Listing Detail Strict 404 Fallback Elimination in Source Code', () => {
    it('verifies that /listing/[id]/page.tsx eliminates the silent fallback to l-1', () => {
      const pagePath = path.resolve(__dirname, '../src/app/listing/[id]/page.tsx');
      const source = fs.readFileSync(pagePath, 'utf-8');

      expect(source).not.toContain("return VEHICLE_CATALOG['l-1'];");
      expect(source).toContain('export function resolveCatalogItem(id: string): VehicleDetail | null');
      expect(source).toContain('return null;');
      expect(source).toContain('Vehicle Listing Not Found');
    });

    it('verifies that /city-to-city/[id]/page.tsx eliminates silent fallback to item 0', () => {
      const pagePath = path.resolve(__dirname, '../src/app/city-to-city/[id]/page.tsx');
      const source = fs.readFileSync(pagePath, 'utf-8');

      expect(source).not.toContain('|| CITY_RIDES_DATA[0]');
      expect(source).toContain('Intercity Route Not Found');
    });

    it('verifies that /shuttles/[id]/page.tsx eliminates silent fallback to item 0', () => {
      const pagePath = path.resolve(__dirname, '../src/app/shuttles/[id]/page.tsx');
      const source = fs.readFileSync(pagePath, 'utf-8');

      expect(source).not.toContain('|| SHUTTLES_DATA[0]');
      expect(source).toContain('Pick & Drop Route Not Found');
    });

    it('verifies that /movers/[id]/page.tsx eliminates silent fallback to item 0', () => {
      const pagePath = path.resolve(__dirname, '../src/app/movers/[id]/page.tsx');
      const source = fs.readFileSync(pagePath, 'utf-8');

      expect(source).not.toContain('|| MOVERS_DATA[0]');
      expect(source).toContain('Moving Service Not Found');
    });
  });

  describe('Dynamic Listing Paused Enforcement by Host Subscription', () => {
    it('marks listing as paused when host owner subscription is inactive', () => {
      const listerId = 'usr-unpaid-owner';
      const unpaidUser: RegisteredUser = {
        id: listerId,
        name: 'Unpaid Rental Fleet',
        phone: '+92 312 0001122',
        city: 'Lahore',
        countryCode: 'PK',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'UNSUBSCRIBED', quota: 0, usedQuota: 0 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      localStorage.setItem('safarpk_registered_users_v2', JSON.stringify([unpaidUser]));

      const isPaused = isListingPaused('any-listing-id', listerId);
      expect(isPaused).toBe(true);
    });

    it('allows listing to be active when host owner subscription is ACTIVE', () => {
      const listerId = 'usr-paid-owner';
      const paidUser: RegisteredUser = {
        id: listerId,
        name: 'Paid VIP Rental Fleet',
        phone: '+92 312 9991122',
        city: 'Lahore',
        countryCode: 'PK',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: { status: 'ACTIVE', quota: 10, usedQuota: 2 },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      localStorage.setItem('safarpk_registered_users_v2', JSON.stringify([paidUser]));

      const isPaused = isListingPaused('any-listing-id', listerId);
      expect(isPaused).toBe(false);
    });
  });
});
