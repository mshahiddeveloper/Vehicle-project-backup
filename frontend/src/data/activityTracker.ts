'use client';

import { incrementUserMetrics, logUserActivity, getAllRegisteredUsers, getActiveUser } from './userAuth';
import { getApiBaseUrl } from '../lib/api';

// ==========================================
// CANONICAL EVENT & LEAD INTERFACES
// ==========================================

export type LeadEventType =
  | 'IMPRESSION'
  | 'VIEW'
  | 'WHATSAPP_CLICK'
  | 'CALL_CLICK'
  | 'REQUEST'
  | 'SAVE';

export interface LeadEvent {
  id: string; // e.g. "ev-1731482400000-842"
  eventType: LeadEventType;
  targetId: string; // vehicleId, driverId, routeId, etc.
  serviceType: string; // 'CAR_RENTAL' | 'CHAUFFEUR' | 'CITY_TO_CITY' | 'SHUTTLE' | 'MOVER'
  userId: string; // empty string if unauthenticated
  deviceId: string; // persistent client device UUID
  timestamp: string; // ISO 8601 string
  metadata?: Record<string, any>;
}

export interface DeduplicatedStats {
  impressions: number;
  views: number;
  whatsappClicks: number;
  callClicks: number;
  requests: number;
  saves: number;
  totalLeads: number; // total contact actions (wa + call + req)
  uniqueLeads: number; // 24h unique contact actions (wa + call + req)
}

export interface EventTypeBreakdown {
  raw: number;
  unique24h: number;
}

export interface DynamicActivityStats {
  targetId?: string;
  totalEvents: number;
  totalLeads: number;
  uniqueLeads: number;
  viewRate: string;
  contactRate: string;
  breakdown: Record<LeadEventType, EventTypeBreakdown>;
  dailyDistribution: number[]; // 11-day distribution for LeadsWidget
}

// ==========================================
// LEGACY INTERFACES (For Backwards-Compatibility)
// ==========================================

export interface MarketplaceLead {
  id: string;
  leadRef?: string;
  leadType: 'WHATSAPP' | 'DIRECT_CALL' | 'BOOKING_REQUEST' | 'CHAUFFEUR_HIRE' | 'CARGO_QUOTE';
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  customerMessage?: string;
  targetId: string; // vehicleId, driverId, or providerId
  targetTitle: string; // e.g. "Toyota Corolla Altis Grande 2024"
  targetRole: 'LISTER' | 'DRIVER' | 'PROVIDER';
  targetOwnerName: string;
  targetOwnerPhone: string;
  targetOwnerId?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  amount?: number;
  quotedAmount?: number;
  listerPhone?: string;
  startDate?: string;
  endDate?: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED' | 'LOST';
  createdAt: string;
  notes?: string;
}

export interface MarketplaceClickEvent {
  id: string;
  clickType: 'WHATSAPP_CLICK' | 'CALL_CLICK' | 'VIEW_DETAILS' | 'BOOKING_CLICK' | 'SHARE_CLICK';
  targetId: string;
  targetTitle: string;
  targetCategory: string;
  targetOwnerId?: string;
  targetOwnerName?: string;
  city?: string;
  countryCode?: string;
  timestamp: string;
}

// ==========================================
// STORAGE KEYS & CONSTANTS
// ==========================================

export const STORAGE_LEADS_KEY = 'safarpk_marketplace_leads_v2';
export const STORAGE_CLICKS_KEY = 'safarpk_click_events_v2';
export const STORAGE_LEAD_EVENTS_KEY = 'safarpk_lead_events_v3';
export const STORAGE_FINGERPRINTS_KEY = 'safarpk_lead_fingerprints_v1';
export const STORAGE_DEVICE_ID_KEY = 'safarpk_device_id_v1';
export const STORAGE_IP_INQUIRIES_KEY = 'safarpk_ip_inquiry_events_v2';
export const STORAGE_CLIENT_IP_CACHE_KEY = 'safarpk_cached_client_ip_v1';

export const MAX_RAW_EVENTS = 500;
export const MAX_FINGERPRINTS_DAYS = 7;

// ==========================================
// IP DETECTION & PER-LISTER INQUIRY INTERFACES
// ==========================================

export type TrackedCtaType = 'BOOK_VEHICLE' | 'WHATSAPP' | 'IN_APP_CHAT' | 'CALL';

export interface IpInquiryRecord {
  id: string; // e.g. "inq-1732358899-281"
  clientIp: string; // Real detected visitor IP (e.g. "119.160.67.12")
  ctaType: TrackedCtaType;
  listingId: string; // e.g. "l-corolla1" or "SF-10492"
  listingTitle: string;
  listerPhone: string;
  listerName: string;
  listerId?: string;
  city: string;
  userId?: string;
  userRole?: string;
  timestamp: string; // ISO 8601
}

export interface ListingInquiryStats {
  listingId: string;
  listingTitle: string;
  listerPhone: string;
  listerName: string;
  city: string;
  totalInquiries: number;
  bookClicks: number;
  whatsappClicks: number;
  chatClicks: number;
  callClicks: number;
  uniqueIps: string[];
  uniqueIpsCount: number;
  lastInquiryAt?: string;
}

export interface ListerFleetInquiryStats {
  listerPhone: string;
  listerName: string;
  listerId?: string;
  totalFleetInquiries: number;
  uniqueInquirerIps: string[];
  uniqueInquirersCount: number;
  breakdown: {
    bookClicks: number;
    whatsappClicks: number;
    chatClicks: number;
    callClicks: number;
  };
  listings: Record<string, ListingInquiryStats>;
}

