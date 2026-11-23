/**
 * SafarPK Tamper-Evident Chained Cryptographic Audit Logging Engine
 * OWASP ASVS Level 2+ / NIST SP 800-63B Compliant
 * 
 * Chains every audit log entry to the previous block via SHA-256 Merkle link:
 * current_hash = SHA-256(previous_hash || actor_id || action_type || created_at)
 * 
 * Target Table: `audit_logs` (REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC)
 */

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

export interface AuditEventParams {
  actorId?: string | null;
  actorRole: string;
  actionType: string;
  targetResource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  stateDelta?: Record<string, any> | null;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes SHA-256 hash string
 */
function computeHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Inserts a tamper-evident chained audit event into Neon PostgreSQL `audit_logs`
 */
export async function logAuditEvent(params: AuditEventParams): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn('AuditLog: DATABASE_URL not set; skipping database log');
      return { success: false, error: 'DATABASE_URL not set' };
    }

    const sql = neon(dbUrl);

    // 1. Fetch latest current_hash from audit_logs
    const lastRow = await sql`
      SELECT current_hash 
      FROM audit_logs 
      ORDER BY id DESC 
      LIMIT 1;
    `;

    const previousHash = lastRow.length > 0 && lastRow[0].current_hash ? lastRow[0].current_hash : GENESIS_HASH;
    const createdAt = new Date().toISOString();
    const actorIdStr = params.actorId || '00000000-0000-0000-0000-000000000000';

    // 2. Compute cryptographic chained hash: SHA-256(prev_hash || actor_id || action || timestamp)
    const payloadToHash = `${previousHash}||${actorIdStr}||${params.actionType}||${createdAt}`;
    const currentHash = computeHash(payloadToHash);

    // 3. Insert record into audit_logs
    const actorIdParam = params.actorId && /^[0-9a-f-]{36}$/i.test(params.actorId) ? params.actorId : null;
    const stateDeltaJson = params.stateDelta ? JSON.stringify(params.stateDelta) : null;

    await sql`
      INSERT INTO audit_logs (
        actor_id,
        actor_role,
        action_type,
        target_resource,
        resource_id,
        ip_address,
        user_agent,
        state_delta,
        previous_hash,
        current_hash,
        created_at
      ) VALUES (
        ${actorIdParam},
        ${params.actorRole || 'ANONYMOUS'},
        ${params.actionType},
        ${params.targetResource},
        ${params.resourceId || null},
        ${params.ipAddress && /^[0-9a-f.:]+$/i.test(params.ipAddress) ? params.ipAddress : null},
        ${params.userAgent || null},
        ${stateDeltaJson}::jsonb,
        ${previousHash},
        ${currentHash},
        ${createdAt}::timestamptz
      );
    `;

    return { success: true, hash: currentHash };
  } catch (err: any) {
    console.error('AuditLog insertion failure:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to insert audit log' };
  }
}
