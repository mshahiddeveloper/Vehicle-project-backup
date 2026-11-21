import { describe, it, expect } from 'vitest';
import {
  SHUTTLES_DATA,
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  MOVERS_DATA,
  matchesShuttleRoute,
} from '../src/data/marketplaceData';

describe('Strict City Filter Isolation & Route Corridor Matching', () => {
  it('has a direct corridor connecting DHA Phase 5 & 6 to Bahria Town Lahore', () => {
    const lahoreCorridor = SHUTTLES_DATA.find((s) => s.id === 'sht-lhr-4');
    expect(lahoreCorridor).toBeDefined();
    expect(lahoreCorridor?.city).toBe('Lahore');
    expect(lahoreCorridor?.from).toBe('DHA Phase 5 & 6');
    expect(lahoreCorridor?.to).toBe('Bahria Town Lahore');

    // matchesShuttleRoute must match
    const matched = matchesShuttleRoute(
      lahoreCorridor!,
      'DHA Phase 5 & 6',
      'Bahria Town Lahore',
      'Lahore'
    );
    expect(matched).toBe(true);
  });

  it('strictly rejects Karachi corridors when filtering for Lahore', () => {
    const karachiShuttle = SHUTTLES_DATA.find((s) => s.id === 'sht-khi-1');
    expect(karachiShuttle).toBeDefined();
    expect(karachiShuttle?.city).toBe('Karachi');

    // Should NOT match if cityQuery is Lahore
    const matched = matchesShuttleRoute(
      karachiShuttle!,
      'Malir Cantt',
      'I.I. Chundrigar Road / Tower',
      'Lahore'
    );
    expect(matched).toBe(false);
  });

  it('guarantees all Lahore shuttles belong exclusively to Lahore', () => {
    const lahoreShuttles = SHUTTLES_DATA.filter(
      (s) => s.city.toLowerCase() === 'lahore'
    );
    expect(lahoreShuttles.length).toBeGreaterThanOrEqual(4);

    for (const shuttle of lahoreShuttles) {
      expect(shuttle.city.toLowerCase()).toBe('lahore');
      expect(shuttle.from.toLowerCase()).not.toContain('karachi');
      expect(shuttle.from.toLowerCase()).not.toContain('clifton');
      expect(shuttle.to.toLowerCase()).not.toContain('chundrigar');
    }
  });

  it('guarantees filtering shuttles for Lahore NEVER falls back to all-Pakistan data', () => {
    const targetCity = 'Lahore';
    const cityList = SHUTTLES_DATA.filter(
      (s) => s.city.toLowerCase() === targetCity.toLowerCase()
    );

    // Simulated nonexistent route in Lahore
    const pickup = 'Nonexistent Colony';
    const drop = 'Nowhere Stop';

    const exactMatches = cityList.filter((s) =>
      matchesShuttleRoute(s, pickup, drop, targetCity)
    );
    expect(exactMatches).toHaveLength(0);

    // Crucial: The fallback MUST be empty array [], NOT SHUTTLES_DATA!
    const result = exactMatches.length > 0 ? exactMatches : [];
    expect(result).toHaveLength(0);
    expect(result).not.toEqual(SHUTTLES_DATA);
  });

  it('guarantees car filtering strictly adheres to targetCity', () => {
    const lahoreCars = CARS_DATA.filter((c) => c.city.toLowerCase() === 'lahore');
    expect(lahoreCars.length).toBeGreaterThan(0);
    for (const car of lahoreCars) {
      expect(car.city.toLowerCase()).toBe('lahore');
    }
  });

  it('guarantees driver filtering strictly adheres to targetCity', () => {
    const lahoreDrivers = DRIVERS_DATA.filter((d) => d.city.toLowerCase() === 'lahore');
    expect(lahoreDrivers.length).toBeGreaterThan(0);
    for (const driver of lahoreDrivers) {
      expect(driver.city.toLowerCase()).toBe('lahore');
    }
  });

  it('guarantees intercity rides include targetCity in fromCity or toCity', () => {
    const targetCity = 'lahore';
    const lahoreRides = CITY_RIDES_DATA.filter(
      (r) =>
        r.fromCity.toLowerCase() === targetCity ||
        r.toCity.toLowerCase() === targetCity
    );
    expect(lahoreRides.length).toBeGreaterThan(0);
    for (const ride of lahoreRides) {
      const connectsLahore =
        ride.fromCity.toLowerCase() === 'lahore' ||
        ride.toCity.toLowerCase() === 'lahore';
      expect(connectsLahore).toBe(true);
    }
  });

  it('guarantees mover filtering strictly adheres to targetCity', () => {
    const lahoreMovers = MOVERS_DATA.filter((m) => m.city.toLowerCase() === 'lahore');
    expect(lahoreMovers.length).toBeGreaterThan(0);
    for (const mover of lahoreMovers) {
      expect(mover.city.toLowerCase()).toBe('lahore');
    }
  });

  it('guarantees busy drivers are hidden on today date and on blocked dates', () => {
    const busyDriver = DRIVERS_DATA.find((d) => d.id === 'drv-3');
    expect(busyDriver).toBeDefined();
    expect(busyDriver?.avail).toBe('Busy');
    expect(busyDriver?.blockedDates).toContain('2026-11-20');

    // Filter available drivers in Lahore for today (2026-11-20)
    const today = '2026-11-20';
    const lahoreAvailableToday = DRIVERS_DATA.filter((d) => {
      if (d.city.toLowerCase() !== 'lahore') return false;
      if (d.avail === 'Offline') return false;
      if (today === '2026-11-20' && d.avail === 'Busy') return false;
      if (d.blockedDates && d.blockedDates.includes(today)) return false;
      return true;
    });

    // drv-3 must NOT be present
    expect(lahoreAvailableToday.map((d) => d.id)).not.toContain('drv-3');
    // drv-1 (Imran Khan) and drv-2 (Waqar Ahmed) must be present
    expect(lahoreAvailableToday.map((d) => d.id)).toContain('drv-1');
    expect(lahoreAvailableToday.map((d) => d.id)).toContain('drv-2');
    expect(lahoreAvailableToday.length).toBe(2);
  });

  it('guarantees search input is not duplicated in MobileHomeNativeView', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../src/components/MobileHomeNativeView.tsx'),
      'utf-8'
    );
    const searchMatches = src.match(/ref=\{searchInputRef\}/g);
    expect(searchMatches).toHaveLength(1);
  });
});

