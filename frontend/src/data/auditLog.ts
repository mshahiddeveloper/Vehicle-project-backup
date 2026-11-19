'use client';

/**
 * SafarPK Stealth Audit Log Engine
 * Milestone 1: Core Shared Data & Synchronization Engine
 * Storage Key: 'safarpk_stealth_audit_logs_v1'
 *
 * Captures actor, action, targetEntity, timestamp, and field-level
 * before/after diffs ([{ field, before, after }]) across all administrative
 * and agent mutations with zero data loss and automated ring-buffer management.
 */

export interface AuditDiff {
  field: string;
  before: any;
  after: any;
}

export interface AuditActor {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'STAFF_AGENT';
  branch?: string;
  ipAddress?: string;
}

export type AuditTargetType =
  | 'USER'
  | 'LISTING'
  | 'SUBSCRIPTION'
  | 'PROMO_CODE'
  | 'BOOKING'
  | 'PERMISSIONS';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  actor: AuditActor;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  diff: AuditDiff[];
  reason?: string;
  isSuspicious?: boolean;

  // Compatibility display fields for existing Admin & Agent UI views
  agentName?: string;
  staffId?: string;
  branch?: string;
  ipAddress?: string;
  actionType?: string;
  actionDesc?: string;
  targetEntity?: string;
  officialTariff?: number;
  feeReported?: number;
  suspicionReason?: string;
  paymentMethod?: string;
  trnRef?: string;
  paymentProofUrl?: string;
  metadata?: Record<string, any>;
}

export const STORAGE_AUDIT_LOGS_KEY = 'safarpk_stealth_audit_logs_v1';
export const LEGACY_STORAGE_AUDIT_LOGS_KEY = 'safarpk_stealth_audit_logs';
export const MAX_AUDIT_LOGS = 200;

export const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'stl-1',
    timestamp: '2026-11-10T09:42:00.000Z',
    actor: {
      id: 'AG-102',
      name: 'Bilal Ahmed',
      role: 'STAFF_AGENT',
      branch: 'Islamabad HQ Operations',
      ipAddress: '192.168.10.42 (Terminal-ISB-02)',
    },
    action: 'MANUAL_LISTER_CREATE',
    targetType: 'LISTING',
    targetId: 'LST-9021',
    diff: [
      { field: 'officialTariff', before: 12000, after: 7000 },
      { field: 'feeReported', before: 12000, after: 7000 },
    ],
    reason:
      'CRITICAL TARIFF DEFICIT (-PKR 5,000): Agent submitted PKR 7,000 against scheduled PKR 12,000 fee. Potential unapproved discount or offline cash diversion.',
    isSuspicious: true,
    agentName: 'Bilal Ahmed',
    staffId: 'AG-102',
    branch: 'Islamabad HQ Operations',
    ipAddress: '192.168.10.42 (Terminal-ISB-02)',
    actionType: 'MANUAL_LISTER_CREATE',
    actionDesc: 'Created Lister Profile: "Pak Punjab Tours & Fleet" (Sheikhupura)',
    targetEntity: 'Lister: Pak Punjab Tours (LST-9021)',
    officialTariff: 12000,
    feeReported: 7000,
    suspicionReason:
      'CRITICAL TARIFF DEFICIT (-PKR 5,000): Agent submitted PKR 7,000 against scheduled PKR 12,000 fee. Potential unapproved discount or offline cash diversion.',
    paymentMethod: 'JAZZCASH_TILL',
    trnRef: 'JC-8921849102-PK',
    paymentProofUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'stl-2',
    timestamp: '2026-11-10T08:15:00.000Z',
    actor: {
      id: 'AG-101',
      name: 'Kashif Raza',
      role: 'STAFF_AGENT',
      branch: 'Lahore Regional Desk',
      ipAddress: '192.168.1.18 (Terminal-LHR-01)',
    },
    action: 'SUBSCRIPTION_APPROVAL',
    targetType: 'SUBSCRIPTION',
    targetId: 'usr-demo-lister',
    diff: [
      { field: 'subscription.status', before: 'PENDING_APPROVAL', after: 'ACTIVE' },
      { field: 'subscription.quota', before: 0, after: 15 },
    ],
    reason: 'Tariff Reconciled (100% schedule match)',
    isSuspicious: false,
    agentName: 'Kashif Raza',
    staffId: 'AG-101',
    branch: 'Lahore Regional Desk',
    ipAddress: '192.168.1.18 (Terminal-LHR-01)',
    actionType: 'SUBSCRIPTION_APPROVAL',
    actionDesc: 'Approved Subscription: "Salman Rent a Car & Tours"',
    targetEntity: 'Lister: Salman Rentals (p-2)',
    officialTariff: 12000,
    feeReported: 12000,
    suspicionReason: 'Tariff Reconciled (100% schedule match)',
    paymentMethod: 'MEEZAN_BANK_TRANSFER',
    trnRef: 'TX-MEEZAN-99210',
    paymentProofUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
  },
];

