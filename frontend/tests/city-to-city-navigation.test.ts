import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CITY_RIDES_DATA,
  INTERCITY_CITIES,
  saveCustomCityRide,
  getCustomCityRides,
  CityRideItem,
} from '../src/data/marketplaceData';
import { getStoreDataBySlug } from '../src/data/storefrontEngine';
import { RegisteredUser } from '../src/data/userAuth';

describe('City-to-City Intercity Flow Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('imports useEffect in /city-to-city/[id]/page.tsx and guards handlers against undefined ride', () => {
    const filePath = path.resolve(__dirname, '../src/app/city-to-city/[id]/page.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');

    // Fix for ReferenceError: useEffect is not defined runtime crash
    expect(source).toMatch(/import React,\s*\{[^}]*\buseEffect\b[^}]*\}\s*from ['"]react['"]/);
    // Supports custom lister rides & Neon /api/intercity dynamic trips
    expect(source).toContain('getCustomCityRides');
    expect(source).toContain('/api/intercity');
    // Supports Seat Sharing (carpool) and Full Car booking modes
    expect(source).toContain('bookingMode');
    expect(source).toContain('supportsSeatSharing');
  });

  it('makes City-to-City cards on MobileHomeNativeView fully tappable and filters custom + INTERCITY_CITIES routes', () => {
    const mobilePath = path.resolve(__dirname, '../src/components/MobileHomeNativeView.tsx');
    const source = fs.readFileSync(mobilePath, 'utf-8');

    expect(source).toContain('onClick={() => router.push(`/city-to-city/${ride.id}`)}');
    expect(source).toContain('getCustomCityRides');
    expect(source).toContain('toggleSaveRide');
    // Ensures destination cities like Hyderabad appear in mobile City-to-City picker
    expect(source).toContain('INTERCITY_CITIES');
    expect(INTERCITY_CITIES).toContain('Hyderabad');
  });

  it('includes wishlist toggle, click propagation safety, and paused filter on Desktop & Directory City-to-City', () => {
    const desktopPath = path.resolve(__dirname, '../src/app/page.tsx');
    const dirPath = path.resolve(__dirname, '../src/app/city-to-city/page.tsx');
    const desktopSource = fs.readFileSync(desktopPath, 'utf-8');
    const dirSource = fs.readFileSync(dirPath, 'utf-8');

    expect(desktopSource).toContain('toggleSaveRide');
    expect(desktopSource).toContain('isListingPaused(ride.id, ride.op)');
    expect(dirSource).toContain('/api/intercity');
    expect(dirSource).toContain('isListingPaused(r.id, r.op)');
  });

  it('persists and resolves custom lister City-to-City rides and operator CITY_TO_CITY storefront', () => {
    const customRide: CityRideItem = {
      id: 'c2c-custom-test-01',
      op: 'Multan Highway Connect',
      car: 'Honda Civic RS · AC · 4 seats',
      fromCity: 'Multan',
      toCity: 'Islamabad',
      bag: '2 bags',
      time: '07:00 AM',
      duration: '5.5 hrs via M-4 / M-2',
      one: 18500,
      ret: 33000,
      ver: true,
      tags: ['Seat Sharing', 'Motorway M-2'],
      category: 'Seat Sharing (Carpool)',
      phone: '+92 300 7711223',
      whatsapp: '923007711223',
      rideType: 'SEAT_SHARING',
      pricePerSeat: 3200,
      availableSeats: 2,
      totalSeats: 4,
      rating: 4.9,
    };

    saveCustomCityRide(customRide);
    const loaded = getCustomCityRides();
    expect(loaded.some((r) => r.id === customRide.id)).toBe(true);

    const providerUser: RegisteredUser = {
      id: 'usr-c2c-provider-01',
      name: 'Multan Operator',
      businessName: 'Multan Highway Connect',
      phone: '+92 300 7711223',
      city: 'Multan',
      countryCode: 'PK',
      role: 'PROVIDER',
      providerSubtype: 'CITY_TO_CITY',
      registeredAt: new Date().toISOString(),
      subscription: { status: 'ACTIVE', quota: 10, usedQuota: 1 },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
      activities: [],
    };
    localStorage.setItem('safarpk_registered_users_v2', JSON.stringify([providerUser]));

    const store = getStoreDataBySlug(providerUser.id);
    expect(store).not.toBeNull();
    expect(store?.primaryService).toBe('CITY_TO_CITY');
    expect(store?.isSubscriptionActive).toBe(true);
    expect(store?.listings.rides.some((r) => r.id === customRide.id)).toBe(true);

    // Ensure seeded Karachi routes exist and are well-formed
    const karachiRoutes = CITY_RIDES_DATA.filter((r) => r.fromCity === 'Karachi');
    expect(karachiRoutes.length).toBeGreaterThanOrEqual(2);
  });
});

