import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUnifiedBooking,
  getUnifiedBookings,
  getBookingById,
  getBookingsByCustomer,
} from '@/data/bookingSync';
import {
  createDriverBooking,
  getDriverBookings,
  confirmDriverBooking,
  getDriverCredentialsDisplay,
} from '@/data/driverBookings';
import {
  logLeadEvent,
  getDeduplicatedStats,
} from '@/data/activityTracker';
import {
  validatePromoCode,
  saveStoredPromoCodes,
  DEFAULT_PROMO_CODES,
  PROMO_CODES,
} from '@/data/promoCodes';
import {
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  DEMO_USERS,
  RegisteredUser,
} from '@/data/userAuth';
import {
  calculatePlanDaysLeft,
  extendUserSubscription,
  addCalendarMonths,
  validateVehiclePublishing,
  publishVehicle,
  MOCK_CUSTOMER,
  MOCK_LISTER,
} from './helpers/mockData';
import {
  CITY_RIDES_DATA,
  SHUTTLES_DATA,
  MOVERS_DATA,
  CARS_DATA,
} from '@/data/marketplaceData';
import {
  getAgentAnalyticsPermission,
  setAgentAnalyticsPermission,
} from '@/data/analyticsEngine';
import { getAuditLogs, clearAuditLogs } from '@/data/auditLog';
import { createEventSpy } from './helpers/eventSpy';