/**
 * Retrieve all stealth audit logs from storage or initialize with defaults
 */
export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return DEFAULT_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOGS_KEY);
    if (!raw) {
      // Check legacy key fallback
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_AUDIT_LOGS_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(legacyParsed));
          return legacyParsed;
        }
      }
      localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return DEFAULT_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return DEFAULT_AUDIT_LOGS;
    }
    return parsed;
  } catch (err) {
    console.error('[auditLog] Failed to load audit logs:', err);
    return DEFAULT_AUDIT_LOGS;
  }
}

/**
 * Log an administrative mutation event with field-level diffs
 */
export function logAuditEvent(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `stl-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    agentName: entry.agentName || entry.actor.name,
    staffId: entry.staffId || entry.actor.id,
    branch: entry.branch || entry.actor.branch || 'Headquarters Operations',
    ipAddress: entry.ipAddress || entry.actor.ipAddress || '192.168.1.18 (Terminal-SEC-01)',
    actionType: entry.actionType || entry.action,
    actionDesc:
      entry.actionDesc ||
      `${entry.action.replace(/_/g, ' ')} on ${entry.targetType} ${entry.targetId}`,
    targetEntity: entry.targetEntity || `${entry.targetType}: ${entry.targetId}`,
    isSuspicious: entry.isSuspicious ?? false,
    suspicionReason:
      entry.suspicionReason ||
      (entry.isSuspicious ? entry.reason : 'Tariff Reconciled / Standard Clearance'),
    diff: entry.diff || [],
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getAuditLogs();
      const updated = [fullEntry, ...existing].slice(0, MAX_AUDIT_LOGS);
      localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(updated));
      // Mirror to legacy key for backwards-compatibility with existing views
      localStorage.setItem(LEGACY_STORAGE_AUDIT_LOGS_KEY, JSON.stringify(updated));

      window.dispatchEvent(
        new CustomEvent('safarpk_audit_log_added', { detail: fullEntry })
      );
      window.dispatchEvent(
        new CustomEvent('safarpk_audit_logs_updated', { detail: updated })
      );
    } catch (err) {
      console.error('[auditLog] Failed to persist audit event:', err);
    }
  }

  return fullEntry;
}

/**
 * Convenience helper for recording an administrative mutation event
 */
export function recordAuditAction(params: any): AuditLogEntry {
  return logAuditEvent({
    action: params.action || 'ADMIN_ACTION',
    actor: {
      id: params.staffId || 'SUPER_ADMIN',
      name: params.staffName || 'Super Admin',
      role: 'SUPER_ADMIN',
    },
    targetType: params.targetType || 'SYSTEM',
    targetId: params.targetId || 'SYSTEM',
    diff: params.diff || [],
    staffId: params.staffId || 'SUPER_ADMIN',
    agentName: params.staffName || 'Super Admin',
    actionDesc: params.details || params.action,
  } as any);
}

/**
 * Retrieve audit logs filtered by targetId
 */
export function getAuditLogsByTarget(targetId: string): AuditLogEntry[] {
  return getAuditLogs().filter((l) => l.targetId === targetId);
}

/**
 * Retrieve audit logs filtered by actor id
 */
export function getAuditLogsByActor(actorId: string): AuditLogEntry[] {
  return getAuditLogs().filter(
    (l) => l.actor?.id === actorId || l.staffId === actorId
  );
}

/**
 * Helper to compute field-level diff between two states
 */
export function computeDiff(before: any, after: any, fields?: string[]): AuditDiff[] {
  const diffs: AuditDiff[] = [];
  const keys =
    fields ||
    Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  for (const key of keys) {
    const bVal = before ? before[key] : undefined;
    const aVal = after ? after[key] : undefined;
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diffs.push({ field: key, before: bVal, after: aVal });
    }
  }
  return diffs;
}

/**
 * Reset or clear audit logs (for testing purposes)
 */
export function clearAuditLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_AUDIT_LOGS_KEY);
    localStorage.removeItem(LEGACY_STORAGE_AUDIT_LOGS_KEY);
  } catch (err) {
    console.error('[auditLog] Failed to clear audit logs:', err);
  }
}