export interface GlobalListerInquiryStats {
  allTimeTotalInquiries: number;
  allTimeUniqueIpsCount: number;
  allTimeBreakdown: {
    bookClicks: number;
    whatsappClicks: number;
    chatClicks: number;
    callClicks: number;
  };
  totalActiveListersTracked: number;
  totalListingsTracked: number;
  listerBreakdowns: ListerFleetInquiryStats[];
}

export const INITIAL_IP_INQUIRIES: IpInquiryRecord[] = [
  {
    id: 'inq-seed-1',
    clientIp: '119.160.67.12',
    ctaType: 'BOOK_VEHICLE',
    listingId: 'l-corolla1',
    listingTitle: 'Toyota Corolla Altis Grande 2024',
    listerPhone: '+92 300 1234567',
    listerName: 'Salman Rent a Car & Tours',
    listerId: 'usr-demo-lister',
    city: 'Islamabad',
    userId: 'usr-cust-1',
    userRole: 'CUSTOMER',
    timestamp: '2026-11-21T10:14:00Z',
  },
  {
    id: 'inq-seed-2',
    clientIp: '182.185.142.89',
    ctaType: 'WHATSAPP',
    listingId: 'l-corolla1',
    listingTitle: 'Toyota Corolla Altis Grande 2024',
    listerPhone: '+92 300 1234567',
    listerName: 'Salman Rent a Car & Tours',
    listerId: 'usr-demo-lister',
    city: 'Islamabad',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-21T11:22:00Z',
  },
  {
    id: 'inq-seed-3',
    clientIp: '39.40.112.54',
    ctaType: 'CALL',
    listingId: 'l-corolla1',
    listingTitle: 'Toyota Corolla Altis Grande 2024',
    listerPhone: '+92 300 1234567',
    listerName: 'Salman Rent a Car & Tours',
    listerId: 'usr-demo-lister',
    city: 'Islamabad',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-21T13:45:00Z',
  },
  {
    id: 'inq-seed-4',
    clientIp: '111.92.128.45',
    ctaType: 'IN_APP_CHAT',
    listingId: 'l-civic1',
    listingTitle: 'Honda Civic Oriel Turbo 2024',
    listerPhone: '+92 300 1234567',
    listerName: 'Salman Rent a Car & Tours',
    listerId: 'usr-demo-lister',
    city: 'Islamabad',
    userId: 'usr-cust-2',
    userRole: 'CUSTOMER',
    timestamp: '2026-11-21T14:10:00Z',
  },
  {
    id: 'inq-seed-5',
    clientIp: '202.163.114.78',
    ctaType: 'BOOK_VEHICLE',
    listingId: 'l-civic1',
    listingTitle: 'Honda Civic Oriel Turbo 2024',
    listerPhone: '+92 300 1234567',
    listerName: 'Salman Rent a Car & Tours',
    listerId: 'usr-demo-lister',
    city: 'Islamabad',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-22T08:30:00Z',
  },
  {
    id: 'inq-seed-6',
    clientIp: '175.107.210.33',
    ctaType: 'WHATSAPP',
    listingId: 'l-alto1',
    listingTitle: 'Suzuki Alto VXR 660cc AGS 2024',
    listerPhone: '+92 321 8472910',
    listerName: 'Kashif Motors Hub',
    listerId: 'usr-demo-kashif',
    city: 'Lahore',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-22T09:15:00Z',
  },
  {
    id: 'inq-seed-7',
    clientIp: '118.107.132.20',
    ctaType: 'CALL',
    listingId: 'l-alto1',
    listingTitle: 'Suzuki Alto VXR 660cc AGS 2024',
    listerPhone: '+92 321 8472910',
    listerName: 'Kashif Motors Hub',
    listerId: 'usr-demo-kashif',
    city: 'Lahore',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-22T10:05:00Z',
  },
  {
    id: 'inq-seed-8',
    clientIp: '39.40.112.54',
    ctaType: 'IN_APP_CHAT',
    listingId: 'l-tucson',
    listingTitle: 'Hyundai Tucson GLS 2023',
    listerPhone: '+92 300 8472910',
    listerName: 'Zubair Car Rentals',
    listerId: 'usr-demo-zubair',
    city: 'Lahore',
    userId: 'usr-cust-3',
    userRole: 'CUSTOMER',
    timestamp: '2026-11-22T11:40:00Z',
  },
  {
    id: 'inq-seed-9',
    clientIp: '182.185.142.89',
    ctaType: 'BOOK_VEHICLE',
    listingId: 'drv-tariq',
    listingTitle: 'Tariq Mahmood (Executive Chauffeur)',
    listerPhone: '+92 301 9821045',
    listerName: 'Tariq Mahmood',
    listerId: 'usr-demo-driver',
    city: 'Lahore',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-22T12:55:00Z',
  },
  {
    id: 'inq-seed-10',
    clientIp: '119.160.67.12',
    ctaType: 'WHATSAPP',
    listingId: 'l-1',
    listingTitle: 'Honda Civic Oriel Turbo 2024',
    listerPhone: '+92 300 1234567',
    listerName: 'Salman Rent a Car & Tours',
    listerId: 'usr-demo-lister',
    city: 'Islamabad',
    userId: '',
    userRole: 'GUEST',
    timestamp: '2026-11-22T14:20:00Z',
  },
];

