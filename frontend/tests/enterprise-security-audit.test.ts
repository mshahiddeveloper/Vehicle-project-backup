import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  timingSafeEqual,
  hashPassword,
  verifyPassword,
  sealUserSession,
  unsealUserSession,
  generateCryptographicOtp,
  sanitizeUserInput,
} from '../src/lib/cryptoVault';
import {
  sendWhatsAppVerificationOtp,
  verifyWhatsAppOtpCode,
  authenticateUser,
  getActiveUser,
  setActiveUser,
  DEMO_USERS,
} from '../src/data/userAuth';

describe('Enterprise Security & Anti-Hack Hardening Audit Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Cryptographic Vault & Password Security', () => {
    it('T1.1: timingSafeEqual performs constant-time string comparison', () => {
      expect(timingSafeEqual('correct_secret_pin', 'correct_secret_pin')).toBe(true);
      expect(timingSafeEqual('correct_secret_pin', 'wrong_secret_pin')).toBe(false);
      expect(timingSafeEqual('short', 'longer_string_here')).toBe(false);
    });

    it('T1.2: hashPassword creates salted PBKDF2 hash with 100,000 iterations', async () => {
      const plain = 'StrongP@ssw0rd2026!';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      expect(hash1).toMatch(/^pbkdf2_sha256\$100000\$/);
      // Different salts produce different hashes for identical passwords
      expect(hash1).not.toBe(hash2);

      const isValid1 = await verifyPassword(plain, hash1);
      const isValid2 = await verifyPassword(plain, hash2);
      const isInvalid = await verifyPassword('WrongPassword!', hash1);

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('T1.3: verifyPassword maintains backward compatibility with legacy demo passwords', async () => {
      expect(await verifyPassword('password123', 'password123')).toBe(true);
      expect(await verifyPassword('wrongpassword', 'password123')).toBe(false);
    });

    it('T1.4: sanitizeUserInput neutralizes XSS payloads', () => {
      const malicious = '<script>alert("Hacked!")</script><img src="x" onerror="steal()"/>';
      const clean = sanitizeUserInput(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;script&gt;');
      expect(clean).toContain('&lt;img');
    });

    it('T1.5: generateCryptographicOtp generates authentic 6-digit numeric string', () => {
      for (let i = 0; i < 10; i++) {
        const otp = generateCryptographicOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
      }
    });
  });

  describe('2. Client-Side Session Tamper Protection (Anti-Privilege Escalation)', () => {
    it('T2.1: sealUserSession and unsealUserSession preserve authentic customer session', () => {
      const customer = { id: 'usr-customer-1', role: 'CUSTOMER', name: 'Shahid Customer' };
      const sealed = sealUserSession(customer);
      const unsealed = unsealUserSession<typeof customer>(sealed);

      expect(unsealed).not.toBeNull();
      expect(unsealed?.id).toBe('usr-customer-1');
      expect(unsealed?.role).toBe('CUSTOMER');
    });

    it('T2.2: unsealUserSession DETECTS AND REJECTS tampered session (e.g. Hacker modifying role to SUPER_ADMIN)', () => {
      const legitUser = { id: 'usr-customer-1', role: 'CUSTOMER', name: 'Hacker' };
      const sealed = sealUserSession(legitUser);
      const envelope = JSON.parse(sealed);

      // Hacker alters role inside the envelope
      envelope.payload.role = 'SUPER_ADMIN';
      const tamperedSealed = JSON.stringify(envelope);

      const rejected = unsealUserSession(tamperedSealed);
      expect(rejected).toBeNull(); // Cryptographic signature mismatch!
    });

    it('T2.3: getActiveUser strips sensitive password credentials from runtime memory', () => {
      const testUser = { ...DEMO_USERS[0], password: 'super_secret_password' };
      setActiveUser(testUser);

      const active = getActiveUser();
      expect(active).not.toBeNull();
      expect((active as any).password).toBeUndefined(); // Password must NEVER be exposed in memory
    });
  });

  describe('3. WhatsApp OTP Brute-Force & Vulnerability Hardening', () => {
    it('T3.1: verifyWhatsAppOtpCode REJECTS arbitrary codes when no OTP was dispatched (no bypass)', () => {
      const res = verifyWhatsAppOtpCode('+923001234567', '123456');
      expect(res.success).toBe(false);
      expect(res.error).toContain('No active verification code found');
    });

    it('T3.2: verifyWhatsAppOtpCode locks out attacker after 3 failed brute-force attempts', () => {
      const phone = '+923009988776';
      const dispatched = sendWhatsAppVerificationOtp(phone);
      expect(dispatched.success).toBe(true);

      // Attempt 1: Failed
      const a1 = verifyWhatsAppOtpCode(phone, '000001');
      expect(a1.success).toBe(false);
      expect(a1.error).toContain('2 attempt(s) remaining');

      // Attempt 2: Failed
      const a2 = verifyWhatsAppOtpCode(phone, '000002');
      expect(a2.success).toBe(false);
      expect(a2.error).toContain('1 attempt(s) remaining');

      // Attempt 3: Failed
      const a3 = verifyWhatsAppOtpCode(phone, '000003');
      expect(a3.success).toBe(false);

      // Attempt 4: Completely Locked Out
      const a4 = verifyWhatsAppOtpCode(phone, dispatched.code); // Even with correct code now, it is locked!
      expect(a4.success).toBe(false);
      expect(a4.error).toContain('locked');
    });

    it('T3.3: verifyWhatsAppOtpCode succeeds with authentic code and cleans up storage', () => {
      const phone = '+923005544332';
      const dispatched = sendWhatsAppVerificationOtp(phone);
      const verified = verifyWhatsAppOtpCode(phone, dispatched.code);

      expect(verified.success).toBe(true);

      // Re-verifying same code fails because it was consumed (one-time use)
      const reused = verifyWhatsAppOtpCode(phone, dispatched.code);
      expect(reused.success).toBe(false);
    });
  });

  describe('4. HTTP Security Headers Verification in next.config.mjs', () => {
    const configPath = path.resolve(__dirname, '../next.config.mjs');
    const configContent = fs.readFileSync(configPath, 'utf-8');

    it('T4.1: Contains Anti-Clickjacking Header (X-Frame-Options: DENY)', () => {
      expect(configContent).toContain("key: 'X-Frame-Options'");
      expect(configContent).toContain("value: 'DENY'");
    });

    it('T4.2: Contains Anti-MIME Sniffing Header (X-Content-Type-Options: nosniff)', () => {
      expect(configContent).toContain("key: 'X-Content-Type-Options'");
      expect(configContent).toContain("value: 'nosniff'");
    });

    it('T4.3: Contains Strict-Transport-Security (HSTS)', () => {
      expect(configContent).toContain("key: 'Strict-Transport-Security'");
      expect(configContent).toContain('max-age=63072000');
    });

    it('T4.4: Contains Referrer-Policy and Permissions-Policy', () => {
      expect(configContent).toContain("key: 'Referrer-Policy'");
      expect(configContent).toContain("key: 'Permissions-Policy'");
    });
  });

  describe('5. Role-Based Route Protection & Privilege Escalation Hardening', () => {
    const adminPagePath = path.resolve(__dirname, '../src/app/admin/page.tsx');
    const adminPageContent = fs.readFileSync(adminPagePath, 'utf-8');

    it('T5.1: Admin portal blocks non-admin users from escalating to SUPER_ADMIN', () => {
      expect(adminPageContent).toContain("if (user && user.role !== 'SUPER_ADMIN')");
      expect(adminPageContent).toContain('getUserDashboardPath(user)');
    });
  });
});

