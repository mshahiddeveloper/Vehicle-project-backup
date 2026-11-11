'use client';

import { incrementUserMetrics, logUserActivity, getAllRegisteredUsers } from './userAuth';

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

const STORAGE_LEADS_KEY = 'safarpk_marketplace_leads_v2';
const STORAGE_CLICKS_KEY = 'safarpk_click_events_v2';

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

/**
 * Record a new lead (WhatsApp, Call, Booking Form)
 */
export function recordLead(leadData: Omit<MarketplaceLead, 'id' | 'createdAt' | 'status'>): MarketplaceLead {
  const newLead: MarketplaceLead = {
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 900)}`,
    status: 'NEW',
    createdAt: new Date().toISOString(),
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
    const owner = allUsers.find((u) => u.phone.replace(/[\s\-\(\)]/g, '').endsWith(cleanPhone) || cleanPhone.endsWith(u.phone.replace(/[\s\-\(\)]/g, '')));
    if (owner) resolvedOwnerId = owner.id;
  }

  if (resolvedOwnerId) {
    incrementUserMetrics(resolvedOwnerId, 'leadsCount');
    incrementUserMetrics(resolvedOwnerId, 'clickCount');
    logUserActivity(resolvedOwnerId, {
      type: 'LEAD_RECEIVED',
      title: `New Lead: ${leadData.leadType}`,
      description: `${leadData.customerName} (${leadData.customerPhone}) contacted regarding "${leadData.targetTitle}"`,
      meta: newLead,
    });
  }

  // Also log as a click event
  recordClickEvent({
    clickType: leadData.leadType === 'WHATSAPP' ? 'WHATSAPP_CLICK' : leadData.leadType === 'DIRECT_CALL' ? 'CALL_CLICK' : 'BOOKING_CLICK',
    targetId: leadData.targetId,
    targetTitle: leadData.targetTitle,
    targetCategory: leadData.targetRole,
    targetOwnerId: resolvedOwnerId,
    targetOwnerName: leadData.targetOwnerName,
    city: leadData.customerCity,
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
 */
export function recordClickEvent(eventData: Omit<MarketplaceClickEvent, 'id' | 'timestamp'>): MarketplaceClickEvent {
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
    } catch (e) {}
  }

  if (eventData.targetOwnerId) {
    incrementUserMetrics(eventData.targetOwnerId, 'clickCount');
    if (eventData.clickType === 'VIEW_DETAILS') {
      incrementUserMetrics(eventData.targetOwnerId, 'viewCount');
    }
  }

  return newEvent;
}

/**
 * Update lead status or assign to an agent
 */
export function updateLead(leadId: string, updates: Partial<MarketplaceLead>): MarketplaceLead | null {
  const leads = getAllLeads();
  const idx = leads.findIndex((l) => l.id === leadId);
  if (idx === -1) return null;

  leads[idx] = { ...leads[idx], ...updates };
  saveAllLeads(leads);
  return leads[idx];
}
