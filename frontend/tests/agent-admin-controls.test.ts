import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllRegisteredUsers,
  saveAllRegisteredUsers,
  createAgentUser,
  toggleUserSubscriptionPause,
  toggleUserProfileDeactivation,
  getPausedListingIds,
  isListingPaused,
  toggleListingPause,
  RegisteredUser,
  getActiveUser,
  setActiveUser,
} from '../src/data/userAuth';
import { getAgentPermissions } from '../src/data/agentPermissions';
import { getAuditLogs } from '../src/data/auditLog';

describe('Super Admin & Agent Operational Controls Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('T1: Super Admin creates Agent account and strictly denies deletion power', () => {
    const res = createAgentUser({
      name: 'Agent Farhan Test',
      email: 'farhan.test@safarpk.com',
      phone: '+92 300 9988776',
      city: 'Lahore',
      desk: 'Lahore Compliance Desk',
      staffId: 'AGY-PK-999',
    });

    expect(res.success).toBe(true);
    expect(res.agent).toBeDefined();
    expect(res.agent?.role).toBe('AGENT');
    expect(res.agent?.employeeId).toBe('AGY-PK-999');

    // Verify stored in users registry
    const all = getAllRegisteredUsers();
    const found = all.find((u) => u.email === 'farhan.test@safarpk.com');
    expect(found).toBeDefined();
    expect(found?.role).toBe('AGENT');

    // Verify agent permissions enforce del = false
    const perms = getAgentPermissions(res.agent!.id);
    expect(perms.del).toBe(false);
    expect(perms.view).toBe(true);
    expect(perms.approve).toBe(true);
  });

  it('T2: Rejects duplicate agent creation', () => {
    createAgentUser({
      name: 'Agent One',
      email: 'agent1@safarpk.com',
      phone: '+92 300 1112223',
    });

    const dup = createAgentUser({
      name: 'Agent Two Duplicate',
      email: 'agent1@safarpk.com',
      phone: '+92 300 1112223',
    });

    expect(dup.success).toBe(false);
    expect(dup.error).toContain('already exists');
  });

  it('T3: Pause and Resume user subscription by Super Admin or Agent', () => {
    const testUser: RegisteredUser = {
      id: 'test-host-1',
      name: 'Host Tariq',
      email: 'host@safarpk.com',
      phone: '+92 300 7776655',
      password: 'password123',
      city: 'Lahore',
      countryCode: 'PK',
      role: 'LISTER',
      registeredAt: new Date().toISOString(),
      kycStatus: 'VERIFIED',
      subscription: {
        status: 'ACTIVE',
        quota: 5,
        usedQuota: 2,
        planName: 'Fleet Basic',
      },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
      activities: [],
    };
    saveAllRegisteredUsers([testUser]);
    setActiveUser(testUser);

    // Pause subscription
    const pauseRes = toggleUserSubscriptionPause('test-host-1', 'AGY-PK-101');
    expect(pauseRes.success).toBe(true);
    expect(pauseRes.isPaused).toBe(true);

    const pausedUser = getAllRegisteredUsers().find((u) => u.id === 'test-host-1');
    expect(pausedUser?.subscription.status).toBe('PAUSED');
    expect(getActiveUser()?.subscription.status).toBe('PAUSED');

    // Resume subscription
    const resumeRes = toggleUserSubscriptionPause('test-host-1', 'AGY-PK-101');
    expect(resumeRes.success).toBe(true);
    expect(resumeRes.isPaused).toBe(false);

    const resumedUser = getAllRegisteredUsers().find((u) => u.id === 'test-host-1');
    expect(resumedUser?.subscription.status).toBe('ACTIVE');
    expect(getActiveUser()?.subscription.status).toBe('ACTIVE');
  });

  it('T4: Deactivate and Reactivate user profile', () => {
    const testDriver: RegisteredUser = {
      id: 'test-driver-1',
      name: 'Driver Arshad',
      email: 'driver@safarpk.com',
      phone: '+92 300 5554433',
      password: 'password123',
      city: 'Karachi',
      countryCode: 'PK',
      role: 'DRIVER',
      registeredAt: new Date().toISOString(),
      kycStatus: 'VERIFIED',
      subscription: {
        status: 'ACTIVE',
        quota: 1,
        usedQuota: 1,
      },
      metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
      activities: [],
    };
    saveAllRegisteredUsers([testDriver]);

    // Deactivate
    const deactRes = toggleUserProfileDeactivation('test-driver-1', 'Pending KYC Document Review', 'Super Admin');
    expect(deactRes.success).toBe(true);
    expect(deactRes.isDeactivated).toBe(true);

    let found = getAllRegisteredUsers().find((u) => u.id === 'test-driver-1');
    expect(found?.isDeactivated).toBe(true);
    expect(found?.deactivatedReason).toBe('Pending KYC Document Review');

    // Reactivate
    const reactRes = toggleUserProfileDeactivation('test-driver-1', undefined, 'Super Admin');
    expect(reactRes.success).toBe(true);
    expect(reactRes.isDeactivated).toBe(false);

    found = getAllRegisteredUsers().find((u) => u.id === 'test-driver-1');
    expect(found?.isDeactivated).toBe(false);
  });

  it('T5: Pause and Resume Marketplace Listings', () => {
    const listingId = 'car-corolla-altis-1';

    expect(isListingPaused(listingId)).toBe(false);

    // Pause listing
    const pauseRes = toggleListingPause(listingId, 'Agent Kashif', 'LST-889900');
    expect(pauseRes.success).toBe(true);
    expect(pauseRes.isPaused).toBe(true);
    expect(isListingPaused(listingId)).toBe(true);
    expect(getPausedListingIds()).toContain(listingId);

    // Resume listing
    const resumeRes = toggleListingPause(listingId, 'Agent Kashif', 'LST-889900');
    expect(resumeRes.success).toBe(true);
    expect(resumeRes.isPaused).toBe(false);
    expect(isListingPaused(listingId)).toBe(false);
    expect(getPausedListingIds()).not.toContain(listingId);
  });
});

