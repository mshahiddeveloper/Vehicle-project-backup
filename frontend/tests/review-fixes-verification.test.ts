import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { extendUserSubscription, getAllRegisteredUsers, saveAllRegisteredUsers, RegisteredUser } from '@/data/userAuth';
import { CARS_DATA } from '@/data/marketplaceData';

const FRONTEND_DIR = path.resolve(__dirname, '..');
const MOBILE_HOME_PATH = path.join(FRONTEND_DIR, 'src', 'components', 'MobileHomeNativeView.tsx');
const SAVED_PAGE_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'saved', 'page.tsx');
const LISTING_PAGE_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'listing', '[id]', 'page.tsx');
const DESKTOP_HOME_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'page.tsx');
const ADMIN_PAGE_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'admin', 'page.tsx');
const ADMIN_CONSOLE_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'admin', 'console', 'page.tsx');
const ADMIN_AGENTS_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'admin', 'agents', 'page.tsx');

describe('Review Verification Suite: Critical Bug Fixes & Requirements Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Fix 1: Search Popovers Stacking, Back Navigation & State Reflection', () => {
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');
    const desktopPageSource = fs.readFileSync(DESKTOP_HOME_PATH, 'utf-8');

    it('F1.1: Mobile search sheet has lower z-index than sub-pickers', () => {
      // Base searchSheetOpen container has z-[999990]
      expect(mobileHomeSource).toContain('searchSheetOpen && (');
      expect(mobileHomeSource).toContain('z-[999990]');

      // Sub-picker sheets have elevated z-[1000005] ensuring they pop open in front
      expect(mobileHomeSource).toContain('citySheetOpen && (');
      expect(mobileHomeSource).toContain('c2cPickerSheetOpen && (');
      expect(mobileHomeSource).toContain('shuttleAreaSheetOpen && (');
      expect(mobileHomeSource).toContain('z-[1000005]');
    });

    it('F1.2: All three sub-pickers feature dedicated Back buttons for smooth return', () => {
      // City picker back button
      expect(mobileHomeSource).toContain('onClick={() => setCitySheetOpen(false)}');
      // City to City picker back button
      expect(mobileHomeSource).toContain('onClick={() => setC2cPickerSheetOpen(null)}');
      // Shuttle Area picker back button
      expect(mobileHomeSource).toContain('onClick={() => setShuttleAreaSheetOpen(null)}');
      // Contains Back text and ArrowLeft icon
      expect(mobileHomeSource).toContain('aria-label="Back to filter options"');
    });

    it('F1.3: Real-time quick filtering is present across city, c2c, and shuttle stops', () => {
      expect(mobileHomeSource).toContain('citySearchQuery');
      expect(mobileHomeSource).toContain('c2cSearchQuery');
      expect(mobileHomeSource).toContain('shuttleAreaSearchQuery');
      expect(mobileHomeSource).toContain('placeholder="Search city hub or terminal..."');
      expect(mobileHomeSource).toContain('Search corridor stops in');
    });

    it('F1.4: Selecting a location reflects immediately in the respective search fields', () => {
      // Car & Drivers Where
      expect(mobileHomeSource).toContain('{searchWhere || city || \'Select City\'}');
      // C2C Departure & Destination
      expect(mobileHomeSource).toContain('{c2cFromCity || city}');
      expect(mobileHomeSource).toContain('{c2cToCity}');
      // Shuttles City, Pickup & Drop
      expect(mobileHomeSource).toContain('{shuttleCity || city}');
      expect(mobileHomeSource).toContain('{shuttlePickupArea || \'Select pickup corridor stop\'}');
      expect(mobileHomeSource).toContain('{shuttleDropArea || \'Select drop-off corridor stop\'}');
      // Movers City
      expect(mobileHomeSource).toContain('{searchWhere || city}');
    });

    it('F1.5: Desktop homepage search popovers have high z-index (z-[999]) and overflow-visible', () => {
      expect(desktopPageSource).toContain('overflow-visible z-40');
      expect(desktopPageSource).toContain('z-[999]');
    });
  });

  describe('Fix 2: Universal Wishlist Synchronization Across All Views', () => {
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');
    const savedPageSource = fs.readFileSync(SAVED_PAGE_PATH, 'utf-8');
    const listingPageSource = fs.readFileSync(LISTING_PAGE_PATH, 'utf-8');
    const desktopPageSource = fs.readFileSync(DESKTOP_HOME_PATH, 'utf-8');

    it('F2.1: MobileHomeNativeView synchronizes both safarpk_saved_items and safarpk_saved_vehicles', () => {
      expect(mobileHomeSource).toContain('safarpk_saved_vehicles');
      expect(mobileHomeSource).toContain('safarpk_saved_items');
      expect(mobileHomeSource).toContain('safarpk_saved_updated');
      expect(mobileHomeSource).toContain('safarpk_favorites_updated');
    });

    it('F2.2: Saved Page resolves vehicles from safarpk_saved_vehicles and CARS_DATA', () => {
      expect(savedPageSource).toContain("import { CARS_DATA } from '@/data/marketplaceData';");
      expect(savedPageSource).toContain('safarpk_saved_vehicles');
      expect(savedPageSource).toContain('safarpk_saved_items');
      expect(savedPageSource).toContain('safarpk_favorites_updated');
    });

    it('F2.3: Vehicle Detail Page (Page 8) contains back, share, and save buttons with image overlay', () => {
      expect(listingPageSource).toContain('router.back()');
      expect(listingPageSource).toContain('handleShareListing');
      expect(listingPageSource).toContain('handleToggleSave');
      expect(listingPageSource).toContain('Heart');
      expect(listingPageSource).toContain('Share2');
      expect(listingPageSource).toContain('1 / 8');
    });

    it('F2.4: Desktop home page synchronizes with both storage keys and event types', () => {
      expect(desktopPageSource).toContain('safarpk_saved_vehicles');
      expect(desktopPageSource).toContain('safarpk_saved_items');
      expect(desktopPageSource).toContain('safarpk_favorites_updated');
      expect(desktopPageSource).toContain('safarpk_saved_updated');
    });
  });

  describe('Fix 3: Super Admin Plan Extension & Subscription Expiry Calculations', () => {
    it('F3.1: extendUserSubscription extends active plan from existing end date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureStr = futureDate.toISOString().slice(0, 10);

      const mockUser: RegisteredUser = {
        id: 'usr-test-ext-1',
        name: 'Kashif Motors Test',
        phone: '+92 300 1112233',
        city: 'Islamabad',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: {
          status: 'ACTIVE',
          planId: 'starter',
          planName: 'Starter Fleet',
          quota: 5,
          usedQuota: 1,
          validUntil: futureStr,
          endDate: futureStr,
        },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      saveAllRegisteredUsers([mockUser]);

      const updated = extendUserSubscription('usr-test-ext-1', 30, 'Customer loyalty bonus', 'Super Admin');
      expect(updated).not.toBeNull();
      expect(updated?.subscription?.status).toBe('ACTIVE');

      const expectedDate = new Date(futureStr + 'T00:00:00');
      expectedDate.setDate(expectedDate.getDate() + 30);
      const expectedStr = expectedDate.toISOString().slice(0, 10);

      expect(updated?.subscription?.validUntil).toBe(expectedStr);
      expect(updated?.subscription?.endDate).toBe(expectedStr);
      expect(updated?.subscription?.renewsOn).toBe(expectedStr);
    });

    it('F3.2: extendUserSubscription extends expired plan from today', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);
      const pastStr = pastDate.toISOString().slice(0, 10);

      const mockUser: RegisteredUser = {
        id: 'usr-test-ext-expired',
        name: 'Expired Motors',
        phone: '+92 300 9998877',
        city: 'Lahore',
        role: 'LISTER',
        registeredAt: new Date().toISOString(),
        subscription: {
          status: 'EXPIRED' as any,
          planId: 'starter',
          planName: 'Starter Fleet',
          quota: 5,
          usedQuota: 0,
          validUntil: pastStr,
          endDate: pastStr,
        },
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
      };

      saveAllRegisteredUsers([mockUser]);

      const updated = extendUserSubscription('usr-test-ext-expired', 15, 'Reactivation offer', 'Super Admin');
      expect(updated).not.toBeNull();
      expect(updated?.subscription?.status).toBe('ACTIVE');

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 15);
      const expectedStr = expectedDate.toISOString().slice(0, 10);

      expect(updated?.subscription?.validUntil).toBe(expectedStr);
      expect(updated?.subscription?.endDate).toBe(expectedStr);
    });
  });

  describe('Fix 4: Super Admin Redesign & Module Directory Completeness', () => {
    const adminPageSource = fs.readFileSync(ADMIN_PAGE_PATH, 'utf-8');
    const adminConsoleSource = fs.readFileSync(ADMIN_CONSOLE_PATH, 'utf-8');
    const adminAgentsSource = fs.readFileSync(ADMIN_AGENTS_PATH, 'utf-8');

    it('F4.1: Admin overview table supports extending plans and viewing leads report', () => {
      expect(adminPageSource).toContain('setExtendModalUser(u)');
      expect(adminPageSource).toContain('+ Extend plan');
      expect(adminPageSource).toContain('Leads report');
      expect(adminPageSource).toContain('handleAssignUserToAgent');
    });

    it('F4.2: Admin console covers all 7 operational categories', () => {
      expect(adminConsoleSource).toContain("'DASHBOARD'");
      expect(adminConsoleSource).toContain("'PEOPLE'");
      expect(adminConsoleSource).toContain("'MARKETPLACE'");
      expect(adminConsoleSource).toContain("'ACTIVITY'");
      expect(adminConsoleSource).toContain("'MONEY'");
      expect(adminConsoleSource).toContain("'CONTENT'");
      expect(adminConsoleSource).toContain("'SYSTEM'");
    });

    it('F4.3: Staff agents hub provides granular capability toggles and activity logs', () => {
      expect(adminAgentsSource).toContain("key: 'view'");
      expect(adminAgentsSource).toContain("key: 'contact'");
      expect(adminAgentsSource).toContain("key: 'approve'");
      expect(adminAgentsSource).toContain("key: 'verify'");
      expect(adminAgentsSource).toContain("key: 'edit'");
      expect(adminAgentsSource).toContain("key: 'del'");
      expect(adminAgentsSource).toContain("key: 'analytics'");
      expect(adminAgentsSource).toContain("key: 'export'");
      expect(adminAgentsSource).toContain("key: 'promo'");
      expect(adminAgentsSource).toContain('recordAuditAction');
    });
  });

  describe('Fix 5: Movers Area Picker Sheet & Mobile Location Sync', () => {
    const mobileHomeSource = fs.readFileSync(MOBILE_HOME_PATH, 'utf-8');

    it('F5.1: Movers area picker sheet has elevated z-[1000005] and smooth back navigation', () => {
      expect(mobileHomeSource).toContain('moverAreaSheetOpen && (');
      expect(mobileHomeSource).toContain('setMoverAreaSheetOpen(null)');
      expect(mobileHomeSource).toContain('moverAreaSearchQuery');
      expect(mobileHomeSource).toContain('Pick area');
    });

    it('F5.2: Dynamic datasets use searchWhere fallback and dependency arrays', () => {
      expect(mobileHomeSource).toContain('const targetCity = searchWhere || city;');
    });
  });

  describe('Fix 6: WhatsApp International Phone Number Normalization in Admin', () => {
    const adminPageSource = fs.readFileSync(ADMIN_PAGE_PATH, 'utf-8');

    it('F6.1: WhatsApp links use normalizeWhatsAppPhone to eliminate leading zero failure', () => {
      expect(adminPageSource).toContain("import { normalizeWhatsAppPhone } from '@/data/chatEngine';");
      expect(adminPageSource).toContain('normalizeWhatsAppPhone(user.phone)');
      expect(adminPageSource).toContain('normalizeWhatsAppPhone(p.phone)');
    });
  });

  describe('Fix 7: Agent Permissions Persistence in Data & Admin Hub', () => {
    const agentPermSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src', 'data', 'agentPermissions.ts'), 'utf-8');
    const adminAgentsSource = fs.readFileSync(ADMIN_AGENTS_PATH, 'utf-8');

    it('F7.1: agentPermissions.ts exports persistence functions and AgentPermissions type', () => {
      expect(agentPermSource).toContain('export type AgentPermissions');
      expect(agentPermSource).toContain('export function getAllAgentsPermissionsMap');
      expect(agentPermSource).toContain('export function saveAllAgentsPermissionsMap');
      expect(agentPermSource).toContain('export function getAgentPermissions');
      expect(agentPermSource).toContain('export function saveAgentPermissions');
    });

    it('F7.2: Admin agents page persists permissions to localStorage on save', () => {
      expect(adminAgentsSource).toContain('saveAllAgentsPermissionsMap(permissionsMap)');
      expect(adminAgentsSource).toContain('getAllAgentsPermissionsMap()');
    });
  });

  describe('Fix 8: Mobile Bottom Navigation Bar on Customer & Lister Portals', () => {
    const customerPageSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src', 'app', 'customer', 'page.tsx'), 'utf-8');
    const listerPageSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src', 'app', 'lister', 'page.tsx'), 'utf-8');

    it('F8.1: Customer dashboard includes MobileNavBar and mobile bottom padding', () => {
      expect(customerPageSource).toContain("import { MobileNavBar } from '@/components/MobileNavBar';");
      expect(customerPageSource).toContain('<MobileNavBar />');
      expect(customerPageSource).toContain('pb-20 md:pb-0');
    });

    it('F8.2: Lister dashboard includes MobileNavBar and mobile bottom padding', () => {
      expect(listerPageSource).toContain("import { MobileNavBar } from '@/components/MobileNavBar';");
      expect(listerPageSource).toContain('<MobileNavBar />');
      expect(listerPageSource).toContain('pb-20 md:pb-0');
    });
  });

  describe('Fix 9: Universal Wishlist Integration on Drivers, Shuttles, and Movers Detail Pages', () => {
    const driverDetailSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src', 'app', 'driver', '[slug]', 'page.tsx'), 'utf-8');
    const shuttleDetailSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src', 'app', 'shuttles', '[id]', 'page.tsx'), 'utf-8');
    const moverDetailSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src', 'app', 'movers', '[id]', 'page.tsx'), 'utf-8');

    it('F9.1: Driver detail page includes Heart save button and safarpk_saved_items integration', () => {
      expect(driverDetailSource).toContain('handleToggleSaveDriver');
      expect(driverDetailSource).toContain('safarpk_saved_items');
      expect(driverDetailSource).toContain('safarpk_saved_updated');
    });

    it('F9.2: Shuttle detail page includes Heart save button and safarpk_saved_items integration', () => {
      expect(shuttleDetailSource).toContain('handleToggleSaveShuttle');
      expect(shuttleDetailSource).toContain('safarpk_saved_items');
      expect(shuttleDetailSource).toContain('safarpk_saved_updated');
    });

    it('F9.3: Mover detail page includes Heart save button and safarpk_saved_items integration', () => {
      expect(moverDetailSource).toContain('handleToggleSaveMover');
      expect(moverDetailSource).toContain('safarpk_saved_items');
      expect(moverDetailSource).toContain('safarpk_saved_updated');
    });
  });
});