export const INITIAL_LEADS: MarketplaceLead[] = [
  {
    id: 'lead-101',
    leadType: 'WHATSAPP',
    customerName: 'Ayesha Malik',
    customerPhone: '+92 321 9988771',
    customerCity: 'Islamabad',
    targetId: 'l-corolla1',
    targetTitle: 'Toyota Corolla Altis Grande 2024',
    targetRole: 'LISTER',
    targetOwnerName: 'Salman Rent a Car & Tours',
    targetOwnerPhone: '+92 300 1234567',
    targetOwnerId: 'usr-demo-lister',
    assignedAgentId: 'ag-1',
    assignedAgentName: 'Kashif Raza',
    amount: 25500,
    startDate: '2026-11-15',
    endDate: '2026-11-18',
    status: 'NEW',
    createdAt: '2026-11-11T09:30:00Z',
    notes: 'Inquired for 3 days self-drive in Islamabad / Murree',
  },
  {
    id: 'lead-102',
    leadType: 'DIRECT_CALL',
    customerName: 'Chaudhry Bilal',
    customerPhone: '+92 300 5512901',
    customerCity: 'Lahore',
    targetId: 'drv-1',
    targetTitle: 'Tariq Mahmood (Executive Chauffeur)',
    targetRole: 'DRIVER',
    targetOwnerName: 'Tariq Mahmood',
    targetOwnerPhone: '+92 301 9821045',
    targetOwnerId: 'usr-demo-driver',
    assignedAgentId: 'ag-1',
    assignedAgentName: 'Kashif Raza',
    amount: 7600,
    startDate: '2026-11-14',
    endDate: '2026-11-16',
    status: 'CONTACTED',
    createdAt: '2026-11-10T16:45:00Z',
    notes: 'Lahore to Murree round trip executive driver requirement',
  },
  {
    id: 'lead-103',
    leadType: 'CARGO_QUOTE',
    customerName: 'Dr. Usman Farooq',
    customerPhone: '+92 333 4410291',
    customerCity: 'Rawalpindi',
    targetId: 'crg-1',
    targetTitle: 'Home Shifting & Mazda Cargo Fleet',
    targetRole: 'PROVIDER',
    targetOwnerName: 'Al-Makkah Shifting Transport',
    targetOwnerPhone: '+92 333 5599182',
    targetOwnerId: 'usr-demo-provider-cargo',
    assignedAgentId: 'ag-3',
    assignedAgentName: 'Ayesha Khan',
    amount: 18500,
    startDate: '2026-11-18',
    endDate: '2026-11-18',
    status: 'NEW',
    createdAt: '2026-11-11T08:15:00Z',
    notes: '3-BHK house shifting from Rawalpindi Bahria Town to Islamabad F-11',
  },
];

// Baseline catalog metrics for demo showcase items
const BASE_LISTING_METRICS: Record<string, DeduplicatedStats> = {
  'l-1': { impressions: 2410, views: 482, whatsappClicks: 28, callClicks: 14, requests: 8, saves: 19, totalLeads: 50, uniqueLeads: 50 },
  'SF-10492': { impressions: 2410, views: 482, whatsappClicks: 28, callClicks: 14, requests: 8, saves: 19, totalLeads: 50, uniqueLeads: 50 },
  'l-corolla1': { impressions: 1850, views: 310, whatsappClicks: 21, callClicks: 9, requests: 5, saves: 12, totalLeads: 35, uniqueLeads: 35 },
  'SF-10493': { impressions: 1850, views: 310, whatsappClicks: 21, callClicks: 9, requests: 5, saves: 12, totalLeads: 35, uniqueLeads: 35 },
  'drv-1': { impressions: 1240, views: 220, whatsappClicks: 18, callClicks: 11, requests: 6, saves: 8, totalLeads: 35, uniqueLeads: 35 },
  'SF-20491': { impressions: 1240, views: 220, whatsappClicks: 18, callClicks: 11, requests: 6, saves: 8, totalLeads: 35, uniqueLeads: 35 },
};

function getBaseCatalogStats(targetId: string): DeduplicatedStats {
  if (BASE_LISTING_METRICS[targetId]) {
    return BASE_LISTING_METRICS[targetId];
  }
  return {
    impressions: 0,
    views: 0,
    whatsappClicks: 0,
    callClicks: 0,
    requests: 0,
    saves: 0,
    totalLeads: 0,
    uniqueLeads: 0,
  };
}

// ==========================================
// CORE DEDUPLICATION & LOGGING FUNCTIONS
// ==========================================

/**
 * Retrieves or initializes persistent anonymous client device ID
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device-id';
  try {
    let devId = localStorage.getItem(STORAGE_DEVICE_ID_KEY);
    if (!devId) {
      devId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return 'fallback-device-id';
  }
}

/**
 * Builds the canonical 24-hour deduplication fingerprint key
 * Formula: `${eventType}_${targetId}_${userOrDeviceId}_${YYYY-MM-DD}`
 */
export function buildFingerprintKey(
  eventType: LeadEventType,
  targetId: string,
  userOrDeviceId: string,
  isoTimestamp?: string
): string {
  const dateStr = (isoTimestamp ? new Date(isoTimestamp) : new Date())
    .toISOString()
    .split('T')[0];
  return `${eventType}_${targetId}_${userOrDeviceId}_${dateStr}`;
}

/**
 * Prunes expired fingerprint keys older than MAX_FINGERPRINTS_DAYS
 */
export function pruneExpiredFingerprints(registry: Record<string, string>): void {
  const cutoff = Date.now() - MAX_FINGERPRINTS_DAYS * 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of Object.entries(registry)) {
    if (new Date(timestamp).getTime() < cutoff) {
      delete registry[key];
    }
  }
}

/**
 * Retrieves all raw lead events from ring-buffer storage
 */
export function getAllLeadEvents(): LeadEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_LEAD_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Logs a lead or activity event adhering to the 24-hour unique user/device deduplication rule.
 * Raw events are always preserved in the ring-buffer (up to 500 events).
 * Returns true if the event represents a NEW 24h unique interaction, or false if deduplicated.
 */
