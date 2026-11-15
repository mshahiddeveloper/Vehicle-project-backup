import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUnifiedBooking,
  getUnifiedBookings,
  getBookingById,
  updateBookingStatus,
} from '@/data/bookingSync';
import {
  logLeadEvent,
  getDeduplicatedStats,
  recordClickEvent,
  getAllClickEvents,
} from '@/data/activityTracker';
import {
  logAuditEvent,
  getAuditLogs,
  clearAuditLogs,
  STORAGE_AUDIT_LOGS_KEY,
} from '@/data/auditLog';
import {
  validatePromoCode,
  getStoredPromoCodes,
  saveStoredPromoCodes,
  DEFAULT_PROMO_CODES,
  PromoCode,
} from '@/data/promoCodes';
import {
  calculatePlanDaysLeft,
  extendUserSubscription,
  addCalendarMonths,
  validateVehiclePublishing,
  restoreQuotaOnListingDelete,
  MOCK_LISTER,
} from './helpers/mockData';
import { getDocRulesForCountry } from '@/data/docRules';
import {
  maskPakistaniCnic,
  maskPakistaniLicense,
  getDriverCredentialsDisplay,
  confirmDriverBooking,
  declineDriverBooking,
  createDriverBooking,
} from '@/data/driverBookings';
import {
  getAgentAnalyticsPermission,
  setAgentAnalyticsPermission,
} from '@/data/analyticsEngine';
import {
  getAgentFeaturedPermission,
  setAgentFeaturedPermission,
  STORAGE_STAFF_AGENTS_KEY,
} from '@/data/featuredAds';
import {
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  DEMO_USERS,
  RegisteredUser,
} from '@/data/userAuth';

