import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { startOrOpenConversation, getWhatsAppTargetUrl, getAllConversations } from '@/data/chatEngine';
import { getActiveUser, setActiveUser } from '@/data/userAuth';

const FRONTEND_DIR = path.resolve(__dirname, '..');
const DRIVER_SLUG_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'driver', '[slug]', 'page.tsx');
const DRIVERS_ID_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'drivers', '[id]', 'page.tsx');
const CAR_LISTING_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'listing', '[id]', 'page.tsx');
const CITY_TO_CITY_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'city-to-city', '[id]', 'page.tsx');
const MOVERS_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'movers', '[id]', 'page.tsx');
const SHUTTLES_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'shuttles', '[id]', 'page.tsx');

describe('Detail Page Actions & In-App Direct Chat Standardization', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Driver Detail Page Source Code Validation', () => {
    const driverSource = fs.readFileSync(DRIVER_SLUG_PATH, 'utf-8');

    it('replaces "WhatsApp Chat" with "WhatsApp" in header card action button', () => {
      expect(driverSource).not.toMatch(/>\s*WhatsApp Chat\s*</);
      expect(driverSource).toContain('<span>WhatsApp</span>');
    });

    it('renames blue button to "Hire Driver" instead of "Check Rates & Hire Driver"', () => {
      expect(driverSource).not.toContain('Check Rates & Hire Driver');
      expect(driverSource).toContain('<span>Hire Driver</span>');
    });

    it('renames adjacent WhatsApp button to "Chat" for direct in-app messaging', () => {
      expect(driverSource).toContain('onClick={handleDirectChat}');
      expect(driverSource).toContain('<span>Chat</span>');
    });

    it('implements role-aware handleDirectChat routing', () => {
      // Unauthenticated -> /login?redirect=...
      expect(driverSource).toContain('router.push(`/login?redirect=');
      // Vendor/Lister/Driver -> /inbox
      expect(driverSource).toContain("user.role === 'VENDOR' || user.role === 'LISTER' || user.role === 'DRIVER'");
      expect(driverSource).toContain("router.push('/inbox')");
      // Customer -> startOrOpenConversation -> /inbox?conv=...
      expect(driverSource).toContain('startOrOpenConversation');
      expect(driverSource).toContain('router.push(`/inbox?conv=${convId}`)');
    });

    it('drivers/[id]/page.tsx properly re-exports driver/[slug]/page', () => {
      const driversIdSource = fs.readFileSync(DRIVERS_ID_PATH, 'utf-8');
      expect(driversIdSource).toContain("import PublicDriverProfilePage from '@/app/driver/[slug]/page'");
      expect(driversIdSource).toContain('export default PublicDriverProfilePage');
    });
  });

  describe('Universal Detail Pages In-App Chat & WhatsApp Standardization', () => {
    const carSource = fs.readFileSync(CAR_LISTING_PATH, 'utf-8');
    const c2cSource = fs.readFileSync(CITY_TO_CITY_PATH, 'utf-8');
    const moversSource = fs.readFileSync(MOVERS_PATH, 'utf-8');
    const shuttlesSource = fs.readFileSync(SHUTTLES_PATH, 'utf-8');

    it('Car detail page has Rent Car, Chat, WhatsApp and handleDirectChat', () => {
      expect(carSource).toContain('<span>Rent Car</span>');
      expect(carSource).toContain('<span>Chat</span>');
      expect(carSource).toContain('<span>WhatsApp</span>');
      expect(carSource).toContain('handleDirectChat');
      expect(carSource).toContain("user.role === 'VENDOR' || user.role === 'LISTER' || user.role === 'DRIVER'");
    });

    it('City-to-city detail page has Book Ride, Chat, WhatsApp and handleDirectChat', () => {
      expect(c2cSource).toContain('<span>Book Ride</span>');
      expect(c2cSource).toContain('<span>Chat</span>');
      expect(c2cSource).toContain('<span>WhatsApp</span>');
      expect(c2cSource).toContain('handleDirectChat');
      expect(c2cSource).toContain("user.role === 'VENDOR' || user.role === 'LISTER' || user.role === 'DRIVER'");
    });

    it('Movers detail page has Book Mover, Chat, WhatsApp and handleDirectChat', () => {
      expect(moversSource).toContain('<span>Book Mover</span>');
      expect(moversSource).toContain('<span>Chat</span>');
      expect(moversSource).toContain('<span>WhatsApp</span>');
      expect(moversSource).toContain('handleDirectChat');
      expect(moversSource).toContain("user.role === 'VENDOR' || user.role === 'LISTER' || user.role === 'DRIVER'");
    });

    it('Shuttles detail page has Reserve Seat, Chat, WhatsApp and handleDirectChat', () => {
      expect(shuttlesSource).toContain('<span>Reserve Seat</span>');
      expect(shuttlesSource).toContain('<span>Chat</span>');
      expect(shuttlesSource).toContain('<span>WhatsApp</span>');
      expect(shuttlesSource).toContain('handleDirectChat');
      expect(shuttlesSource).toContain("user.role === 'VENDOR' || user.role === 'LISTER' || user.role === 'DRIVER'");
    });
  });

  describe('In-App Chat Engine Functional Execution for Customers & Providers', () => {
    it('creates or retrieves 1-to-1 conversation when a customer chats with a driver listing', () => {
      const customer = {
        id: 'cust-101',
        name: 'Bilal Ahmed',
        email: 'bilal@example.com',
        phone: '+92 321 9876543',
        role: 'CUSTOMER' as const,
      };

      const convId = startOrOpenConversation({
        currentUser: customer,
        partnerId: 'driver-1',
        partnerName: 'Imran Khan',
        partnerRole: 'DRIVER',
        partnerPhone: '+92 300 1234567',
        about: 'Hire Chauffeur Imran Khan (Lahore)',
        bookingMetadata: {
          category: 'driver',
          customerName: customer.name,
          customerPhone: customer.phone,
          customerCity: 'Lahore',
          providerName: 'Imran Khan',
          providerPhone: '+92 300 1234567',
          itemName: 'Daily City Duty (12 Hours)',
          totalEstimate: 'Rs. 2,500',
          serviceMode: 'Professional Driver Duty',
          bookingRef: 'DRV-99999',
        },
        initialGreeting: 'Assalam-o-Alaikum Imran Khan! I am interested in hiring you.',
      });

      expect(convId).toBeDefined();
      expect(typeof convId).toBe('string');

      // Verify conversation stored
      const stored = getAllConversations();
      expect(stored).toBeDefined();
      const conv = stored.find((c: any) => c.id === convId);
      expect(conv).toBeDefined();
      expect(conv!.participantNames['driver-1']).toBe('Imran Khan');
      expect(conv!.bookingMetadata?.category).toBe('driver');
    });
  });
});
