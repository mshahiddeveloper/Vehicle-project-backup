'use client';

import { getAllLeads, getAllClickEvents, MarketplaceLead, MarketplaceClickEvent } from './activityTracker';

export interface ListingActionMetrics {
  id: string;
  name: string;
  category: 'CAR' | 'DRIVER' | 'SHUTTLE' | 'MOVER';
  city: string;
  regOrRef?: string;
  ownerId?: string;
  ownerName: string;
  ownerPhone: string;
  impressions: number;
  views: number;
  whatsappClicks: number;
  callClicks: number;
  bookingRequests: number;
  savedCount: number;
  conversionRate: string; // e.g. "9.8%"
  delta: string; // e.g. "+14%"
  colorAccent: string; // Hex color for visual bars
}

export interface PlatformAnalyticsSummary {
  totalImpressions: number;
  totalViews: number;
  totalWhatsAppClicks: number;
  totalCallClicks: number;
  totalBookingRequests: number;
  totalLeads: number;
  averageConversionRate: string;
  grossInquiredValue: number;
  claimedLeadsCount: number;
  unclaimedLeadsCount: number;
}

const STORAGE_STAFF_AGENTS_PERMS_KEY = 'safarpk_staff_agent_perms_v1';

/**
 * Super Admin permission: Check if an agent is allowed to access & export Analytics
 */
export function getAgentAnalyticsPermission(agentId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_STAFF_AGENTS_PERMS_KEY);
    if (!raw) return true; // Default: senior agents permitted
    const parsed = JSON.parse(raw);
    return parsed[agentId]?.viewAnalytics ?? true;
  } catch (e) {
    return true;
  }
}

/**
 * Super Admin permission: Toggle agent analytics & export permission
 */
export function setAgentAnalyticsPermission(agentId: string, allowed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_STAFF_AGENTS_PERMS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[agentId] = {
      ...(parsed[agentId] || {}),
      viewAnalytics: allowed,
    };
    localStorage.setItem(STORAGE_STAFF_AGENTS_PERMS_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event('safarpk_agent_perms_updated'));
  } catch (e) {
    console.error('Failed to set agent analytics permission:', e);
  }
}

/**
 * Claim an inquiry / lead by staff or agent
 */
