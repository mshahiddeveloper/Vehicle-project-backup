import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUnifiedBooking,
  getUnifiedBookings,
  getBookingById,
  updateBookingStatus,
  EVENT_BOOKING_STATUS_UPDATED,
} from '@/data/bookingSync';
import {
  createDriverBooking,
  getDriverBookings,
  confirmDriverBooking,
  declineDriverBooking,
  getDriverCredentialsDisplay,
} from '@/data/driverBookings';
import {
  logLeadEvent,
  getDeduplicatedStats,
} from '@/data/activityTracker';
import {
  approveSubscriptionByAdmin,
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  DEMO_USERS,
  RegisteredUser,
} from '@/data/userAuth';
import {
  calculatePlanDaysLeft,
  extendUserSubscription,
  updateUserKycStatus,
  validateVehiclePublishing,
  publishVehicle,
  MOCK_LISTER,
  MOCK_DRIVER,
} from './helpers/mockData';
import { getAuditLogs, clearAuditLogs } from '@/data/auditLog';
import { createEventSpy } from './helpers/eventSpy';

describe('Tier 3: Dynamic Synchronization Scenarios (§12a Matrix)', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAllRegisteredUsers(JSON.parse(JSON.stringify(DEMO_USERS)));
    clearAuditLogs();
  });

  // =========================================================================
  // Scenario 3.1: Full Lifecycle Booking Sync & Driver Credential Unmasking
  // =========================================================================
  it('Scenario 3.1: Full Lifecycle Booking Sync & Driver Credential Unmasking (Customer ↔ Driver ↔ Admin)', () => {
    const driverCnic = '35201-4412098-5';
    const driverLicense = 'LHR-LTV-99210';

    // Step 1: Customer submits chauffeur hiring request for 2 days outstation
    const hiringRequest = createDriverBooking({
      bookingRef: 'DRV-SYNC-101',
      customerName: 'Chaudhry Bilal',
      customerPhone: '+92 300 5512901',
      customerCity: 'Lahore',
      driverId: 'usr-demo-driver',
      driverName: 'Tariq Mahmood',
      driverPhone: '+92 301 9821045',
      driverCnic,
      driverLicense,
      dutyType: 'OUT_OF_STATION',
      destination: 'Murree Hills & Bhurban',
      vehicleProvided: 'Customer Honda Civic 2023',
      startDate: '2026-11-20',
      days: 2,
      totalFare: 7600,
    });

    expect(hiringRequest.id).toBeDefined();
    expect(hiringRequest.status).toBe('PENDING_CONFIRMATION');

    // Assert credentials are strictly masked while pending
    const initialCredentials = getDriverCredentialsDisplay(driverCnic, driverLicense, false);
    expect(initialCredentials.isConfirmed).toBe(false);
    expect(initialCredentials.cnic).toBe('35201-441***8-5');
    expect(initialCredentials.license).toBe('LHR-LTV-99***0');
    expect(initialCredentials.badgeClass).toContain('amber');

    // Step 2: Lister leads counter & 24h deduplicated lead logging
    const leadLogged = logLeadEvent('REQUEST', 'usr-demo-driver', 'CHAUFFEUR', 'usr-demo-customer', 'dev-customer-1');
    expect(leadLogged).toBe(true);

    const stats = getDeduplicatedStats('usr-demo-driver');
    expect(stats.requests).toBeGreaterThanOrEqual(1);

    // Step 3: Admin & Driver Cockpit Queue check
    const driverQueue = getDriverBookings();
    const foundInQueue = driverQueue.find((b) => b.id === hiringRequest.id);
    expect(foundInQueue).toBeDefined();
    expect(foundInQueue?.status).toBe('PENDING_CONFIRMATION');

    // Step 4: Driver logs into cockpit and clicks Confirm
    const spy = createEventSpy('safarpk_driver_booking_status_updated');
    const confirmResult = confirmDriverBooking(hiringRequest.id);

    expect(confirmResult.success).toBe(true);
    expect(confirmResult.booking?.status).toBe('CONFIRMED');
    expect(confirmResult.booking?.confirmedAt).toBeDefined();
    expect(spy.count).toBe(1);
    spy.teardown();

    // Step 5: Customer portal verification -> credentials unmasking
    const confirmedCredentials = getDriverCredentialsDisplay(driverCnic, driverLicense, true);
    expect(confirmedCredentials.isConfirmed).toBe(true);
    expect(confirmedCredentials.cnic).toBe(driverCnic);
    expect(confirmedCredentials.license).toBe(driverLicense);
    expect(confirmedCredentials.badgeClass).toContain('emerald');
  });

  // =========================================================================
  // Scenario 3.2: Lister Decline & Credential Masking Enforcement
  // =========================================================================
  it('Scenario 3.2: Lister Decline & Credential Masking Enforcement', () => {
    const driverCnic = '35201-4412098-5';
    const driverLicense = 'LHR-LTV-99210';

    const booking = createDriverBooking({
      bookingRef: 'DRV-DECLINE-302',
      customerName: 'Ayesha Malik',
      customerPhone: '+92 321 9988771',
      customerCity: 'Islamabad',
      driverId: 'usr-demo-driver',
      driverName: 'Tariq Mahmood',
      driverPhone: '+92 301 9821045',
      driverCnic,
      driverLicense,
      dutyType: 'LOCAL_FULL_DAY',
      destination: 'Rawalpindi',
      vehicleProvided: 'Toyota Corolla',
      startDate: '2026-11-22',
      days: 1,
      totalFare: 3800,
    });

    // Step 1: Driver declines booking
    const declineResult = declineDriverBooking(booking.id);
    expect(declineResult.success).toBe(true);

    const updatedBooking = getDriverBookings().find((b) => b.id === booking.id);
    expect(updatedBooking?.status).toBe('DECLINED');

    // Step 2: Customer portal verification -> credentials stay strictly masked
    const display = getDriverCredentialsDisplay(driverCnic, driverLicense, false);
    expect(display.isConfirmed).toBe(false);
    expect(display.cnic).toBe('35201-441***8-5');
    expect(display.license).toBe('LHR-LTV-99***0');
    expect(display.cnic).not.toBe(driverCnic);
    expect(display.license).not.toBe(driverLicense);
  });

  // =========================================================================
  // Scenario 3.3: Admin Payment Approval -> Active Subscription -> Days Left -> Publishing Double-Gate
  // =========================================================================
  it('Scenario 3.3: Admin Payment Approval -> Active Subscription -> Days Left -> Publishing Double-Gate', () => {
    // Initial State: Lister has pending approval subscription, 0 days left
    const users = getAllRegisteredUsers();
    const listerIndex = users.findIndex((u) => u.id === 'usr-demo-lister');
    expect(listerIndex).not.toBe(-1);

    users[listerIndex].subscription = {
      status: 'PENDING_APPROVAL',
      planId: 'p-2',
      planName: 'Professional Fleet Hub (15 Vehicles)',
      quota: 15,
      usedQuota: 0,
      amountPaid: 12000,
      currency: 'PKR',
      symbol: 'Rs',
      renewsOn: undefined,
    };
    saveAllRegisteredUsers(users);

    const vehicleCandidate = {
      id: 'veh-gate-1',
      title: 'Honda Civic Oriel Turbo 2024',
      registrationDocId: 'LEA-24-9988',
    };

    // Step 1: Publishing gate check before approval -> blocked by inactive plan
    const preCheck = validateVehiclePublishing(users[listerIndex], vehicleCandidate);
    expect(preCheck.canPublish).toBe(false);
    expect(preCheck.error).toContain('Choose a plan to publish or Save as draft.');
    expect(calculatePlanDaysLeft(users[listerIndex].subscription.renewsOn)).toBe(0);

    // Step 2: Super Admin approves payment proof
    const approvedUser = approveSubscriptionByAdmin('usr-demo-lister');
    expect(approvedUser).not.toBeNull();
    expect(approvedUser?.subscription.status).toBe('ACTIVE');
    expect(approvedUser?.subscription.renewsOn).toBeDefined();
    expect(approvedUser?.subscription.approvedAt).toBeDefined();

    // Step 3: Days left calculation is immediately >= 29 days
    const daysLeft = calculatePlanDaysLeft(approvedUser!.subscription.renewsOn);
    expect(daysLeft).toBeGreaterThanOrEqual(29);
    expect(daysLeft).toBeLessThanOrEqual(31);

    // Step 4: Publishing gate check after approval succeeds
    const postCheck = validateVehiclePublishing(approvedUser!, vehicleCandidate);
    expect(postCheck.canPublish).toBe(true);

    const publishResult = publishVehicle('usr-demo-lister', vehicleCandidate);
    expect(publishResult.success).toBe(true);
    expect(publishResult.vehicle?.status).toBe('LIVE');

    const finalUser = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
    expect(finalUser.subscription.usedQuota).toBe(1);
  });

  // =========================================================================
  // Scenario 3.4: Admin/Agent Document Verification -> Verified Badge Sync
  // =========================================================================
  it('Scenario 3.4: Admin/Agent Document Verification -> Verified Badge Sync', () => {
    // Initial State: Driver has PENDING_APPROVAL KYC status
    const users = getAllRegisteredUsers();
    const driver = users.find((u) => u.id === 'usr-demo-driver')!;
    driver.kycStatus = 'PENDING_APPROVAL';
    saveAllRegisteredUsers(users);

    const spy = createEventSpy('safarpk_user_kyc_updated');

    // Step 1: Staff Agent approves KYC documents
    const success = updateUserKycStatus('usr-demo-driver', 'VERIFIED', {
      id: 'ag-1',
      name: 'Kashif Raza',
      role: 'STAFF_AGENT',
    });

    expect(success).toBe(true);
    expect(spy.count).toBe(1);
    expect(spy.first()?.detail.status).toBe('VERIFIED');
    spy.teardown();

    // Step 2: User profile reflects VERIFIED
    const updatedDriver = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-driver')!;
    expect(updatedDriver.kycStatus).toBe('VERIFIED');

    // Step 3: Audit log inspection
    const auditLogs = getAuditLogs().filter((l) => l.targetId === 'usr-demo-driver');
    const kycLog = auditLogs.find((l) => l.action === 'KYC_VERIFICATION_APPROVED');
    expect(kycLog).toBeDefined();
    expect(kycLog?.actor.role).toBe('STAFF_AGENT');
    expect(kycLog?.diff).toEqual([
      { field: 'kycStatus', before: 'PENDING_APPROVAL', after: 'VERIFIED' },
    ]);
  });

  // =========================================================================
  // Scenario 3.5: Stealth Audit Log Recording Actor, Action, and State Diffs
  // =========================================================================
  it('Scenario 3.5: Stealth Audit Log Recording Actor, Action, and State Diffs', () => {
    clearAuditLogs();

    // Admin extends lister plan by 1 month
    const extensionSuccess = extendUserSubscription(
      'usr-demo-lister',
      1,
      'Showroom anniversary loyalty',
      {
        id: 'adm-1',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      }
    );

    expect(extensionSuccess).toBe(true);

    const logs = getAuditLogs();
    const listerLog = logs.find(
      (l) => l.targetId === 'usr-demo-lister' && l.action === 'SUBSCRIPTION_EXTENDED'
    );

    expect(listerLog).toBeDefined();
    expect(listerLog?.actor.role).toBe('SUPER_ADMIN');
    expect(listerLog?.targetType).toBe('SUBSCRIPTION');
    expect(listerLog?.reason).toBe('Showroom anniversary loyalty');
    expect(listerLog?.diff.some((d) => d.field === 'subscription.renewsOn')).toBe(true);
    expect(listerLog?.diff.some((d) => d.field === 'subscription.status')).toBe(true);
  });
});
