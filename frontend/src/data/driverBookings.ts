'use client';

export interface DriverBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverCnic: string; // Real unmasked CNIC: e.g. '35201-4412098-5'
  driverLicense: string; // Real unmasked License: e.g. 'LHR-LTV-99210'
  dutyType: string;
  destination: string;
  vehicleProvided: string;
  startDate: string;
  days: number;
  totalFare: number;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
  confirmedAt?: string;
}

/**
 * Mask Pakistani CNIC preserving full pattern:
 * e.g. 35201-4412098-5 -> 35201-441***8-5
 * or 42101-2123456-1 -> 42101-212***6-1
 * Matches user specification: "like 4201-212***1-1"
 */
export function maskPakistaniCnic(cnic?: string | null): string {
  if (!cnic) return '35201-212***1-1';
  const clean = cnic.replace(/[^0-9]/g, '');
  if (clean.length < 13) {
    // If not full 13 digits, apply partial mask
    if (clean.length >= 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 7)}***${clean.slice(-1)}`;
    }
    return '35201-212***1-1';
  }

  const prefix = clean.slice(0, 5); // 35201
  const mid1 = clean.slice(5, 8); // first 3 digits of middle (e.g. 441)
  const mid2 = clean.slice(11, 12); // last digit of middle (e.g. 8)
  const last = clean.slice(12, 13); // check digit (e.g. 5)

  return `${prefix}-${mid1}***${mid2}-${last}`;
}

/**
 * Mask Pakistani Driving Licence preserving authority & class format:
 * e.g. LHR-LTV-99210 -> LHR-LTV-99***0
 * or ISB-DL-49201 -> ISB-DL-49***1
 * or KHI-DL-12345 -> KHI-DL-12***5
 */
export function maskPakistaniLicense(license?: string | null): string {
  if (!license) return 'LHR-DL-98***0';
  const trimmed = license.trim();

  // If format is PREFIX-SUBPREFIX-NUMBER (e.g. LHR-LTV-99210)
  const parts = trimmed.split('-');
  if (parts.length >= 3) {
    const authority = parts[0];
    const category = parts[1];
    const num = parts.slice(2).join('-');
    if (num.length >= 4) {
      const maskedNum = `${num.slice(0, 2)}***${num.slice(-1)}`;
      return `${authority}-${category}-${maskedNum}`;
    }
    return `${authority}-${category}-***`;
  }

  // If format is PREFIX-NUMBER (e.g. ISB-49201 or PK-84920)
  if (parts.length === 2) {
    const prefix = parts[0];
    const num = parts[1];
    if (num.length >= 4) {
      const maskedNum = `${num.slice(0, 2)}***${num.slice(-1)}`;
      return `${prefix}-${maskedNum}`;
    }
    return `${prefix}-***`;
  }

  // Generic fallback
  if (trimmed.length > 5) {
    return `${trimmed.slice(0, 3)}***${trimmed.slice(-2)}`;
  }
  return 'LHR-DL-98***0';
}

const STORAGE_KEY = 'safarpk_driver_hiring_bookings';

const DEFAULT_BOOKINGS: DriverBooking[] = [
  {
    id: 'dreq-1',
    bookingRef: 'DRV-4410',
    customerName: 'Chaudhry Bilal',
    customerPhone: '+92 300 5512901',
    customerCity: 'Lahore',
    driverId: 'usr-demo-driver',
    driverName: 'Tariq Mahmood',
    driverPhone: '+92 301 9821045',
    driverCnic: '35201-4412098-5',
    driverLicense: 'LHR-LTV-99210',
    dutyType: 'OUT_OF_STATION',
    destination: 'Lahore to Murree Hills (Family Trip)',
    vehicleProvided: 'Customer Honda Civic',
    startDate: '2026-11-14',
    days: 2,
    totalFare: 7600,
    status: 'CONFIRMED',
    createdAt: '2026-11-10T14:30:00Z',
    confirmedAt: '2026-11-10T15:00:00Z',
  },
  {
    id: 'dreq-2',
    bookingRef: 'DRV-8912',
    customerName: 'Malik Zeeshan',
    customerPhone: '+92 321 8891024',
    customerCity: 'Lahore',
    driverId: 'usr-demo-driver',
    driverName: 'Tariq Mahmood',
    driverPhone: '+92 301 9821045',
    driverCnic: '35201-4412098-5',
    driverLicense: 'LHR-LTV-99210',
    dutyType: 'LOCAL_FULL_DAY',
    destination: 'Lahore City Wedding Conveyance (12 Hours)',
    vehicleProvided: 'Customer Toyota Fortuner',
    startDate: '2026-11-16',
    days: 1,
    totalFare: 2800,
    status: 'PENDING_CONFIRMATION',
    createdAt: '2026-11-11T11:20:00Z',
  },
];

/**
 * Get all driver hiring bookings
 */
export function getDriverBookings(): DriverBooking[] {
  if (typeof window === 'undefined') return DEFAULT_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKINGS));
      return DEFAULT_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_BOOKINGS;
  } catch (e) {
    return DEFAULT_BOOKINGS;
  }
}

/**
 * Save bookings to storage
 */
export function saveDriverBookings(bookings: DriverBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(
      new CustomEvent('safarpk_driver_booking_status_updated', {
        detail: { bookings },
      })
    );
  } catch (e) {
    console.error('Failed to save driver bookings', e);
  }
}

/**
 * Driver confirms a booking from their profile.
 * When confirmed, the booker customer is granted access to the driver's unmasked CNIC and License!
 */
export function confirmDriverBooking(bookingIdOrRef: string): {
  success: boolean;
  booking?: DriverBooking;
} {
  const all = getDriverBookings();
  const idx = all.findIndex(
    (b) => b.id === bookingIdOrRef || b.bookingRef === bookingIdOrRef
  );
  if (idx === -1) return { success: false };

  all[idx] = {
    ...all[idx],
    status: 'CONFIRMED',
    confirmedAt: new Date().toISOString(),
  };

  saveDriverBookings(all);
  return { success: true, booking: all[idx] };
}

/**
 * Driver declines a booking
 */
export function declineDriverBooking(bookingIdOrRef: string): {
  success: boolean;
} {
  const all = getDriverBookings();
  const idx = all.findIndex(
    (b) => b.id === bookingIdOrRef || b.bookingRef === bookingIdOrRef
  );
  if (idx === -1) return { success: false };

  all[idx] = {
    ...all[idx],
    status: 'DECLINED',
  };

  saveDriverBookings(all);
  return { success: true };
}

/**
 * Create a new hiring request from customer
 */
export function createDriverBooking(
  req: Omit<DriverBooking, 'id' | 'status' | 'createdAt'>
): DriverBooking {
  const all = getDriverBookings();
  const newBooking: DriverBooking = {
    ...req,
    id: `dreq-${Date.now()}`,
    status: 'PENDING_CONFIRMATION',
    createdAt: new Date().toISOString(),
  };
  all.unshift(newBooking);
  saveDriverBookings(all);
  return newBooking;
}

/**
 * Helper to get driver's display credentials according to booking confirmation status:
 * If confirmed: returns full unmasked CNIC and License
 * If not confirmed: returns masked CNIC (35201-441***8-5) and masked License (LHR-LTV-99***0)
 */
export function getDriverCredentialsDisplay(
  driverCnic: string,
  driverLicense: string,
  isConfirmed: boolean
): {
  isConfirmed: boolean;
  cnic: string;
  license: string;
  badgeLabel: string;
  badgeClass: string;
  helpText: string;
} {
  if (isConfirmed) {
    return {
      isConfirmed: true,
      cnic: driverCnic,
      license: driverLicense,
      badgeLabel: '✓ Booking Confirmed · Verified ID Unlocked',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      helpText: 'Driver has confirmed your booking. Verified CNIC and Driving Licence released for your trip safety.',
    };
  }

  return {
    isConfirmed: false,
    cnic: maskPakistaniCnic(driverCnic),
    license: maskPakistaniLicense(driverLicense),
    badgeLabel: '⏳ Pending Driver Confirmation · ID on File',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    helpText: 'Driver has verified CNIC & Licence on file. Full unmasked details unlock automatically once the driver confirms your booking.',
  };
}

