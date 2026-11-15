'use client';

/**
 * SafarPK Unified Booking Synchronization Engine
 * Milestone 1: Core Shared Data & Synchronization Engine
 * Storage Key: 'safarpk_unified_bookings_v3'
 *
 * Unifies all 5 marketplace services:
 * 1. CAR_RENTAL (Rent a Car: Self-drive or with driver)
 * 2. CHAUFFEUR (Hire an Independent Driver)
 * 3. CITY_TO_CITY (Intercity Motorway Trips)
 * 4. SHUTTLE (Office & School Pick & Drop Routes)
 * 5. MOVER (Home Shifting & Commercial Cargo Logistics)
 */

export type ServiceType =
  | 'CAR_RENTAL'
  | 'CHAUFFEUR'
  | 'CITY_TO_CITY'
  | 'SHUTTLE'
  | 'MOVER';

export type BookingStatus =
  | 'WAITING'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface BookingActor {
  id: string;
  name: string;
  role: 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PROVIDER' | 'STAFF_AGENT' | 'SUPER_ADMIN';
}

export interface UnifiedBooking {
  id: string; // Canonical format: e.g. "SF-10492"
  serviceType: ServiceType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCnic?: string;
  customerCity?: string;
  providerId: string;
  providerName?: string;
  providerPhone?: string;
  listingId: string;
  listingTitle: string;
  pickupDate: string; // ISO string or human formatted date
  returnDate?: string;
  pickupLocation: string;
  destinationLocation?: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string; // Default: 'PKR'
  specialRequests?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  confirmedAt?: string;

  // Rich domain metadata for service-specific fields
  metadata?: {
    // Car Rental
    driveMode?: 'SELF_DRIVE' | 'WITH_CHAUFFEUR';
    assignedDriverName?: string;
    assignedDriverPhone?: string;
    assignedDriverCnic?: string;
    assignedDriverLicense?: string;
    assignedVehicleReg?: string;

    // Chauffeur Hire
    dutyType?: 'LOCAL_FULL_DAY' | 'OUT_OF_STATION';
    vehicleProvidedByCustomer?: string;
    driverLicense?: string;
    driverCnic?: string;

    // Shuttle Route
    routeStop?: string;
    pickupTime?: string;
    passType?: 'DAILY' | 'MONTHLY';
    seatsBooked?: number;

    // City to City
    tripType?: 'ONE_WAY' | 'RETURN';
    seatCount?: number;

    // Mover / Shifting
    truckRequired?: string;
    helpersCount?: number;
    floorCount?: number;
    distanceKm?: number;
    shiftingType?: string;
    [key: string]: any;
  };
}

export const STORAGE_KEY_UNIFIED_BOOKINGS = 'safarpk_unified_bookings_v3';
export const EVENT_BOOKING_STATUS_UPDATED = 'safarpk_booking_status_updated';
export const EVENT_BOOKING_CREATED = 'safarpk_booking_created';

/**
 * Realistic Initial Demo Seed Bookings across all 5 services
 */
