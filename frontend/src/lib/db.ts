/**
 * SafarPK Serverless Database Connection Utility
 * Configured for Neon PostgreSQL 16 on Vercel Fluid Compute
 * 
 * Best Practices:
 * - Uses `@neondatabase/serverless` for HTTP one-shot queries and connectionless pooling.
 * - Supports pooled connection string (with pgbouncer=true) for serverless route handlers.
 * - Provides connection health test and diagnostics.
 */

import { neon, neonConfig } from '@neondatabase/serverless';

// Suppress browser direct-query warning in Next.js Server Components / Route Handlers
neonConfig.disableWarningInBrowsers = true;

export interface DatabaseConnectionInfo {
  isConfigured: boolean;
  isPooled: boolean;
  sslModeRequired: boolean;
  host?: string;
  database?: string;
}

/**
 * Validates Neon PostgreSQL 16 connection string configuration
 */
export function getDatabaseConnectionInfo(): DatabaseConnectionInfo {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return {
      isConfigured: false,
      isPooled: false,
      sslModeRequired: false,
    };
  }

  const isPooled = dbUrl.includes('pgbouncer=true') || dbUrl.includes('-pooler.');
  const sslModeRequired = dbUrl.includes('sslmode=require');

  try {
    const url = new URL(dbUrl.replace(/^postgresql:\/\//, 'http://'));
    return {
      isConfigured: true,
      isPooled,
      sslModeRequired,
      host: url.hostname,
      database: url.pathname.replace(/^\//, ''),
    };
  } catch {
    return {
      isConfigured: true,
      isPooled,
      sslModeRequired,
    };
  }
}

let cachedSqlClient: ReturnType<typeof neon> | null = null;

/**
 * Returns a cached Neon Serverless HTTP query client (optimized for Vercel Fluid Compute)
 */
export function getNeonSqlClient() {
  if (cachedSqlClient) return cachedSqlClient;
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment.');
  }
  cachedSqlClient = neon(connectionString);
  return cachedSqlClient;
}

/**
 * Health check to test live connection to Neon PostgreSQL
 */
export async function testNeonDatabaseConnection(): Promise<{
  connected: boolean;
  version?: string;
  tablesCount?: number;
  error?: string;
}> {
  try {
    const sql = getNeonSqlClient();
    const versionResult = await sql`SELECT version() as pg_version`;
    const tablesResult = await sql`
      SELECT count(*)::int as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    return {
      connected: true,
      version: versionResult[0]?.pg_version,
      tablesCount: tablesResult[0]?.count,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Failed to query Neon PostgreSQL database',
    };
  }
}

/**
 * Returns connection options optimized for Vercel Fluid Compute
 */
export function getFluidComputePoolConfig() {
  return {
    maxConnections: 1, // Fluid compute serverless lambdas scale horizontally; keep pool at 1 per instance
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  };
}