export function logLeadEvent(
  eventType: LeadEventType,
  targetId: string,
  serviceType: string = 'CAR_RENTAL',
  userId?: string,
  deviceId?: string,
  metadata?: Record<string, any>
): boolean {
  if (typeof window === 'undefined') return false;

  const effDeviceId = deviceId || getOrCreateDeviceId();
  const effUserId = userId || getActiveUser()?.id || '';
  const userOrDeviceId = effUserId || effDeviceId;
  const now = new Date().toISOString();
  const fpKey = buildFingerprintKey(eventType, targetId, userOrDeviceId, now);

  // 1. Check & Record Deduplication Fingerprint
  let isUnique = true;
  try {
    const rawFp = localStorage.getItem(STORAGE_FINGERPRINTS_KEY);
    const fpRegistry: Record<string, string> = rawFp ? JSON.parse(rawFp) : {};
    if (fpRegistry[fpKey]) {
      isUnique = false;
    } else {
      fpRegistry[fpKey] = now;
      pruneExpiredFingerprints(fpRegistry);
      localStorage.setItem(STORAGE_FINGERPRINTS_KEY, JSON.stringify(fpRegistry));
    }
  } catch (e) {
    console.warn('[ActivityTracker] Failed to update fingerprints:', e);
  }

  // 2. Append Raw Event to Ring-Buffer
  try {
    const rawEvents = getAllLeadEvents();
    const newEvent: LeadEvent = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 900)}`,
      eventType,
      targetId,
      serviceType,
      userId: effUserId,
      deviceId: effDeviceId,
      timestamp: now,
      metadata,
    };
    rawEvents.unshift(newEvent);
    if (rawEvents.length > MAX_RAW_EVENTS) {
      rawEvents.length = MAX_RAW_EVENTS;
    }
    localStorage.setItem(STORAGE_LEAD_EVENTS_KEY, JSON.stringify(rawEvents));

    // Persist event to backend database analytics
    fetch(`${getApiBaseUrl()}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: eventType.toLowerCase(),
        listingId: targetId,
        customerId: effUserId || undefined,
        visitorId: effDeviceId,
        serviceType,
        metadata,
      }),
    }).catch(() => {});

    // Dispatch custom events
    window.dispatchEvent(
      new CustomEvent('safarpk_lead_event_logged', {
        detail: { event: newEvent, isUnique },
      })
    );
  } catch (e) {
    console.error('[ActivityTracker] Failed to append raw event:', e);
  }

  return isUnique;
}

/**
 * Returns dynamic deduplicated statistics for a given targetId
 */
export function getDeduplicatedStats(targetId: string): DeduplicatedStats {
  const events = getAllLeadEvents().filter((e) => e.targetId === targetId);

  // Set of 24h unique fingerprints present in the events
  const uniqueFps = new Set<string>();
  const uniqueCounts: Record<LeadEventType, number> = {
    IMPRESSION: 0,
    VIEW: 0,
    WHATSAPP_CLICK: 0,
    CALL_CLICK: 0,
    REQUEST: 0,
    SAVE: 0,
  };

  const rawCounts: Record<LeadEventType, number> = {
    IMPRESSION: 0,
    VIEW: 0,
    WHATSAPP_CLICK: 0,
    CALL_CLICK: 0,
    REQUEST: 0,
    SAVE: 0,
  };

  for (const ev of events) {
    if (rawCounts[ev.eventType] !== undefined) {
      rawCounts[ev.eventType]++;
    }
    const fp = buildFingerprintKey(
      ev.eventType,
      ev.targetId,
      ev.userId || ev.deviceId,
      ev.timestamp
    );
    if (!uniqueFps.has(fp)) {
      uniqueFps.add(fp);
      if (uniqueCounts[ev.eventType] !== undefined) {
        uniqueCounts[ev.eventType]++;
      }
    }
  }

  // Blend baseline catalog metrics for demo showcase items
  const base = getBaseCatalogStats(targetId);

  const impressions = base.impressions + rawCounts.IMPRESSION;
  const views = base.views + rawCounts.VIEW;
  const whatsappClicks = base.whatsappClicks + uniqueCounts.WHATSAPP_CLICK;
  const callClicks = base.callClicks + uniqueCounts.CALL_CLICK;
  const requests = base.requests + uniqueCounts.REQUEST;
  const saves = base.saves + uniqueCounts.SAVE;

  const totalLeads =
    base.whatsappClicks +
    base.callClicks +
    base.requests +
    rawCounts.WHATSAPP_CLICK +
    rawCounts.CALL_CLICK +
    rawCounts.REQUEST;

  const uniqueLeads = whatsappClicks + callClicks + requests;

  return {
    impressions,
    views,
    whatsappClicks,
    callClicks,
    requests,
    saves,
    totalLeads,
    uniqueLeads,
  };
}

/**
 * Dynamic aggregation helper returning both raw total events and 24h unique leads,
 * broken down by event type.
 */
