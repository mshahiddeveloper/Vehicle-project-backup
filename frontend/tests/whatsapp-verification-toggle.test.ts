import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SYSTEM_SETTINGS,
  getLocalSystemSettings,
  saveLocalSystemSettings,
  SystemSettings,
} from '../src/data/systemSettings';
import fs from 'fs';
import path from 'path';

describe('WhatsApp OTP Verification Deactivation & Super Admin Toggle Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Default System Settings & Persistence', () => {
    it('defaults to WhatsApp OTP verification DISABLED as requested by user', () => {
      expect(DEFAULT_SYSTEM_SETTINGS.whatsappVerificationEnabled).toBe(false);
      const current = getLocalSystemSettings();
      expect(current.whatsappVerificationEnabled).toBe(false);
    });

    it('persists enabled/disabled state in localStorage when toggled by Super Admin', () => {
      // 1. Enable
      const enabled = saveLocalSystemSettings({ whatsappVerificationEnabled: true });
      expect(enabled.whatsappVerificationEnabled).toBe(true);
      expect(getLocalSystemSettings().whatsappVerificationEnabled).toBe(true);

      // 2. Deactivate
      const disabled = saveLocalSystemSettings({ whatsappVerificationEnabled: false });
      expect(disabled.whatsappVerificationEnabled).toBe(false);
      expect(getLocalSystemSettings().whatsappVerificationEnabled).toBe(false);
    });
  });

  describe('2. Registration Page Dynamic Gate Inspection', () => {
    const registerPath = path.resolve(__dirname, '../src/app/register/page.tsx');
    const registerContent = fs.readFileSync(registerPath, 'utf8');

    it('integrates system settings into registration flow', () => {
      expect(registerContent).toContain('fetchSystemSettings');
      expect(registerContent).toContain('getLocalSystemSettings');
      expect(registerContent).toContain('waOtpRequired');
    });

    it('allows direct registration when WhatsApp verification is disabled', () => {
      expect(registerContent).toContain('Direct Registration Active');
      expect(registerContent).toContain('phoneVerified: waOtpRequired ? phoneVerified : true');
    });

    it('guards registration with OTP only when waOtpRequired is true', () => {
      expect(registerContent).toContain('waOtpRequired && !phoneVerified');
    });
  });

  describe('3. Super Admin Cockpit Verification Switch Inspection', () => {
    const sadminPath = path.resolve(__dirname, '../src/app/sadmin/page.tsx');
    const sadminContent = fs.readFileSync(sadminPath, 'utf8');

    it('provides WhatsApp verification toggle state and handler in Super Admin portal', () => {
      expect(sadminContent).toContain('waOtpEnabled');
      expect(sadminContent).toContain('handleToggleWhatsAppVerification');
      expect(sadminContent).toContain('updateSystemSettings');
    });

    it('includes WhatsApp OTP Verification Master Control Card on Overview tab', () => {
      expect(sadminContent).toContain('WhatsApp OTP Registration Verification');
      expect(sadminContent).toContain('role="switch"');
      expect(sadminContent).toContain('Click switch to deactivate');
    });

    it('includes dedicated Security & WhatsApp settings tab in Super Admin portal', () => {
      expect(sadminContent).toContain("activeTab === 'settings'");
      expect(sadminContent).toContain('Security & WhatsApp');
      expect(sadminContent).toContain('system_settings');
    });
  });

  describe('4. API Route Settings Verification', () => {
    const apiRoutePath = path.resolve(__dirname, '../src/app/api/settings/route.ts');
    const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');

    it('implements GET and POST handlers with no-store cache headers', () => {
      expect(apiRouteContent).toContain('export async function GET()');
      expect(apiRouteContent).toContain('export async function POST(');
      expect(apiRouteContent).toContain("'Cache-Control': 'no-store, no-cache, must-revalidate'");
    });

    it('synchronizes with Neon PostgreSQL system_settings table', () => {
      expect(apiRouteContent).toContain('system_settings');
      expect(apiRouteContent).toContain('whatsapp_verification');
    });
  });
});