export const DEFAULT_UNIFIED_BOOKINGS: UnifiedBooking[] = [
  // 1. CAR RENTAL (Self-Drive) - Confirmed
  {
    id: 'SF-10492',
    serviceType: 'CAR_RENTAL',
    customerId: 'usr-customer-active',
    customerName: 'Hamza Tariq',
    customerPhone: '+92 300 8472910',
    customerCnic: '35202-8172910-3',
    customerCity: 'Islamabad',
    providerId: 'usr-demo-lister',
    providerName: 'Salman Rent a Car & Tours',
    providerPhone: '+92 300 1234567',
    listingId: 'l-1',
    listingTitle: 'Honda Civic Oriel Turbo 2024',
    pickupDate: '2026-11-14T10:00:00Z',
    returnDate: '2026-11-16T10:00:00Z',
    pickupLocation: 'Centaurus Mall, F-8, Islamabad',
    status: 'CONFIRMED',
    totalAmount: 28000,
    currency: 'PKR',
    specialRequests: 'Child seat requested in advance. Non-smoking vehicle.',
    createdAt: '2026-11-10T14:30:00Z',
    updatedAt: '2026-11-10T15:00:00Z',
    confirmedAt: '2026-11-10T15:00:00Z',
    metadata: {
      driveMode: 'SELF_DRIVE',
      assignedVehicleReg: 'ISB-24-4412',
    },
  },
  // 2. CAR RENTAL (With Chauffeur) - Waiting
  {
    id: 'SF-10493',
    serviceType: 'CAR_RENTAL',
    customerId: 'usr-demo-customer',
    customerName: 'Chaudhry Bilal',
    customerPhone: '+92 321 8891024',
    customerCnic: '35201-9988123-1',
    customerCity: 'Lahore',
    providerId: 'usr-demo-lister',
    providerName: 'Salman Rent a Car & Tours',
    providerPhone: '+92 300 1234567',
    listingId: 'l-corolla1',
    listingTitle: 'Toyota Fortuner Legender 2024',
    pickupDate: '2026-11-18T08:00:00Z',
    returnDate: '2026-11-20T20:00:00Z',
    pickupLocation: 'DHA Phase 5, Lahore',
    status: 'WAITING',
    totalAmount: 75000,
    currency: 'PKR',
    specialRequests: 'Wedding conveyance with executive chauffeur.',
    createdAt: '2026-11-12T11:00:00Z',
    updatedAt: '2026-11-12T11:00:00Z',
    metadata: {
      driveMode: 'WITH_CHAUFFEUR',
      assignedDriverName: 'Muhammad Akram',
      assignedDriverPhone: '+92 301 8472910',
      assignedDriverCnic: '35201-4412098-5',
      assignedDriverLicense: 'LHR-DL-99210',
      assignedVehicleReg: 'LEA-24-9988',
    },
  },
  // 3. CHAUFFEUR - Confirmed
  {
    id: 'SF-20491',
    serviceType: 'CHAUFFEUR',
    customerId: 'usr-customer-active',
    customerName: 'Chaudhry Bilal',
    customerPhone: '+92 300 5512901',
    customerCity: 'Lahore',
    providerId: 'usr-demo-driver',
    providerName: 'Tariq Mahmood (Executive Chauffeur)',
    providerPhone: '+92 301 9821045',
    listingId: 'drv-1',
    listingTitle: 'Tariq Mahmood (Executive VIP Chauffeur)',
    pickupDate: '2026-11-14T07:00:00Z',
    returnDate: '2026-11-16T22:00:00Z',
    pickupLocation: 'Gulberg III, Lahore',
    destinationLocation: 'Murree Hills & Bhurban',
    status: 'CONFIRMED',
    totalAmount: 7600,
    currency: 'PKR',
    specialRequests: 'Motorway M-2 driving for family trip.',
    createdAt: '2026-11-10T14:30:00Z',
    updatedAt: '2026-11-10T15:00:00Z',
    confirmedAt: '2026-11-10T15:00:00Z',
    metadata: {
      dutyType: 'OUT_OF_STATION',
      vehicleProvidedByCustomer: 'Customer Honda Civic 2023',
      driverLicense: 'LHR-LTV-99210',
      driverCnic: '35201-4412098-5',
    },
  },
  // 4. CHAUFFEUR - Waiting
  {
    id: 'SF-20492',
    serviceType: 'CHAUFFEUR',
    customerId: 'usr-demo-customer',
    customerName: 'Malik Zeeshan',
    customerPhone: '+92 321 8891024',
    customerCity: 'Lahore',
    providerId: 'usr-demo-driver',
    providerName: 'Tariq Mahmood (Executive Chauffeur)',
    providerPhone: '+92 301 9821045',
    listingId: 'drv-1',
    listingTitle: 'Tariq Mahmood (Executive VIP Chauffeur)',
    pickupDate: '2026-11-16T12:00:00Z',
    returnDate: '2026-11-17T00:00:00Z',
    pickupLocation: 'Model Town, Lahore',
    destinationLocation: 'Lahore City Banquet Halls',
    status: 'WAITING',
    totalAmount: 2800,
    currency: 'PKR',
    specialRequests: '12-hour city duty for guest conveyance.',
    createdAt: '2026-11-11T11:20:00Z',
    updatedAt: '2026-11-11T11:20:00Z',
    metadata: {
      dutyType: 'LOCAL_FULL_DAY',
      vehicleProvidedByCustomer: 'Customer Toyota Fortuner',
      driverLicense: 'LHR-LTV-99210',
      driverCnic: '35201-4412098-5',
    },
  },
  // 5. CITY TO CITY - Confirmed
  {
    id: 'SF-30491',
    serviceType: 'CITY_TO_CITY',
    customerId: 'usr-customer-active',
    customerName: 'Hamza Tariq',
    customerPhone: '+92 300 8472910',
    customerCity: 'Lahore',
    providerId: 'usr-demo-lister',
    providerName: 'Salman Rent a Car & Tours',
    providerPhone: '+92 300 1234567',
    listingId: 'c2c-1',
    listingTitle: 'Lahore to Islamabad M-2 Executive Express',
    pickupDate: '2026-11-20T08:00:00Z',
    pickupLocation: 'Thokar Niaz Baig, Lahore',
    destinationLocation: 'Zero Point / Blue Area, Islamabad',
    status: 'CONFIRMED',
    totalAmount: 18000,
    currency: 'PKR',
    specialRequests: 'Private full vehicle booking via Motorway.',
    createdAt: '2026-11-11T09:00:00Z',
    updatedAt: '2026-11-11T09:30:00Z',
    confirmedAt: '2026-11-11T09:30:00Z',
    metadata: {
      tripType: 'ONE_WAY',
      seatCount: 4,
    },
  },
  // 6. SHUTTLE - Confirmed Monthly Pass
  {
    id: 'SF-40491',
    serviceType: 'SHUTTLE',
    customerId: 'usr-customer-active',
    customerName: 'Hamza Tariq',
    customerPhone: '+92 300 8472910',
    customerCity: 'Lahore',
    providerId: 'usr-demo-provider-pnd',
    providerName: 'Metro Commute Services',
    providerPhone: '+92 321 8472910',
    listingId: 'rt-1',
    listingTitle: 'Johar Town to Gulberg Main Blvd / Mall Road Shuttle',
    pickupDate: '2026-11-01T07:20:00Z',
    returnDate: '2026-11-30T17:30:00Z',
    pickupLocation: 'Johar Town G-1 Market',
    destinationLocation: 'Gulberg Main Blvd (Siddiq Trade Center)',
    status: 'CONFIRMED',
    totalAmount: 8500,
    currency: 'PKR',
    specialRequests: 'Reserved front window seat for daily office commute.',
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T14:00:00Z',
    confirmedAt: '2026-10-28T14:00:00Z',
    metadata: {
      routeStop: 'Johar Town G-1 Market',
      pickupTime: '07:20 AM',
      passType: 'MONTHLY',
      seatsBooked: 1,
    },
  },
  // 7. SHUTTLE - Waiting
  {
    id: 'SF-40492',
    serviceType: 'SHUTTLE',
    customerId: 'usr-demo-customer',
    customerName: 'Ayesha Malik',
    customerPhone: '+92 321 9988771',
    customerCity: 'Islamabad',
    providerId: 'usr-demo-provider-pnd',
    providerName: 'Metro Commute Services',
    providerPhone: '+92 321 8472910',
    listingId: 'rt-2',
    listingTitle: 'Rawalpindi Saddar to Islamabad Blue Area / F-8',
    pickupDate: '2026-11-15T07:15:00Z',
    returnDate: '2026-12-15T17:00:00Z',
    pickupLocation: 'Saddar Metro Station',
    destinationLocation: 'F-8 Markaz Courts',
    status: 'WAITING',
    totalAmount: 9500,
    currency: 'PKR',
    specialRequests: 'Female reserved seating section requested.',
    createdAt: '2026-11-12T16:20:00Z',
    updatedAt: '2026-11-12T16:20:00Z',
    metadata: {
      routeStop: 'Saddar Metro Station',
      pickupTime: '07:15 AM',
      passType: 'MONTHLY',
      seatsBooked: 1,
    },
  },
  // 8. MOVER - Waiting
  {
    id: 'SF-50491',
    serviceType: 'MOVER',
    customerId: 'usr-customer-active',
    customerName: 'Saima Waqas',
    customerPhone: '+92 300 8192041',
    customerCity: 'Lahore',
    providerId: 'usr-demo-provider-cargo',
    providerName: 'Al-Makkah Shifting Transport',
    providerPhone: '+92 333 5599182',
    listingId: 'crg-1',
    listingTitle: '2.5 Ton Shehzore + 3 Helpers House Shifting',
    pickupDate: '2026-11-22T09:00:00Z',
    pickupLocation: 'House 42, Block J, Johar Town, Lahore',
    destinationLocation: 'House 112, Phase 6, DHA, Lahore',
    status: 'WAITING',
    totalAmount: 14500,
    currency: 'PKR',
    specialRequests: 'Requires bubble wrap packing for fragile kitchen crockery.',
    createdAt: '2026-11-12T09:30:00Z',
    updatedAt: '2026-11-12T09:30:00Z',
    metadata: {
      truckRequired: 'Hyundai Shehzore (2.5 Ton)',
      helpersCount: 3,
      floorCount: 2,
      distanceKm: 18,
      shiftingType: '2 BHK Household Relocation',
    },
  },
  // 9. MOVER - Confirmed
  {
    id: 'SF-50492',
    serviceType: 'MOVER',
    customerId: 'usr-demo-customer',
    customerName: 'Dr. Usman Farooq',
    customerPhone: '+92 333 4910291',
    customerCity: 'Islamabad',
    providerId: 'usr-demo-provider-cargo',
    providerName: 'Al-Makkah Shifting Transport',
    providerPhone: '+92 333 5599182',
    listingId: 'crg-2',
    listingTitle: '5.0 Ton Mazda Titan Full House Shifting',
    pickupDate: '2026-11-16T08:00:00Z',
    pickupLocation: 'Sector G-11/2, Islamabad',
    destinationLocation: 'Bahria Town Phase 7, Rawalpindi',
    status: 'CONFIRMED',
    totalAmount: 11400,
    currency: 'PKR',
    specialRequests: 'Heavy sofa set and refrigerator hoisting required.',
    createdAt: '2026-11-10T16:00:00Z',
    updatedAt: '2026-11-10T17:15:00Z',
    confirmedAt: '2026-11-10T17:15:00Z',
    metadata: {
      truckRequired: 'Mazda Titan (5.0 Ton)',
      helpersCount: 4,
      floorCount: 1,
      distanceKm: 28,
      shiftingType: 'Full House Shifting',
    },
  },
];

