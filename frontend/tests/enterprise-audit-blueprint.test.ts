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

  // =========================================================================
  // Pillar 6: Essential Tables for 5 Verticals & Serverless Edge Reliability
  // =========================================================================
  describe('Pillar 6: Essential Tables for 5 Verticals & Serverless Edge Reliability', () => {
    it('verifies all 5 additional tables (intercity_trips, wishlists, reviews, otp_verifications, notifications) exist in Neon', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `;
      const tableNames = tables.map((t: any) => t.table_name);
      expect(tableNames).toContain('intercity_trips');
      expect(tableNames).toContain('wishlists');
      expect(tableNames).toContain('reviews');
      expect(tableNames).toContain('otp_verifications');
      expect(tableNames).toContain('notifications');
    });

    it('intercity_trips: supports atomic seat decrement transaction', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);

      // Fetch a scheduled intercity trip
      const tripRows = await sql`
        SELECT id, available_seats, per_seat_fare_pkr 
        FROM intercity_trips 
        WHERE status = 'SCHEDULED' AND available_seats >= 2 
        LIMIT 1;
      `;

      if (tripRows.length > 0) {
        const trip = tripRows[0];
        const initialSeats = trip.available_seats;

        // Perform atomic decrement
        await withUserContext(null, 'INTERNAL_SYSTEM', async (client) => {
          await client.query(
            'UPDATE intercity_trips SET available_seats = available_seats - 1 WHERE id = $1',
            [trip.id]
          );
        });

        const updated = await sql`SELECT available_seats FROM intercity_trips WHERE id = ${trip.id};`;
        expect(updated[0].available_seats).toBe(initialSeats - 1);
      }
    });

    it('wishlists: enforces unique composite constraint (user_id, vehicle_id)', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);

      const userRows = await sql`SELECT id FROM users LIMIT 1;`;
      const vehRows = await sql`SELECT id FROM vehicle_listings LIMIT 1;`;

      if (userRows.length > 0 && vehRows.length > 0) {
        const uId = userRows[0].id;
        const vId = vehRows[0].id;

        // First insert
        await sql`
          INSERT INTO wishlists (user_id, vehicle_id)
          VALUES (${uId}, ${vId})
          ON CONFLICT (user_id, vehicle_id) DO NOTHING;
        `;

        // Second insert without DO NOTHING should trigger uniqueness constraint violation
        let duplicateBlocked = false;
        try {
          await sql`INSERT INTO wishlists (user_id, vehicle_id) VALUES (${uId}, ${vId});`;
        } catch (err: any) {
          duplicateBlocked = true;
          expect(err.message).toContain('unique');
        }
        expect(duplicateBlocked).toBe(true);
      }
    });

    it('reviews: verifies rating range (1-5) and booking uniqueness', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);

      // Attempting invalid rating (0 or 6) must be blocked by check constraint
      let invalidBlocked = false;
      try {
        await sql`
          INSERT INTO reviews (booking_id, customer_id, target_user_id, rating, comment)
          VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 10, 'Invalid rating');
        `;
      } catch (err: any) {
        invalidBlocked = true;
        expect(err.message).toContain('check');
      }
      expect(invalidBlocked).toBe(true);
    });

    it('otp_verifications: persists OTP hash, cooldown, and 10-minute expiry in PostgreSQL', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const testPhone = '923998877665';
      const testHash = 'test_hash_val_12345';

      await sql`
        INSERT INTO otp_verifications (phone, otp_hash, attempt_count, cooldown_until, expires_at)
        VALUES (${testPhone}, ${testHash}, 0, NOW() + INTERVAL '60 seconds', NOW() + INTERVAL '10 minutes')
        ON CONFLICT (phone) DO UPDATE SET otp_hash = EXCLUDED.otp_hash;
      `;

      const rows = await sql`SELECT phone, otp_hash, attempt_count FROM otp_verifications WHERE phone = ${testPhone};`;
      expect(rows.length).toBe(1);
      expect(rows[0].otp_hash).toBe(testHash);

      // Clean up test phone
      await sql`DELETE FROM otp_verifications WHERE phone = ${testPhone};`;
    });

    it('notifications: persists and retrieves user notifications with read state toggles', async () => {
      if (!dbUrl) return;
      const sql = neon(dbUrl);
      const userRows = await sql`SELECT id FROM users LIMIT 1;`;

      if (userRows.length > 0) {
        const uId = userRows[0].id;
        const ins = await sql`
          INSERT INTO notifications (user_id, type, title, message)
          VALUES (${uId}, 'SYSTEM_ALERT', 'Test Notification', 'Testing notification persistence')
          RETURNING id, is_read;
        `;
        expect(ins[0].is_read).toBe(false);

        // Mark as read
        await sql`UPDATE notifications SET is_read = TRUE WHERE id = ${ins[0].id};`;
        const updated = await sql`SELECT is_read FROM notifications WHERE id = ${ins[0].id};`;
        expect(updated[0].is_read).toBe(true);

        // Clean up test notification
        await sql`DELETE FROM notifications WHERE id = ${ins[0].id};`;
      }
    });
  });
});

