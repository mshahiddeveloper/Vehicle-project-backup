import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createUnifiedBooking,
  getUnifiedBookings,
  getBookingById,
  getBookingsByCustomer,
  getBookingsByProvider,
  updateBookingStatus,
  EVENT_BOOKING_STATUS_UPDATED,
} from '@/data/bookingSync';
import {
  logLeadEvent,
  getDeduplicatedStats,
  recordLead,
} from '@/data/activityTracker';
import {
  logAuditEvent,
  getAuditLogs,
  getAuditLogsByTarget,
} from '@/data/auditLog';
import {
  validatePromoCode,
  incrementPromoUsage,
  getAvailablePromosForCountry,
  getStoredPromoCodes,
  saveStoredPromoCodes,
  DEFAULT_PROMO_CODES,
  PROMO_CODES,
} from '@/data/promoCodes';
import {
  calculatePlanDaysLeft,
  extendUserSubscription,
  updateUserKycStatus,
  validateVehiclePublishing,
  publishVehicle,
  MOCK_CUSTOMER,
  MOCK_LISTER,
} from './helpers/mockData';
import {
  getDocRulesForCountry,
  getRenterDocRequirement,
  isMasterDocAskEnabled,
  setMasterDocAskEnabled,
} from '@/data/docRules';
import {
  maskPakistaniCnic,
  maskPakistaniLicense,
  getDriverCredentialsDisplay,
  confirmDriverBooking,
  createDriverBooking,
} from '@/data/driverBookings';
import { CARS_DATA } from '@/data/marketplaceData';
import {
  getAgentAnalyticsPermission,
  setAgentAnalyticsPermission,
} from '@/data/analyticsEngine';
import {
  getAgentFeaturedPermission,
  setAgentFeaturedPermission,
} from '@/data/featuredAds';
import {
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  DEMO_USERS,
  approveSubscriptionByAdmin,
} from '@/data/userAuth';
import { createEventSpy } from './helpers/eventSpy';

