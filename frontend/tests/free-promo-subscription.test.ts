import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerNewUser,
  grantFreePromotionalSubscription,
  getCategoryPromoPolicies,
  toggleCategoryPromoPolicy,
  syncSubscriptionExpiries,
  getAllRegisteredUsers,
  getAllSubscriptionPayments,
  saveAllRegisteredUsers,
  syncUserListingsQuota,
  toggleUserSubscriptionPause,
  isListingPaused,
} from '../src/data/userAuth';

describe('Super Admin Free Promotional Subscription & Launch Policies', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T1: Driver auto-receives 100% Free Promotional Subscription on registration under active policy', () => {
    // Check default policy has DRIVER active
    const policies = getCategoryPromoPolicies();
    const driverPolicy = policies.find((p) => p.category === 'DRIVER');
    expect(driverPolicy).toBeDefined();
    expect(driverPolicy?.isFreePromoActive).toBe(true);

    // Register a new driver
    const regRes = registerNewUser({
      name: 'Tariq Chauffeur',
      phone: '03099988771',
      password: 'Password123!',
      role: 'DRIVER',
      city: 'Lahore',
      countryCode: 'PK',
    });

    expect(regRes.success).toBe(true);
    expect(regRes.user?.subscription?.status).toBe('ACTIVE');
    expect(regRes.user?.subscription?.amountPaid).toBe(0);
    expect(regRes.user?.subscription?.originalAmount).toBe(7000);
    expect(regRes.user?.subscription?.quota).toBe(1);
    expect(regRes.user?.subscription?.billingCycle).toBe('ANNUAL');
    expect(regRes.user?.subscription?.discountPercentage).toBe(100);
    expect(regRes.user?.subscription?.isFreePromo).toBe(true);

    // Financial ledger must record 0 PKR invoice
    const ledger = getAllSubscriptionPayments();
    const driverSlip = ledger.find((l) => l.userId === regRes.user?.id);
    expect(driverSlip).toBeDefined();
    expect(driverSlip?.amountPaid).toBe(0);
    expect(driverSlip?.originalAmount).toBe(7000);
    expect(driverSlip?.discountPercentage).toBe(100);
    expect(driverSlip?.status).toBe('CONFIRMED');
    expect(driverSlip?.isFreePromo).toBe(true);
  });

  it('T2: Super Admin grants individual 100% Free Subscription Waiver with custom expiry and original value', () => {
    // Register a lister without auto-free promo
    const listerRes = registerNewUser({
      name: 'Malik Car Rentals',
      phone: '03219876543',
      password: 'Password123!',
      role: 'LISTER',
      city: 'Islamabad',
    });
    expect(listerRes.success).toBe(true);
    const userId = listerRes.user!.id;

    // Super Admin grants free waiver
    const grantRes = grantFreePromotionalSubscription({
      userId,
      planName: 'Commercial Fleet Hub Pass (100% Free Promo)',
      originalPrice: 12000,
      durationDays: 60,
      reason: 'VIP Early Fleet Onboarding Waiver',
      grantedBy: 'Super Admin',
    });

    expect(grantRes.success).toBe(true);
    expect(grantRes.user?.subscription?.status).toBe('ACTIVE');
    expect(grantRes.user?.subscription?.amountPaid).toBe(0);
    expect(grantRes.user?.subscription?.originalAmount).toBe(12000);
    expect(grantRes.user?.subscription?.discountPercentage).toBe(100);
    expect(grantRes.user?.subscription?.isFreePromo).toBe(true);
    expect(grantRes.user?.subscription?.planName).toBe('Commercial Fleet Hub Pass (100% Free Promo)');

    // Ledger inspection
    const ledger = getAllSubscriptionPayments();
    const listerSlip = ledger.find((l) => l.userId === userId);
    expect(listerSlip).toBeDefined();
    expect(listerSlip?.amountPaid).toBe(0);
    expect(listerSlip?.originalAmount).toBe(12000);
    expect(listerSlip?.status).toBe('CONFIRMED');
  });

  it('T3: Super Admin can toggle Category Promotional Free Policy dynamically', () => {
    // Toggle DRIVER policy off
    toggleCategoryPromoPolicy('DRIVER');
    let policies = getCategoryPromoPolicies();
    let driverPol = policies.find((p) => p.category === 'DRIVER');
    expect(driverPol?.isFreePromoActive).toBe(false);

    // Register a driver when policy is disabled -> should be UNSUBSCRIBED
    const regRes = registerNewUser({
      name: 'Akram Driver',
      phone: '03115544332',
      password: 'Password123!',
      role: 'DRIVER',
      city: 'Karachi',
    });
    expect(regRes.success).toBe(true);
    expect(regRes.user?.subscription?.status).toBe('UNSUBSCRIBED');

    // Toggle DRIVER policy back ON
    toggleCategoryPromoPolicy('DRIVER');
    policies = getCategoryPromoPolicies();
    driverPol = policies.find((p) => p.category === 'DRIVER');
    expect(driverPol?.isFreePromoActive).toBe(true);
  });

  it('T4: syncSubscriptionExpiries automatically pauses expired subscriptions and pauses their fleet listings', () => {
    // Register user with a past expiry date
    const regRes = registerNewUser({
      name: 'Bilal Fleet Expired',
      phone: '03339988776',
      password: 'Password123!',
      role: 'LISTER',
      city: 'Lahore',
    });
    expect(regRes.success).toBe(true);
    const userId = regRes.user!.id;

    // Manually set subscription to expired in the past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // 2 days ago

    const all = getAllRegisteredUsers();
    const u = all.find((usr) => usr.id === userId);
    if (u) {
      u.subscription = {
        status: 'ACTIVE',
        validUntil: pastDate.toISOString(),
        endDate: pastDate.toISOString(),
        quota: 10,
        usedQuota: 1,
      };
      saveAllRegisteredUsers(all);
    }

    // Put a LIVE vehicle into their fleet in localStorage
    const fleetKey = `safarpk_fleet_${userId}`;
    localStorage.setItem(
      fleetKey,
      JSON.stringify([
        {
          id: 'v-1',
          title: 'Toyota Corolla 2024',
          status: 'LIVE',
        },
      ])
    );

    // Run syncSubscriptionExpiries
    const syncRes = syncSubscriptionExpiries();
    expect(syncRes.expiredCount).toBeGreaterThanOrEqual(1);

    // User subscription must now be PAUSED
    const updatedUsers = getAllRegisteredUsers();
    const updatedUser = updatedUsers.find((usr) => usr.id === userId);
    expect(updatedUser?.subscription?.status).toBe('PAUSED');

    // Fleet in localStorage must now be automatically PAUSED
    const updatedFleet = JSON.parse(localStorage.getItem(fleetKey) || '[]');
    expect(updatedFleet[0].status).toBe('PAUSED');
  });

  it('T5: syncUserListingsQuota strictly limits LIVE listings to the quota and pauses excess', () => {
    const userId = 'usr-fleet-quota-test';
    const fleetKey = `safarpk_fleet_${userId}`;

    // Add 4 vehicles
    localStorage.setItem(
      fleetKey,
      JSON.stringify([
        { id: 'v-101', title: 'Car 1', status: 'PENDING' },
        { id: 'v-102', title: 'Car 2', status: 'PENDING' },
        { id: 'v-103', title: 'Car 3', status: 'PENDING' },
        { id: 'v-104', title: 'Car 4', status: 'PENDING' },
      ])
    );

    // Sync with quota = 2 and isActive = true
    const result = syncUserListingsQuota(userId, 2, true);
    expect(result.total).toBe(4);
    expect(result.live).toBe(2);
    expect(result.paused).toBe(2);

    const updated = JSON.parse(localStorage.getItem(fleetKey) || '[]');
    expect(updated[0].status).toBe('LIVE');
    expect(updated[1].status).toBe('LIVE');
    expect(updated[2].status).toBe('PAUSED');
    expect(updated[3].status).toBe('PAUSED');

    // Paused listings IDs in storage must include excess
    expect(isListingPaused('v-101')).toBe(false);
    expect(isListingPaused('v-102')).toBe(false);
    expect(isListingPaused('v-103')).toBe(true);
    expect(isListingPaused('v-104')).toBe(true);
  });

  it('T6: toggleUserSubscriptionPause pauses all listings when subscription is paused and reactivates up to quota', () => {
    const regRes = registerNewUser({
      name: 'Raza Motors',
      phone: '03001122334',
      password: 'Password123!',
      role: 'LISTER',
      city: 'Rawalpindi',
    });
    expect(regRes.success).toBe(true);
    const userId = regRes.user!.id;
    const fleetKey = `safarpk_fleet_${userId}`;

    // Grant 100% Free 12-month pass with quota = 1
    grantFreePromotionalSubscription({
      userId,
      planName: 'Starter Chauffeur Pass (Annual)',
      originalPrice: 7000,
      durationDays: 365,
      quota: 1,
      billingCycle: 'ANNUAL',
      reason: '12 Month Special Free Listing',
      grantedBy: 'Super Admin',
    });

    localStorage.setItem(
      fleetKey,
      JSON.stringify([
        { id: 'v-201', title: 'Honda Civic', status: 'LIVE' },
        { id: 'v-202', title: 'Toyota Yaris', status: 'PAUSED' },
      ])
    );

    // 1. Pause subscription
    const pauseRes = toggleUserSubscriptionPause(userId, 'Super Admin');
    expect(pauseRes.success).toBe(true);
    expect(pauseRes.isPaused).toBe(true);

    // Both listings must now be paused
    const pausedFleet = JSON.parse(localStorage.getItem(fleetKey) || '[]');
    expect(pausedFleet[0].status).toBe('PAUSED');
    expect(pausedFleet[1].status).toBe('PAUSED');
    expect(isListingPaused('v-201')).toBe(true);
    expect(isListingPaused('v-202')).toBe(true);

    // Also isListingPaused with owner phone should return true
    expect(isListingPaused('any-listing', '03001122334')).toBe(true);

    // 2. Resume subscription -> should activate only up to quota (1)
    const resumeRes = toggleUserSubscriptionPause(userId, 'Super Admin');
    expect(resumeRes.success).toBe(true);
    expect(resumeRes.isPaused).toBe(false);

    const resumedFleet = JSON.parse(localStorage.getItem(fleetKey) || '[]');
    expect(resumedFleet[0].status).toBe('LIVE');
    expect(resumedFleet[1].status).toBe('PAUSED');
    expect(isListingPaused('v-201')).toBe(false);
    expect(isListingPaused('v-202')).toBe(true);
  });
});
