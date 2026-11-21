import { describe, it, expect, beforeEach } from 'vitest';
import {
  STANDARD_DOCUMENTS,
  getDocRulesForCountry,
  saveDocRulesForCountry,
  getRoleDocRequirement,
  isDocActiveForRole,
  isDocMandatoryForRole,
  getRoleActiveDocList,
  isListingBlockedByDocs,
  isBookingBlockedForCustomer,
  mapRoleToDocKey,
  mapDocNameToId,
  DocRuleItem,
} from '../src/data/docRules';

describe('Central Document Verification Matrix & Role-Based Checklist Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defines exactly the 4 standard documents', () => {
    expect(STANDARD_DOCUMENTS).toHaveLength(4);
    const ids = STANDARD_DOCUMENTS.map((d) => d.id);
    expect(ids).toContain('license');
    expect(ids).toContain('cnic');
    expect(ids).toContain('ntn');
    expect(ids).toContain('owner_card');
  });

  it('initializes default platform state with all 4 documents set to Off across all roles', () => {
    const rules = getDocRulesForCountry('PK');
    expect(rules).toHaveLength(4);

    rules.forEach((rule) => {
      expect(rule.owner).toBe('Off');
      expect(rule.driver).toBe('Off');
      expect(rule.shuttle).toBe('Off');
      expect(rule.mover).toBe('Off');
      expect(rule.renter).toBe('Off');
    });

    // Verification helpers confirm they are not active
    expect(isDocActiveForRole('CUSTOMER', 'cnic')).toBe(false);
    expect(isDocActiveForRole('LISTER', 'owner_card')).toBe(false);
    expect(isDocActiveForRole('DRIVER', 'license')).toBe(false);
    expect(isDocActiveForRole('PROVIDER', 'ntn')).toBe(false);
  });

  it('correctly maps application user roles to document matrix columns', () => {
    expect(mapRoleToDocKey('CUSTOMER')).toBe('renter');
    expect(mapRoleToDocKey('RENTER')).toBe('renter');
    expect(mapRoleToDocKey('LISTER')).toBe('owner');
    expect(mapRoleToDocKey('DRIVER')).toBe('driver');
    expect(mapRoleToDocKey('PROVIDER', 'COMMERCIAL_CARGO')).toBe('mover');
    expect(mapRoleToDocKey('PROVIDER', 'SHUTTLE_SERVICE')).toBe('shuttle');
  });

  it('allows unblocked listing and booking when documents are set to Off', () => {
    // Lister with zero documents uploaded
    const listerCheck = isListingBlockedByDocs('LISTER', {});
    expect(listerCheck.isBlocked).toBe(false);
    expect(listerCheck.missingDocs).toHaveLength(0);

    // Customer with zero documents uploaded booking self-drive
    const customerCheck = isBookingBlockedForCustomer({}, true);
    expect(customerCheck.isBlocked).toBe(false);
    expect(customerCheck.missingDocs).toHaveLength(0);

    // Active doc list for Lister and Customer is empty
    expect(getRoleActiveDocList('LISTER')).toHaveLength(0);
    expect(getRoleActiveDocList('CUSTOMER')).toHaveLength(0);
  });

  it('enforces mandatory upload when Super Admin turns documents to Upload', () => {
    const rules = getDocRulesForCountry('PK');
    const updated: DocRuleItem[] = rules.map((r) => {
      const id = mapDocNameToId(r.docName);
      if (id === 'cnic') {
        return { ...r, owner: 'Upload', renter: 'Upload' };
      }
      if (id === 'owner_card') {
        return { ...r, owner: 'Upload' };
      }
      return r;
    });

    saveDocRulesForCountry('PK', updated);

    // Now CNIC & Owner Card are active and mandatory for Lister
    expect(isDocActiveForRole('LISTER', 'cnic')).toBe(true);
    expect(isDocMandatoryForRole('LISTER', 'cnic')).toBe(true);
    expect(isDocActiveForRole('LISTER', 'owner_card')).toBe(true);
    expect(isDocMandatoryForRole('LISTER', 'owner_card')).toBe(true);

    // Lister missing CNIC & Owner Card is blocked
    const blockedCheck = isListingBlockedByDocs('LISTER', {});
    expect(blockedCheck.isBlocked).toBe(true);
    expect(blockedCheck.missingDocs).toContain('CNIC');
    expect(blockedCheck.missingDocs).toContain('Car Owner Card');

    // When documents are uploaded, block is lifted
    const unblockedCheck = isListingBlockedByDocs('LISTER', {
      cnicUploaded: true,
      ownerCardUploaded: true,
    });
    expect(unblockedCheck.isBlocked).toBe(false);

    // Customer is blocked if booking and CNIC is mandatory
    const customerCheck = isBookingBlockedForCustomer({}, true);
    expect(customerCheck.isBlocked).toBe(true);
    expect(customerCheck.missingDocs).toContain('CNIC');

    // Customer with uploaded CNIC is unblocked
    const customerVerifiedCheck = isBookingBlockedForCustomer({ cnicUploaded: true }, true);
    expect(customerVerifiedCheck.isBlocked).toBe(false);
  });

  it('allows Optional status without blocking actions', () => {
    const rules = getDocRulesForCountry('PK');
    const updated: DocRuleItem[] = rules.map((r) => {
      const id = mapDocNameToId(r.docName);
      if (id === 'ntn') {
        return { ...r, owner: 'Optional' };
      }
      return r;
    });

    saveDocRulesForCountry('PK', updated);

    expect(isDocActiveForRole('LISTER', 'ntn')).toBe(true);
    expect(isDocMandatoryForRole('LISTER', 'ntn')).toBe(false);

    const activeList = getRoleActiveDocList('LISTER');
    expect(activeList).toHaveLength(1);
    expect(activeList[0].id).toBe('ntn');
    expect(activeList[0].isMandatory).toBe(false);

    // Optional doc does NOT block listing
    const check = isListingBlockedByDocs('LISTER', {});
    expect(check.isBlocked).toBe(false);
  });
});

