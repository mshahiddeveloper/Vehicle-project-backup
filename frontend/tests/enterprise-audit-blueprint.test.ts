import { describe, it, expect } from 'vitest';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '../src/lib/session';
import { logAuditEvent } from '../src/lib/auditLogServer';
import { withUserContext } from '../src/lib/dbWithContext';
import { getRulesForRole } from '../src/lib/docRulesServer';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

describe('SafarPK Enterprise Audit Blueprint & Neon PostgreSQL 16 Verification Suite', () => {
  const dbUrl = process.env.DATABASE_URL;

  // =========================================================================
  // Pillar 1: PostgreSQL 16 Schema & Cryptographic Extensions
  // =========================================================================
  describe('Pillar 1: PostgreSQL 16 Schema & Cryptographic Extensions', () => {
    it('verifies all 11 enterprise core tables exist in Neon database', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      const tableNames = tables.map((t: any) => t.table_name);

      const requiredTables = [
        'users',
        'document_verification_rules',
        'user_documents',
        'subscription_plans',
        'user_subscriptions',
        'vehicle_listings',
        'chauffeur_profiles',
        'shuttle_routes',
        'moving_quotes',
        'bookings',
        'audit_logs',
      ];

      for (const req of requiredTables) {
        expect(tableNames).toContain(req);
      }
    });

    it('verifies cryptographic extensions uuid-ossp, pgcrypto, citext are active', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const extensions = await sql`
        SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'citext');
      `;
      const extNames = extensions.map((e: any) => e.extname);
      expect(extNames).toContain('uuid-ossp');
      expect(extNames).toContain('pgcrypto');
      expect(extNames).toContain('citext');
    });

    it('verifies pgcrypto column-level encryption and decryption with KMS_ENCRYPTION_KEY', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const key = process.env.KMS_ENCRYPTION_KEY || 'safarpk_test_key_2026';
      const sampleCnic = '35201-9988776-5';

      const enc = await sql`SELECT pgp_sym_encrypt(${sampleCnic}, ${key}) as enc;`;
      expect(enc[0].enc).toBeDefined();

      const dec = await sql`SELECT pgp_sym_decrypt(${enc[0].enc}::bytea, ${key}) as dec;`;
      expect(dec[0].dec).toBe(sampleCnic);
    });
  });

  // =========================================================================
  // Pillar 2: Neon RLS Session Context Adaptation
  // =========================================================================
  describe('Pillar 2: Neon RLS Session Context Adaptation', () => {
    it('executes query inside withUserContext and propagates app.current_user_id & app.current_user_role', async () => {
      if (!dbUrl) return;
      const testUserId = '12345678-1234-1234-1234-1234567890ab';
      const testRole = 'LISTER';

      const res = await withUserContext(testUserId, testRole, async (client) => {
        const queryRes = await client.query(
          "SELECT current_setting('app.current_user_id', true) as uid, current_setting('app.current_user_role', true) as role"
        );
        return queryRes.rows[0];
      });

      expect(res.uid).toBe(testUserId);
      expect(res.role).toBe(testRole);
    });
  });

  // =========================================================================
  // Pillar 3: Server-Side HttpOnly Session Cookie Security (OWASP ASVS Level 2+)
  // =========================================================================
  describe('Pillar 3: Server-Side HttpOnly Session Cookie Security', () => {
    it('creates an HMAC-SHA256 signed session token that verifies cleanly', async () => {
      const user = {
        id: 'user-uuid-123',
        phone: '+923001234567',
        name: 'Test Customer',
        role: 'CUSTOMER' as const,
        city: 'Lahore',
      };

      const token = await createSessionToken(user);
      expect(token).toBeDefined();
      expect(token).toContain('.');

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(user.id);
      expect(verified?.phone).toBe(user.phone);
      expect(verified?.role).toBe(user.role);
    });

    it('rejects tampered session tokens (e.g. privilege escalation attempt)', async () => {
      const user = {
        id: 'user-uuid-123',
        phone: '+923001234567',
        name: 'Test Customer',
        role: 'CUSTOMER' as const,
      };

      const token = await createSessionToken(user);
      const [payloadB64, signature] = token.split('.');

      // Attacker tries to modify payload to SUPER_ADMIN without knowing secret key
      const decodedJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const tamperedObj = JSON.parse(decodedJson);
      tamperedObj.role = 'SUPER_ADMIN';
      const tamperedPayloadB64 = Buffer.from(JSON.stringify(tamperedObj)).toString('base64url');

      const tamperedToken = `${tamperedPayloadB64}.${signature}`;
      const result = await verifySessionToken(tamperedToken);

      expect(result).toBeNull();
    });

    it('rejects malformed or empty session tokens gracefully', async () => {
      expect(await verifySessionToken('')).toBeNull();
      expect(await verifySessionToken(null)).toBeNull();
      expect(await verifySessionToken('invalid.token.structure')).toBeNull();
    });
  });

  // =========================================================================
  // Pillar 4: Tamper-Evident Chained Cryptographic Audit Logging
  // =========================================================================
  describe('Pillar 4: Tamper-Evident Chained Cryptographic Audit Logging', () => {
    it('inserts chained audit records where previous_hash links to last block current_hash', async () => {
      if (!dbUrl) return;

      const logA = await logAuditEvent({
        actorRole: 'SUPER_ADMIN',
        actionType: 'BLUEPRINT_TEST_A',
        targetResource: 'SYSTEM',
      });
      expect(logA.success).toBe(true);
      expect(logA.hash).toBeDefined();

      const logB = await logAuditEvent({
        actorRole: 'LISTER',
        actionType: 'BLUEPRINT_TEST_B',
        targetResource: 'VEHICLE',
      });
      expect(logB.success).toBe(true);

      const sql = neon(dbUrl);
      const rows = await sql`
        SELECT action_type, previous_hash, current_hash 
        FROM audit_logs 
        ORDER BY id DESC 
        LIMIT 2;
      `;

      expect(rows[0].previous_hash).toBe(rows[1].current_hash);
    });

    it('proves audit_logs immutability: engine trigger blocks UPDATE and DELETE', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);

      let deleteBlocked = false;
      try {
        await sql`DELETE FROM audit_logs WHERE id = 1;`;
      } catch (err: any) {
        deleteBlocked = true;
        expect(err.message).toContain('audit_logs entries are immutable');
      }
      expect(deleteBlocked).toBe(true);

      let updateBlocked = false;
      try {
        await sql`UPDATE audit_logs SET action_type = 'HACKED' WHERE id = 1;`;
      } catch (err: any) {
        updateBlocked = true;
        expect(err.message).toContain('audit_logs entries are immutable');
      }
      expect(updateBlocked).toBe(true);
    });
  });

  // =========================================================================
  // Pillar 5: Dynamic Document Rules & Role Control
  // =========================================================================
  describe('Pillar 5: Dynamic Document Rules & Role Control', () => {
    it('fetches dynamic document verification rules for LISTER role from PostgreSQL', async () => {
      if (!dbUrl) return;
      const rules = await getRulesForRole('LISTER');
      expect(rules.length).toBeGreaterThan(0);

      const docTypes = rules.map((r) => r.documentType);
      expect(docTypes).toContain('CNIC');
      expect(docTypes).toContain('CAR_OWNER_CARD');
    });

    it('verifies SUPER_ADMIN account exists in enterprise users table', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const adminRows = await sql`
        SELECT phone, email, role, kyc_status 
        FROM users 
        WHERE role = 'SUPER_ADMIN' 
        LIMIT 1;
      `;
      expect(adminRows.length).toBe(1);
      expect(adminRows[0].role).toBe('SUPER_ADMIN');
      expect(adminRows[0].kyc_status).toBe('VERIFIED');
    });
  });
});
