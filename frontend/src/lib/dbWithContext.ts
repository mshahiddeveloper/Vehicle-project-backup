/**
 * SafarPK Enterprise Database Context Wrapper for Neon PostgreSQL 16
 * 
 * Implements Neon-adapted Row-Level Security (RLS) session context.
 * Sets `app.current_user_id` and `app.current_user_role` locally within an interactive transaction,
 * ensuring all subsequent queries in the callback strictly adhere to RLS policies.
 */

import { Pool, neon, neonConfig } from '@neondatabase/serverless';

neonConfig.disableWarningInBrowsers = true;

export type DbRole =
  | 'CUSTOMER'
  | 'LISTER'
  | 'DRIVER'
  | 'PROVIDER'
  | 'AGENT'
  | 'SUPER_ADMIN'
  | 'INTERNAL_SYSTEM'
  | 'ANONYMOUS';

let globalPool: Pool | null = null;

export function getDbPool(): Pool {
  if (!globalPool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not configured');
    }
    globalPool = new Pool({
      connectionString: dbUrl,
      max: 10,
    });
  }
  return globalPool;
}

export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(dbUrl);
}

/**
 * Executes an interactive query callback inside a transaction with PostgreSQL session variables
 * set for Row-Level Security enforcement:
 * - `app.current_user_id`
 * - `app.current_user_role`
 */
export async function withUserContext<T>(
  userId: string | null | undefined,
  role: DbRole = 'ANONYMOUS',
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const safeUserId = userId && /^[0-9a-f-]{36}$/i.test(userId) ? userId : '';
    const safeRole = role || 'ANONYMOUS';

    await client.query("SELECT set_config('app.current_user_id', $1, true)", [safeUserId]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [safeRole]);

    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}
