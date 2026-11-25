import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const readSrc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('Production DB, Wishlist Logout, Listing Navigation & Unified Admin', () => {
  it('removes second admin panel (/sadmin) and integrates AdminSystemControlTab into /admin', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/sadmin/page.tsx'))).toBe(false);
    const adminPage = readSrc('src/app/admin/page.tsx');
    expect(adminPage).toContain('AdminSystemControlTab');
    expect(adminPage).toContain("activeTab === 'system'");
    expect(adminPage).not.toContain("window.location.replace('/sadmin')");
  });

  it('scopes wishlist per user, clears cache on logout, and never falls back to /listing/l-1', () => {
    const wishlistSrc = readSrc('src/data/wishlist.ts');
    expect(wishlistSrc).toContain('clearWishlistClientCache');
    expect(wishlistSrc).toContain('syncWishlistFromServer');
    expect(wishlistSrc).not.toContain("'/listing/l-1'");
    expect(wishlistSrc).toContain('const rawKeys = [itemsKey];');

    const authSrc = readSrc('src/data/userAuth.ts');
    expect(authSrc).toContain("fetch('/api/auth/logout'");
    expect(authSrc).toContain("localStorage.removeItem('safarpk_saved_items')");
    expect(authSrc).toContain("localStorage.removeItem('safarpk_saved_vehicles')");

    const homeSrc = readSrc('src/app/page.tsx');
    expect(homeSrc).toContain("window.addEventListener('safarpk_auth_state_changed', syncSaved)");
    expect(homeSrc).not.toContain("localStorage.getItem('safarpk_saved_items')");
    expect(homeSrc).not.toContain("href: '/listing/l-1'");
  });

  it('connects all 5 vertical directories to Neon DB APIs', () => {
    expect(readSrc('src/app/cars/page.tsx')).toContain("fetch('/api/listings'");
    expect(readSrc('src/app/drivers/page.tsx')).toContain("fetch('/api/drivers'");
    expect(readSrc('src/app/shuttles/page.tsx')).toContain("fetch('/api/shuttles'");
    expect(readSrc('src/app/movers/page.tsx')).toContain("fetch('/api/movers'");
    expect(readSrc('src/app/city-to-city/page.tsx')).toContain('/api/intercity');
  });

  it('provides full-stack Neon DB API routes with no-store headers', () => {
    const routes = [
      'src/app/api/listings/route.ts',
      'src/app/api/drivers/route.ts',
      'src/app/api/shuttles/route.ts',
      'src/app/api/movers/route.ts',
      'src/app/api/bookings/route.ts',
      'src/app/api/leads/route.ts',
      'src/app/api/admin/overview/route.ts',
    ];
    for (const r of routes) {
      const src = readSrc(r);
      expect(src).toContain('no-store');
      expect(src).toContain('getNeonSqlClient');
    }
  });

  it('sends providerSubtype on registration and hydrates wishlist on login', () => {
    const regSrc = readSrc('src/app/register/page.tsx');
    expect(regSrc).toContain('providerSubtype,');
    expect(regSrc).toContain('router.replace(dest)');

    const loginSrc = readSrc('src/app/login/page.tsx');
    expect(loginSrc).toContain('syncWishlistFromServer');
  });
});

