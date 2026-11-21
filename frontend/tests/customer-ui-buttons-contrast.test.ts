import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Customer Dashboard UI Polish, Button Standardization & Dynamic Documents', () => {
  const customerPagePath = path.resolve(__dirname, '../src/app/customer/page.tsx');
  const listerPagePath = path.resolve(__dirname, '../src/app/lister/page.tsx');
  const driverPagePath = path.resolve(__dirname, '../src/app/driver/page.tsx');
  const providerPagePath = path.resolve(__dirname, '../src/app/provider/page.tsx');

  const customerSource = fs.readFileSync(customerPagePath, 'utf-8');
  const listerSource = fs.readFileSync(listerPagePath, 'utf-8');
  const driverSource = fs.readFileSync(driverPagePath, 'utf-8');
  const providerSource = fs.readFileSync(providerPagePath, 'utf-8');

  it('T1: Customer dashboard welcome banner has high-contrast readable white text', () => {
    expect(customerSource).toContain('text-xs sm:text-sm text-white font-medium mt-1.5 max-w-xl leading-relaxed');
  });

  it('T2: Lister, Driver, and Provider dashboard banners have high-contrast readable white text', () => {
    expect(listerSource).toContain('text-xs sm:text-sm text-white font-medium mt-1.5 leading-relaxed');
    expect(driverSource).toContain('text-xs sm:text-sm text-white font-medium mt-1.5 leading-relaxed');
    expect(providerSource).toContain('text-xs sm:text-sm text-white font-medium mt-1.5 leading-relaxed');
  });

  it('T3: Mobile tab bar labels are concise to prevent multi-line wrapping and ellipsis truncation', () => {
    expect(customerSource).toContain("{ id: 'bookings', label: 'Rentals'");
    expect(customerSource).toContain("{ id: 'rides', label: 'Shuttles'");
    expect(customerSource).toContain("{ id: 'drivers', label: 'Drivers'");
    expect(customerSource).toContain("{ id: 'shifting', label: 'Movers'");
    expect(customerSource).toContain("{ id: 'wishlist', label: 'Saved'");
    expect(customerSource).toContain("{ id: 'leads', label: 'Inquiries'");
    expect(customerSource).toContain("{ id: 'profile', label: 'Profile'");
  });

  it('T4: Action buttons are renamed to View Documents with single-line whitespace-nowrap', () => {
    expect(customerSource).toContain('View Documents');
    expect(customerSource).not.toContain('View Smart Card & NTN');
    expect(customerSource).not.toContain('View Vehicle Smart Card & Owner FBR Credentials');
  });

  it('T5: WhatsApp buttons use official WhatsAppIcon, green brand color, and concise label', () => {
    expect(customerSource).toContain('WhatsAppIcon');
    expect(customerSource).toContain('bg-[#25D366]');
    expect(customerSource).not.toContain('<span>Chat Owner</span>');
    expect(customerSource).not.toContain('<span>Direct WhatsApp Owner</span>');
  });

  it('T6: Documents modal dynamically resolves genuine documents with image preview and full-size links', () => {
    expect(customerSource).toContain('dynamicSmartCardUrl');
    expect(customerSource).toContain('dynamicNtnUrl');
    expect(customerSource).toContain('View Full Document');
    expect(customerSource).toContain('View NTN Certificate');
    expect(customerSource).toContain('getAllRegisteredUsers()');
  });
});