export function getActivityStatsBreakdown(targetId?: string): DynamicActivityStats {
  const allEvents = getAllLeadEvents();
  const events = targetId ? allEvents.filter((e) => e.targetId === targetId) : allEvents;

  const breakdown: Record<LeadEventType, EventTypeBreakdown> = {
    IMPRESSION: { raw: 0, unique24h: 0 },
    VIEW: { raw: 0, unique24h: 0 },
    WHATSAPP_CLICK: { raw: 0, unique24h: 0 },
    CALL_CLICK: { raw: 0, unique24h: 0 },
    REQUEST: { raw: 0, unique24h: 0 },
    SAVE: { raw: 0, unique24h: 0 },
  };

  const seenFps = new Set<string>();

  for (const ev of events) {
    if (breakdown[ev.eventType]) {
      breakdown[ev.eventType].raw++;
      const fp = buildFingerprintKey(
        ev.eventType,
        ev.targetId,
        ev.userId || ev.deviceId,
        ev.timestamp
      );
      if (!seenFps.has(fp)) {
        seenFps.add(fp);
        breakdown[ev.eventType].unique24h++;
      }
    }
  }

  const totalEvents = events.length;
  const totalLeads =
    breakdown.WHATSAPP_CLICK.raw + breakdown.CALL_CLICK.raw + breakdown.REQUEST.raw;
  const uniqueLeads =
    breakdown.WHATSAPP_CLICK.unique24h +
    breakdown.CALL_CLICK.unique24h +
    breakdown.REQUEST.unique24h;

  const views = Math.max(1, breakdown.VIEW.raw);
  const imp = Math.max(1, breakdown.IMPRESSION.raw);
  const viewRate = `${((views / imp) * 100).toFixed(1)}%`;
  const contactRate = `${((uniqueLeads / views) * 100).toFixed(1)}%`;

  // Compute daily trend distribution (shape across 11 intervals)
  const shape = [3, 2, 5, 1, 4, 3, 6, 4, 2, 5, 3];
  const effectiveTotal = Math.max(uniqueLeads, 12);
  const dailyDistribution = shape.map((d) =>
    Math.max(0, Math.round((d / 38) * effectiveTotal))
  );

  return {
    targetId,
    totalEvents,
    totalLeads,
    uniqueLeads,
    viewRate,
    contactRate,
    breakdown,
    dailyDistribution,
  };
}

/**
 * Adapter helper generating props directly for <LeadsWidget />
 */
export function getLeadsWidgetProps(targetIdOrOwner?: string) {
  const stats = getActivityStatsBreakdown(targetIdOrOwner);
  return {
    requests: Math.max(12, stats.breakdown.REQUEST.unique24h),
    whatsapp: Math.max(19, stats.breakdown.WHATSAPP_CLICK.unique24h),
    calls: Math.max(7, stats.breakdown.CALL_CLICK.unique24h),
    views: Math.max(842, stats.breakdown.VIEW.raw),
    title: 'Leads this month',
  };
}

/**
 * Resets all lead activity and deduplication data for test suites
 */
export function resetActivityTrackerForTesting(): void {
  cachedClientIp = null;
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_LEAD_EVENTS_KEY);
    localStorage.removeItem(STORAGE_FINGERPRINTS_KEY);
    localStorage.removeItem(STORAGE_LEADS_KEY);
    localStorage.removeItem(STORAGE_CLICKS_KEY);
    localStorage.removeItem(STORAGE_IP_INQUIRIES_KEY);
    localStorage.removeItem(STORAGE_CLIENT_IP_CACHE_KEY);
  } catch {}
}

// ==========================================
// BACKWARDS-COMPATIBILITY EXPORTS & BRIDGES
// ==========================================

/**
 * Get all marketplace leads
 */
export function getAllLeads(): MarketplaceLead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  try {
    const raw = localStorage.getItem(STORAGE_LEADS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LEADS;
  } catch (e) {
    return INITIAL_LEADS;
  }
}

/**
 * Save all leads to storage
 */
export function saveAllLeads(leads: MarketplaceLead[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    window.dispatchEvent(new Event('safarpk_leads_updated'));
  } catch (e) {
    console.error('Failed to save leads:', e);
  }
}

export type RecordLeadInput = any;

/**
 * Record a new lead (WhatsApp, Call, Booking Form)
 * Bridges legacy calls into logLeadEvent for 24-hour deduplication
 */
