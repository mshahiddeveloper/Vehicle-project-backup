import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import {
  recordIpInquiry,
  getListingInquiryStats,
  getListerFleetInquiryStats,
  getGlobalListerInquiryStats,
  getAllIpInquiries,
  setClientDetectedIp,
  getClientDetectedIp,
  resetActivityTrackerForTesting,
  recordClickEvent,
  extractClientIp,
} from '@/data/activityTracker';
import { POST as trackClickPost, GET as trackClickGet } from '@/app/api/track-click/route';

const FRONTEND_DIR = path.resolve(__dirname, '..');
const CAR_LISTING_PATH = path.join(FRONTEND_DIR, 'src', 'app', 'listing', '[id]', 'page.tsx');

describe('Vehicle Detail Buttons & Lister/Listing IP Tracking Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetActivityTrackerForTesting();
  });

  describe('1. Vehicle Detail Page Action Buttons Hierarchy & Labels', () => {
    const carPageSource = fs.readFileSync(CAR_LISTING_PATH, 'utf-8');

    it('places "Book Vehicle" as the FIRST priority CTA button in the main card', () => {
      const bookIdx = carPageSource.indexOf('<span>Book Vehicle</span>');
      const waIdx = carPageSource.indexOf('<span>WhatsApp</span>');
      const inAppChatIdx = carPageSource.indexOf('<span>In-App Chat</span>');
      const phoneIdx = carPageSource.indexOf('<span>{hostPhoneRevealed ? `Call: ${car.hostPhone}` : \'Show Phone Number\'}</span>');

      expect(bookIdx).toBeGreaterThan(-1);
      expect(waIdx).toBeGreaterThan(-1);
      expect(inAppChatIdx).toBeGreaterThan(-1);
      expect(phoneIdx).toBeGreaterThan(-1);

      // Book Vehicle MUST be before WhatsApp, In-App Chat, and Phone
      expect(bookIdx).toBeLessThan(waIdx);
      expect(waIdx).toBeLessThan(inAppChatIdx);
      expect(inAppChatIdx).toBeLessThan(phoneIdx);
    });

    it('completely removes verbose "Book Vehicle & Check Rates" label', () => {
      expect(carPageSource).not.toContain('Book Vehicle & Check Rates');
    });

    it('replaces "Chat with Host" with concise "In-App Chat" to prevent 2-line wrapping', () => {
      expect(carPageSource).not.toContain('<span>Chat with Host</span>');
      expect(carPageSource).toContain('<span>In-App Chat</span>');
    });

    it('implements phone reveal on click with mobile direct tel: dialer support', () => {
      expect(carPageSource).toContain('setHostPhoneRevealed(true)');
      expect(carPageSource).toContain("window.location.href = `tel:${car.hostPhone.replace(/[^0-9+]/g, '')}`");
    });
  });

  describe('2. /api/track-click IP Detection Endpoint', () => {
    it('extracts real client IP from x-forwarded-for header (first IP in chain)', () => {
      const req = new NextRequest('http://localhost:3000/api/track-click', {
        headers: {
          'x-forwarded-for': '119.160.67.12, 10.0.0.1, 192.168.1.1',
        },
      });
      const ip = extractClientIp(req);
      expect(ip).toBe('119.160.67.12');
    });

    it('extracts client IP from x-real-ip when x-forwarded-for is absent', () => {
      const req = new NextRequest('http://localhost:3000/api/track-click', {
        headers: {
          'x-real-ip': '182.185.142.89',
        },
      });
      const ip = extractClientIp(req);
      expect(ip).toBe('182.185.142.89');
    });

    it('falls back to 127.0.0.1 when no proxy headers are provided', () => {
      const req = new NextRequest('http://localhost:3000/api/track-click');
      const ip = extractClientIp(req);
      expect(ip).toBe('127.0.0.1');
    });

    it('POST /api/track-click records click with client IP and returns tracked event', async () => {
      const req = new NextRequest('http://localhost:3000/api/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '39.40.112.54',
        },
        body: JSON.stringify({
          listingId: 'l-corolla1',
          listingTitle: 'Toyota Corolla Altis Grande 2024',
          listerPhone: '+92 300 1234567',
          listerName: 'Salman Rent a Car & Tours',
          ctaType: 'WHATSAPP',
          city: 'Islamabad',
        }),
      });

      const res = await trackClickPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.clientIp).toBe('39.40.112.54');
      expect(json.event.ctaType).toBe('WHATSAPP');
      expect(json.event.listingId).toBe('l-corolla1');
    });

    it('GET /api/track-click returns detected client IP for client-side caching', async () => {
      const req = new NextRequest('http://localhost:3000/api/track-click', {
        headers: {
          'x-forwarded-for': '202.163.114.78',
        },
      });
      const res = await trackClickGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.clientIp).toBe('202.163.114.78');
    });
  });

  describe('3. Per-Listing Individual Inquiry & Unique IP Tracking', () => {
    it('records individual CTA clicks with distinct client IP addresses', () => {
      setClientDetectedIp('119.160.67.12');
      const inq1 = recordIpInquiry({
        listingId: 'test-car-99',
        listingTitle: 'Honda Civic RS 2024',
        listerPhone: '+92 300 9998877',
        listerName: 'Alpha Motors',
        ctaType: 'BOOK_VEHICLE',
        city: 'Lahore',
      });
      expect(inq1.clientIp).toBe('119.160.67.12');
      expect(inq1.ctaType).toBe('BOOK_VEHICLE');

      setClientDetectedIp('182.185.142.89');
      recordIpInquiry({
        listingId: 'test-car-99',
        listingTitle: 'Honda Civic RS 2024',
        listerPhone: '+92 300 9998877',
        listerName: 'Alpha Motors',
        ctaType: 'WHATSAPP',
        city: 'Lahore',
      });

      setClientDetectedIp('119.160.67.12'); // Same IP as customer 1
      recordIpInquiry({
        listingId: 'test-car-99',
        listingTitle: 'Honda Civic RS 2024',
        listerPhone: '+92 300 9998877',
        listerName: 'Alpha Motors',
        ctaType: 'CALL',
        city: 'Lahore',
      });

      const stats = getListingInquiryStats('test-car-99');
      expect(stats.totalInquiries).toBe(3);
      expect(stats.bookClicks).toBe(1);
      expect(stats.whatsappClicks).toBe(1);
      expect(stats.callClicks).toBe(1);
      expect(stats.chatClicks).toBe(0);
      // Unique IPs must deduplicate 119.160.67.12 (appeared twice)
      expect(stats.uniqueIpsCount).toBe(2);
      expect(stats.uniqueIps).toContain('119.160.67.12');
      expect(stats.uniqueIps).toContain('182.185.142.89');
    });
  });

  describe('4. Per-Lister Fleet-Wide Inquiries Aggregation', () => {
    it('aggregates inquiries across multiple listings owned by the same lister', () => {
      // Lister owns 2 cars
      const listerPhone = '+92 300 5551234';
      const listerName = 'Royal Fleets Karachi';

      setClientDetectedIp('111.92.128.45');
      recordIpInquiry({
        listingId: 'car-a',
        listingTitle: 'Toyota Prado',
        listerPhone,
        listerName,
        ctaType: 'BOOK_VEHICLE',
        city: 'Karachi',
      });

      setClientDetectedIp('175.107.210.33');
      recordIpInquiry({
        listingId: 'car-b',
        listingTitle: 'Hyundai Sonata',
        listerPhone,
        listerName,
        ctaType: 'IN_APP_CHAT',
        city: 'Karachi',
      });

      setClientDetectedIp('111.92.128.45'); // Same IP visiting second vehicle
      recordIpInquiry({
        listingId: 'car-b',
        listingTitle: 'Hyundai Sonata',
        listerPhone,
        listerName,
        ctaType: 'WHATSAPP',
        city: 'Karachi',
      });

      const fleetStats = getListerFleetInquiryStats(listerPhone);
      expect(fleetStats.totalFleetInquiries).toBe(3);
      expect(fleetStats.breakdown.bookClicks).toBe(1);
      expect(fleetStats.breakdown.chatClicks).toBe(1);
      expect(fleetStats.breakdown.whatsappClicks).toBe(1);
      expect(fleetStats.uniqueInquirersCount).toBe(2);
      expect(Object.keys(fleetStats.listings)).toHaveLength(2);
    });
  });

  describe('5. Platform-Wide Total All-Time Lister Inquiries', () => {
    it('computes grand total inquiries of all time across all listers', () => {
      const globalStats = getGlobalListerInquiryStats();
      expect(globalStats.allTimeTotalInquiries).toBeGreaterThanOrEqual(10);
      expect(globalStats.allTimeUniqueIpsCount).toBeGreaterThan(0);
      expect(globalStats.totalActiveListersTracked).toBeGreaterThan(0);
      expect(globalStats.totalListingsTracked).toBeGreaterThan(0);
    });
  });
});