/**
 * Retrieve all unified bookings from storage or fallback to defaults
 */
export function getUnifiedBookings(): UnifiedBooking[] {
  if (typeof window === 'undefined') return DEFAULT_UNIFIED_BOOKINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNIFIED_BOOKINGS);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY_UNIFIED_BOOKINGS,
        JSON.stringify(DEFAULT_UNIFIED_BOOKINGS)
      );
      return DEFAULT_UNIFIED_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_UNIFIED_BOOKINGS;
  } catch (e) {
    console.error('[bookingSync] Failed to read unified bookings:', e);
    return DEFAULT_UNIFIED_BOOKINGS;
  }
}

/**
 * Persist bookings to localStorage
 */
function saveUnifiedBookings(bookings: UnifiedBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UNIFIED_BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error('[bookingSync] Failed to persist unified bookings:', e);
  }
}

/**
 * Query bookings by Customer ID
 */
export function getBookingsByCustomer(customerId: string): UnifiedBooking[] {
  const all = getUnifiedBookings();
  return all.filter(
    (b) =>
      b.customerId === customerId ||
      (customerId === 'usr-customer-active' && b.customerPhone === '+92 300 8472910')
  );
}

/**
 * Query bookings by Provider ID (Lister, Driver, or Logistics Provider)
 */