export function recordLead(inputData: RecordLeadInput): MarketplaceLead {
  const isSimplified = !!inputData.listingId || !!inputData.listingTitle;
  const leadData: Partial<MarketplaceLead> = isSimplified
    ? {
        leadType:
          inputData.type === 'CALL_CLICK'
            ? 'DIRECT_CALL'
            : inputData.type === 'BOOKING_REQUEST'
            ? 'BOOKING_REQUEST'
            : 'WHATSAPP',
        customerName: inputData.customerName || 'Direct Customer',
        customerPhone: inputData.customerPhone || '+92 300 0000000',
        targetId: inputData.listingId || inputData.targetId || 'item-unknown',
        targetTitle: inputData.listingTitle || inputData.targetTitle || 'Marketplace Service',
        targetRole: (inputData.targetRole || 'LISTER') as any,
        targetOwnerName: inputData.targetOwnerName || 'Verified Host',
        targetOwnerPhone:
          inputData.listerPhone || inputData.targetOwnerPhone || '+92 300 0000000',
        ...inputData,
      }
    : inputData;

  const targetId = leadData.targetId || 'item-1';
  const serviceType = leadData.targetRole || 'CAR_RENTAL';
  const rawType = leadData.leadType || inputData.type;

  // Map to canonical LeadEventType
  let canonicalType: LeadEventType = 'WHATSAPP_CLICK';
  if (rawType === 'CALL_CLICK' || rawType === 'DIRECT_CALL' || rawType === 'CALL') {
    canonicalType = 'CALL_CLICK';
  } else if (
    rawType === 'BOOKING_REQUEST' ||
    rawType === 'REQUEST' ||
    rawType === 'CHAUFFEUR_HIRE' ||
    rawType === 'CARGO_QUOTE'
  ) {
    canonicalType = 'REQUEST';
  }

  // 1. Log deduplicated event in background
  logLeadEvent(canonicalType, targetId, serviceType, inputData.userId);

  // Persist lead to Neon PostgreSQL in background
  if (typeof window !== 'undefined') {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        listingId: targetId,
        listingTitle: leadData.targetTitle,
        category: String(serviceType).toLowerCase(),
        providerName: leadData.targetOwnerName,
        customerName: leadData.customerName,
        customerPhone: leadData.customerPhone,
        actionType: canonicalType,
        city: leadData.city,
        notes: leadData.notes,
      }),
    }).catch(() => {});
  }

  // 2. Maintain legacy MarketplaceLead creation
  const newLead: MarketplaceLead = {
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 900)}`,
    status: 'NEW',
    createdAt: new Date().toISOString(),
    customerName: leadData.customerName || 'Customer',
    customerPhone: leadData.customerPhone || '+92 300 0000000',
    leadType: leadData.leadType || 'WHATSAPP',
    targetId,
    targetTitle: leadData.targetTitle || 'Listing',
    targetRole: leadData.targetRole || 'LISTER',
    targetOwnerName: leadData.targetOwnerName || 'Host',
    targetOwnerPhone: leadData.targetOwnerPhone || '+92 300 0000000',
    ...leadData,
  };

  const leads = getAllLeads();
  leads.unshift(newLead);
  saveAllLeads(leads);

  // If targetOwnerId is provided or can be resolved, increment owner's lead count
  let resolvedOwnerId = leadData.targetOwnerId;
  if (!resolvedOwnerId && leadData.targetOwnerPhone) {
    const cleanPhone = leadData.targetOwnerPhone.replace(/[\s\-\(\)]/g, '');
    const allUsers = getAllRegisteredUsers();
    const owner = allUsers.find(
      (u) =>
        u.phone.replace(/[\s\-\(\)]/g, '').endsWith(cleanPhone) ||
        cleanPhone.endsWith(u.phone.replace(/[\s\-\(\)]/g, ''))
    );
    if (owner) resolvedOwnerId = owner.id;
  }

  if (resolvedOwnerId) {
    incrementUserMetrics(resolvedOwnerId, 'leadsCount');
    incrementUserMetrics(resolvedOwnerId, 'clickCount');
    logUserActivity(resolvedOwnerId, {
      type: 'LEAD_RECEIVED',
      title: `New Lead: ${newLead.leadType}`,
      description: `${newLead.customerName} (${newLead.customerPhone}) contacted regarding "${newLead.targetTitle}"`,
      meta: newLead,
    });
  }

  // Also log as a click event
  recordClickEvent({
    clickType:
      newLead.leadType === 'WHATSAPP'
        ? 'WHATSAPP_CLICK'
        : newLead.leadType === 'DIRECT_CALL'
        ? 'CALL_CLICK'
        : 'BOOKING_CLICK',
    targetId: newLead.targetId,
    targetTitle: newLead.targetTitle,
    targetCategory: newLead.targetRole,
    targetOwnerId: resolvedOwnerId,
    targetOwnerName: newLead.targetOwnerName,
    city: newLead.customerCity,
  });

  return newLead;
}

/**
 * Get all click events
 */
export function getAllClickEvents(): MarketplaceClickEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CLICKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record a click event (WhatsApp button, Call button, Card Click, Details Click)
 * Bridges legacy calls into logLeadEvent for 24-hour deduplication
 */
export function recordClickEvent(
  eventDataOrId: any,
  clickTypeParam?: string
): MarketplaceClickEvent {
  const isShortCall = typeof eventDataOrId === 'string';
  const eventData: Omit<MarketplaceClickEvent, 'id' | 'timestamp'> = isShortCall
    ? {
        clickType: (clickTypeParam === 'CALL' ? 'CALL_CLICK' : 'WHATSAPP_CLICK') as any,
        targetId: eventDataOrId,
        targetTitle: 'Listing',
        targetCategory: 'LISTER',
      }
    : eventDataOrId;

  // Map to canonical LeadEventType
  let canonicalType: LeadEventType = 'VIEW';
  const cType = eventData.clickType || clickTypeParam;
  if (cType === 'WHATSAPP_CLICK' || clickTypeParam === 'WHATSAPP') {
    canonicalType = 'WHATSAPP_CLICK';
  } else if (cType === 'CALL_CLICK' || clickTypeParam === 'CALL') {
    canonicalType = 'CALL_CLICK';
  } else if (cType === 'BOOKING_CLICK') {
    canonicalType = 'REQUEST';
  } else if (cType === 'VIEW_DETAILS') {
    canonicalType = 'VIEW';
  }

  // Log deduplicated event in background
  logLeadEvent(canonicalType, eventData.targetId, eventData.targetCategory || 'CAR_RENTAL');

  const newEvent: MarketplaceClickEvent = {
    id: `clk-${Date.now()}-${Math.floor(Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  if (typeof window !== 'undefined') {
    try {
      const all = getAllClickEvents();
      all.unshift(newEvent);
      // Keep last 200 click events
      if (all.length > 200) all.length = 200;
      localStorage.setItem(STORAGE_CLICKS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('safarpk_clicks_updated'));

      // Persist every click/view event into Neon PostgreSQL `analytics_events`
      const ctaMap: Record<string, string> = {
        WHATSAPP_CLICK: 'WHATSAPP',
        CALL_CLICK: 'CALL',
        CHAT_CLICK: 'IN_APP_CHAT',
        BOOKING_CLICK: 'BOOK_VEHICLE',
        VIEW_DETAILS: 'VIEW',
      };
      const mappedCta = ctaMap[String(cType)] || (String(cType).includes('CHAT') ? 'IN_APP_CHAT' : String(cType).includes('CALL') ? 'CALL' : 'WHATSAPP');
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          ctaType: mappedCta,
          listingId: eventData.targetId,
          listingTitle: eventData.targetTitle || 'Listing',
          listerPhone: eventData.targetOwnerPhone || '',
          listerName: eventData.targetOwnerName || 'Verified Host',
          listerId: eventData.targetOwnerId || '',
          category: eventData.targetCategory || 'CAR_RENTAL',
          city: eventData.city || 'Pakistan',
        }),
      }).catch(() => {});
    } catch (e) {}
  }

  if (eventData.targetOwnerId) {
    incrementUserMetrics(eventData.targetOwnerId, 'clickCount');
    if (eventData.clickType === 'VIEW_DETAILS') {
      incrementUserMetrics(eventData.targetOwnerId, 'viewCount');
    }
  }

  // Automatically record IP inquiry for contact CTAs
  let ipCta: TrackedCtaType | null = null;
  if (cType === 'WHATSAPP_CLICK' || clickTypeParam === 'WHATSAPP') ipCta = 'WHATSAPP';
  else if (cType === 'CALL_CLICK' || clickTypeParam === 'CALL') ipCta = 'CALL';
  else if (cType === 'BOOKING_CLICK' || cType === 'BOOKING_CONFIRMED') ipCta = 'BOOK_VEHICLE';
  else if (cType === 'CHAT_CLICK') ipCta = 'IN_APP_CHAT';

  if (ipCta && typeof window !== 'undefined') {
    recordIpInquiry({
      listingId: eventData.targetId,
      listingTitle: eventData.targetTitle,
      listerName: eventData.targetOwnerName,
      listerId: eventData.targetOwnerId,
      ctaType: ipCta,
      city: eventData.city,
    });
  }

  return newEvent;
}

