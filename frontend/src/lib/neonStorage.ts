/**
 * SafarPK Neon Object Storage Client Utility
 * S3-compatible storage integrated with Lakebase Postgres branching
 * 
 * Configured per Neon Object Storage best practices:
 * - forcePathStyle: true (required for Neon S3 API)
 * - SigV4 authentication
 * - Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const DEFAULT_BUCKET = process.env.NEON_OBJECT_STORAGE_BUCKET || 'assets';

/**
 * Creates and returns the S3 client configured for Neon Object Storage
 */
export function getNeonStorageClient(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Neon Object Storage is not configured. Missing AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, or AWS_SECRET_ACCESS_KEY.'
    );
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // Mandatory for Neon Object Storage
  });
}

/**
 * Uploads a buffer or string to Neon Object Storage
 */
export async function uploadToNeonStorage(options: {
  key: string;
  buffer: Buffer | Uint8Array | string;
  contentType?: string;
  bucket?: string;
}): Promise<{
  success: boolean;
  key: string;
  bucket: string;
  url: string;
  error?: string;
}> {
  const bucket = options.bucket || DEFAULT_BUCKET;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3?.replace(/\/$/, '') || '';

  try {
    const s3 = getNeonStorageClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: options.key,
      Body: typeof options.buffer === 'string' ? Buffer.from(options.buffer) : options.buffer,
      ContentType: options.contentType || 'application/octet-stream',
    });

    await s3.send(command);

    const publicUrl = `${endpoint}/${bucket}/${options.key}`;

    return {
      success: true,
      key: options.key,
      bucket,
      url: publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      key: options.key,
      bucket,
      url: '',
      error: err?.message || 'Failed to upload to Neon Object Storage',
    };
  }
}

/**
 * Generates a presigned URL for private bucket objects
 */
export async function getNeonPresignedDownloadUrl(options: {
  key: string;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const bucket = options.bucket || DEFAULT_BUCKET;
  const expiresIn = options.expiresInSeconds || 3600; // 1 hour default

  const s3 = getNeonStorageClient();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: options.key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Pings / tests Neon Object Storage connectivity
 */
export async function testNeonStorageConnection(): Promise<{
  connected: boolean;
  bucket: string;
  objectCount?: number;
  error?: string;
}> {
  const bucket = DEFAULT_BUCKET;
  try {
    const s3 = getNeonStorageClient();
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 5,
    });
    const result = await s3.send(command);
    return {
      connected: true,
      bucket,
      objectCount: result.KeyCount || 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      bucket,
      error: err?.message || 'Failed to connect to Neon Object Storage',
    };
  }
}