export function getBookingsByProvider(providerId: string): UnifiedBooking[] {
  const all = getUnifiedBookings();
  return all.filter((b) => b.providerId === providerId);
}

/**
 * Query a specific booking by ID or reference
 */
export function getBookingById(bookingId: string): UnifiedBooking | null {
  const all = getUnifiedBookings();
  return all.find((b) => b.id === bookingId) || null;
}

/**
 * Create a new unified booking across any of the 5 services
 */
export function createUnifiedBooking(
  bookingInput: Omit<UnifiedBooking, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): UnifiedBooking {
  const all = getUnifiedBookings();
  const now = new Date().toISOString();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const newBooking: UnifiedBooking = {
    ...bookingInput,
    id: `SF-${randomSuffix}`,
    status: 'WAITING',
    currency: bookingInput.currency || 'PKR',
    createdAt: now,
    updatedAt: now,
  };

  all.unshift(newBooking);
  saveUnifiedBookings(all);

  // Sync with Backend PostgreSQL / SQLite Database via REST API
  if (typeof window !== 'undefined') {
    fetch('http://localhost:3001/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingRef: newBooking.id,
        isGuest: newBooking.customerId === 'usr-customer-guest' || !newBooking.customerId,
        customerId: newBooking.customerId !== 'usr-customer-guest' ? newBooking.customerId : undefined,
        customerName: newBooking.customerName,
        customerPhone: newBooking.customerPhone,
        customerCnic: newBooking.customerCnic,
        serviceCategory: newBooking.serviceType,
        listingId: newBooking.listingId,
        startDate: newBooking.pickupDate,
        endDate: newBooking.returnDate || newBooking.pickupDate,
        pickupCity: newBooking.pickupLocation,
        withDriver: newBooking.metadata?.driveMode === 'WITH_CHAUFFEUR',
        totalAmount: newBooking.totalAmount,
      }),
    }).catch(() => {});

    window.dispatchEvent(
      new CustomEvent(EVENT_BOOKING_CREATED, {
        detail: { booking: newBooking },
      })
    );
    window.dispatchEvent(
      new CustomEvent(EVENT_BOOKING_STATUS_UPDATED, {
        detail: {
          bookingId: newBooking.id,
          status: 'WAITING',
          actor: bookingInput.customerName || 'Customer',
        },
      })
    );
  }

  return newBooking;
}