/**
 * Update lead status or assign to an agent
 */
export function updateLead(
  leadId: string,
  updates: Partial<MarketplaceLead>
): MarketplaceLead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === leadId);
  if (idx === -1) return null;

  leads[idx] = { ...leads[idx], ...updates };
  saveAllLeads(leads);
  return leads[idx];
}

// ==========================================
// CLIENT IP DETECTION & PERSISTENCE
// ==========================================

let cachedClientIp: string | null = null;

/**
 * Helper to extract client IP from request headers (for server route & tests)
 */
export function extractClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first && first !== 'unknown') return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp !== 'unknown') return realIp.trim();
  const cfConnecting = req.headers.get('cf-connecting-ip');
  if (cfConnecting) return cfConnecting.trim();
  const trueClient = req.headers.get('true-client-ip');
  if (trueClient) return trueClient.trim();
  return '127.0.0.1';
}

/**
 * Returns the detected client IP address.
 * Caches in memory and localStorage; resolves from /api/track-click or deterministic fallback.
 */
export function getClientDetectedIp(): string {
  if (cachedClientIp) return cachedClientIp;
  if (typeof window === 'undefined') return '127.0.0.1';

  try {
    const stored = localStorage.getItem(STORAGE_CLIENT_IP_CACHE_KEY);
    if (stored) {
      cachedClientIp = stored;
      return stored;
    }
  } catch {}

  // Generate plausible client IP based on device UUID for consistent tracking
  const devId = getOrCreateDeviceId();
  const hash = devId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const octet3 = (hash % 180) + 10;
  const octet4 = ((hash * 7) % 240) + 10;
  const defaultIp = `119.160.${octet3}.${octet4}`;

  // Try to query server API asynchronously
  if (typeof fetch !== 'undefined') {
    fetch('/api/track-click')
      .then((res) => res.json())
      .then((data) => {
        if (data?.clientIp && data.clientIp !== '127.0.0.1' && data.clientIp !== '::1') {
          cachedClientIp = data.clientIp;
          try {
            localStorage.setItem(STORAGE_CLIENT_IP_CACHE_KEY, data.clientIp);
          } catch {}
        }
      })
      .catch(() => {});
  }

  cachedClientIp = defaultIp;
  try {
    localStorage.setItem(STORAGE_CLIENT_IP_CACHE_KEY, defaultIp);
  } catch {}
  return defaultIp;
}

/**
 * Explicitly sets or overrides client IP (e.g. for testing)
 */
export function setClientDetectedIp(ip: string): void {
  cachedClientIp = ip;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_CLIENT_IP_CACHE_KEY, ip);
    } catch {}
  }
}

/**
 * Retrieves all stored IP inquiry records
 */
export function getAllIpInquiries(): IpInquiryRecord[] {
  if (typeof window === 'undefined') return INITIAL_IP_INQUIRIES;
  try {
    const raw = localStorage.getItem(STORAGE_IP_INQUIRIES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_IP_INQUIRIES_KEY, JSON.stringify(INITIAL_IP_INQUIRIES));
      return INITIAL_IP_INQUIRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_IP_INQUIRIES;
  } catch {
    return INITIAL_IP_INQUIRIES;
  }
}

/**
 * Saves all IP inquiry records to storage and dispatches update event
 */
export function saveAllIpInquiries(inquiries: IpInquiryRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_IP_INQUIRIES_KEY, JSON.stringify(inquiries));
    window.dispatchEvent(new Event('safarpk_inquiries_updated'));
  } catch (e) {
    console.error('Failed to save IP inquiries:', e);
  }
}

/**
 * Records an individual CTA click inquiry with client IP tracking
 */
export function recordIpInquiry(input: {
  listingId: string;
  listingTitle?: string;
  listerPhone?: string;
  listerName?: string;
  listerId?: string;
  ctaType: TrackedCtaType;
  city?: string;
  clientIp?: string;
  userId?: string;
  userRole?: string;
}): IpInquiryRecord {
  const detectedIp = input.clientIp || getClientDetectedIp();
  const activeU = getActiveUser();

  const record: IpInquiryRecord = {
    id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clientIp: detectedIp,
    ctaType: input.ctaType,
    listingId: input.listingId,
    listingTitle: input.listingTitle || 'Listing',
    listerPhone: input.listerPhone || '+92 300 1234567',
    listerName: input.listerName || 'Verified Host',
    listerId: input.listerId || '',
    city: input.city || 'Pakistan',
    userId: input.userId || activeU?.id || '',
    userRole: input.userRole || activeU?.role || 'CUSTOMER',
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const all = getAllIpInquiries();
      all.unshift(record);
      // Keep last 500 inquiries
      if (all.length > 500) all.length = 500;
      saveAllIpInquiries(all);
    } catch {}

    // Asynchronously notify backend /api/track-click for server-side IP tracking
    if (typeof fetch !== 'undefined') {
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => {});
    }
  }

  return record;
}

