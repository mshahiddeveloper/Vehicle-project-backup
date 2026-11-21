import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CARS_DATA,
  DRIVERS_DATA,
  MOVERS_DATA,
  FAMOUS_PAKISTAN_CITIES,
  formatShortDate,
} from '../src/data/marketplaceData';
import { getAllRegisteredUsers, saveAllRegisteredUsers, RegisteredUser } from '../src/data/userAuth';

describe('Search Sheet UI, Default City & Dynamic Partner Cities Tests', () => {
  const mobileHomeSource = fs.readFileSync(
    path.join(__dirname, '../src/components/MobileHomeNativeView.tsx'),
    'utf-8'
  );
  const driversPageSource = fs.readFileSync(
    path.join(__dirname, '../src/app/drivers/page.tsx'),
    'utf-8'
  );

  describe('1. Default Location is Karachi across the marketplace', () => {
    it('T1.1: MobileHomeNativeView defaults city, searchWhere, and c2cFromCity to Karachi', () => {
      expect(mobileHomeSource).toMatch(/useState<string>\('Karachi'\)/);
      expect(mobileHomeSource).toMatch(/useState\('Karachi'\)/);
      expect(mobileHomeSource).toContain("const [searchWhere, setSearchWhere] = useState('Karachi');");
      expect(mobileHomeSource).toContain("const [c2cFromCity, setC2cFromCity] = useState('Karachi');");
    });

    it('T1.2: Drivers directory page defaults selectedCity to Karachi', () => {
      expect(driversPageSource).toContain("const [selectedCity, setSelectedCity] = useState<string>('Karachi');");
    });
  });

  describe('2. Famous 7 Major Hub Cities in Requested Order', () => {
    it('T2.1: FAMOUS_PAKISTAN_CITIES strictly lists the 7 famous cities with Karachi first', () => {
      const cityNames = FAMOUS_PAKISTAN_CITIES.map((c) => c.name);
      expect(cityNames).toEqual([
        'Karachi',
        'Hyderabad',
        'Lahore',
        'Islamabad',
        'Multan',
        'Faisalabad',
        'Peshawar',
      ]);
    });

    it('T2.2: Each famous city is marked with isFamous: true', () => {
      FAMOUS_PAKISTAN_CITIES.forEach((c) => {
        expect(c.isFamous).toBe(true);
      });
    });

    it('T2.3: Drivers page city select includes all 7 famous cities with Karachi at top', () => {
      const expectedOptions = [
        '<option value="Karachi">Karachi</option>',
        '<option value="Hyderabad">Hyderabad</option>',
        '<option value="Lahore">Lahore</option>',
        '<option value="Islamabad">Islamabad</option>',
        '<option value="Multan">Multan</option>',
        '<option value="Faisalabad">Faisalabad</option>',
        '<option value="Peshawar">Peshawar</option>',
      ];
      expectedOptions.forEach((opt) => {
        expect(driversPageSource).toContain(opt);
      });
    });
  });

  describe('3. Hyderabad Listings Available in All Services', () => {
    it('T3.1: CARS_DATA contains active verified rental cars in Hyderabad', () => {
      const hydCars = CARS_DATA.filter((c) => c.city.toLowerCase() === 'hyderabad');
      expect(hydCars.length).toBeGreaterThanOrEqual(2);
      expect(hydCars.some((c) => c.name.includes('Yaris'))).toBe(true);
      expect(hydCars.some((c) => c.name.includes('Civic'))).toBe(true);
    });

    it('T3.2: DRIVERS_DATA contains active verified chauffeurs in Hyderabad', () => {
      const hydDrivers = DRIVERS_DATA.filter((d) => d.city.toLowerCase() === 'hyderabad');
      expect(hydDrivers.length).toBeGreaterThanOrEqual(1);
      expect(hydDrivers[0].name).toBe('Nadeem Abbas');
      expect(hydDrivers[0].phone).toBe('+92 301 9876543');
    });

    it('T3.3: MOVERS_DATA contains cargo and shifting services in Hyderabad', () => {
      const hydMovers = MOVERS_DATA.filter((m) => m.city.toLowerCase() === 'hyderabad');
      expect(hydMovers.length).toBeGreaterThanOrEqual(1);
      expect(hydMovers[0].name).toContain('Hyderabad');
    });
  });

  describe('4. Clean Date Display Without "Today" or "Tomorrow" Prefix', () => {
    it('T4.1: formatShortDate formats ISO date as day and short month (e.g., "21 Nov")', () => {
      const formatted = formatShortDate('2026-11-21');
      expect(formatted).toBe('21 Nov');
    });

    it('T4.2: formatShortDate handles leap years and different months cleanly', () => {
      expect(formatShortDate('2026-03-15')).toBe('15 Mar');
      expect(formatShortDate('2026-12-31')).toBe('31 Dec');
    });

    it('T4.3: Pick-up date box in MobileHomeNativeView uses formatShortDate without "Today" prefix', () => {
      const pickupDateIndex = mobileHomeSource.indexOf('Pick-up Date');
      expect(pickupDateIndex).toBeGreaterThan(-1);
      const pickupDateSlice = mobileHomeSource.slice(pickupDateIndex, pickupDateIndex + 800);
      expect(pickupDateSlice).toContain('formatShortDate(pickupDate || todayDateStr)');
      expect(pickupDateSlice).not.toContain('Today (');
      expect(pickupDateSlice).not.toContain('Tomorrow (');
    });

    it('T4.4: Driver duty date and Mover shifting date use formatShortDate without "Today" prefix', () => {
      const driverDutyIdx = mobileHomeSource.indexOf('When needed / Starting Date');
      expect(driverDutyIdx).toBeGreaterThan(-1);
      const driverDutySlice = mobileHomeSource.slice(driverDutyIdx, driverDutyIdx + 800);
      expect(driverDutySlice).toContain('formatShortDate(pickupDate || todayDateStr)');
      expect(driverDutySlice).not.toContain('Today (');

      const moverDateIdx = mobileHomeSource.indexOf('Shifting Date');
      expect(moverDateIdx).toBeGreaterThan(-1);
      const moverDateSlice = mobileHomeSource.slice(moverDateIdx, moverDateIdx + 800);
      expect(moverDateSlice).toContain('formatShortDate');
      expect(moverDateSlice).not.toContain('Today (');
    });
  });

  describe('5. Search Sheet Native App Styling & Sizing', () => {
    it('T5.1: Self-drive and With driver toggle has comfortable native app height (h-11)', () => {
      const selfDriveIdx = mobileHomeSource.indexOf('Self-drive vs With Driver Segmented Toggle');
      expect(selfDriveIdx).toBeGreaterThan(-1);
      const selfDriveSlice = mobileHomeSource.slice(selfDriveIdx, selfDriveIdx + 1200);
      expect(selfDriveSlice).toContain('h-11');
      expect(selfDriveSlice).toContain('Self-drive');
      expect(selfDriveSlice).toContain('With driver');
    });

    it('T5.2: Universal search input has proper height (h-12) with centered icon and clean placeholder', () => {
      const searchBoxIdx = mobileHomeSource.indexOf('Live Search & Model Keyword Input Box');
      expect(searchBoxIdx).toBeGreaterThan(-1);
      const searchBoxSlice = mobileHomeSource.slice(searchBoxIdx, searchBoxIdx + 2500);
      expect(searchBoxSlice).toContain('h-12');
      expect(searchBoxSlice).toContain('pl-11');
      expect(searchBoxSlice).toContain('top-1/2 -translate-y-1/2');
      expect(searchBoxSlice).toContain('Search car name or model');
    });

    it('T5.3: Transmission row provides spacious dedicated 3-column pill grid without horizontal squeezing', () => {
      const transIdx = mobileHomeSource.indexOf('SERVICE 0: TRANSMISSION');
      expect(transIdx).toBeGreaterThan(-1);
      const transSlice = mobileHomeSource.slice(transIdx, transIdx + 1500);
      expect(transSlice).toContain('grid-cols-3');
      expect(transSlice).toContain("['All', 'Automatic', 'Manual']");
    });

    it('T5.4: Vehicle Type and Daily Budget 2-column grid is functional with sub-sheets', () => {
      expect(mobileHomeSource).toContain('setCarCategorySheetOpen(true)');
      expect(mobileHomeSource).toContain('setPriceSheetOpen(true)');
      expect(mobileHomeSource).toContain('CAR_CATEGORIES[selectedCarCategory]');
      expect(mobileHomeSource).toContain('selectedPriceMax');
    });

    it('T5.5: Pick & drop search only contains Commute City, pickup/drop-off area pickers are removed', () => {
      const shuttleSheetIdx = mobileHomeSource.indexOf('{activeServiceIdx === 3 && (');
      expect(shuttleSheetIdx).toBeGreaterThan(-1);
      const shuttleSheetSlice = mobileHomeSource.slice(shuttleSheetIdx, shuttleSheetIdx + 1500);
      expect(shuttleSheetSlice).toContain('Commute City');
      expect(shuttleSheetSlice).not.toContain('Pick-up area (Home Stop)');
      expect(shuttleSheetSlice).not.toContain('Drop-off (Office or School Stop)');

      // Other category options still preserve their fields
      const c2cIdx = mobileHomeSource.indexOf('{activeServiceIdx === 2 && (');
      expect(c2cIdx).toBeGreaterThan(-1);
      const c2cSlice = mobileHomeSource.slice(c2cIdx, c2cIdx + 3000);
      expect(c2cSlice).toContain('Leaving from');
      expect(c2cSlice).toContain('Going to');

      const moversIdx = mobileHomeSource.indexOf('{activeServiceIdx === 4 && (');
      expect(moversIdx).toBeGreaterThan(-1);
      const moversSlice = mobileHomeSource.slice(moversIdx, moversIdx + 5000);
      expect(moversSlice).toContain('Pickup Location');
      expect(moversSlice).toContain('Drop-off Location');
    });
  });

  describe('6. Dynamic Partner/Lister Cities Syncing', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('T6.1: New lister registering in Sialkot dynamically contributes city to partner hub', () => {
      const users = getAllRegisteredUsers();
      const newLister: RegisteredUser = {
        id: 'usr-test-sialkot-lister',
        name: 'Sialkot Rent a Car Fleet',
        phone: '+92 333 1122334',
        email: 'sialkot.fleet@safarpk.com',
        role: 'LISTER',
        city: 'Sialkot',
        countryCode: 'PK',
        registeredAt: new Date().toISOString(),
        subscription: {
          status: 'ACTIVE',
          planId: 'p-1',
          planName: 'Fleet Starter Pass',
          quota: 5,
          usedQuota: 2,
          amountPaid: 5000,
          currency: 'PKR',
          symbol: 'Rs',
          renewsOn: '30 Dec 2026',
        },
      };

      saveAllRegisteredUsers([...users, newLister]);
      const storedUsers = getAllRegisteredUsers();
      const sialkotLister = storedUsers.find((u) => u.id === 'usr-test-sialkot-lister');
      expect(sialkotLister).toBeDefined();
      expect(sialkotLister?.city).toBe('Sialkot');
      expect(sialkotLister?.subscription?.status).toBe('ACTIVE');
    });

    it('T6.2: City selection sheet presents Major Hubs and Registered Partner Cities sections', () => {
      const citySheetIdx = mobileHomeSource.indexOf('citySheetOpen &&');
      expect(citySheetIdx).toBeGreaterThan(-1);
      const citySheetSlice = mobileHomeSource.slice(citySheetIdx, citySheetIdx + 8000);
      expect(citySheetSlice).toContain('Major Hubs');
      expect(citySheetSlice).toContain('Registered Partner Cities');
      expect(citySheetSlice).toContain('Partner City');
    });

    it('T6.3: Initial demo users are strictly constrained to major hubs and do not seed unlisted cities like Rawalpindi', () => {
      const users = getAllRegisteredUsers();
      const demoUsers = users.filter((u) => u.id.startsWith('usr-demo-'));
      const famousLower = FAMOUS_PAKISTAN_CITIES.map((c) => c.name.toLowerCase());
      demoUsers.forEach((demo) => {
        expect(famousLower).toContain(demo.city.toLowerCase());
      });
    });

    it('T6.4: Only active subscribed listers qualify for partner cities (customers and unpaid accounts excluded)', () => {
      expect(mobileHomeSource).toContain("u.role === 'LISTER' || u.role === 'DRIVER' || u.role === 'PROVIDER'");
      expect(mobileHomeSource).toContain("u.subscription && u.subscription.status === 'ACTIVE'");
      expect(mobileHomeSource).toContain("!u.id.startsWith('usr-demo-')");
    });
  });
});
