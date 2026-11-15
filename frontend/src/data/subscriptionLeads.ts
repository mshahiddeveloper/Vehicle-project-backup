'use client';

import { RegisteredUser, getAllRegisteredUsers, saveAllRegisteredUsers } from './userAuth';

export type SubscriptionLeadStatus =
  | 'NEW'
  | 'CONTACTED_INTERESTED'
  | 'FOLLOW_UP_SCHEDULED'
  | 'PAYMENT_PROMISED'
  | 'CONVERTED'
  | 'NOT_INTERESTED';

export interface SubscriptionFollowUpNote {
  id: string;
  timestamp: string;
  agentName: string;
  note: string;
  statusChange?: SubscriptionLeadStatus;
}

export interface SubscriptionLeadRecord {
  userId: string;
  status: SubscriptionLeadStatus;
  assignedAgentName?: string;
  lastContactedAt?: string;
  followUpDate?: string;
  recommendedPlan?: string;
  notes: SubscriptionFollowUpNote[];
}

export interface SubscriptionLeadItem {
  user: RegisteredUser;
  record: SubscriptionLeadRecord;
}

const SETTINGS_KEY = 'safarpk_subscription_followup_enabled';
const RECORDS_KEY = 'safarpk_subscription_lead_records';

/**
 * Checks if the Subscription Follow-up Desk is enabled.
 * Default is TRUE (enabled by default as requested by user).
 * Super Admin can toggle it on or off to hide from agents.
 */
export function isSubscriptionFollowUpEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(SETTINGS_KEY);
    if (val === null) return true; // Enabled by default!
    return val !== 'false';
  } catch (e) {
    return true;
  }
}

/**
 * Super Admin toggles subscription follow-up access for agents
 */
export function setSubscriptionFollowUpEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, String(enabled));
    window.dispatchEvent(new Event('safarpk_settings_updated'));
    window.dispatchEvent(new Event('safarpk_subscription_followup_toggle'));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Retrieve all persistent follow-up records
 */
export function getAllSubscriptionLeadRecords(): Record<string, SubscriptionLeadRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const val = localStorage.getItem(RECORDS_KEY);
    if (!val) return {};
    return JSON.parse(val);
  } catch (e) {
    return {};
  }
}

/**
 * Save or update follow-up record for a user
 */
export function saveSubscriptionLeadRecord(
  userId: string,
  update: Partial<SubscriptionLeadRecord>
): SubscriptionLeadRecord {
  const all = getAllSubscriptionLeadRecords();
  const existing = all[userId] || {
    userId,
    status: 'NEW',
    notes: [],
  };

  const updated: SubscriptionLeadRecord = {
    ...existing,
    ...update,
    userId,
  };

  all[userId] = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('safarpk_subscription_leads_updated'));
    } catch (e) {
      console.error(e);
    }
  }

  return updated;
}

/**
 * Log a new note or call for a subscription lead
 */
export function addSubscriptionLeadNote(
  userId: string,
  noteText: string,
  agentName: string,
  newStatus?: SubscriptionLeadStatus,
  followUpDate?: string
): SubscriptionLeadRecord {
  const all = getAllSubscriptionLeadRecords();
  const existing = all[userId] || {
    userId,
    status: 'NEW',
    notes: [],
  };

  const noteEntry: SubscriptionFollowUpNote = {
    id: `note-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentName,
    note: noteText,
    statusChange: newStatus,
  };

  const updatedStatus = newStatus || existing.status;

  const updated: SubscriptionLeadRecord = {
    ...existing,
    status: updatedStatus,
    assignedAgentName: agentName,
    lastContactedAt: new Date().toISOString(),
    followUpDate: followUpDate || existing.followUpDate,
    notes: [noteEntry, ...(existing.notes || [])],
  };

  all[userId] = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('safarpk_subscription_leads_updated'));
    } catch (e) {
      console.error(e);
    }
  }

  return updated;
}

/**
 * Returns all registered users who have created an account but not activated/purchased a subscription
 */
export function getSubscriptionFollowUpLeads(users: RegisteredUser[]): SubscriptionLeadItem[] {
  const records = getAllSubscriptionLeadRecords();

  // Filter users who registered as Lister, Driver, or Provider but have status === 'UNSUBSCRIBED' or not active
  const unsubscribedUsers = users.filter((u) => {
    // Only commercial roles need subscriptions (Customers, Agents, and Super Admin don't need lister plans)
    if (u.role === 'CUSTOMER' || u.role === 'AGENT' || u.role === 'SUPER_ADMIN') {
      return false;
    }
    const status = u.subscription?.status;
    return status === 'UNSUBSCRIBED' || !status;
  });

  return unsubscribedUsers.map((user) => {
    const record = records[user.id] || {
      userId: user.id,
      status: 'NEW',
      notes: [],
    };
    return { user, record };
  });
}

/**
 * Generate a prefilled WhatsApp link with professional onboarding message for this lead
 */
export function generateWhatsAppOnboardingUrl(user: RegisteredUser, agentName: string): string {
  const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.replace(/^0/, '92');

  const roleName =
    user.role === 'LISTER'
      ? 'Car Rental Fleet Host'
      : user.role === 'DRIVER'
      ? 'Private Chauffeur'
      : user.providerSubtype === 'PICK_AND_DROP'
      ? 'Daily Shuttle Operator'
      : 'Home Shifting & Cargo Carrier';

  const text =
    `Assalam-o-Alaikum ${user.name}!\n\n` +
    `I am ${agentName} from the SafarPK Onboarding Team. We noticed you recently registered your profile (*${user.businessName || user.name}*) as a ${roleName} in ${user.city}.\n\n` +
    `Your profile is ready, but your subscription is not yet active. Activating your plan unlocks:\n` +
    `• Instant LIVE publication of your vehicles & services\n` +
    `• Direct WhatsApp inquiries and phone calls from verified customers\n` +
    `• Zero commission — pay the monthly subscription and keep 100% of your earnings\n\n` +
    `Would you like me to guide you through activating your package via Bank Transfer, JazzCash, or Easypaisa?`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