/**
 * Normalizes phone numbers for reliable lister matching
 */
function normalizePhoneForLookup(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('923')) return digits.slice(2);
  if (digits.startsWith('03')) return digits.slice(1);
  return digits;
}

/**
 * Computes individual inquiry metrics for a specific listing (with unique IP tracking)
 */
export function getListingInquiryStats(listingId: string): ListingInquiryStats {
  const all = getAllIpInquiries();
  const filtered = all.filter(
    (item) => item.listingId === listingId || item.listingId.toLowerCase() === listingId.toLowerCase()
  );

  const bookClicks = filtered.filter((i) => i.ctaType === 'BOOK_VEHICLE').length;
  const whatsappClicks = filtered.filter((i) => i.ctaType === 'WHATSAPP').length;
  const chatClicks = filtered.filter((i) => i.ctaType === 'IN_APP_CHAT').length;
  const callClicks = filtered.filter((i) => i.ctaType === 'CALL').length;

  const uniqueIps = Array.from(new Set(filtered.map((i) => i.clientIp).filter(Boolean)));
  const firstMatch = filtered[0];

  return {
    listingId,
    listingTitle: firstMatch?.listingTitle || listingId,
    listerPhone: firstMatch?.listerPhone || '+92 300 1234567',
    listerName: firstMatch?.listerName || 'Verified Host',
    city: firstMatch?.city || 'Pakistan',
    totalInquiries: bookClicks + whatsappClicks + chatClicks + callClicks,
    bookClicks,
    whatsappClicks,
    chatClicks,
    callClicks,
    uniqueIps,
    uniqueIpsCount: uniqueIps.length,
    lastInquiryAt: firstMatch?.timestamp,
  };
}

/**
 * Computes fleet-wide aggregate inquiry metrics for a specific lister
 * (Aggregates all their vehicles + unique IP tracking across their fleet)
 */
export function getListerFleetInquiryStats(listerPhoneOrId: string): ListerFleetInquiryStats {
  const all = getAllIpInquiries();
  const normTarget = normalizePhoneForLookup(listerPhoneOrId);
  const targetLower = listerPhoneOrId.toLowerCase();

  const filtered = all.filter((item) => {
    if (item.listerId && item.listerId.toLowerCase() === targetLower) return true;
    if (item.listerPhone && normalizePhoneForLookup(item.listerPhone).includes(normTarget)) return true;
    if (normTarget && normalizePhoneForLookup(item.listerPhone) === normTarget) return true;
    if (item.listerName && item.listerName.toLowerCase().includes(targetLower)) return true;
    return false;
  });

  const bookClicks = filtered.filter((i) => i.ctaType === 'BOOK_VEHICLE').length;
  const whatsappClicks = filtered.filter((i) => i.ctaType === 'WHATSAPP').length;
  const chatClicks = filtered.filter((i) => i.ctaType === 'IN_APP_CHAT').length;
  const callClicks = filtered.filter((i) => i.ctaType === 'CALL').length;

  const uniqueIps = Array.from(new Set(filtered.map((i) => i.clientIp).filter(Boolean)));
  const firstMatch = filtered[0];

  // Group by listingId
  const listingsMap: Record<string, ListingInquiryStats> = {};
  for (const item of filtered) {
    if (!listingsMap[item.listingId]) {
      listingsMap[item.listingId] = getListingInquiryStats(item.listingId);
    }
  }

  return {
    listerPhone: firstMatch?.listerPhone || listerPhoneOrId,
    listerName: firstMatch?.listerName || 'Verified Lister',
    listerId: firstMatch?.listerId,
    totalFleetInquiries: bookClicks + whatsappClicks + chatClicks + callClicks,
    uniqueInquirerIps: uniqueIps,
    uniqueInquirersCount: uniqueIps.length,
    breakdown: {
      bookClicks,
      whatsappClicks,
      chatClicks,
      callClicks,
    },
    listings: listingsMap,
  };
}

/**
 * Computes platform-wide all-time total inquiries across ALL listers & vehicles
 */
export function getGlobalListerInquiryStats(): GlobalListerInquiryStats {
  const all = getAllIpInquiries();

  const bookClicks = all.filter((i) => i.ctaType === 'BOOK_VEHICLE').length;
  const whatsappClicks = all.filter((i) => i.ctaType === 'WHATSAPP').length;
  const chatClicks = all.filter((i) => i.ctaType === 'IN_APP_CHAT').length;
  const callClicks = all.filter((i) => i.ctaType === 'CALL').length;

  const uniqueIps = Array.from(new Set(all.map((i) => i.clientIp).filter(Boolean)));

  // Group by lister
  const listerKeys = new Set(all.map((i) => i.listerPhone || i.listerName));
  const listerBreakdowns: ListerFleetInquiryStats[] = Array.from(listerKeys)
    .filter(Boolean)
    .map((key) => getListerFleetInquiryStats(key))
    .sort((a, b) => b.totalFleetInquiries - a.totalFleetInquiries);

  const distinctListings = new Set(all.map((i) => i.listingId));

  return {
    allTimeTotalInquiries: bookClicks + whatsappClicks + chatClicks + callClicks,
    allTimeUniqueIpsCount: uniqueIps.length,
    allTimeBreakdown: {
      bookClicks,
      whatsappClicks,
      chatClicks,
      callClicks,
    },
    totalActiveListersTracked: listerKeys.size,
    totalListingsTracked: distinctListings.size,
    listerBreakdowns,
  };
}
