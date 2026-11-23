import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDatabaseConnectionInfo, getFluidComputePoolConfig } from '../src/lib/db';
import {
  getNeonStorageClient,
  uploadToNeonStorage,
  getNeonPresignedDownloadUrl,
  DEFAULT_BUCKET,
} from '../src/lib/neonStorage';
import { GET } from '../src/app/api/neon-health/route';

describe('Neon Services End-to-End Suite (Postgres & Object Storage)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.DATABASE_URL =
      'postgresql://neondb_owner:npg_G4uHT0rlXaoF@ep-fragrant-snow-a1l4e7yl-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require&pgbouncer=true';
    process.env.DATABASE_URL_UNPOOLED =
      'postgresql://neondb_owner:npg_G4uHT0rlXaoF@ep-fragrant-snow-a1l4e7yl.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
    process.env.AWS_ACCESS_KEY_ID = 'nak_live_62bc4cfb31214c03889fd6cf2f1e67cd';
    process.env.AWS_SECRET_ACCESS_KEY =
      'nsk_live_e37c94fad87c639669ecf6baf4248ada237dbedf1a5768b8650c37a13e65e20f';
    process.env.AWS_ENDPOINT_URL_S3 =
      'https://br-restless-glade-a1ogsfe6.storage.c-1.ap-southeast-1.aws.neon.tech';
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.NEON_OBJECT_STORAGE_BUCKET = 'assets';
  });

  describe('Neon Lakebase Postgres Connection Configuration', () => {
    it('detects pooled connection with pgbouncer=true', () => {
      const info = getDatabaseConnectionInfo();
      expect(info.isConfigured).toBe(true);
      expect(info.isPooled).toBe(true);
      expect(info.sslModeRequired).toBe(true);
      expect(info.host).toContain('neon.tech');
    });

    it('returns fluid compute horizontal scale config', () => {
      const config = getFluidComputePoolConfig();
      expect(config.maxConnections).toBe(1);
      expect(config.connectionTimeoutMillis).toBe(5000);
    });
  });

  describe('Neon Object Storage (S3-Compatible) Configuration', () => {
    it('initializes S3 client with path-style addressing and Neon endpoint', () => {
      const client = getNeonStorageClient();
      expect(client).toBeDefined();
      expect(client.config.forcePathStyle).toBe(true);
    });

    it('uses declared assets bucket as default', () => {
      expect(DEFAULT_BUCKET).toBe('assets');
    });

    it('generates a valid presigned download URL with signature', async () => {
      const presignedUrl = await getNeonPresignedDownloadUrl({
        key: 'documents/cnic_sample.jpg',
        bucket: 'assets',
        expiresInSeconds: 1800,
      });

      expect(presignedUrl).toContain('https://');
      expect(presignedUrl).toContain('assets/documents/cnic_sample.jpg');
      expect(presignedUrl).toContain('X-Amz-Signature');
      expect(presignedUrl).toContain('X-Amz-Credential');
    });
  });

  describe('Neon Health Check API Route (/api/neon-health)', () => {
    it('returns structured service status for postgres and object storage', async () => {
      const res = await GET();
      expect(res.status).toBeDefined();
      const body = await res.json();
      expect(body.services).toBeDefined();
      expect(body.services.postgres).toBeDefined();
      expect(body.services.objectStorage).toBeDefined();
      expect(body.services.objectStorage.bucket).toBe('assets');
    });
  });
});