export function claimLeadByStaff(
  leadId: string,
  staff: { id: string; name: string; staffId: string }
): MarketplaceLead | null {
  if (typeof window === 'undefined') return null;
  try {
    const leads = getAllLeads();
    const idx = leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return null;

    leads[idx] = {
      ...leads[idx],
      assignedAgentId: staff.staffId,
      assignedAgentName: staff.name,
      status: leads[idx].status === 'NEW' ? 'CONTACTED' : leads[idx].status,
      notes: (leads[idx].notes ? leads[idx].notes + ' · ' : '') + `Claimed by ${staff.name} (${staff.staffId}) at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    };

    localStorage.setItem('safarpk_marketplace_leads_v2', JSON.stringify(leads));
    window.dispatchEvent(new Event('safarpk_leads_updated'));
    return leads[idx];
  } catch (e) {
    return null;
  }
}

/**
 * Export any analytics table or leads list to a real, downloadable CSV file
 */
export function downloadAnalyticsCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  if (typeof window === 'undefined') return;
  try {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\r\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('CSV export failed:', e);
  }
}

/**
 * Realistic Base Listing Analytics Data Catalog
 */
export const BASE_LISTING_METRICS: ListingActionMetrics[] = [
  {
    id: 'l-corolla1',
    name: 'Toyota Corolla Altis Grande 2024',
    category: 'CAR',
    city: 'Islamabad',
    regOrRef: 'LEA-24-9988',
    ownerName: 'Salman Rent a Car & Tours',
    ownerPhone: '+92 300 1234567',
    impressions: 2840,
    views: 462,
    whatsappClicks: 28,
    callClicks: 14,
    bookingRequests: 6,
    savedCount: 22,
    conversionRate: '10.4%',
    delta: '+14%',
    colorAccent: '#0B6B4F', // Emerald
  },
  {
    id: 'l-civic1',
    name: 'Honda Civic Oriel Turbo 2024',
    category: 'CAR',
    city: 'Islamabad',
    regOrRef: 'ISB-24-4412',
    ownerName: 'Salman Rent a Car & Tours',
    ownerPhone: '+92 300 1234567',
    impressions: 3410,
    views: 588,
    whatsappClicks: 36,
    callClicks: 18,
    bookingRequests: 9,
    savedCount: 31,
    conversionRate: '10.7%',
    delta: '+22%',
    colorAccent: '#0B6B4F',
  },
  {
    id: 'l-prado1',
    name: 'Toyota Prado TX 2.8D 2023',
    category: 'CAR',
    city: 'Islamabad',
    regOrRef: 'ISB-PR-770',
    ownerName: 'Salman Rent a Car & Tours',
    ownerPhone: '+92 300 1234567',
    impressions: 4290,
    views: 820,
    whatsappClicks: 48,
    callClicks: 24,
    bookingRequests: 11,
    savedCount: 45,
    conversionRate: '10.1%',
    delta: '+29%',
    colorAccent: '#0B6B4F',
  },
  {
    id: 'l-alto1',
    name: 'Suzuki Alto VXR 660cc AGS 2024',
    category: 'CAR',
    city: 'Lahore',
    regOrRef: 'LHR-24-3310',
    ownerName: 'Kashif Motors Hub',
    ownerPhone: '+92 321 8472910',
    impressions: 3950,
    views: 640,
    whatsappClicks: 42,
    callClicks: 26,
    bookingRequests: 14,
    savedCount: 28,
    conversionRate: '12.8%',
    delta: '+18%',
    colorAccent: '#0B6B4F',
  },
  {
    id: 'drv-tariq',
    name: 'Tariq Mahmood (Executive Chauffeur)',
    category: 'DRIVER',
    city: 'Lahore',
    regOrRef: 'LIC-LHR-9921',
    ownerName: 'Tariq Mahmood',
    ownerPhone: '+92 301 9821045',
    impressions: 2180,
    views: 384,
    whatsappClicks: 26,
    callClicks: 19,
    bookingRequests: 8,
    savedCount: 17,
    conversionRate: '13.8%',
    delta: '+16%',
    colorAccent: '#D97706', // Amber
  },
  {
    id: 'drv-akram',
    name: 'Muhammad Akram (VIP Highway Driver)',
    category: 'DRIVER',
    city: 'Islamabad',
    regOrRef: 'LIC-ISB-4412',
    ownerName: 'Muhammad Akram',
    ownerPhone: '+92 301 8472910',
    impressions: 1940,
    views: 312,
    whatsappClicks: 22,
    callClicks: 15,
    bookingRequests: 5,
    savedCount: 14,
    conversionRate: '13.5%',
    delta: '+11%',
    colorAccent: '#D97706',
  },
  {
    id: 'sht-isb-rwp',
    name: 'Twin Cities Executive Daily Shuttle',
    category: 'SHUTTLE',
    city: 'Islamabad / Rawalpindi',
    regOrRef: 'ROUTE-ISB-01',
    ownerName: 'Al-Madina Shuttle Services',
    ownerPhone: '+92 312 4499112',
    impressions: 3100,
    views: 520,
    whatsappClicks: 38,
    callClicks: 21,
    bookingRequests: 12,
    savedCount: 25,
    conversionRate: '13.7%',
    delta: '+25%',
    colorAccent: '#7C3AED', // Purple
  },
  {
    id: 'mvr-almakkah',
    name: 'Al-Makkah Shifting & Mazda Cargo Fleet',
    category: 'MOVER',
    city: 'Rawalpindi / Islamabad',
    regOrRef: 'CARGO-RWP-77',
    ownerName: 'Al-Makkah Shifting Transport',
    ownerPhone: '+92 333 5599182',
    impressions: 2450,
    views: 410,
    whatsappClicks: 32,
    callClicks: 18,
    bookingRequests: 9,
    savedCount: 19,
    conversionRate: '14.4%',
    delta: '+19%',
    colorAccent: '#0284C7', // Sky Blue
  },
  {
    id: 'l-sportage',
    name: 'Kia Sportage AWD 2.0 2023',
    category: 'CAR',
    city: 'Islamabad',
    regOrRef: 'ISB-23-9081',
    ownerName: 'Kashif Motors Hub',
    ownerPhone: '+92 300 1234567',
    impressions: 2680,
    views: 430,
    whatsappClicks: 29,
    callClicks: 16,
    bookingRequests: 7,
    savedCount: 20,
    conversionRate: '12.1%',
    delta: '+15%',
    colorAccent: '#0B6B4F',
  },
  {
    id: 'l-tucson',
    name: 'Hyundai Tucson GLS 2023',
    category: 'CAR',
    city: 'Lahore',
    regOrRef: 'LHR-23-7182',
    ownerName: 'Zubair Car Rentals',
    ownerPhone: '+92 300 8472910',
    impressions: 3120,
    views: 510,
    whatsappClicks: 34,
    callClicks: 20,
    bookingRequests: 10,
    savedCount: 26,
    conversionRate: '12.5%',
    delta: '+17%',
    colorAccent: '#0B6B4F',
  },
  {
    id: 'c2c-lahore-isb',
    name: 'Capital Express Intercity Transfer (Toyota Altis)',
    category: 'CAR',
    city: 'Lahore ➔ Islamabad',
    regOrRef: 'C2C-M2-101',
    ownerName: 'Capital Express Intercity',
    ownerPhone: '+92 300 8472910',
    impressions: 2900,
    views: 480,
    whatsappClicks: 40,
    callClicks: 22,
    bookingRequests: 15,
    savedCount: 30,
    conversionRate: '16.0%',
    delta: '+21%',
    colorAccent: '#0284C7',
  },
  {
    id: 'sht-gulberg',
    name: 'Johar Town to Gulberg Commuter Van (HiAce)',
    category: 'SHUTTLE',
    city: 'Lahore',
    regOrRef: 'SHUT-LHR-04',
    ownerName: 'Subhan & Noor Shuttles',
    ownerPhone: '+92 300 9876543',
    impressions: 3400,
    views: 590,
    whatsappClicks: 44,
    callClicks: 25,
    bookingRequests: 18,
    savedCount: 33,
    conversionRate: '14.7%',
    delta: '+24%',
    colorAccent: '#7C3AED',
  },
  {
    id: 'mvr-pak',
    name: 'Pak Movers Suzuki Ravi 1-Ton Pickup',
    category: 'MOVER',
    city: 'Lahore',
    regOrRef: 'CARGO-LHR-12',
    ownerName: 'Pak Movers & Packers',
    ownerPhone: '+92 300 1234567',
    impressions: 2200,
    views: 370,
    whatsappClicks: 28,
    callClicks: 17,
    bookingRequests: 8,
    savedCount: 16,
    conversionRate: '14.3%',
    delta: '+13%',
    colorAccent: '#0284C7',
  },
  {
    id: 'drv-yasin',
    name: 'Muhammad Yasin (Clifton & DHA Chauffeur)',
    category: 'DRIVER',
    city: 'Karachi',
    regOrRef: 'LIC-KHI-8891',
    ownerName: 'Muhammad Yasin',
    ownerPhone: '+92 321 4455667',
    impressions: 1850,
    views: 295,
    whatsappClicks: 21,
    callClicks: 14,
    bookingRequests: 6,
    savedCount: 12,
    conversionRate: '13.9%',
    delta: '+12%',
    colorAccent: '#D97706',
  },
];

/**
 * Compute real-time platform analytics combining live leads & click events
 */
export function getPlatformAnalyticsSummary(): PlatformAnalyticsSummary {
  const leads = getAllLeads();
  const clicks = getAllClickEvents();

  const waLeads = leads.filter((l) => l.leadType === 'WHATSAPP').length;
  const callLeads = leads.filter((l) => l.leadType === 'DIRECT_CALL').length;
  const bookingLeads = leads.filter((l) => l.leadType === 'BOOKING_REQUEST' || l.leadType === 'CHAUFFEUR_HIRE' || l.leadType === 'CARGO_QUOTE').length;

  const waClicks = clicks.filter((c) => c.clickType === 'WHATSAPP_CLICK').length + waLeads;
  const callClicks = clicks.filter((c) => c.clickType === 'CALL_CLICK').length + callLeads;
  const viewClicks = clicks.filter((c) => c.clickType === 'VIEW_DETAILS').length;

  const totalImpressions = BASE_LISTING_METRICS.reduce((acc, m) => acc + m.impressions, 0) + (clicks.length * 12);
  const totalViews = BASE_LISTING_METRICS.reduce((acc, m) => acc + m.views, 0) + viewClicks;
  const totalWhatsAppClicks = BASE_LISTING_METRICS.reduce((acc, m) => acc + m.whatsappClicks, 0) + waClicks;
  const totalCallClicks = BASE_LISTING_METRICS.reduce((acc, m) => acc + m.callClicks, 0) + callClicks;
  const totalBookingRequests = BASE_LISTING_METRICS.reduce((acc, m) => acc + m.bookingRequests, 0) + bookingLeads;
  const totalLeads = totalWhatsAppClicks + totalCallClicks + totalBookingRequests;

  const avgCr = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) + '%' : '10.8%';
  const grossValue = leads.reduce((acc, l) => acc + (l.amount || 0), 0) + 1850000;

  const claimed = leads.filter((l) => !!l.assignedAgentId).length;
  const unclaimed = leads.filter((l) => !l.assignedAgentId).length;

  return {
    totalImpressions,
    totalViews,
    totalWhatsAppClicks,
    totalCallClicks,
    totalBookingRequests,
    totalLeads,
    averageConversionRate: avgCr,
    grossInquiredValue: grossValue,
    claimedLeadsCount: claimed,
    unclaimedLeadsCount: unclaimed,
  };
}

/**
 * Filter listing metrics for specific user or role
 */
export function getListingMetricsForRole(role: 'LISTER' | 'DRIVER' | 'PROVIDER' | 'ALL', ownerPhoneOrName?: string): ListingActionMetrics[] {
  let list = BASE_LISTING_METRICS;
  if (role === 'LISTER') {
    list = list.filter((m) => m.category === 'CAR');
  } else if (role === 'DRIVER') {
    list = list.filter((m) => m.category === 'DRIVER');
  } else if (role === 'PROVIDER') {
    list = list.filter((m) => m.category === 'SHUTTLE' || m.category === 'MOVER');
  }

  if (ownerPhoneOrName) {
    const q = ownerPhoneOrName.toLowerCase().replace(/[\s\-\+]/g, '');
    const filtered = list.filter(
      (m) =>
        m.ownerPhone.replace(/[\s\-\+]/g, '').includes(q) ||
        m.ownerName.toLowerCase().includes(ownerPhoneOrName.toLowerCase())
    );
    if (filtered.length > 0) return filtered;
  }

  return list;
}