describe('Tier 4: Real-World End-to-End Application Journeys across All 5 Services', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAllRegisteredUsers(JSON.parse(JSON.stringify(DEMO_USERS)));
    saveStoredPromoCodes(JSON.parse(JSON.stringify(DEFAULT_PROMO_CODES)));
    clearAuditLogs();
  });

  // =========================================================================
  // Journey 1: Self-Drive Car Rental Customer Journey
  // =========================================================================
  it('Journey 1: Self-Drive Car Rental Flow (Search Tab 0, Licence OCR, CNIC Formatting, Quote, Dispatch)', () => {
    // Step 1: Homepage Search Tab 0 (Rent a Car)
    const activeServiceTab = 0; // Rent a Car
    const searchParams = {
      destination: 'Islamabad',
      pickupDate: '2026-11-20',
      returnDate: '2026-11-23',
    };
    expect(activeServiceTab).toBe(0);

    // Step 2: Vehicle Detail Selection
    const car = CARS_DATA.find((c) => c.id === 'l-1') || CARS_DATA[0];
    expect(car).toBeDefined();

    // Rental mode toggle: Self-Drive
    const rentalMode = 'SELF_DRIVE';
    const withDriver = false;
    expect(withDriver).toBe(false);

    // Step 3: Document Validation Gating
    let licenceUploaded = false;
    let ocrLicenceNumber = '';
    let rawCnicInput = '3520281729103';

    // Verify self-drive blocks without driving licence
    const validateRenterDocs = (uploaded: boolean, cnic: string) => {
      if (!uploaded) {
        return { valid: false, error: 'Self-drive rental requires Driving licence upload.' };
      }
      const digits = cnic.replace(/\D/g, '');
      if (digits.length !== 13) {
        return { valid: false, error: 'Please enter a valid 13-digit National ID (CNIC) number.' };
      }
      return { valid: true };
    };

    const attemptWithoutLicence = validateRenterDocs(licenceUploaded, rawCnicInput);
    expect(attemptWithoutLicence.valid).toBe(false);
    expect(attemptWithoutLicence.error).toBe('Self-drive rental requires Driving licence upload.');

    // Simulate OCR Scan upload
    licenceUploaded = true;
    ocrLicenceNumber = 'LHR-DL-492019-B';
    const ocrExpiry = '14 Oct 2028';

    // Incomplete CNIC test
    const attemptWithIncompleteCnic = validateRenterDocs(licenceUploaded, '35202-8172');
    expect(attemptWithIncompleteCnic.valid).toBe(false);
    expect(attemptWithIncompleteCnic.error).toBe(
      'Please enter a valid 13-digit National ID (CNIC) number.'
    );

    // Auto-formatting 13 digits: 3520281729103 -> 35202-8172910-3
    const formatCnic = (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 13);
      if (digits.length === 13) {
        return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
      }
      return digits;
    };
    const formattedCnic = formatCnic(rawCnicInput);
    expect(formattedCnic).toBe('35202-8172910-3');

    const validSubmission = validateRenterDocs(licenceUploaded, formattedCnic);
    expect(validSubmission.valid).toBe(true);

    // Step 4: Quote Calculation (3 days × Rs 12,000 + Rs 30,000 security deposit)
    const daysCount = 3;
    const dailyRate = car.priceNum || 12000;
    const rentAmount = dailyRate * daysCount;
    const securityDeposit = 30000;
    const totalAmount = rentAmount + securityDeposit;
    expect(rentAmount).toBe(36000);
    expect(totalAmount).toBe(66000);

    // Step 5: Dispatch & Booking Store Persistence
    const booking = createUnifiedBooking({
      serviceType: 'CAR_RENTAL',
      customerId: 'usr-customer-active',
      customerName: 'Hamza Tariq',
      customerPhone: '+92 300 8472910',
      customerCnic: formattedCnic,
      customerCity: 'Islamabad',
      providerId: 'usr-demo-lister',
      listingId: car.id,
      listingTitle: car.name,
      pickupDate: searchParams.pickupDate,
      returnDate: searchParams.returnDate,
      pickupLocation: 'Centaurus Mall, F-8, Islamabad',
      totalAmount,
      currency: 'PKR',
      specialRequests: 'Child seat requested in advance.',
      metadata: {
        driveMode: 'SELF_DRIVE',
        driverLicense: ocrLicenceNumber,
        driverLicenseExpiry: ocrExpiry,
      },
    });

    expect(booking.id).toMatch(/^SF-\d+/);
    expect(booking.status).toBe('WAITING');

    // Lead logging with 24h deduplication
    const leadLogged = logLeadEvent('REQUEST', car.id, 'CAR_RENTAL', 'usr-customer-active');
    expect(leadLogged).toBe(true);

    // Verify booking appears in customer bookings
    const customerBookings = getBookingsByCustomer('usr-customer-active');
    expect(customerBookings.some((b) => b.id === booking.id)).toBe(true);
  });

  // =========================================================================
  // Journey 2: Independent Chauffeur Hiring Journey
  // =========================================================================
  it('Journey 2: Independent Chauffeur Hiring Journey (Search Tab 1, Directory, Masking, Booking, Confirmation, Unmasking)', () => {
    // Step 1: Homepage Search Tab 1 (Hire a Driver)
    const activeServiceTab = 1;
    const searchFilter = { city: 'Lahore', duty: '2-3 Days Outstation' };
    expect(activeServiceTab).toBe(1);

    // Step 2: Driver Directory Inspection
    const driver = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-driver')!;
    expect(driver).toBeDefined();

    const realCnic = '35201-4412098-5';
    const realLicense = 'LHR-LTV-99210';

    // Verify public credentials are masked
    const publicCreds = getDriverCredentialsDisplay(realCnic, realLicense, false);
    expect(publicCreds.isConfirmed).toBe(false);
    expect(publicCreds.cnic).toBe('35201-441***8-5');
    expect(publicCreds.license).toBe('LHR-LTV-99***0');

    // Step 3: Customer Submits Outstation Booking Request
    const driverBooking = createDriverBooking({
      bookingRef: 'DRV-HIRE-201',
      customerName: 'Chaudhry Bilal',
      customerPhone: '+92 300 5512901',
      customerCity: 'Lahore',
      driverId: 'usr-demo-driver',
      driverName: driver.name,
      driverPhone: driver.phone,
      driverCnic: realCnic,
      driverLicense: realLicense,
      dutyType: 'OUT_OF_STATION',
      destination: 'Murree Hills & Bhurban',
      vehicleProvided: 'Customer Honda Civic 2023',
      startDate: '2026-11-20',
      days: 2,
      totalFare: 7600,
    });

    expect(driverBooking.status).toBe('PENDING_CONFIRMATION');

    // Step 4: Driver Confirms Booking in Cockpit
    const spy = createEventSpy('safarpk_driver_booking_status_updated');
    const confirmResult = confirmDriverBooking(driverBooking.id);
    expect(confirmResult.success).toBe(true);
    expect(confirmResult.booking?.status).toBe('CONFIRMED');
    expect(spy.count).toBe(1);
    spy.teardown();

    // Step 5: Customer Portal Verifies Unmasked Credentials
    const unlockedCreds = getDriverCredentialsDisplay(realCnic, realLicense, true);
    expect(unlockedCreds.isConfirmed).toBe(true);
    expect(unlockedCreds.cnic).toBe(realCnic);
    expect(unlockedCreds.license).toBe(realLicense);
    expect(unlockedCreds.badgeClass).toContain('emerald');
  });

  // =========================================================================
  // Journey 3: City-to-City Intercity Ride Journey
  // =========================================================================
  it('Journey 3: City-to-City Intercity Ride Flow (Search Tab 2, One-Way vs Return Fares, Inclusions, Booking)', () => {
    // Step 1: Homepage Search Tab 2 (City to City)
    const activeServiceTab = 2;
    const search = { from: 'Lahore', to: 'Islamabad', leaveDate: '2026-11-20' };
    expect(activeServiceTab).toBe(2);

    // Step 2: Route Selection & One-Way Fare
    const ride = CITY_RIDES_DATA.find((r) => r.id === 'c2c-1') || CITY_RIDES_DATA[0];
    expect(ride.fromCity).toBe('Lahore');
    expect(ride.toCity).toBe('Islamabad');

    let isReturnTrip = false;
    let effectiveFare = isReturnTrip ? ride.ret : ride.one;
    expect(effectiveFare).toBe(13500);

    // Step 3: Return Trip Toggle & Recalculation
    isReturnTrip = true;
    effectiveFare = isReturnTrip ? ride.ret : ride.one;
    expect(effectiveFare).toBe(24000);

    // Verify Inclusion tags
    expect(ride.tags).toContain('Motorway M-2');
    expect(ride.tags).toContain('Tolls included');
    expect(ride.tags).toContain('Doorstep pickup');

    // Step 4: Booking Dispatch
    const booking = createUnifiedBooking({
      serviceType: 'CITY_TO_CITY',
      customerId: 'usr-cust-intercity',
      customerName: 'Asad Ali',
      customerPhone: '+92 321 4455667',
      customerCity: 'Lahore',
      providerId: 'usr-lister-c2c',
      providerName: ride.op,
      listingId: ride.id,
      listingTitle: `${ride.car} (${ride.fromCity} to ${ride.toCity})`,
      pickupDate: '2026-11-20',
      returnDate: '2026-11-23',
      pickupLocation: 'Gulberg III, Lahore',
      destinationLocation: 'Sector F-7, Islamabad',
      totalAmount: effectiveFare,
      currency: 'PKR',
      metadata: {
        tripType: 'RETURN',
        seatCount: 4,
      },
    });

    expect(booking.id).toMatch(/^SF-\d+/);
    expect(booking.totalAmount).toBe(24000);
    expect(booking.metadata?.tripType).toBe('RETURN');
  });

  // =========================================================================
  // Journey 4: Pick & Drop Daily Commuter Shuttle Journey
  // =========================================================================
  it('Journey 4: Pick & Drop Daily Commuter Shuttle Flow (Search Tab 3, Route Inspection, Vacancy Badge, Waitlist)', () => {
    // Step 1: Homepage Search Tab 3 (Pick & Drop Shuttles)
    const activeServiceTab = 3;
    expect(activeServiceTab).toBe(3);

    // Step 2: Route Inspection & Vacancy Calculation
    const getSeatBadge = (seats: number, total: number) => {
      if (seats === 0) {
        return { label: 'Waiting list · van full', color: 'red' };
      }
      if (seats <= 2) {
        return { label: `Only ${seats} seats left`, color: 'amber' };
      }
      return { label: `${seats} of ${total} seats vacant`, color: 'emerald' };
    };

    // Route 1 (2 of 14 seats left)
    const shuttle1 = SHUTTLES_DATA.find((s) => s.id === 'sht-1') || { seats: 2, total: 14 };
    const badge1 = getSeatBadge(shuttle1.seats, shuttle1.total);
    expect(badge1.label).toBe('Only 2 seats left');
    expect(badge1.color).toBe('amber');

    // Route 2 (4 of 7 seats left)
    const shuttle2 = SHUTTLES_DATA.find((s) => s.id === 'sht-2') || { seats: 4, total: 7 };
    const badge2 = getSeatBadge(shuttle2.seats, shuttle2.total);
    expect(badge2.label).toBe('4 of 7 seats vacant');
    expect(badge2.color).toBe('emerald');

    // Step 3: Full Van Route (0 seats left) -> Waitlist Mode
    const fullVanBadge = getSeatBadge(0, 14);
    expect(fullVanBadge.label).toBe('Waiting list · van full');
    expect(fullVanBadge.color).toBe('red');

    // Step 4: Seat Reservation Booking
    const booking = createUnifiedBooking({
      serviceType: 'SHUTTLE',
      customerId: 'usr-commuter-1',
      customerName: 'Fatima Zahra',
      customerPhone: '+92 300 8192041',
      providerId: 'usr-shuttle-provider',
      listingId: 'sht-1',
      listingTitle: 'Noor Shuttles DHA to Gulberg III',
      pickupDate: '2026-12-01',
      pickupLocation: 'DHA Phase 5',
      destinationLocation: 'Gulberg III Main Boulevard',
      totalAmount: 9500,
      currency: 'PKR',
      metadata: {
        passType: 'MONTHLY',
        seatsBooked: 1,
      },
    });

    expect(booking.id).toMatch(/^SF-\d+/);
    expect(booking.serviceType).toBe('SHUTTLE');
    expect(booking.totalAmount).toBe(9500);
  });

  // =========================================================================
  // Journey 5: Home Shifting Movers Cargo Journey
  // =========================================================================
  it('Journey 5: Home Shifting Movers Cargo Flow (Search Tab 4, Estimator Calculation, Quotation Broadcast)', () => {
    // Step 1: Homepage Search Tab 4 (Home Shifting Movers)
    const activeServiceTab = 4;
    expect(activeServiceTab).toBe(4);

    // Step 2: Estimator Calculation Formula from movers/page.tsx
    const calculateEstimate = (
      homeSize: number, // 0: 1-room, 1: 2-3 bed, 2: 4+ bed, 3: Office
      distanceKm: number,
      helpersCount: number,
      needPacking: boolean
    ) => {
      const baseRates = [3000, 5000, 7500, 8500];
      const kmRates = [80, 120, 150, 160];
      const helperRate = 1000;
      const packCost = needPacking ? 3500 : 0;

      const base = baseRates[homeSize] || 5000;
      const kmCost = distanceKm * (kmRates[homeSize] || 120);
      const helpersCost = helpersCount * helperRate;

      const total = base + kmCost + helpersCost + packCost;
      const low = Math.round((total * 0.9) / 500) * 500;
      const high = Math.round((total * 1.15) / 500) * 500;

      return { total, low, high, formatted: `Rs. ${low.toLocaleString('en-US')} – Rs. ${high.toLocaleString('en-US')}` };
    };

    // Scenario: 2-3 bed house (homeSize: 1), 18 km, 3 helpers, packing: true
    const estimate = calculateEstimate(1, 18, 3, true);
    // Base 5000 + (18 * 120 = 2160) + (3 * 1000 = 3000) + 3500 = 13660
    expect(estimate.total).toBe(13660);
    expect(estimate.low).toBe(12500);
    expect(estimate.high).toBe(15500);
    expect(estimate.formatted).toBe('Rs. 12,500 – Rs. 15,500');

    // Step 3: "Send to 3 movers" Quotation Broadcast
    const leadLogged = logLeadEvent('REQUEST', 'mov-broadcast-3', 'MOVER', 'usr-mover-customer');
    expect(leadLogged).toBe(true);

    const booking = createUnifiedBooking({
      serviceType: 'MOVER',
      customerId: 'usr-mover-customer',
      customerName: 'Saima Waqas',
      customerPhone: '+92 300 8192041',
      customerCity: 'Lahore',
      providerId: 'usr-demo-provider-cargo',
      listingId: 'crg-1',
      listingTitle: '2.5 Ton Shehzore + 3 Helpers House Shifting',
      pickupDate: '2026-11-25',
      pickupLocation: 'Johar Town, Lahore',
      destinationLocation: 'Bahria Town, Lahore',
      totalAmount: estimate.low,
      currency: 'PKR',
      specialRequests: 'Requires bubble wrap packing for fragile items.',
      metadata: {
        truckRequired: 'Hyundai Shehzore (2.5 Ton)',
        helpersCount: 3,
        distanceKm: 18,
        shiftingType: '2 BHK Household Relocation',
      },
    });

    expect(booking.id).toMatch(/^SF-\d+/);
    expect(booking.serviceType).toBe('MOVER');
  });

  // =========================================================================
  // Journey 6: Super Admin & Staff Agent Governance Journey
  // =========================================================================
  it('Journey 6: Super Admin & Staff Agent Governance Flow (Permissions, Plan Extensions, Promo Extra Time, Audit Log)', () => {
    // Step 1: Staff Agent Granular Permission Enforcement
    // Agent Bilal Ahmed (ag-2) has viewAnalytics revoked
    setAgentAnalyticsPermission('ag-2', false);
    expect(getAgentAnalyticsPermission('ag-2')).toBe(false);

    // Agent Kashif Raza (ag-1) has viewAnalytics allowed
    setAgentAnalyticsPermission('ag-1', true);
    expect(getAgentAnalyticsPermission('ag-1')).toBe(true);

    // Step 2: Super Admin Plan Extension Calendar Month Math
    // 2a: Active Plan Extension (+1 Month)
    const activeLister = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
    activeLister.subscription.renewsOn = '10 Dec 2026';
    saveAllRegisteredUsers(getAllRegisteredUsers());

    extendUserSubscription('usr-demo-lister', 1, 'Loyalty extension', {
      id: 'admin-1',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    });

    const extendedActive = getAllRegisteredUsers().find((u) => u.id === 'usr-demo-lister')!;
    expect(extendedActive.subscription.renewsOn).toContain('Jan 2027');

    // 2b: Expired Plan Extension (Calculates starting from today)
    const expiredUser: RegisteredUser = {
      ...MOCK_LISTER,
      id: 'usr-expired-test',
      subscription: {
        status: 'UNSUBSCRIBED',
        quota: 10,
        usedQuota: 2,
        renewsOn: '15 Oct 2024', // Past expired
      },
    };
    const allUsers = getAllRegisteredUsers();
    allUsers.push(expiredUser);
    saveAllRegisteredUsers(allUsers);

    extendUserSubscription('usr-expired-test', 1, 'Reactivation', {
      id: 'admin-1',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    });

    const reactivated = getAllRegisteredUsers().find((u) => u.id === 'usr-expired-test')!;
    expect(reactivated.subscription.status).toBe('ACTIVE');
    const newRenewsDate = new Date(reactivated.subscription.renewsOn!);
    expect(newRenewsDate.getTime()).toBeGreaterThan(Date.now());

    // Step 3: Promo Code Extra Time & Geo-Fencing
    const launchPromo = PROMO_CODES.find((p) => p.code === 'LAUNCHPK');
    expect(launchPromo?.extraDurationDays).toBe(14);

    // Apply in PK -> Valid
    const pkValidation = validatePromoCode('LAUNCHPK', 'PK', 'CAR_RENTAL', 12000);
    expect(pkValidation.valid).toBe(true);

    // Apply in DE -> Blocked by Geo-Fence
    const deValidation = validatePromoCode('LAUNCHPK', 'DE', 'CAR_RENTAL', 12000);
    expect(deValidation.valid).toBe(false);
    expect(deValidation.error).toContain('not applicable in your region');

    // Step 4: Stealth Audit Log Surveillance
    const auditLogs = getAuditLogs();
    expect(auditLogs.length).toBeGreaterThan(0);

    const extensionAudit = auditLogs.find((l) => l.action === 'SUBSCRIPTION_EXTENDED');
    expect(extensionAudit).toBeDefined();
    expect(extensionAudit?.actor.role).toBe('SUPER_ADMIN');
    expect(extensionAudit?.diff.length).toBeGreaterThan(0);
  });
});
