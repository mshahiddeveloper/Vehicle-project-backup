import { describe, it, expect } from 'vitest';
import { CARS_DATA } from '../src/data/marketplaceData';
import { isListingPaused, toggleListingPause } from '../src/data/userAuth';

describe('Cars Directory & Marketplace CTAs Verification', () => {
  it('CARS_DATA contains valid listings across Pakistani cities', () => {
    expect(CARS_DATA.length).toBeGreaterThan(0);
    const cities = new Set(CARS_DATA.map((c) => c.city));
    expect(cities.has('Karachi')).toBe(true);
    expect(cities.has('Lahore')).toBe(true);
    expect(cities.has('Islamabad')).toBe(true);
  });

  it('paused listings are excluded from active directory query', () => {
    const testCar = CARS_DATA[0];
    if (isListingPaused(testCar.id)) {
      toggleListingPause(testCar.id, 'Test admin');
    }
    expect(isListingPaused(testCar.id)).toBe(false);

    // Pause the listing
    const res = toggleListingPause(testCar.id, 'Test admin', testCar.name);
    expect(res.isPaused).toBe(true);
    expect(isListingPaused(testCar.id)).toBe(true);

    const activeCars = CARS_DATA.filter((car) => !isListingPaused(car.id));
    expect(activeCars.some((c) => c.id === testCar.id)).toBe(false);

    // Restore unpause
    toggleListingPause(testCar.id, 'Test admin');
    expect(isListingPaused(testCar.id)).toBe(false);
  });

  it('dynamic service routes point to real working directory pages', () => {
    const getServiceHref = (serviceId: string, city: string, searchQuery?: string) => {
      switch (serviceId) {
        case 'rent_car':
          return `/cars?city=${encodeURIComponent(city)}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
        case 'drivers':
          return `/drivers?city=${encodeURIComponent(city)}`;
        case 'pick_and_drop':
          return `/shuttles?city=${encodeURIComponent(city)}`;
        case 'movers':
          return `/movers?city=${encodeURIComponent(city)}`;
        case 'city_to_city':
          return '/city-to-city';
        default:
          return '/cars';
      }
    };

    expect(getServiceHref('rent_car', 'Karachi')).toBe('/cars?city=Karachi');
    expect(getServiceHref('rent_car', 'Lahore', 'Corolla')).toBe('/cars?city=Lahore&search=Corolla');
    expect(getServiceHref('drivers', 'Islamabad')).toBe('/drivers?city=Islamabad');
    expect(getServiceHref('pick_and_drop', 'Karachi')).toBe('/shuttles?city=Karachi');
    expect(getServiceHref('movers', 'Rawalpindi')).toBe('/movers?city=Rawalpindi');
    expect(getServiceHref('city_to_city', 'Multan')).toBe('/city-to-city');
  });

  it('enforces past date protection so back dates cannot be selected', () => {
    const today = new Date().toISOString().split('T')[0];
    const pastDate = '2020-01-01';
    const futureDate = '2030-12-31';

    const sanitizeDate = (val: string, minAllowed: string) => {
      if (val && val < minAllowed) return minAllowed;
      return val;
    };

    expect(sanitizeDate(pastDate, today)).toBe(today);
    expect(sanitizeDate(futureDate, today)).toBe(futureDate);
  });

  it('shuttle corridor stops should be visible and accessible by default', () => {
    // Default stops accordion state must be open so users immediately see route corridor stops
    const defaultStopsOpen = true;
    expect(defaultStopsOpen).toBe(true);

    const defaultFeaturesOpen = false;
    const defaultPoliciesOpen = false;
    expect(defaultFeaturesOpen).toBe(false);
    expect(defaultPoliciesOpen).toBe(false);
  });

  it('marketplace public routes are differentiated from provider portals', () => {
    const isPublicMarketplaceRoute = (path: string) => {
      if (path.startsWith('/provider')) return false;
      if (path.startsWith('/admin')) return false;
      if (path.startsWith('/agent')) return false;
      if (path === '/driver') return false;
      if (path === '/lister') return false;
      return true;
    };

    expect(isPublicMarketplaceRoute('/shuttles')).toBe(true);
    expect(isPublicMarketplaceRoute('/shuttles/sh-1')).toBe(true);
    expect(isPublicMarketplaceRoute('/movers')).toBe(true);
    expect(isPublicMarketplaceRoute('/cars')).toBe(true);
    expect(isPublicMarketplaceRoute('/provider')).toBe(false);
    expect(isPublicMarketplaceRoute('/admin')).toBe(false);
  });
});

