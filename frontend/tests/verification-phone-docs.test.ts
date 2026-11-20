import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizePakistaniPhone,
  normalizePhone,
  sendWhatsAppVerificationOtp,
  verifyWhatsAppOtpCode,
  markUserPhoneVerified,
  registerNewUser,
  authenticateUser,
  getAllRegisteredUsers,
} from '../src/data/userAuth';

describe('Phone Normalization, WhatsApp OTP & Document Verification', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Pakistani Phone Number Auto-Sanitization (+92 & Zero Stripping)', () => {
    it('automatically strips leading 0 when user types 03331286257', () => {
      const res = sanitizePakistaniPhone('03331286257');
      expect(res.rawDigits).toBe('3331286257');
      expect(res.display).toBe('333 1286257');
      expect(res.standard).toBe('+92 333 1286257');
      expect(res.key).toBe('923331286257');
      expect(res.isValid).toBe(true);
    });

    it('handles direct 3-prefixed numbers without leading zero (3331286257)', () => {
      const res = sanitizePakistaniPhone('3331286257');
      expect(res.rawDigits).toBe('3331286257');
      expect(res.standard).toBe('+92 333 1286257');
      expect(res.key).toBe('923331286257');
      expect(res.isValid).toBe(true);
    });

    it('handles international format with +92 (+92 333 1286257)', () => {
      const res = sanitizePakistaniPhone('+92 333 1286257');
      expect(res.rawDigits).toBe('3331286257');
      expect(res.standard).toBe('+92 333 1286257');
      expect(res.isValid).toBe(true);
    });

    it('handles leading 920 edge case (9203331286257)', () => {
      const res = sanitizePakistaniPhone('9203331286257');
      expect(res.rawDigits).toBe('3331286257');
      expect(res.standard).toBe('+92 333 1286257');
      expect(res.isValid).toBe(true);
    });

    it('enforces maximum 10 digits limit and validates 3-prefix', () => {
      const longInput = sanitizePakistaniPhone('03331286257999');
      expect(longInput.rawDigits.length).toBe(10);
      expect(longInput.rawDigits).toBe('3331286257');

      const nonPakistani = sanitizePakistaniPhone('0212345678');
      expect(nonPakistani.isValid).toBe(false);
    });

    it('ensures normalizePhone returns identical lookup key for all input formats', () => {
      const k1 = normalizePhone('03331286257');
      const k2 = normalizePhone('3331286257');
      const k3 = normalizePhone('+92 333 1286257');
      const k4 = normalizePhone('0333-1286257');

      expect(k1).toBe('923331286257');
      expect(k2).toBe('923331286257');
      expect(k3).toBe('923331286257');
      expect(k4).toBe('923331286257');
    });
  });

  describe('2. WhatsApp OTP Dispatch, Verification & Permanent Lock', () => {
    it('dispatches a 6-digit WhatsApp OTP with deep link', () => {
      const res = sendWhatsAppVerificationOtp('03331286257');
      expect(res.success).toBe(true);
      expect(res.code).toMatch(/^\d{6}$/);
      expect(res.phoneStandard).toBe('+92 333 1286257');
      expect(res.waLink).toContain('https://wa.me/?text=');
      expect(res.waLink).toContain(res.code);
    });

    it('successfully verifies correct OTP code', () => {
      const phone = '03331286257';
      const otp = sendWhatsAppVerificationOtp(phone);
      const verifyRes = verifyWhatsAppOtpCode(phone, otp.code);
      expect(verifyRes.success).toBe(true);
    });

    it('rejects incorrect OTP code', () => {
      const phone = '03331286257';
      sendWhatsAppVerificationOtp(phone);
      const verifyRes = verifyWhatsAppOtpCode(phone, '000000');
      expect(verifyRes.success).toBe(false);
      expect(verifyRes.error).toContain('Incorrect');
    });

    it('marks user phone permanently verified and locked', () => {
      const reg = registerNewUser({
        name: 'Shahid Verification Test',
        phone: '03331286257',
        password: 'password123',
        city: 'Lahore',
        countryCode: 'PK',
        role: 'LISTER',
      });
      expect(reg.success).toBe(true);
      expect(reg.user.phone).toBe('+92 333 1286257');

      const locked = markUserPhoneVerified(reg.user.id);
      expect(locked).toBe(true);

      const all = getAllRegisteredUsers();
      const updated = all.find((u) => u.id === reg.user.id);
      expect(updated?.phoneVerified).toBe(true);
      expect(updated?.phoneLocked).toBe(true);
    });
  });

  describe('3. Registration & Clean Document State (No Fake Demo Data on New Accounts)', () => {
    it('creates brand new user without leaking dummy demo CNIC or license', () => {
      const reg = registerNewUser({
        name: 'Muhammad Shahid New',
        phone: '03129876543',
        password: 'password123',
        city: 'Karachi',
        countryCode: 'PK',
        role: 'DRIVER',
      });
      expect(reg.success).toBe(true);
      const user = reg.user;

      // Must NOT leak Tariq Mahmood's demo data!
      expect(user.cnicNumber).toBeUndefined();
      expect(user.nationalId).toBeUndefined();
      expect(user.cnicName).toBeUndefined();
      expect(user.cnicIssueDate).toBeUndefined();
      expect(user.cnicExpiryDate).toBeUndefined();
      expect(user.cnicLocked).toBe(false);
      expect(user.licenseNumber).toBeUndefined();
      expect(user.licenseLocked).toBe(false);
      expect(user.cnicFrontUrl).toBeUndefined();
      expect(user.cnicBackUrl).toBeUndefined();
      expect(user.licenseUrl).toBeUndefined();
    });

    it('seamlessly authenticates with normalized phone variations (0312 vs +92 312)', () => {
      const reg = registerNewUser({
        name: 'Login Test User',
        phone: '03451122334',
        password: 'secretPassword1',
        city: 'Islamabad',
        countryCode: 'PK',
        role: 'CUSTOMER',
      });
      expect(reg.success).toBe(true);

      // Login using 3451122334 (without zero)
      const auth1 = authenticateUser('3451122334', 'secretPassword1');
      expect(auth1.success).toBe(true);
      expect(auth1.user?.id).toBe(reg.user.id);

      // Login using 03451122334 (with leading zero)
      const auth2 = authenticateUser('03451122334', 'secretPassword1');
      expect(auth2.success).toBe(true);

      // Login using +92 345 1122334 (full international format)
      const auth3 = authenticateUser('+92 345 1122334', 'secretPassword1');
      expect(auth3.success).toBe(true);
    });
  });
});
