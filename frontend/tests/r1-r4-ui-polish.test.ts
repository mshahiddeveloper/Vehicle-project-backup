import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CARS_DATA,
  DRIVERS_DATA,
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  MAJOR_HUBS,
  INTERCITY_CITIES,
  CITY_COMMUTE_AREAS,
  matchesShuttleRoute,
  VehicleCardItem,
  DriverCardItem,
  CityRideItem,
  ShuttleItem,
  MoverItem,
} from '@/data/marketplaceData';

const FRONTEND_DIR = path.resolve(__dirname, '..');
const APP_HEADER_PATH = path.join(FRONTEND_DIR, 'src', 'components', 'AppHeader.tsx');
const MOBILE_HOME_PATH = path.join(FRONTEND_DIR, 'src', 'components', 'MobileHomeNativeView.tsx');
const MOBILE_PWA_PATH = path.join(FRONTEND_DIR, 'src', 'components', 'MobilePWAExperience.tsx');
const PAGE_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'page.tsx');

describe('Milestone 1: UI Refactoring & Polish (Requirements R1 - R4)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // =========================================================================
  // REQUIREMENT R1: Header, Sidebar Navigation, and Account Role Display
  // =========================================================================
  describe('Requirement R1: Header, Sidebar Navigation, and Account Role Display', () => {
    const appHeaderSource = fs.readFileSync(APP_HEADER_PATH, 'utf-8');
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');

    it('R1.1: Mobile top bar has hamburger icon left, SafarPK logo centered, notification bell and profile right', () => {
      // In AppHeader.tsx
      const notifBellSource = fs.readFileSync(
        path.resolve(__dirname, '../src/components/NotificationBellButton.tsx'),
        'utf-8'
      );
      expect(appHeaderSource).toContain('aria-label="Open Navigation Drawer"');
      expect(appHeaderSource).toContain('href="/inbox"');
      expect(appHeaderSource).toContain('<NotificationBellButton');
      expect(notifBellSource).toContain('aria-label="Notifications"');
      expect(appHeaderSource).toContain('aria-label="My account"');

      // Top bar layout ordering in AppHeader mobile section:
      // Left: hamburger button
      // Center: SafarPK logo
      // Right: notifications bell + user avatar
      const appHeaderMobileIdx = appHeaderSource.indexOf('2. MOBILE HEADER');
      expect(appHeaderMobileIdx).toBeGreaterThan(-1);
      const appHeaderSection = appHeaderSource.slice(appHeaderMobileIdx, appHeaderMobileIdx + 3000);

      const hamburgerIdx = appHeaderSection.indexOf('aria-label="Open Navigation Drawer"');
      const logoIdx = appHeaderSection.indexOf('href="/"');
      const bellIdx = appHeaderSection.indexOf('<NotificationBellButton');
      const userIdx = appHeaderSection.indexOf('aria-label="My account"');

      expect(hamburgerIdx).toBeGreaterThan(-1);
      expect(logoIdx).toBeGreaterThan(hamburgerIdx);
      expect(bellIdx).toBeGreaterThan(logoIdx);
      expect(userIdx).toBeGreaterThan(bellIdx);
    });

    it('R1.2: MobileHomeNativeView top bar aligns identically with AppHeader', () => {
      // In MobileHomeNativeView.tsx
      expect(mobileHomeSource).toContain('aria-label="Open Navigation Drawer"');
      expect(mobileHomeSource).toContain('SafarPK');
      expect(mobileHomeSource).toContain("'/inbox'");
      expect(mobileHomeSource).toContain('aria-label="Notifications"');
      expect(mobileHomeSource).toContain('aria-label="My account"');

      const mobileTopNavIdx = mobileHomeSource.indexOf('1. TOP APP BAR');
      expect(mobileTopNavIdx).toBeGreaterThan(-1);
      const mobileTopNavSection = mobileHomeSource.slice(mobileTopNavIdx, mobileTopNavIdx + 3000);

      const hamburgerIdx = mobileTopNavSection.indexOf('aria-label="Open Navigation Drawer"');
      const logoIdx = mobileTopNavSection.indexOf('href="/"');
      const bellIdx = mobileTopNavSection.indexOf('aria-label="Notifications"');
      const userIdx = mobileTopNavSection.indexOf('aria-label="My account"');

      expect(hamburgerIdx).toBeGreaterThan(-1);
      expect(logoIdx).toBeGreaterThan(hamburgerIdx);
      expect(bellIdx).toBeGreaterThan(logoIdx);
      expect(userIdx).toBeGreaterThan(bellIdx);
    });

    it('R1.3: MobileNavigationDrawer is exported and shared between AppHeader and MobileHomeNativeView', () => {
      expect(appHeaderSource).toContain('export function MobileNavigationDrawer');
      expect(mobileHomeSource).toContain("import { MobileNavigationDrawer } from '@/components/AppHeader';");
      expect(mobileHomeSource).toContain('<MobileNavigationDrawer');
    });

    it('R1.4: Slide-out sidebar drawer includes collapsible accordion sections', () => {
      // Four accordion sections: Services, Partner & Host Portals, Preferences, Support & Legal
      expect(appHeaderSource).toContain('Services');
      expect(appHeaderSource).toContain('Partner & Host Portals');
      expect(appHeaderSource).toContain('Preferences');
      expect(appHeaderSource).toContain('Support & Legal');

      // Accordion toggle logic
      expect(appHeaderSource).toContain('toggleAccordion');
      expect(appHeaderSource).toContain('openAccordions');
    });

    it('R1.5: Displays logged-in user first name above auth actions, and hides it when logged out', () => {
      // First name extraction logic
      expect(appHeaderSource).toContain("activeUser?.name ? activeUser.name.trim().split(/\\s+/)[0] : ''");

      // Displays user greeting above auth actions
      expect(appHeaderSource).toContain('{firstName}');

      // Hidden when activeUser is null
      expect(appHeaderSource).toContain('{activeUser ? (');
    });

    it('R1.6: Displays exact role badges: "Customer Account" vs "Professional Fleet Host / Business Partner"', () => {
      // Customer Account badge
      expect(appHeaderSource).toContain("if (role === 'CUSTOMER') return 'Customer Account';");

      // Professional Fleet Host / Business Partner badge for LISTER and PROVIDER
      expect(appHeaderSource).toContain("if (role === 'LISTER' || role === 'PROVIDER') return 'Professional Fleet Host / Business Partner';");

      // Verified Chauffeur / Driver badge
      expect(appHeaderSource).toContain("if (role === 'DRIVER') return 'Verified Chauffeur / Driver';");

      // Rendered badge
      expect(appHeaderSource).toContain('{getRoleBadge(activeUser.role)}');
    });

    it('R1.7: Standalone PWA install banner is removed from page body; subtle Install button is in sidebar', () => {
      const pwaSource = fs.readFileSync(MOBILE_PWA_PATH, 'utf-8');

      // Standalone banner is not auto-displayed in page body
      expect(pwaSource).not.toContain('{showPrompt &&');
      expect(pwaSource).not.toContain('Install SafarPK App');

      // Sidebar has subtle Install App button near the bottom
      expect(appHeaderSource).toContain('Install App');

      // Install button is hidden if in standalone mode or already installed
      expect(appHeaderSource).toContain('display-mode: standalone');
      expect(appHeaderSource).toContain('!isStandalone');
    });
  });

  // =========================================================================
  // REQUIREMENT R2: Service Selection and Search Filters
  // =========================================================================
  describe('Requirement R2: Service Selection and Search Filters', () => {
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');

    it('R2.1: All 5 service chips fit cleanly in home view without horizontal scroll hiding Movers', () => {
      // Check 5 services in home tabs
      expect(mobileHomeSource).toContain("'Rent car'");
      expect(mobileHomeSource).toContain("'Drivers'");
      expect(mobileHomeSource).toContain("'City to City'");
      expect(mobileHomeSource).toContain("'Pick & drop'");
      expect(mobileHomeSource).toContain("'Movers'");

      // Grid cols 5 ensures all 5 chips fit on screen without horizontal scroll
      expect(mobileHomeSource).toContain('grid grid-cols-5 gap-1');
    });

    it('R2.2: Origin city selector is click-to-change without keyboard text entry', () => {
      // Click to change button triggers citySheetOpen
      expect(mobileHomeSource).toContain('setCitySheetOpen(true)');

      // Origin city selector button renders current city
      expect(mobileHomeSource).toContain('<span className="max-w-[75px] truncate">{city}</span>');
    });

    it('R2.3: Bottom search sheet uses 5-column segmented grid with Movers 100% visible', () => {
      // Search sheet segmented grid control
      const searchSheetIdx = mobileHomeSource.indexOf('5-Column Segmented Grid Switcher');
      expect(searchSheetIdx).toBeGreaterThan(-1);
      const searchSheetSlice = mobileHomeSource.slice(searchSheetIdx, searchSheetIdx + 1500);

      expect(searchSheetSlice).toContain('grid grid-cols-5 gap-1');
      expect(searchSheetSlice).toContain('Movers');
    });

    it('R2.4: City to City search covers all major hubs and supports route swap', () => {
      const requiredHubs = [
        'Karachi',
        'Lahore',
        'Islamabad',
        'Rawalpindi',
        'Peshawar',
        'Multan',
        'Faisalabad',
      ];

      // MAJOR_HUBS must contain all required hubs
      requiredHubs.forEach((hub) => {
        expect(MAJOR_HUBS).toContain(hub);
        expect(INTERCITY_CITIES).toContain(hub);
      });

      // City to City pickers in search sheet
      expect(mobileHomeSource).toContain('Leaving from');
      expect(mobileHomeSource).toContain('Going to (Destination City)');
      expect(mobileHomeSource).toContain('aria-label="Swap cities"');

      // Swap logic swaps departure and arrival
      expect(mobileHomeSource).toContain('setC2cFromCity(c2cToCity)');
      expect(mobileHomeSource).toContain('setC2cToCity(temp)');
    });

    it('R2.5: Pick & drop provides corridor area selectors with corridor stop matching via matchesShuttleRoute', () => {
      // Defined commute areas exist
      expect(CITY_COMMUTE_AREAS['Karachi']).toBeDefined();
      expect(CITY_COMMUTE_AREAS['Lahore']).toBeDefined();
      expect(CITY_COMMUTE_AREAS['Islamabad']).toBeDefined();

      // Test shuttle corridor matching logic
      const testShuttle: ShuttleItem = {
        id: 'shut-test-1',
        title: 'Morning Executive Commute',
        from: 'Gulshan-e-Iqbal',
        to: 'I.I. Chundrigar Road',
        route: 'Gulshan -> Shahrah-e-Faisal -> Clifton -> I.I. Chundrigar Road',
        stops: ['Gulshan-e-Iqbal', 'Shahrah-e-Faisal', 'Clifton', 'I.I. Chundrigar Road'],
        departureTime: '07:30 AM',
        returnTime: '05:30 PM',
        monthlyRate: 15000,
        vehicleType: 'Toyota HiAce High Roof',
        seatsAvailable: 4,
        totalSeats: 14,
        ac: true,
        wifi: true,
        city: 'Karachi',
        operatorName: 'Metro Shuttles',
        phone: '03001234567',
        rating: 4.8,
      };

      // 1. Direct corridor match (first stop to last stop)
      expect(matchesShuttleRoute(testShuttle, 'Gulshan-e-Iqbal', 'I.I. Chundrigar Road')).toBe(true);

      // 2. Intermediate stop corridor match (Shahrah-e-Faisal to Clifton)
      expect(matchesShuttleRoute(testShuttle, 'Shahrah-e-Faisal', 'Clifton')).toBe(true);

      // 3. Non-matching pickup stop
      expect(matchesShuttleRoute(testShuttle, 'North Nazimabad', 'Clifton')).toBe(false);

      // 4. Shuttle search sheet has commute city and area search via top search bar
      const shuttleSheetIdx = mobileHomeSource.indexOf('{activeServiceIdx === 3 && (');
      expect(shuttleSheetIdx).toBeGreaterThan(-1);
      const shuttleSheetSlice = mobileHomeSource.slice(shuttleSheetIdx, shuttleSheetIdx + 3000);
      expect(shuttleSheetSlice).toContain('Commute City');
      expect(shuttleSheetSlice).not.toContain('Single-Day Trip Date');
    });

    it('R2.6: Movers search provides pickup location, drop-off location, and shifting date pickers', () => {
      const moversSheetIdx = mobileHomeSource.indexOf('{activeServiceIdx === 4 && (');
      expect(moversSheetIdx).toBeGreaterThan(-1);
      const moversSheetSlice = mobileHomeSource.slice(moversSheetIdx, moversSheetIdx + 8000);

      expect(moversSheetSlice).toContain('Pickup Location');
      expect(moversSheetSlice).toContain('Drop-off Location');
      expect(moversSheetSlice).toContain('Shifting Date');
    });

    it('R2.7: Drivers search provides location and flexible starting date picker without return date', () => {
      const driversSheetIdx = mobileHomeSource.indexOf('When needed / Starting Date');
      expect(driversSheetIdx).toBeGreaterThan(-1);
      const driversSheetSlice = mobileHomeSource.slice(driversSheetIdx - 200, driversSheetIdx + 1500);

      expect(driversSheetSlice).toContain('When needed / Starting Date');
      expect(mobileHomeSource).toContain('Any Date (Flexible)');
      expect(driversSheetSlice).not.toContain('Return date');
    });
  });

  // =========================================================================
  // REQUIREMENT R3: Dynamic Service Inventory Listings on Home Screen
  // =========================================================================
  describe('Requirement R3: Dynamic Service Inventory Listings on Home Screen', () => {
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');

    it('R3.1: All mock dataset items across all 5 services have realistic ratings (4.0 - 5.0)', () => {
      // CARS
      expect(CARS_DATA.length).toBeGreaterThan(0);
      CARS_DATA.forEach((car: VehicleCardItem) => {
        expect(typeof car.rating).toBe('number');
        expect(car.rating).toBeGreaterThanOrEqual(4.0);
        expect(car.rating).toBeLessThanOrEqual(5.0);
      });

      // DRIVERS
      expect(DRIVERS_DATA.length).toBeGreaterThan(0);
      DRIVERS_DATA.forEach((driver: DriverCardItem) => {
        expect(typeof driver.rating).toBe('number');
        expect(driver.rating).toBeGreaterThanOrEqual(4.0);
        expect(driver.rating).toBeLessThanOrEqual(5.0);
      });

      // CITY RIDES
      expect(CITY_RIDES_DATA.length).toBeGreaterThan(0);
      CITY_RIDES_DATA.forEach((ride: CityRideItem) => {
        expect(typeof ride.rating).toBe('number');
        expect(ride.rating).toBeGreaterThanOrEqual(4.0);
        expect(ride.rating).toBeLessThanOrEqual(5.0);
      });

      // SHUTTLES
      expect(SHUTTLES_DATA.length).toBeGreaterThan(0);
      SHUTTLES_DATA.forEach((shuttle: ShuttleItem) => {
        expect(typeof shuttle.rating).toBe('number');
        expect(shuttle.rating).toBeGreaterThanOrEqual(4.0);
        expect(shuttle.rating).toBeLessThanOrEqual(5.0);
      });

      // MOVERS
      expect(MOVERS_DATA.length).toBeGreaterThan(0);
      MOVERS_DATA.forEach((mover: MoverItem) => {
        expect(typeof mover.rating).toBe('number');
        expect(mover.rating).toBeGreaterThanOrEqual(4.0);
        expect(mover.rating).toBeLessThanOrEqual(5.0);
      });
    });

    it('R3.2: Dynamically switches listing feed when each service chip is selected', () => {
      // Dynamic rendering blocks exist for all 5 services
      expect(mobileHomeSource).toContain('activeServiceIdx === 0 &&');
      expect(mobileHomeSource).toContain('activeServiceIdx === 1 &&');
      expect(mobileHomeSource).toContain('activeServiceIdx === 2 &&');
      expect(mobileHomeSource).toContain('activeServiceIdx === 3 &&');
      expect(mobileHomeSource).toContain('activeServiceIdx === 4 &&');

      // Feeds display respective items
      expect(mobileHomeSource).toContain('filteredCars.slice(0, 8).map');
      expect(mobileHomeSource).toContain('filteredDrivers.map');
      expect(mobileHomeSource).toContain('filteredRides.map');
      expect(mobileHomeSource).toContain('filteredShuttles.map');
      expect(mobileHomeSource).toContain('filteredMovers.map');
    });

    it('R3.3: Listing cards are rendered in compact mobile format with core details and rating', () => {
      // Cars cards: name, price/day, specs, rating
      expect(mobileHomeSource).toContain('{car.name}');
      expect(mobileHomeSource).toContain('{car.specs}');
      expect(mobileHomeSource).toContain('{car.rating ? car.rating.toFixed(1) : \'4.9\'}');

      // Drivers cards: name, rate, rating, exp
      expect(mobileHomeSource).toContain('{driver.name}');
      expect(mobileHomeSource).toContain('{driver.exp}');
      expect(mobileHomeSource).toContain('{driver.rating ? driver.rating.toFixed(1) : \'4.9\'}');

      // City to City cards: departure, destination, fares, rating
      expect(mobileHomeSource).toContain('{ride.fromCity}');
      expect(mobileHomeSource).toContain('{ride.toCity}');
      expect(mobileHomeSource).toContain('{ride.rating ? ride.rating.toFixed(1) : \'4.8\'}');

      // Shuttles cards: corridor route, monthly fee, rating
      expect(mobileHomeSource).toContain('{shuttle.from}');
      expect(mobileHomeSource).toContain('{shuttle.to}');
      expect(mobileHomeSource).toContain('{shuttle.fare}');
      expect(mobileHomeSource).toContain('{shuttle.rating ? shuttle.rating.toFixed(1) : \'4.8\'}');

      // Movers cards: vehicle type, base rate, rating
      expect(mobileHomeSource).toContain('{mover.name}');
      expect(mobileHomeSource).toContain('{mover.trucks}');
      expect(mobileHomeSource).toContain('{mover.rating ? mover.rating.toFixed(1) : \'4.9\'}');
    });

    it('R3.4: Direct Call and WhatsApp action buttons are rendered with valid tel: and wa.me links', () => {
      // Direct Call links
      expect(mobileHomeSource).toContain('href={`tel:${car.phone}`}');
      expect(mobileHomeSource).toContain('title="Call Owner"');

      // Direct WhatsApp links
      expect(mobileHomeSource).toContain('href={`https://wa.me/${cleanPhone}');
      expect(mobileHomeSource).toContain('title="WhatsApp Owner"');
    });

    it('R3.5: Clicking listing cards navigates to corresponding detail page routes', () => {
      // Cars detail link
      expect(mobileHomeSource).toContain('href={`/listing/${car.id}`}');

      // Drivers detail link
      expect(mobileHomeSource).toContain('href={`/drivers/${driver.id}`}');

      // City to City detail link
      expect(mobileHomeSource).toContain('href={`/city-to-city/${ride.id}`}');

      // Shuttles detail link
      expect(mobileHomeSource).toContain('href={`/shuttles/${shuttle.id}`}');

      // Movers detail link
      expect(mobileHomeSource).toContain('href={`/movers/${mover.id}`}');
    });
  });

  // =========================================================================
  // REQUIREMENT R4: City Hubs and Home Layout Cleanup
  // =========================================================================
  describe('Requirement R4: City Hubs and Home Layout Cleanup', () => {
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');
    const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');

    it('R4.1: Cluttered bottom app promo box and marketing text block are removed', () => {
      // Promo box block and promotional marketing text removed from layout
      expect(mobileHomeSource).not.toContain('SafarPK on Google Play and App Store');
      expect(mobileHomeSource).not.toContain('SafarPK is Pakistan’s peer-to-peer car rental marketplace');
      expect(mobileHomeSource).not.toContain('Get the app');

      expect(pageSource).not.toContain('SafarPK on Google Play and App Store');
      expect(pageSource).not.toContain('Get the app');
    });

    it('R4.2: Popular cities section removes blank color rectangles and displays clean badges with icon', () => {
      // Blank color rectangles style={{ backgroundColor: c.tint }} removed
      expect(mobileHomeSource).not.toContain('span className="block h-16 w-full"');
      expect(mobileHomeSource).not.toContain('style={{ backgroundColor: c.tint }}');

      // Clean city badge visual with Building2 icon
      expect(mobileHomeSource).toContain('Popular cities');
      expect(mobileHomeSource).toContain('<Building2 className="w-4 h-4 stroke-[2.2]" />');
      expect(mobileHomeSource).toContain('{c.name}');
    });
  });
});