/**
 * Universal booking status transition
 * Allowed statuses: WAITING, CONFIRMED, DECLINED, CANCELLED, COMPLETED
 */
export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  actor: string
): UnifiedBooking | null {
  const all = getUnifiedBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status,
    updatedAt: now,
    confirmedAt: status === 'CONFIRMED' ? now : all[idx].confirmedAt,
  };

  saveUnifiedBookings(all);

  // Sync status with Backend PostgreSQL / SQLite Database
  if (typeof window !== 'undefined') {
    fetch(`http://localhost:3001/api/v1/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});

    window.dispatchEvent(
      new CustomEvent(EVENT_BOOKING_STATUS_UPDATED, {
        detail: { bookingId, status, actor },
      })
    );

    // Backward-compatibility bridge for driver hiring
    if (all[idx].serviceType === 'CHAUFFEUR') {
      window.dispatchEvent(
        new CustomEvent('safarpk_driver_booking_status_updated', {
          detail: { bookingId, status },
        })
      );
    }
  }

  return all[idx];
}

/**
 * Subscribe to cross-portal booking status changes
 * Returns an unsubscription cleanup function
 */
export function subscribeToBookingUpdates(
  callback: (detail: { bookingId: string; status: BookingStatus; actor: string }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ bookingId: string; status: BookingStatus; actor: string }>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  window.addEventListener(EVENT_BOOKING_STATUS_UPDATED, handler);
  return () => window.removeEventListener(EVENT_BOOKING_STATUS_UPDATED, handler);
}

/**
 * Migration helper: Imports legacy fragmented bookings into unified v3 store
 */
export function migrateLegacyBookings(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const currentUnified = getUnifiedBookings();
    const existingIds = new Set(currentUnified.map((b) => b.id));
    let migratedCount = 0;

    // 1. Migrate driver bookings
    const driverRaw = localStorage.getItem('safarpk_driver_hiring_bookings');
    if (driverRaw) {
      const driverBookings = JSON.parse(driverRaw);
      if (Array.isArray(driverBookings)) {
        driverBookings.forEach((d: any) => {
          const id = d.bookingRef || `SF-${d.id}`;
          if (!existingIds.has(id)) {
            currentUnified.push({
              id,
              serviceType: 'CHAUFFEUR',
              customerId: 'usr-customer-active',
              customerName: d.customerName || 'Customer',
              customerPhone: d.customerPhone || '',
              customerCity: d.customerCity,
              providerId: d.driverId || 'usr-demo-driver',
              providerName: d.driverName,
              providerPhone: d.driverPhone,
              listingId: 'drv-legacy',
              listingTitle: d.driverName || 'Verified Chauffeur',
              pickupDate: d.startDate,
              pickupLocation: d.customerCity || 'Lahore',
              destinationLocation: d.destination,
              status: d.status === 'PENDING_CONFIRMATION' ? 'WAITING' : (d.status as BookingStatus),
              totalAmount: d.totalFare || 0,
              currency: 'PKR',
              createdAt: d.createdAt || new Date().toISOString(),
              updatedAt: d.confirmedAt || d.createdAt || new Date().toISOString(),
              metadata: {
                dutyType: d.dutyType,
                driverLicense: d.driverLicense,
                driverCnic: d.driverCnic,
              },
            });
            existingIds.add(id);
            migratedCount++;
          }
        });
      }
    }

    if (migratedCount > 0) {
      saveUnifiedBookings(currentUnified);
    }
    return migratedCount;
  } catch (e) {
    console.error('[bookingSync] Legacy migration failed:', e);
    return 0;
  }
}
