/**
 * SafarPK Serverless Database Connection Utility
 * Configured for Neon PostgreSQL 16 on Vercel Fluid Compute
 * 
 * Provides:
 * 1. Connection string validation ensuring required parameters for serverless Neon:
 *    - sslmode=require (Mandatory for Neon encrypted communication)
 *    - pgbouncer=true (Required for Prisma/PgBouncer transaction-mode pooling)
 * 2. Diagnostics utility to inspect connection pooling health on Vercel Fluid Compute.
 */

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