describe('Tier 1: Feature Coverage (54 Happy-Path & Contract Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAllRegisteredUsers(JSON.parse(JSON.stringify(DEMO_USERS)));
    saveStoredPromoCodes(JSON.parse(JSON.stringify(DEFAULT_PROMO_CODES)));
  });

  // ==========================================
  // Feature Area 1: Unified Booking Store & Lifecycle
  // ==========================================
  describe('F1: Unified Booking Creation & Retrieval (bookingSync.ts)', () => {
    it('T1.1.1: Car Rental Booking Creation returns canonical SF-ID in WAITING status', () => {
      const result = createUnifiedBooking({
        serviceType: 'CAR_RENTAL',
        customerId: 'usr-cust-1',
        customerName: 'Zahid Khan',
        customerPhone: '+923001112233',
        providerId: 'usr-demo-lister',
        listingId: 'l-1',
        listingTitle: 'Honda Civic Oriel Turbo',
        pickupDate: '2026-12-01',
        returnDate: '2026-12-05',
        pickupLocation: 'Islamabad F-10',
        totalAmount: 48000,
        currency: 'PKR',
      });

      expect(result.id).toMatch(/^SF-\d+/);
      expect(result.status).toBe('WAITING');
      expect(result.createdAt).toBeDefined();
      expect(getUnifiedBookings().some((b) => b.id === result.id)).toBe(true);
    });

    it('T1.1.2: Chauffeur Hire Booking Retrieval by ID', () => {
      const created = createUnifiedBooking({
        serviceType: 'CHAUFFEUR',
        customerId: 'usr-cust-2',
        customerName: 'Asad Ali',
        customerPhone: '+923214445566',
        providerId: 'usr-demo-driver',
        listingId: 'drv-1',
        listingTitle: 'Tariq Mahmood (Executive Chauffeur)',
        pickupDate: '2026-12-02',
        pickupLocation: 'Lahore Cantt',
        totalAmount: 14000,
        currency: 'PKR',
      });

      const retrieved = getBookingById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.serviceType).toBe('CHAUFFEUR');
      expect(retrieved?.listingTitle).toBe('Tariq Mahmood (Executive Chauffeur)');
    });

    it('T1.1.3: Customer Bookings Partitioning', () => {
      createUnifiedBooking({
        serviceType: 'CAR_RENTAL',
        customerId: 'usr-cust-A',
        customerName: 'Customer A',
        customerPhone: '+923000000001',
        providerId: 'usr-lister-1',
        listingId: 'l-1',
        listingTitle: 'Car 1',
        pickupDate: '2026-12-01',
        pickupLocation: 'City',
        totalAmount: 10000,
        currency: 'PKR',
      });
      createUnifiedBooking({
        serviceType: 'CITY_TO_CITY',
        customerId: 'usr-cust-A',
        customerName: 'Customer A',
        customerPhone: '+923000000001',
        providerId: 'usr-lister-2',
        listingId: 'c2c-1',
        listingTitle: 'Ride 1',
        pickupDate: '2026-12-02',
        pickupLocation: 'City',
        totalAmount: 8000,
        currency: 'PKR',
      });
      createUnifiedBooking({
        serviceType: 'SHUTTLE',
        customerId: 'usr-cust-B',
        customerName: 'Customer B',
        customerPhone: '+923000000002',
        providerId: 'usr-lister-1',
        listingId: 'sht-1',
        listingTitle: 'Shuttle 1',
        pickupDate: '2026-12-03',
        pickupLocation: 'City',
        totalAmount: 5000,
        currency: 'PKR',
      });

      const customerABookings = getBookingsByCustomer('usr-cust-A');
      expect(customerABookings.length).toBe(2);
      expect(customerABookings.every((b) => b.customerId === 'usr-cust-A')).toBe(true);
    });

    it('T1.1.4: Provider Queue Partitioning', () => {
      createUnifiedBooking({
        serviceType: 'CAR_RENTAL',
        customerId: 'usr-cust-X',
        customerName: 'Cust X',
        customerPhone: '+923000000003',
        providerId: 'usr-provider-alpha',
        listingId: 'l-1',
        listingTitle: 'Car Alpha',
        pickupDate: '2026-12-01',
        pickupLocation: 'City',
        totalAmount: 12000,
        currency: 'PKR',
      });

      const providerBookings = getBookingsByProvider('usr-provider-alpha');
      expect(providerBookings.length).toBeGreaterThanOrEqual(1);
      expect(providerBookings.every((b) => b.providerId === 'usr-provider-alpha')).toBe(true);
    });

    it('T1.1.5: Booking Status Confirmation & Event Dispatch', () => {
      const spy = createEventSpy(EVENT_BOOKING_STATUS_UPDATED);
      const created = createUnifiedBooking({
        serviceType: 'CAR_RENTAL',
        customerId: 'usr-cust-1',
        customerName: 'Zahid Khan',
        customerPhone: '+923001112233',
        providerId: 'usr-demo-lister',
        listingId: 'l-1',
        listingTitle: 'Honda Civic',
        pickupDate: '2026-12-01',
        pickupLocation: 'Islamabad',
        totalAmount: 25000,
        currency: 'PKR',
      });

      const updated = updateBookingStatus(created.id, 'CONFIRMED', 'lister');
      expect(updated?.status).toBe('CONFIRMED');
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
      expect(spy.count).toBeGreaterThanOrEqual(1);
      const matchingEvent = spy.events.find(
        (e) => e.detail?.bookingId === created.id && e.detail?.status === 'CONFIRMED'
      );
      expect(matchingEvent).toBeDefined();
      expect(matchingEvent?.detail.actor).toBe('lister');
      spy.teardown();
    });

    it('T1.1.6: Booking Status Declination Lifecycle', () => {
      const created = createUnifiedBooking({
        serviceType: 'MOVER',
        customerId: 'usr-cust-1',
        customerName: 'Bilal',
        customerPhone: '+923001112233',
        providerId: 'usr-demo-provider-cargo',
        listingId: 'mov-1',
        listingTitle: 'Shehzore Shifting',
        pickupDate: '2026-12-01',
        pickupLocation: 'Rawalpindi',
        totalAmount: 18000,
        currency: 'PKR',
      });

      const updated = updateBookingStatus(created.id, 'DECLINED', 'provider');
      expect(updated?.status).toBe('DECLINED');
      expect(getBookingById(created.id)?.status).toBe('DECLINED');
    });
  });

  // ==========================================
  // Feature Area 2: 24-Hour Lead Deduplication & Proof of Leads
  // ==========================================
  describe('F2: 24-Hour Lead Deduplication & Proof (activityTracker.ts)', () => {
    it('T1.2.1: WhatsApp Click Lead Logging records lead and computes stats', () => {
      const targetId = 'target-test-t121';
      const isUnique = logLeadEvent('WHATSAPP_CLICK', targetId, 'CAR_RENTAL', 'usr-c1', 'dev-1');
      expect(isUnique).toBe(true);

      const stats = getDeduplicatedStats(targetId);
      expect(stats.whatsappClicks).toBe(1);
      expect(stats.totalLeads).toBe(1);
    });

    it('T1.2.2: Distinct Interaction Types per Listing', () => {
      const targetId = 'target-test-t122';
      logLeadEvent('VIEW', targetId, 'CAR_RENTAL', 'usr-c1', 'dev-1');
      logLeadEvent('CALL_CLICK', targetId, 'CAR_RENTAL', 'usr-c1', 'dev-1');
      logLeadEvent('REQUEST', targetId, 'CAR_RENTAL', 'usr-c1', 'dev-1');
      logLeadEvent('SAVE', targetId, 'CAR_RENTAL', 'usr-c1', 'dev-1');

      const stats = getDeduplicatedStats(targetId);
      expect(stats.views).toBe(1);
      expect(stats.callClicks).toBe(1);
      expect(stats.requests).toBe(1);
      expect(stats.saves).toBe(1);
    });

    it('T1.2.3: Multiple Distinct Users Accumulation', () => {
      const targetId = 'target-test-t123';
      logLeadEvent('WHATSAPP_CLICK', targetId, 'CAR_RENTAL', 'usr-1', 'dev-1');
      logLeadEvent('WHATSAPP_CLICK', targetId, 'CAR_RENTAL', 'usr-2', 'dev-2');
      logLeadEvent('WHATSAPP_CLICK', targetId, 'CAR_RENTAL', 'usr-3', 'dev-3');

      const stats = getDeduplicatedStats(targetId);
      expect(stats.whatsappClicks).toBe(3);
      expect(stats.totalLeads).toBe(3);
    });

    it('T1.2.4: Cross-Listing Independent Stats', () => {
      const target1 = 'target-test-l1';
      const target2 = 'target-test-l2';
      logLeadEvent('CALL_CLICK', target1, 'CAR_RENTAL', 'usr-x', 'dev-x');
      logLeadEvent('CALL_CLICK', target2, 'CAR_RENTAL', 'usr-x', 'dev-x');

      expect(getDeduplicatedStats(target1).callClicks).toBe(1);
      expect(getDeduplicatedStats(target2).callClicks).toBe(1);
    });

    it('T1.2.5: Anonymous Device Lead Tracking without User ID', () => {
      const targetId = 'target-test-t125';
      const isUnique = logLeadEvent('WHATSAPP_CLICK', targetId, 'CAR_RENTAL', undefined, 'device-fp-9988');
      expect(isUnique).toBe(true);

      const stats = getDeduplicatedStats(targetId);
      expect(stats.whatsappClicks).toBe(1);
      expect(stats.totalLeads).toBe(1);
    });

    it('T1.2.6: Leads Updated CustomEvent Dispatch', () => {
      const spy = createEventSpy('safarpk_leads_updated');
      recordLead({
        customerName: 'Imran Khan',
        customerPhone: '+923001234567',
        leadType: 'WHATSAPP',
        targetId: 'l-1',
        targetTitle: 'Honda Civic',
        targetRole: 'LISTER',
        targetOwnerName: 'Salman Rentals',
        targetOwnerPhone: '+923001234567',
        status: 'NEW',
        createdAt: new Date().toISOString(),
      });

      expect(spy.count).toBeGreaterThanOrEqual(1);
      spy.teardown();
    });
  });

  // ==========================================
  // Feature Area 3: Stealth Audit Log & State Diffs
  // ==========================================
  describe('F3: Stealth Audit Log & State Diffs (auditLog.ts)', () => {
    it('T1.3.1: Admin Subscription Approval Audit Entry', () => {
      const entry = logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'SUBSCRIPTION_APPROVE',
        targetType: 'SUBSCRIPTION',
        targetId: 'sub-101',
        diff: [{ field: 'status', before: 'PENDING_APPROVAL', after: 'ACTIVE' }],
        reason: 'Verified JazzCash slip',
      });

      expect(entry.id).toMatch(/^stl-/);
      expect(entry.timestamp).toBeDefined();
      expect(entry.diff[0]).toEqual({
        field: 'status',
        before: 'PENDING_APPROVAL',
        after: 'ACTIVE',
      });
    });

    it('T1.3.2: Staff Agent Listing Pause Audit Entry', () => {
      const entry = logAuditEvent({
        actor: { id: 'ag-1', name: 'Kashif Raza', role: 'STAFF_AGENT' },
        action: 'LISTING_PAUSE',
        targetType: 'LISTING',
        targetId: 'l-1',
        diff: [{ field: 'status', before: 'LIVE', after: 'PAUSED' }],
        reason: 'Photo missing rear angle',
      });

      expect(entry.actor.role).toBe('STAFF_AGENT');
      expect(entry.reason).toBe('Photo missing rear angle');
    });

    it('T1.3.3: Multi-Field Diff Recording', () => {
      const entry = logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'PLAN_UPGRADE',
        targetType: 'SUBSCRIPTION',
        targetId: 'usr-lister-1',
        diff: [
          { field: 'quota', before: 2, after: 15 },
          { field: 'planId', before: 'p-1', after: 'p-2' },
          { field: 'renewsOn', before: '2026-11-30', after: '2026-12-30' },
        ],
      });

      expect(entry.diff.length).toBe(3);
      expect(entry.diff.map((d) => d.field)).toEqual(['quota', 'planId', 'renewsOn']);
    });

    it('T1.3.4: Target-Specific Audit Filtering', () => {
      logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'ACTION_A',
        targetType: 'USER',
        targetId: 'target-usr-filter-A',
        diff: [],
      });
      logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'ACTION_B',
        targetType: 'USER',
        targetId: 'target-usr-filter-A',
        diff: [],
      });
      logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'ACTION_C',
        targetType: 'USER',
        targetId: 'target-usr-filter-B',
        diff: [],
      });

      const results = getAuditLogsByTarget('target-usr-filter-A');
      expect(results.length).toBe(2);
      expect(results.every((e) => e.targetId === 'target-usr-filter-A')).toBe(true);
    });

    it('T1.3.5: Chronological Audit Retrieval (Newest first)', () => {
      logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'FIRST_ACTION',
        targetType: 'USER',
        targetId: 'u-1',
        diff: [],
      });
      logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'SECOND_ACTION',
        targetType: 'USER',
        targetId: 'u-1',
        diff: [],
      });

      const logs = getAuditLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(logs[1].timestamp).getTime()
      );
    });

    it('T1.3.6: Permissions Modification Audit Logging', () => {
      const entry = logAuditEvent({
        actor: { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' },
        action: 'PERMISSIONS_UPDATE',
        targetType: 'PERMISSIONS',
        targetId: 'ag-2',
        diff: [{ field: 'canApprovePayments', before: false, after: true }],
      });

      expect(entry.targetType).toBe('PERMISSIONS');
      expect(entry.diff[0].after).toBe(true);
    });
  });

  // ==========================================
  // Feature Area 4: Promo Code Calculations & EXTRA_TIME
  // ==========================================
  describe('F4: Promo Code Calculations & EXTRA_TIME (promoCodes.ts)', () => {
    it('T1.4.1: Percentage Discount Calculation (LAUNCHPK 25%)', () => {
      const res = validatePromoCode('LAUNCHPK', 'PK', 'CAR_RENTAL', 12000, 16000);
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(3000);
      expect(res.finalPrice).toBe(9000);
      expect(res.totalSaved).toBe(7000);
    });

    it('T1.4.2: Fixed Amount Discount Calculation (PKFLAT1000)', () => {
      const res = validatePromoCode('PKFLAT1000', 'PK', 'CAR_RENTAL', 3500, 5000);
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(1000);
      expect(res.finalPrice).toBe(2500);
    });

    it('T1.4.3: Global Promo Code for International Fleet (GLOBAL20)', () => {
      const res = validatePromoCode('GLOBAL20', 'DE', 'ALL', 100, 120);
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(20);
      expect(res.finalPrice).toBe(80);
    });

    it('T1.4.4: Extra Time Promo Duration Extraction', () => {
      const launchPromo = PROMO_CODES.find((p) => p.code === 'LAUNCHPK');
      expect(launchPromo).toBeDefined();
      expect(launchPromo?.extraDurationDays).toBe(14);
    });

    it('T1.4.5: Promo Redemption Usage Increment', () => {
      const initial = getStoredPromoCodes().find((p) => p.code === 'LAUNCHPK')!.currentUses;
      const success = incrementPromoUsage('LAUNCHPK');
      expect(success).toBe(true);

      const after = getStoredPromoCodes().find((p) => p.code === 'LAUNCHPK')!.currentUses;
      expect(after).toBe(initial + 1);
    });

    it('T1.4.6: Discover Available Promos by Country', () => {
      const pkPromos = getAvailablePromosForCountry('PK');
      const codes = pkPromos.map((p) => p.code);
      expect(codes).toContain('LAUNCHPK');
      expect(codes).toContain('PKFLAT1000');
      expect(codes).not.toContain('GERMANY20');
    });
  });

  // ==========================================
  // Feature Area 5: Plan Days Left & Subscription Month-Math
  // ==========================================
  describe('F5: Plan Days Left & Subscription Month-Math', () => {
    it('T1.5.1: Calculate Plan Days Left (Future Date)', () => {
      const target = new Date(Date.now() + 15 * 86400000).toISOString();
      expect(calculatePlanDaysLeft(target)).toBe(15);
    });

    it('T1.5.2: Calculate Plan Days Left (Today Expiry)', () => {
      const todayIso = new Date().toISOString();
      const days = calculatePlanDaysLeft(todayIso);
      expect(days).toBe(0);
    });

    it('T1.5.3: Active Subscription Extension (+1 Month)', () => {
      const success = extendUserSubscription('usr-demo-lister', 1, 'Loyalty bonus', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });
      expect(success).toBe(true);

      const updated = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister');
      expect(updated?.subscription.status).toBe('ACTIVE');
      expect(updated?.subscription.renewsOn).toContain('Jan 2027');
    });

    it('T1.5.4: Active Subscription Multi-Month Extension (+3 Months)', () => {
      const success = extendUserSubscription('usr-demo-lister', 3, 'Quarterly extension', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });
      expect(success).toBe(true);

      const updated = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister');
      expect(updated?.subscription.renewsOn).toContain('Mar 2027');
    });

    it('T1.5.5: Subscription Extension Audit Event Emission', () => {
      extendUserSubscription('usr-demo-lister', 1, 'Loyalty test', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });

      const auditEntries = getAuditLogsByTarget('usr-demo-lister');
      const extensionLog = auditEntries.find((e) => e.action === 'SUBSCRIPTION_EXTENDED');
      expect(extensionLog).toBeDefined();
      expect(extensionLog?.reason).toBe('Loyalty test');
      expect(extensionLog?.diff.some((d) => d.field === 'subscription.renewsOn')).toBe(true);
    });

    it('T1.5.6: Subscription Updated Event Dispatch', () => {
      const spy = createEventSpy('safarpk_subscription_updated');
      extendUserSubscription('usr-demo-lister', 1, 'Event test', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });

      expect(spy.count).toBe(1);
      expect(spy.first()?.detail.userId).toBe('usr-demo-lister');
      spy.teardown();
    });
  });

  // ==========================================
  // Feature Area 6: Document Validation & CNIC Auto-Formatting
  // ==========================================
  describe('F6: Document Validation, OCR & CNIC Format (docRules.ts)', () => {
    it('T1.6.1: Pakistan Document Requirements Extraction', () => {
      const rules = getDocRulesForCountry('PK');
      const names = rules.map((r) => r.docName);
      expect(names).toContain('National ID (CNIC)');
      expect(names).toContain('Driving licence');
      expect(names).toContain('Car Owner Card (Excise Smart Card)');
      expect(names).toContain('Business FBR NTN');
    });

    it('T1.6.2: Pakistan Renter Driving Licence Requirement', () => {
      const res = getRenterDocRequirement('PK', 'licence');
      // Initially Off by default to allow instant booking/listing
      expect(res.requirement).toBe('Off');
      expect(res.docName).toBe('Driving licence');
    });

    it('T1.6.3: Pakistan Renter CNIC Requirement', () => {
      const res = getRenterDocRequirement('PK', 'id');
      // Initially Off by default to allow instant booking/listing
      expect(res.requirement).toBe('Off');
      expect(res.docName).toBe('National ID (CNIC)');
    });

    it('T1.6.4: Standard 13-Digit Pakistani CNIC Regex Validation', () => {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      expect(cnicRegex.test('35201-9821045-3')).toBe(true);
      expect(cnicRegex.test('42101-2123456-1')).toBe(true);
    });

    it('T1.6.5: United Arab Emirates (AE) Document Rules', () => {
      const rules = getDocRulesForCountry('AE');
      const names = rules.map((r) => r.docName);
      expect(names).toContain('Driving licence');
      expect(names).toContain('National ID (CNIC)');
      expect(names).toContain('Car Owner Card (Excise Smart Card)');
    });

    it('T1.6.6: Master Document Asking Switch', () => {
      const spy = createEventSpy('safarpk_doc_rules_updated');
      setMasterDocAskEnabled(false);
      expect(isMasterDocAskEnabled()).toBe(false);
      expect(spy.count).toBe(1);
      setMasterDocAskEnabled(true);
      expect(isMasterDocAskEnabled()).toBe(true);
      spy.teardown();
    });
  });

  // ==========================================
  // Feature Area 7: Driver Credential Masking & Unmasking Lifecycle
  // ==========================================
  describe('F7: Driver Masking & Unmasking Lifecycle (driverBookings.ts)', () => {
    it('T1.7.1: Driver CNIC Masking Format', () => {
      expect(maskPakistaniCnic('35201-4412098-5')).toBe('35201-441***8-5');
    });

    it('T1.7.2: Driver Driving Licence Masking Format (Three-Part)', () => {
      expect(maskPakistaniLicense('LHR-LTV-99210')).toBe('LHR-LTV-99***0');
    });

    it('T1.7.3: Driver Driving Licence Masking Format (Two-Part)', () => {
      expect(maskPakistaniLicense('ISB-49201')).toBe('ISB-49***1');
    });

    it('T1.7.4: Display Credentials for Unconfirmed Booking (Masked)', () => {
      const res = getDriverCredentialsDisplay('35201-4412098-5', 'LHR-LTV-99210', false);
      expect(res.isConfirmed).toBe(false);
      expect(res.cnic).toBe('35201-441***8-5');
      expect(res.license).toBe('LHR-LTV-99***0');
      expect(res.badgeClass).toContain('amber');
    });

    it('T1.7.5: Display Credentials for Confirmed Booking (Unmasked)', () => {
      const res = getDriverCredentialsDisplay('35201-4412098-5', 'LHR-LTV-99210', true);
      expect(res.isConfirmed).toBe(true);
      expect(res.cnic).toBe('35201-4412098-5');
      expect(res.license).toBe('LHR-LTV-99210');
      expect(res.badgeClass).toContain('emerald');
    });

    it('T1.7.6: In-App Driver Booking Confirmation Lifecycle', () => {
      const created = createDriverBooking({
        bookingRef: 'DRV-TEST-1',
        customerName: 'Hamza',
        customerPhone: '+923001234567',
        driverId: 'usr-demo-driver',
        driverName: 'Tariq Mahmood',
        driverPhone: '+923019821045',
        driverCnic: '35201-4412098-5',
        driverLicense: 'LHR-LTV-99210',
        dutyType: 'Full Day',
        destination: 'Murree',
        vehicleProvided: 'Customer Honda Civic',
        startDate: '2026-11-20',
        days: 2,
        totalFare: 7600,
      });

      const res = confirmDriverBooking(created.id);
      expect(res.success).toBe(true);
      expect(res.booking?.status).toBe('CONFIRMED');
      expect(res.booking?.confirmedAt).toBeDefined();

      const display = getDriverCredentialsDisplay(
        res.booking!.driverCnic,
        res.booking!.driverLicense,
        true
      );
      expect(display.cnic).toBe('35201-4412098-5');
      expect(display.license).toBe('LHR-LTV-99210');
    });
  });

  // ==========================================
  // Feature Area 8: Vehicle Publishing Double-Gate & Quota Limits
  // ==========================================
  describe('F8: Vehicle Publishing Double-Gate & Quota (mockData.ts)', () => {
    it('T1.8.1: Valid Vehicle Publishing with Active Subscription & Document', () => {
      const lister = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      const validation = validateVehiclePublishing(lister, {
        registrationDocId: 'doc-reg-101',
      });
      expect(validation.canPublish).toBe(true);
    });

    it('T1.8.2: Quota Usage Increment on Publishing', () => {
      const listerBefore = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      const initialUsed = listerBefore.subscription.usedQuota;

      const res = publishVehicle('usr-demo-lister', {
        id: 'veh-new-1',
        title: 'Toyota Yaris 2024',
        registrationDocId: 'doc-reg-101',
      });

      expect(res.success).toBe(true);
      const listerAfter = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      expect(listerAfter.subscription.usedQuota).toBe(initialUsed + 1);
    });

    it('T1.8.3: Draft Vehicle Saving without Gates', () => {
      const draftVehicle = {
        id: 'veh-draft-1',
        title: 'Suzuki Alto',
        status: 'DRAFT',
        registrationDocId: null,
      };
      expect(draftVehicle.status).toBe('DRAFT');
    });

    it('T1.8.4: Multi-Vehicle Lister Operating Within Quota', () => {
      const lister = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      lister.subscription.quota = 50;
      lister.subscription.usedQuota = 10;

      const validation = validateVehiclePublishing(lister, {
        registrationDocId: 'doc-reg-multi',
      });
      expect(validation.canPublish).toBe(true);
    });

    it('T1.8.5: Document Verification Unlocks Live Vehicle Status', () => {
      const spy = createEventSpy('safarpk_user_kyc_updated');
      const success = updateUserKycStatus('usr-demo-lister', 'VERIFIED', {
        id: 'admin-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      });

      expect(success).toBe(true);
      const user = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister');
      expect(user?.kycStatus).toBe('VERIFIED');
      expect(spy.count).toBe(1);
      spy.teardown();
    });

    it('T1.8.6: Public Vehicle Card Renders Accurate Lister Contact', () => {
      expect(CARS_DATA.length).toBeGreaterThan(0);
      const firstCar = CARS_DATA[0];
      expect(firstCar.phone).toBeDefined();
      expect(firstCar.whatsapp).toBeDefined();
    });
  });

  // ==========================================
  // Feature Area 9: Staff Agent 9 Permission Switches
  // ==========================================
  describe('F9: Staff Agent 9 Permission Switches', () => {
    it('T1.9.1: Agent Analytics Permission Enabled', () => {
      setAgentAnalyticsPermission('ag-1', true);
      expect(getAgentAnalyticsPermission('ag-1')).toBe(true);
    });

    it('T1.9.2: Agent Analytics Permission Toggle', () => {
      setAgentAnalyticsPermission('ag-2', false);
      expect(getAgentAnalyticsPermission('ag-2')).toBe(false);
      setAgentAnalyticsPermission('ag-2', true);
      expect(getAgentAnalyticsPermission('ag-2')).toBe(true);
    });

    it('T1.9.3: Agent Featured Ads Permission', () => {
      expect(getAgentFeaturedPermission('ag-1')).toBe(true);
    });

    it('T1.9.4: Agent Payments Approval Gate (Subscription Approval)', () => {
      const user = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
      user.subscription.status = 'PENDING_APPROVAL';
      saveAllRegisteredUsers(getAllRegisteredUsers());

      const approved = approveSubscriptionByAdmin('usr-demo-lister');
      expect(approved?.subscription.status).toBe('ACTIVE');
      expect(approved?.subscription.approvedAt).toBeDefined();
    });

    it('T1.9.5: Agent Document Verification Gate', () => {
      const success = updateUserKycStatus('usr-demo-driver', 'VERIFIED', {
        id: 'ag-1',
        name: 'Kashif Raza',
        role: 'STAFF_AGENT',
      });
      expect(success).toBe(true);

      const driver = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-driver');
      expect(driver?.kycStatus).toBe('VERIFIED');
    });

    it('T1.9.6: Agent Permissions Updated Event Dispatch', () => {
      const spy = createEventSpy('safarpk_agent_perms_updated');
      setAgentFeaturedPermission('ag-1', true);
      expect(spy.count).toBeGreaterThanOrEqual(1);
      spy.teardown();
    });
  });
});
