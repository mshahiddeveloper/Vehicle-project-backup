/**
 * SafarPK Enterprise Listing Quota Enforcement Engine
 * OWASP ASVS Level 2+ Compliant
 * 
 * Enforces atomic subscription quota check & reservation inside PostgreSQL transactions:
 * - Checks status = 'ACTIVE'
 * - Checks current_used_quota < max_quota using SELECT ... FOR UPDATE
 * - Increments current_used_quota atomically upon publishing
 */

import { withUserContext } from './dbWithContext';

export interface QuotaCheckResult {
  allowed: boolean;
  currentQuota?: number;
  maxQuota?: number;
  error?: string;
}

/**
 * Validates and atomically increments subscription quota inside a transaction
 */
export async function assertAndConsumeListingQuota(
  ownerId: string,
  txClient: any
): Promise<QuotaCheckResult> {
  const subRows = await txClient.query(
    `SELECT id, status, max_quota, current_used_quota
     FROM user_subscriptions
     WHERE user_id = $1 AND status = 'ACTIVE'
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [ownerId]
  );

  if (subRows.rows.length === 0) {
    return {
      allowed: false,
      error: 'Active subscription required to publish vehicle listings. Please activate a package in the Subscription tab.',
    };
  }

  const sub = subRows.rows[0];
  if (sub.current_used_quota >= sub.max_quota) {
    return {
      allowed: false,
      currentQuota: sub.current_used_quota,
      maxQuota: sub.max_quota,
      error: `Listing quota exceeded (${sub.current_used_quota}/${sub.max_quota}). Upgrade your subscription package to publish additional fleet vehicles.`,
    };
  }

  // Atomically increment quota
  await txClient.query(
    `UPDATE user_subscriptions
     SET current_used_quota = current_used_quota + 1
     WHERE id = $1`,
    [sub.id]
  );

  return {
    allowed: true,
    currentQuota: sub.current_used_quota + 1,
    maxQuota: sub.max_quota,
  };
}

/**
 * Checks current subscription quota without incrementing
 */
export async function checkCurrentSubscriptionQuota(
  ownerId: string,
  txClient: any
): Promise<QuotaCheckResult> {
  const subRows = await txClient.query(
    `SELECT id, status, max_quota, current_used_quota
     FROM user_subscriptions
     WHERE user_id = $1 AND status = 'ACTIVE'
     ORDER BY created_at DESC
     LIMIT 1`,
    [ownerId]
  );

  if (subRows.rows.length === 0) {
    return {
      allowed: false,
      error: 'No active subscription found.',
    };
  }

  const sub = subRows.rows[0];
  return {
    allowed: sub.current_used_quota < sub.max_quota,
    currentQuota: sub.current_used_quota,
    maxQuota: sub.max_quota,
  };
}
