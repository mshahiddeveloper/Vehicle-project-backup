export const API_BASE = 'http://localhost:3001/api/v1';

// Privacy & Masking Helpers
export function maskCnic(cnic?: string | null): string {
  if (!cnic) return 'XXXXX-XXXXXXX-X';
  const clean = cnic.replace(/[^0-9]/g, '');
  if (clean.length < 13) return cnic;
  return `${clean.slice(0, 5)}-*******-${clean.slice(12)}`;
}

export function maskLicense(lic?: string | null): string {
  if (!lic) return 'PK-DL-XXXXXX';
  if (lic.length <= 6) return lic;
  return `${lic.slice(0, 4)}***${lic.slice(-2)}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '+92 3** *******';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length >= 10) {
    return `+92 ${clean.slice(-10, -7)} ***${clean.slice(-4)}`;
  }
  return phone;
}

// Format Currency
export function formatPKR(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return amount.toLocaleString('en-PK');
}

// Common Shared Interfaces
export interface ListingImage {
  id: string;
  originalUrl: string;
  thumbnailUrl?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface VehicleListing {
  id: string;
  listingRef: string;
  productionYear: number;
  colour?: string;
  registrationNumber?: string;
  city: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  dailyRate: number;
  dailyRateWithDriver?: number;
  driverAvailable?: boolean;
  driverMandatory?: boolean;
  transmission?: string;
  fuelType?: string;
  description?: string;
  serviceType?: 'CAR_RENTAL' | 'PICK_AND_DROP' | 'CITY_TO_CITY' | 'GOODS_TRANSPORT';
  originCity?: string;
  destinationCity?: string;
  routeDetails?: string;
  morningPickupTime?: string;
  eveningDropTime?: string;
  pricePerSeat?: number;
  availableSeats?: number;
  monthlyRatePerSeat?: number;
  movingCapacityTons?: number;
  helpersAvailable?: boolean;
  helperRate?: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'LIVE' | 'SUSPENDED';
  isFeatured?: boolean;
  manufacturer?: { name: string; slug?: string };
  model?: { name: string; slug?: string };
  category?: { name: string; slug?: string; iconUrl?: string };
  images?: ListingImage[];
  lister?: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    displayName?: string;
    ratingAverage?: number;
    ratingCount?: number;
    user?: { phone?: string; email?: string };
  };
}

export interface BookingRequest {
  id: string;
  bookingRef: string;
  listingId: string;
  listing?: VehicleListing;
  startDate: string;
  endDate: string;
  totalAmount: number;
  withDriver: boolean;
  pickupCity: string;
  pickupAddress: string;
  customerName?: string;
  customerCnic?: string;
  customerLicenceNumber?: string;
  customerLicenceExpiry?: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID_ONLINE' | 'PAY_ON_PICKUP' | 'REFUNDED';
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  city: string;
  experienceYears: number;
  licenseCategory: 'LTV' | 'HTV' | 'PSV';
  licenseNumber: string;
  licenseExpiry: string;
  cnicNumber: string;
  dailyRateLocal: number;
  dailyRateOutstation: number;
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  rating: number;
  tripsCount: number;
  avatarUrl?: string;
}