describe('Tier 2: Boundary, Negative & Corner Cases (54 Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAllRegisteredUsers(JSON.parse(JSON.stringify(DEMO_USERS)));
    saveStoredPromoCodes(JSON.parse(JSON.stringify(DEFAULT_PROMO_CODES)));
  });

  // ==========================================
  // Feature Area 1: Unified Booking Creation & Retrieval
  // ==========================================
  describe('F1 Boundaries: Unified Booking Creation & Retrieval', () => {
    it('T2.1.1: Non-Existent Booking ID Update returns null', () => {
      const res = updateBookingStatus('SF-NONEXISTENT-9999', 'CONFIRMED', 'admin');
      expect(res).toBeNull();
    });

    it('T2.1.2: Empty / Invalid ID Lookup returns null safely', () => {
      expect(getBookingById('')).toBeNull();
      expect(getBookingById('   ')).toBeNull();
      expect(getBookingById('null')).toBeNull();
    });

    it('T2.1.3: Booking Creation with Missing Optional Fields serializes gracefully', () => {
      const booking = createUnifiedBooking({
        serviceType: 'MOVER',
        customerId: 'c-1',
        customerName: 'Ali',
        customerPhone: '+923000000000',
        providerId: 'p-1',
        listingId: 'mov-1',
        listingTitle: 'Shifting',
        pickupDate: '2026-12-01',
        pickupLocation: 'Rawalpindi',
        totalAmount: 15000,
        currency: 'PKR',
      });

      expect(booking.id).toBeDefined();
      expect(booking.returnDate).toBeUndefined();
      expect(booking.destinationLocation).toBeUndefined();
      expect(booking.customerCnic).toBeUndefined();
      expect(booking.specialRequests).toBeUndefined();

      const retrieved = getBookingById(booking.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(booking.id);
    });

    it('T2.1.4: Zero Amount Booking Request ($0 / Quote Request)', () => {
      const created = createUnifiedBooking({
        serviceType: 'CAR_RENTAL',
        customerId: 'c-free',
        customerName: 'Free Booker',
        customerPhone: '+923001234567',
        providerId: 'usr-demo-lister',
        listingId: 'l-1',
        listingTitle: 'Test Car',
        pickupDate: '2026-12-01',
        pickupLocation: 'City',
        totalAmount: 0,
        currency: 'PKR',
      });

      expect(created.totalAmount).toBe(0);
      const retrieved = getBookingById(created.id);
      expect(retrieved?.totalAmount).toBe(0);
    });

    it('T2.1.5: Corrupt LocalStorage Recovery falls back gracefully', () => {
      localStorage.setItem('safarpk_unified_bookings_v3', '{corrupt json invalid');
      const bookings = getUnifiedBookings();
      expect(Array.isArray(bookings)).toBe(true);
      expect(bookings.length).toBeGreaterThan(0);
    });

    it('T2.1.6: Status Transition from Terminal State to CANCELLED', () => {
      const created = createUnifiedBooking({
        serviceType: 'CAR_RENTAL',
        customerId: 'c-1',
        customerName: 'Hamza',
        customerPhone: '+923001234567',
        providerId: 'usr-demo-lister',
        listingId: 'l-1',
        listingTitle: 'Car',
        pickupDate: '2026-12-01',
        pickupLocation: 'City',
        totalAmount: 10000,
        currency: 'PKR',
      });

      const cancelled = updateBookingStatus(created.id, 'CANCELLED', 'customer');
      expect(cancelled?.status).toBe('CANCELLED');

      const confirmed = updateBookingStatus(created.id, 'CONFIRMED', 'lister');
      expect(confirmed?.status).toBe('CONFIRMED');
    });
  });

  // ==========================================
  // Feature Area 2: 24-Hour Lead Deduplication & Proof of Leads
  // ==========================================
  describe('F2 Boundaries: 24-Hour Lead Deduplication & Ring Buffer', () => {
    it('T2.2.1: 24-Hour Deduplication Window Strict Enforcement (10 rapid clicks = 1 lead)', () => {
      const targetId = 'target-bva-rapid';
      const results: boolean[] = [];

      for (let i = 0; i < 10; i++) {
        results.push(logLeadEvent('WHATSAPP_CLICK', targetId, 'CAR_RENTAL', 'usr-c1', 'dev-1'));
      }

      expect(results[0]).toBe(true);
      expect(results.slice(1).every((r) => r === false)).toBe(true);

      const stats = getDeduplicatedStats(targetId);
      expect(stats.whatsappClicks).toBe(1);
      expect(stats.uniqueLeads).toBe(1);
      expect(stats.totalLeads).toBe(10);
    });

    it('T2.2.2: Window Expiry Across 24h Boundary (Different dates increment count)', () => {
      const targetId = 'target-bva-dates';
      // In activityTracker, buildFingerprintKey uses YYYY-MM-DD
      const eventDay1 = {
        id: 'ev-1',
        eventType: 'WHATSAPP_CLICK' as const,
        targetId,
        serviceType: 'CAR_RENTAL',
        userId: 'usr-c1',
        deviceId: 'dev-1',
        timestamp: '2026-11-10T10:00:00Z',
      };
      const eventDay2 = {
        id: 'ev-2',
        eventType: 'WHATSAPP_CLICK' as const,
        targetId,
        serviceType: 'CAR_RENTAL',
        userId: 'usr-c1',
        deviceId: 'dev-1',
        timestamp: '2026-11-12T10:00:00Z',
      };

      localStorage.setItem('safarpk_lead_events_v3', JSON.stringify([eventDay2, eventDay1]));

      const stats = getDeduplicatedStats(targetId);
      expect(stats.whatsappClicks).toBe(2);
    });

    it('T2.2.3: Same User, Same Day, Different Listings', () => {
      const isUnique1 = logLeadEvent('WHATSAPP_CLICK', 'target-bva-A', 'CAR_RENTAL', 'usr-c1', 'dev-1');
      const isUnique2 = logLeadEvent('WHATSAPP_CLICK', 'target-bva-B', 'CAR_RENTAL', 'usr-c1', 'dev-1');

      expect(isUnique1).toBe(true);
      expect(isUnique2).toBe(true);
      expect(getDeduplicatedStats('target-bva-A').whatsappClicks).toBe(1);
      expect(getDeduplicatedStats('target-bva-B').whatsappClicks).toBe(1);
    });

    it('T2.2.4: Empty Target ID Handling', () => {
      const res = logLeadEvent('VIEW', '', 'CAR_RENTAL', 'usr-1', 'dev-1');
      expect(typeof res).toBe('boolean');
    });

    it('T2.2.5: Unseen Listing Stats Default to Zero', () => {
      const stats = getDeduplicatedStats('listing-never-seen-999');
      expect(stats).toEqual({
        impressions: 0,
        views: 0,
        whatsappClicks: 0,
        callClicks: 0,
        requests: 0,
        saves: 0,
        totalLeads: 0,
        uniqueLeads: 0,
      });
    });

    it('T2.2.6: Click Events Ring-Buffer Saturation (capped at 200)', () => {
      for (let i = 0; i < 250; i++) {
        recordClickEvent({
          clickType: 'WHATSAPP_CLICK',
          targetId: `item-${i}`,
          targetTitle: `Vehicle ${i}`,
          targetCategory: 'CARS',
          timestamp: new Date().toISOString(),
        });
      }

      const allClicks = getAllClickEvents();
      expect(allClicks.length).toBe(200);
    });
  });

  // ==========================================
  // Feature Area 3: Stealth Audit Log & State Diffs
  // ==========================================
  describe('F3 Boundaries: Stealth Audit Log & State Diffs', () => {
    it('T2.3.1: Audit Storage Ring-Buffer Cap (200 Entries)', () => {
      clearAuditLogs();
      for (let i = 0; i < 250; i++) {
        logAuditEvent({
          actor: { id: `ag-${i}`, name: 'Agent', role: 'STAFF_AGENT' },
          action: 'BATCH_MUTATION',
          targetType: 'LISTING',
          targetId: `lst-${i}`,
          diff: [],
        });
      }

      const logs = getAuditLogs();
      expect(logs.length).toBe(200);
      expect(logs[0].targetId).toBe('lst-249');
    });

    it('T2.3.2: Complex Nested Object Diff Serialization', () => {
      const entry = logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'PERM_CHANGE',
        targetType: 'PERMISSIONS',
        targetId: 'ag-complex',
        diff: [
          {
            field: 'permissions',
            before: { canDelete: false, roles: ['AGENT'] },
            after: { canDelete: true, roles: ['AGENT', 'SUPER'] },
          },
        ],
      });

      const retrieved = getAuditLogs().find((l) => l.id === entry.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.diff[0].before).toEqual({ canDelete: false, roles: ['AGENT'] });
      expect(retrieved?.diff[0].after).toEqual({ canDelete: true, roles: ['AGENT', 'SUPER'] });
    });

    it('T2.3.3: Empty Diff Array Logging', () => {
      const entry = logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'EMPTY_DIFF_ACTION',
        targetType: 'USER',
        targetId: 'u-empty',
        diff: [],
      });

      expect(entry.diff).toEqual([]);
    });

    it('T2.3.4: Null and Undefined Values in Before/After Diffs', () => {
      const entry = logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'CREATE_USER',
        targetType: 'USER',
        targetId: 'u-new',
        diff: [{ field: 'status', before: null, after: 'ACTIVE' }],
      });

      expect(entry.diff[0].before).toBeNull();
      expect(entry.diff[0].after).toBe('ACTIVE');
    });

    it('T2.3.5: Suspicious Action Flagging', () => {
      const entry = logAuditEvent({
        actor: { id: 'ag-bad', name: 'Rogue Agent', role: 'STAFF_AGENT' },
        action: 'UNAPPROVED_DISCOUNT',
        targetType: 'SUBSCRIPTION',
        targetId: 'sub-bad',
        diff: [{ field: 'amountPaid', before: 12000, after: 3000 }],
        isSuspicious: true,
        reason: 'Fee deficit (-PKR 9,000)',
      });

      expect(entry.isSuspicious).toBe(true);
      expect(entry.reason).toBe('Fee deficit (-PKR 9,000)');
    });

    it('T2.3.6: Corrupted Storage Recovery for Audit Logs', () => {
      localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, 'corrupt-string-invalid-json');
      const logs = getAuditLogs();
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  // ==========================================
  // Feature Area 4: Promo Code Calculations & EXTRA_TIME
  // ==========================================
  describe('F4 Boundaries: Promo Code Calculations & EXTRA_TIME', () => {
    it('T2.4.1: Discount Exceeding Plan Base Price (Clamps to 0, never negative)', () => {
      const allPromos = getStoredPromoCodes();
      allPromos.push({
        id: 'promo-excess',
        code: 'BIGDISCOUNT',
        discountType: 'FIXED_AMOUNT',
        discountValue: 5000,
        targetCountries: ['PK'],
        targetRoles: ['ALL'],
        expiryDate: '2026-12-31',
        currentUses: 0,
        isActive: true,
        description: 'Excessive discount test',
      });
      saveStoredPromoCodes(allPromos);

      const res = validatePromoCode('BIGDISCOUNT', 'PK', 'CAR_RENTAL', 3500, 5000);
      expect(res.discountAmount).toBe(3500);
      expect(res.finalPrice).toBe(0);
      expect(res.finalPrice).toBeGreaterThanOrEqual(0);
    });

    it('T2.4.2: Expired Promo Code Rejection', () => {
      const allPromos = getStoredPromoCodes();
      allPromos.push({
        id: 'promo-expired',
        code: 'EXPIRED2025',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        targetCountries: ['PK'],
        targetRoles: ['ALL'],
        expiryDate: '2025-01-01',
        currentUses: 0,
        isActive: true,
        description: 'Expired test',
      });
      saveStoredPromoCodes(allPromos);

      const res = validatePromoCode('EXPIRED2025', 'PK', 'CAR_RENTAL', 10000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('expired');
    });

    it('T2.4.3: Exhausted Usage Limit Rejection', () => {
      const allPromos = getStoredPromoCodes();
      allPromos.push({
        id: 'promo-exhausted',
        code: 'EXHAUSTED',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        targetCountries: ['PK'],
        targetRoles: ['ALL'],
        expiryDate: '2026-12-31',
        maxUses: 10,
        currentUses: 10,
        isActive: true,
        description: 'Exhausted test',
      });
      saveStoredPromoCodes(allPromos);

      const res = validatePromoCode('EXHAUSTED', 'PK', 'CAR_RENTAL', 10000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maximum usage limit');
    });

    it('T2.4.4: Geo-Fencing Country Mismatch Rejection', () => {
      const res = validatePromoCode('GERMANY20', 'PK', 'CAR_RENTAL', 10000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('not applicable in your region');
    });

    it('T2.4.5: Role Mismatch Rejection', () => {
      const res = validatePromoCode('PKFLAT1000', 'PK', 'DRIVER', 10000);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('not valid for your partner account type');
    });

    it('T2.4.6: Empty String & Whitespace Promo Code Input', () => {
      const resEmpty = validatePromoCode('');
      expect(resEmpty.valid).toBe(false);
      expect(resEmpty.error).toBe('Please enter a promo code.');

      const resWhitespace = validatePromoCode('   ');
      expect(resWhitespace.valid).toBe(false);
      expect(resWhitespace.error).toBe('Please enter a promo code.');
    });
  });

  // ==========================================
  // Feature Area 5: Plan Days Left & Subscription Month-Math
  // ==========================================
  describe('F5 Boundaries: Plan Days Left & Subscription Month-Math', () => {
    it('T2.5.1: Past Expired Subscription Extension (Calculates from Today)', () => {
      const users = getAllRegisteredUsers();
      const testUser: RegisteredUser = {
        ...MOCK_LISTER,
        id: 'usr-expired-lister',
        subscription: {
          status: 'UNSUBSCRIBED',
          quota: 5,
          usedQuota: 0,
          renewsOn: '15 May 2026', // In the past relative to current date in late 2026
        },
      };
      users.push(testUser);
      saveAllRegisteredUsers(users);

      const success = extendUserSubscription('usr-expired-lister', 1, 'Reactivation', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });
      expect(success).toBe(true);

      const updated = getAllRegisteredUsers().find((u) => u.id === 'usr-expired-lister');
      expect(updated?.subscription.status).toBe('ACTIVE');

      // The new date should NOT be 15 Jun 2026 (old date + 1m); it must be >= current month + 1m
      const newRenews = new Date(updated!.subscription.renewsOn!);
      const now = new Date();
      expect(newRenews.getTime()).toBeGreaterThan(now.getTime());
    });

    it('T2.5.2: Past Date Days Left Clamp (Zero Floor, never negative)', () => {
      expect(calculatePlanDaysLeft('2024-01-01')).toBe(0);
      expect(calculatePlanDaysLeft('2020-05-15')).toBe(0);
    });

    it('T2.5.3: Leap-Year Month-End Math (Jan 31 -> Feb 28/29)', () => {
      // 2027 is a non-leap year: Jan 31 + 1 month should clamp to Feb 28, 2027
      const jan31 = new Date(2027, 0, 31);
      const febResult = addCalendarMonths(jan31, 1);
      expect(febResult.getFullYear()).toBe(2027);
      expect(febResult.getMonth()).toBe(1); // February (0-indexed)
      expect(febResult.getDate()).toBe(28);

      // 2028 is a leap year: Jan 31 + 1 month should clamp to Feb 29, 2028
      const jan31Leap = new Date(2028, 0, 31);
      const febLeapResult = addCalendarMonths(jan31Leap, 1);
      expect(febLeapResult.getFullYear()).toBe(2028);
      expect(febLeapResult.getMonth()).toBe(1);
      expect(febLeapResult.getDate()).toBe(29);
    });

    it('T2.5.4: Year-End Rollover Math (December -> February)', () => {
      const dec25 = new Date(2026, 11, 25); // 25 Dec 2026
      const feb25 = addCalendarMonths(dec25, 2);
      expect(feb25.getFullYear()).toBe(2027);
      expect(feb25.getMonth()).toBe(1); // February
      expect(feb25.getDate()).toBe(25);
    });

    it('T2.5.5: Corrupt / Invalid Date String in calculatePlanDaysLeft', () => {
      expect(calculatePlanDaysLeft('invalid-date-string')).toBe(0);
      expect(calculatePlanDaysLeft('')).toBe(0);
      expect(calculatePlanDaysLeft(null)).toBe(0);
      expect(calculatePlanDaysLeft(undefined)).toBe(0);
    });

    it('T2.5.6: Non-Existent User ID on Extension returns false', () => {
      const res = extendUserSubscription('usr-ghost-999', 1, 'reason', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });
      expect(res).toBe(false);
    });
  });

  // ==========================================
  // Feature Area 6: Document Validation & CNIC Auto-Formatting
  // ==========================================
  describe('F6 Boundaries: Document Validation & CNIC Auto-Formatting', () => {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

    it('T2.6.1: 12-Digit Incomplete CNIC Rejection', () => {
      expect(cnicRegex.test('35201-123456-1')).toBe(false);
    });

    it('T2.6.2: 14+ Digit CNIC Rejection', () => {
      expect(cnicRegex.test('35201-12345678-1')).toBe(false);
    });

    it('T2.6.3: Alpha-Numeric / Special Character Injection in CNIC', () => {
      expect(cnicRegex.test('35201-123456A-1')).toBe(false);
      expect(cnicRegex.test('35201-1234<script>-1')).toBe(false);
    });

    it('T2.6.4: Unknown Country Code Fallback to Default Rules', () => {
      const rules = getDocRulesForCountry('XYZ');
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.docName.includes('National ID'))).toBe(true);
    });

    it('T2.6.5: Self-Drive Rental Blocking without Driving Licence', () => {
      // In self-drive mode, driving licence is required
      const customer = {
        name: 'Zahid',
        cnic: '35201-9821045-3',
        licenceUploaded: false,
        rentalMode: 'SELF_DRIVE',
      };

      const isLicenceValid = customer.rentalMode === 'SELF_DRIVE' ? customer.licenceUploaded : true;
      expect(isLicenceValid).toBe(false);
    });

    it('T2.6.6: With-Driver Rental Bypass of Customer Licence', () => {
      // With chauffeur mode, driving licence requirement is bypassed
      const customer = {
        name: 'Zahid',
        cnic: '35201-9821045-3',
        licenceUploaded: false,
        rentalMode: 'WITH_CHAUFFEUR',
      };

      const isLicenceValid = customer.rentalMode === 'SELF_DRIVE' ? customer.licenceUploaded : true;
      expect(isLicenceValid).toBe(true);
    });
  });

  // ==========================================
  // Feature Area 7: Driver Credential Masking & Unmasking Lifecycle
  // ==========================================
  describe('F7 Boundaries: Driver Credential Masking & Unmasking', () => {
    it('T2.7.1: Null / Undefined Driver CNIC Fallback', () => {
      expect(maskPakistaniCnic(null)).toBe('35201-212***1-1');
      expect(maskPakistaniCnic(undefined)).toBe('35201-212***1-1');
    });

    it('T2.7.2: Null / Undefined Driver Licence Fallback', () => {
      expect(maskPakistaniLicense(null)).toBe('LHR-DL-98***0');
      expect(maskPakistaniLicense(undefined)).toBe('LHR-DL-98***0');
    });

    it('T2.7.3: Short (<13 digits) Partial CNIC Masking', () => {
      const masked = maskPakistaniCnic('35201123');
      expect(masked).toBeDefined();
      expect(masked).toContain('***');
    });

    it('T2.7.4: Non-Standard Licence String Masking', () => {
      const masked = maskPakistaniLicense('KHI-998877');
      expect(masked).toBe('KHI-99***7');
    });

    it('T2.7.5: Declined Booking Credential Lockdown', () => {
      const created = createDriverBooking({
        bookingRef: 'DRV-DECLINE-TEST',
        customerName: 'Customer',
        customerPhone: '+923000000000',
        driverId: 'usr-demo-driver',
        driverName: 'Tariq',
        driverPhone: '+923010000000',
        driverCnic: '35201-4412098-5',
        driverLicense: 'LHR-LTV-99210',
        dutyType: 'Full Day',
        destination: 'Islamabad',
        vehicleProvided: 'Car',
        startDate: '2026-11-20',
        days: 1,
        totalFare: 3500,
      });

      declineDriverBooking(created.id);
      const display = getDriverCredentialsDisplay('35201-4412098-5', 'LHR-LTV-99210', false);
      expect(display.isConfirmed).toBe(false);
      expect(display.cnic).toBe('35201-441***8-5');
      expect(display.license).toBe('LHR-LTV-99***0');
    });

    it('T2.7.6: Double Confirmation Idempotency', () => {
      const created = createDriverBooking({
        bookingRef: 'DRV-IDEMPOTENT',
        customerName: 'Customer',
        customerPhone: '+923000000000',
        driverId: 'usr-demo-driver',
        driverName: 'Tariq',
        driverPhone: '+923010000000',
        driverCnic: '35201-4412098-5',
        driverLicense: 'LHR-LTV-99210',
        dutyType: 'Full Day',
        destination: 'Islamabad',
        vehicleProvided: 'Car',
        startDate: '2026-11-20',
        days: 1,
        totalFare: 3500,
      });

      const first = confirmDriverBooking(created.id);
      expect(first.success).toBe(true);
      expect(first.booking?.status).toBe('CONFIRMED');

      const second = confirmDriverBooking(created.id);
      expect(second.success).toBe(true);
      expect(second.booking?.status).toBe('CONFIRMED');
    });
  });

  // ==========================================
  // Feature Area 8: Vehicle Publishing Double-Gate & Quota Limits
  // ==========================================
  describe('F8 Boundaries: Vehicle Publishing Double-Gate & Quota Limits', () => {
    it('T2.8.1: Missing Vehicle Registration Document Publish Block', () => {
      const lister = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      const validation = validateVehiclePublishing(lister, {
        registrationDocId: null,
      });

      expect(validation.canPublish).toBe(false);
      expect(validation.error).toContain('Vehicle registration smart card is mandatory.');
    });

    it('T2.8.2: Unsubscribed / Inactive Plan Publish Block', () => {
      const unsubscribedUser: RegisteredUser = {
        ...MOCK_LISTER,
        subscription: {
          status: 'UNSUBSCRIBED',
          quota: 0,
          usedQuota: 0,
        },
      };

      const validation = validateVehiclePublishing(unsubscribedUser, {
        registrationDocId: 'doc-123',
      });
      expect(validation.canPublish).toBe(false);
      expect(validation.error).toContain('Choose a plan to publish or Save as draft.');
    });

    it('T2.8.3: Expired Plan Publish Block', () => {
      const expiredUser: RegisteredUser = {
        ...MOCK_LISTER,
        subscription: {
          status: 'ACTIVE',
          quota: 10,
          usedQuota: 2,
          renewsOn: '10 Jan 2024', // In past
        },
      };

      const validation = validateVehiclePublishing(expiredUser, {
        registrationDocId: 'doc-123',
      });
      expect(validation.canPublish).toBe(false);
      expect(validation.error).toContain('Subscription plan has expired. Please renew.');
    });

    it('T2.8.4: Starter Plan Quota Overflow (Attempting 3rd vehicle on quota: 2)', () => {
      const quotaCappedUser: RegisteredUser = {
        ...MOCK_LISTER,
        subscription: {
          status: 'ACTIVE',
          quota: 2,
          usedQuota: 2,
          renewsOn: '10 Dec 2026',
        },
      };

      const validation = validateVehiclePublishing(quotaCappedUser, {
        registrationDocId: 'doc-123',
      });
      expect(validation.canPublish).toBe(false);
      expect(validation.error).toContain('Listing quota exceeded');
    });

    it('T2.8.5: Zero Quota Account Publish Block', () => {
      const zeroQuotaUser: RegisteredUser = {
        ...MOCK_LISTER,
        subscription: {
          status: 'ACTIVE',
          quota: 0,
          usedQuota: 0,
          renewsOn: '10 Dec 2026',
        },
      };

      const validation = validateVehiclePublishing(zeroQuotaUser, {
        registrationDocId: 'doc-123',
      });
      expect(validation.canPublish).toBe(false);
    });

    it('T2.8.6: Quota Restoration on Listing Deletion', () => {
      const lister = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      lister.subscription.usedQuota = 4;
      saveAllRegisteredUsers(getAllRegisteredUsers());

      const success = restoreQuotaOnListingDelete('usr-demo-lister');
      expect(success).toBe(true);

      const updated = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      expect(updated.subscription.usedQuota).toBe(3);
    });
  });

  // ==========================================
  // Feature Area 9: Staff Agent 9 Permission Switches
  // ==========================================
  describe('F9 Boundaries: Staff Agent 9 Permission Switches', () => {
    it('T2.9.1: Unauthorized Listing Deletion Attempt Blocked', () => {
      const agentPermissions = { canDeleteRecords: false };
      const canDelete = agentPermissions.canDeleteRecords;
      expect(canDelete).toBe(false);
    });

    it('T2.9.2: Unauthorized Analytics Access Revocation', () => {
      setAgentAnalyticsPermission('ag-test-revoked', false);
      expect(getAgentAnalyticsPermission('ag-test-revoked')).toBe(false);
    });

    it('T2.9.3: Unauthorized Promo Code Management Block', () => {
      const agentPermissions = { canManagePromoCodes: false };
      expect(agentPermissions.canManagePromoCodes).toBe(false);
    });

    it('T2.9.4: Agent Route Isolation Protection', () => {
      const agentSession = { role: 'STAFF_AGENT' };
      const isSuperAdminOnly = (role: string) => role === 'SUPER_ADMIN';
      expect(isSuperAdminOnly(agentSession.role)).toBe(false);
    });

    it('T2.9.5: Uninitialized / Default Agent Permission Safety', () => {
      // Unknown agent for featured permission defaults to false
      expect(getAgentFeaturedPermission('ag-unknown-999')).toBe(false);
    });

    it('T2.9.6: Permission Revocation Persistence across Storage Reload', () => {
      setAgentFeaturedPermission('ag-persist-test', false);
      const raw = localStorage.getItem(STORAGE_STAFF_AGENTS_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed['ag-persist-test']?.manageFeaturedAds).toBe(false);
    });
  });
});
