import { NextResponse } from 'next/server';
import { testNeonDatabaseConnection, getDatabaseConnectionInfo } from '@/lib/db';
import { testNeonStorageConnection } from '@/lib/neonStorage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const dbInfo = getDatabaseConnectionInfo();
  const dbHealth = await testNeonDatabaseConnection();
  const storageHealth = await testNeonStorageConnection();

  const allHealthy = dbHealth.connected && storageHealth.connected;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        postgres: {
          connected: dbHealth.connected,
          isPooled: dbInfo.isPooled,
          host: dbInfo.host,
          database: dbInfo.database,
          version: dbHealth.version,
          tablesCount: dbHealth.tablesCount,
          error: dbHealth.error,
        },
        objectStorage: {
          connected: storageHealth.connected,
          bucket: storageHealth.bucket,
          objectCount: storageHealth.objectCount,
          error: storageHealth.error,
        },
      },
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}

