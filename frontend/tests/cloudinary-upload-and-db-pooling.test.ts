import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageMagicBytes,
  validateUploadFolder,
  sanitizeUploadFilename,
  generateSignedUploadParams,
  uploadToCloudinary,
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_FOLDERS,
} from '../src/lib/cloudinary';
import { getDatabaseConnectionInfo, getFluidComputePoolConfig } from '../src/lib/db';
import { GET, POST } from '../src/app/api/upload/route';
import { sealUserSession } from '../src/lib/cryptoVault';
import { NextRequest } from 'next/server';

describe('SafarPK Cloudinary & Neon Production Architecture Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. OWASP ASVS Binary Inspection (Magic Bytes)
  // ---------------------------------------------------------------------------
  describe('OWASP ASVS Magic Byte Verification', () => {
    it('accepts authentic JPEG header (FF D8 FF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const result = validateImageMagicBytes(jpegBuffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
    });

    it('accepts authentic PNG header (89 50 4E 47 0D 0A 1A 0A)', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const result = validateImageMagicBytes(pngBuffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
    });

    it('accepts authentic WebP header (RIFF....WEBP)', () => {
      // 52 49 46 46 (RIFF), 4 bytes size, 57 45 42 50 (WEBP)
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // length
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const result = validateImageMagicBytes(webpBuffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
    });

    it('strictly REJECTS SVG files to prevent stored XSS attacks', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const result = validateImageMagicBytes(svgBuffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Only authentic JPEG, PNG, and WebP');
    });

    it('strictly REJECTS executable binaries & polyglot shells', () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]); // MZ DOS header
      const result = validateImageMagicBytes(exeBuffer);
      expect(result.valid).toBe(false);
    });

    it('rejects buffers shorter than 12 bytes', () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8, 0xff]);
      const result = validateImageMagicBytes(tinyBuffer);
      expect(result.valid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Folder Whitelist & Sanitization
  // ---------------------------------------------------------------------------
  describe('Structured Folder Security & Sanitization', () => {
    it('allows all approved vertical folders', () => {
      expect(validateUploadFolder('safarpk/vehicles')).toBe(true);
      expect(validateUploadFolder('safarpk/documents')).toBe(true);
      expect(validateUploadFolder('safarpk/profiles')).toBe(true);
    });

    it('rejects unapproved or path traversal folders', () => {
      expect(validateUploadFolder('../../../etc/passwd')).toBe(false);
      expect(validateUploadFolder('safarpk/admin_secrets')).toBe(false);
      expect(validateUploadFolder('')).toBe(false);
      expect(validateUploadFolder(null)).toBe(false);
    });

    it('sanitizes dangerous characters in upload filenames', () => {
      const clean = sanitizeUploadFilename('../../../hacker%20payload;rm -rf.jpg');
      expect(clean).not.toContain('..');
      expect(clean).not.toContain(' ');
      expect(clean).not.toContain(';');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Signed Upload Parameters
  // ---------------------------------------------------------------------------
  describe('Cloudinary Signed Upload Tokens', () => {
    it('generates valid signed upload parameters for approved folders', () => {
      const signed = generateSignedUploadParams('safarpk/vehicles');
      expect(signed.cloudName).toBeDefined();
      expect(signed.apiKey).toBeDefined();
      expect(signed.timestamp).toBeGreaterThan(0);
      expect(signed.signature).toBeDefined();
      expect(signed.signature.length).toBeGreaterThan(10);
      expect(signed.folder).toBe('safarpk/vehicles');
    });

    it('throws error when generating signature for invalid folder', () => {
      expect(() => generateSignedUploadParams('invalid/folder' as any)).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Server-Side Upload Utility
  // ---------------------------------------------------------------------------
  describe('Server-Side Upload Function', () => {
    it('uploads valid image buffer and returns WebP optimized URL', async () => {
      const validJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
      ]);

      const res = await uploadToCloudinary({
        buffer: validJpeg,
        folder: 'safarpk/vehicles',
        filename: 'toyota_corolla.jpg',
      });

      expect(res.success).toBe(true);
      expect(res.format).toBe('webp');
      expect(res.secureUrl).toContain('res.cloudinary.com');
      expect(res.secureUrl).toContain('f_auto,q_auto');
      expect(res.folder).toBe('safarpk/vehicles');
    });

    it('rejects buffer exceeding 5MB cap', async () => {
      // 5MB + 1 byte
      const largeBuffer = Buffer.alloc(MAX_UPLOAD_SIZE_BYTES + 1);
      // Give it a valid JPEG header
      largeBuffer[0] = 0xff;
      largeBuffer[1] = 0xd8;
      largeBuffer[2] = 0xff;

      const res = await uploadToCloudinary({
        buffer: largeBuffer,
        folder: 'safarpk/documents',
        filename: 'large_cnic.jpg',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('exceeds the 5MB limit');
    });

    it('rejects buffer with invalid magic bytes', async () => {
      const fakeBuffer = Buffer.from('this is just plain text content not an image header');
      const res = await uploadToCloudinary({
        buffer: fakeBuffer,
        folder: 'safarpk/profiles',
        filename: 'avatar.png',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Only authentic JPEG, PNG, and WebP');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Neon PostgreSQL 16 Connection Pooling Configuration
  // ---------------------------------------------------------------------------
  describe('Neon Connection Pooling Configuration', () => {
    it('correctly identifies pooled Neon connection string with pgbouncer=true', () => {
      process.env.DATABASE_URL =
        'postgresql://neondb_owner:secret@ep-demo-pooler.ap-southeast-1.aws.neon.tech/safarpk?sslmode=require&pgbouncer=true';

      const info = getDatabaseConnectionInfo();
      expect(info.isConfigured).toBe(true);
      expect(info.isPooled).toBe(true);
      expect(info.sslModeRequired).toBe(true);
      expect(info.host).toBe('ep-demo-pooler.ap-southeast-1.aws.neon.tech');
      expect(info.database).toBe('safarpk');
    });

    it('detects unpooled connection if pgbouncer is missing', () => {
      process.env.DATABASE_URL =
        'postgresql://neondb_owner:secret@ep-demo.ap-southeast-1.aws.neon.tech/safarpk?sslmode=require';

      const info = getDatabaseConnectionInfo();
      expect(info.isConfigured).toBe(true);
      expect(info.isPooled).toBe(false);
    });

    it('provides Vercel Fluid Compute horizontal scaling pool configuration', () => {
      const poolConfig = getFluidComputePoolConfig();
      expect(poolConfig.maxConnections).toBe(1);
      expect(poolConfig.connectionTimeoutMillis).toBe(5000);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Next.js App Router API Route /api/upload
  // ---------------------------------------------------------------------------
  describe('/api/upload Route Handler', () => {
    const validJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    ]);

    it('GET /api/upload returns 401 Unauthorized for unauthenticated requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/upload');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/upload returns signed parameters for authenticated users', async () => {
      const session = sealUserSession({ id: 'usr_123', role: 'LISTER' });
      const req = new NextRequest('http://localhost:3000/api/upload?folder=safarpk/vehicles', {
        headers: {
          authorization: `Bearer ${session}`,
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.signature).toBeDefined();
      expect(json.data.folder).toBe('safarpk/vehicles');
    });

    it('POST /api/upload returns 401 Unauthorized for unauthenticated upload', async () => {
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('POST /api/upload rejects non-multipart requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_test_1',
          'content-type': 'text/plain',
        },
        body: 'invalid body',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('POST /api/upload rejects invalid folder', async () => {
      const formData = new FormData();
      const blob = new Blob([validJpeg], { type: 'image/jpeg' });
      formData.append('file', blob, 'car.jpg');
      formData.append('folder', 'unauthorized/hacker_folder');

      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_test_1',
        },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid folder');
    });

    it('POST /api/upload rejects invalid file format / corrupted magic bytes', async () => {
      const formData = new FormData();
      const fakeBlob = new Blob(['malicious executable or script'], { type: 'image/jpeg' });
      formData.append('file', fakeBlob, 'shell.jpg');
      formData.append('folder', 'safarpk/vehicles');

      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_test_1',
        },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toContain('Only authentic JPEG, PNG, and WebP');
    });

    it('POST /api/upload successfully processes authentic JPEG upload for authenticated user', async () => {
      const formData = new FormData();
      const validBlob = new Blob([validJpeg], { type: 'image/jpeg' });
      formData.append('file', validBlob, 'corolla.jpg');
      formData.append('folder', 'safarpk/vehicles');

      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'x-user-id': 'usr_test_1',
        },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.format).toBe('webp');
      expect(json.folder).toBe('safarpk/vehicles');
      expect(json.secureUrl).toContain('res.cloudinary.com');
    });
  });
});
