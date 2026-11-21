'use client';

export type DocRequirement = 'Upload' | 'Type it' | 'Optional' | 'Off';

export type StandardDocId = 'cnic' | 'license' | 'ntn' | 'owner_card';

export interface StandardDocMeta {
  id: StandardDocId;
  name: string;
  shortLabel: string;
  description: string;
}

export const STANDARD_DOCUMENTS: StandardDocMeta[] = [
  {
    id: 'license',
    name: 'Driving licence',
    shortLabel: 'Driving License',
    description: 'Valid Driving Licence (LTV / HTV / Motorcar) issued by Traffic Police / Licensing Authority',
  },
  {
    id: 'cnic',
    name: 'National ID (CNIC)',
    shortLabel: 'CNIC',
    description: 'Government NADRA CNIC or Smart National Identity Card (Front & Back)',
  },
  {
    id: 'ntn',
    name: 'Business FBR NTN',
    shortLabel: 'FBR NTN',
    description: 'Federal Board of Revenue (FBR) National Tax Number or Business Registration Certificate',
  },
  {
    id: 'owner_card',
    name: 'Car Owner Card (Excise Smart Card)',
    shortLabel: 'Car Owner Card',
    description: 'Excise & Taxation Vehicle Registration Book or Smart Card ownership proof',
  },
];

export interface DocRuleItem {
  docName: string;
  category?: 'all' | 'rent_car' | 'driver' | 'shuttle' | 'movers';
  owner: DocRequirement;
  driver: DocRequirement;
  shuttle: DocRequirement;
  mover: DocRequirement;
  renter: DocRequirement;
}

/**
 * Default Document Verification Rules:
 * Initially set to 'Off' (Disabled) platform-wide so Super Admin can allow
 * instant listings and bookings without any document blockers, and turn ON / mandatory
 * as needed per role.
 */
export const DEFAULT_DOC_RULES: Record<string, DocRuleItem[]> = {
  PK: [
    { docName: 'Driving licence', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'National ID (CNIC)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Business FBR NTN', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Car Owner Card (Excise Smart Card)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
  ],
  AE: [
    { docName: 'Driving licence', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'National ID (CNIC)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Business FBR NTN', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Car Owner Card (Excise Smart Card)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
  ],
  SA: [
    { docName: 'Driving licence', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'National ID (CNIC)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Business FBR NTN', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Car Owner Card (Excise Smart Card)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
  ],
  GB: [
    { docName: 'Driving licence', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'National ID (CNIC)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Business FBR NTN', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Car Owner Card (Excise Smart Card)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
  ],
  DE: [
    { docName: 'Driving licence', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'National ID (CNIC)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Business FBR NTN', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    { docName: 'Car Owner Card (Excise Smart Card)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
  ],
};

const STORAGE_DOC_RULES_KEY = 'safarpk_doc_rules_by_country_v3';
const STORAGE_DOC_MASTER_ASK_KEY = 'safarpk_doc_master_ask';

/**
 * Standardize and sanitize rules array to strictly include the 4 documents
 */
function sanitizeRulesArray(rawList: any[]): DocRuleItem[] {
  const map: Record<StandardDocId, DocRuleItem> = {
    license: { docName: 'Driving licence', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    cnic: { docName: 'National ID (CNIC)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    ntn: { docName: 'Business FBR NTN', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
    owner_card: { docName: 'Car Owner Card (Excise Smart Card)', owner: 'Off', driver: 'Off', shuttle: 'Off', mover: 'Off', renter: 'Off' },
  };

  if (Array.isArray(rawList)) {
    rawList.forEach((r) => {
      const docId = mapDocNameToId(r.docName || '');
      if (docId && map[docId]) {
        map[docId] = {
          docName: map[docId].docName,
          owner: r.owner || 'Off',
          driver: r.driver || 'Off',
          shuttle: r.shuttle || 'Off',
          mover: r.mover || 'Off',
          renter: r.renter || 'Off',
        };
      }
    });
  }

  return [map.license, map.cnic, map.ntn, map.owner_card];
}

/**
 * Get all document rules mapped by country
 */
export function getAllCountryDocRules(): Record<string, DocRuleItem[]> {
  if (typeof window === 'undefined') return DEFAULT_DOC_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_DOC_RULES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DOC_RULES_KEY, JSON.stringify(DEFAULT_DOC_RULES));
      return DEFAULT_DOC_RULES;
    }
    const parsed = JSON.parse(raw);
    const result: Record<string, DocRuleItem[]> = {};
    for (const [code, items] of Object.entries(parsed)) {
      result[code] = sanitizeRulesArray(items as any[]);
    }
    if (!result['PK']) {
      result['PK'] = DEFAULT_DOC_RULES['PK'];
    }
    return result;
  } catch (e) {
    return DEFAULT_DOC_RULES;
  }
}

/**
 * Get document rules for a specific country
 */
export function getDocRulesForCountry(countryCode: string): DocRuleItem[] {
  const all = getAllCountryDocRules();
  const c = (countryCode || 'PK').toUpperCase();
  return all[c] || all['PK'] || DEFAULT_DOC_RULES['PK'];
}

/**
 * Save document rules for a specific country
 */
export function saveDocRulesForCountry(countryCode: string, rules: DocRuleItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllCountryDocRules();
    const c = (countryCode || 'PK').toUpperCase();
    all[c] = sanitizeRulesArray(rules);
    localStorage.setItem(STORAGE_DOC_RULES_KEY, JSON.stringify(all));
    window.dispatchEvent(
      new CustomEvent('safarpk_doc_rules_updated', {
        detail: { countryCode: c, rules: all[c] },
      })
    );
  } catch (e) {
    console.error('Failed to save document rules', e);
  }
}

/**
 * Save all rules
 */
export function saveAllCountryDocRules(all: Record<string, DocRuleItem[]>): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized: Record<string, DocRuleItem[]> = {};
    for (const [code, items] of Object.entries(all)) {
      sanitized[code] = sanitizeRulesArray(items);
    }
    localStorage.setItem(STORAGE_DOC_RULES_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(
      new CustomEvent('safarpk_doc_rules_updated', {
        detail: { all: sanitized },
      })
    );
  } catch (e) {
    console.error('Failed to save all doc rules', e);
  }
}

/**
 * Check if Master Document asking is enabled
 */
export function isMasterDocAskEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_DOC_MASTER_ASK_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

/**
 * Set Master Document asking
 */
export function setMasterDocAskEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_DOC_MASTER_ASK_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('safarpk_doc_rules_updated', {
        detail: { masterDocAsk: enabled },
      })
    );
  } catch (e) {
    console.error('Failed to set master doc ask', e);
  }
}

/**
 * Map document name / string to standard ID ('cnic' | 'license' | 'ntn' | 'owner_card')
 */
export function mapDocNameToId(docName: string): StandardDocId | null {
  const norm = docName.toLowerCase();
  if (norm.includes('licence') || norm.includes('license') || norm.includes('führerschein') || norm.includes('driving')) {
    return 'license';
  }
  if (norm.includes('cnic') || norm.includes('national id') || norm.includes('identity') || norm.includes('emirates id') || norm.includes('iqama') || norm.includes('passport')) {
    return 'cnic';
  }
  if (norm.includes('ntn') || norm.includes('business') || norm.includes('trade') || norm.includes('tax')) {
    return 'ntn';
  }
  if (norm.includes('owner card') || norm.includes('registration') || norm.includes('smart card') || norm.includes('mulkiya') || norm.includes('istimara') || norm.includes('logbook')) {
    return 'owner_card';
  }
  return null;
}

/**
 * Map user role to document matrix column key
 */
export function mapRoleToDocKey(role?: string, providerSubtype?: string): 'owner' | 'driver' | 'shuttle' | 'mover' | 'renter' {
  if (!role) return 'renter';
  const r = role.toUpperCase();
  if (r === 'LISTER' || r === 'OWNER') return 'owner';
  if (r === 'DRIVER') return 'driver';
  if (r === 'PROVIDER') {
    if (providerSubtype === 'COMMERCIAL_CARGO') return 'mover';
    if (providerSubtype === 'CITY_TO_CITY') return 'owner';
    return 'shuttle';
  }
  return 'renter';
}

/**
 * Get requirement for a specific role and standard document ID
 */
export function getRoleDocRequirement(
  role: string,
  docId: StandardDocId,
  countryCode: string = 'PK',
  providerSubtype?: string
): DocRequirement {
  if (!isMasterDocAskEnabled()) return 'Off';
  const rules = getDocRulesForCountry(countryCode);
  const roleKey = mapRoleToDocKey(role, providerSubtype);
  const item = rules.find((r) => mapDocNameToId(r.docName) === docId);
  return item ? item[roleKey] : 'Off';
}

/**
 * Check if a document is ACTIVE (either Mandatory 'Upload', 'Type it', or 'Optional')
 * If 'Off', returns false.
 */
export function isDocActiveForRole(
  role: string,
  docId: StandardDocId,
  countryCode: string = 'PK',
  providerSubtype?: string
): boolean {
  const req = getRoleDocRequirement(role, docId, countryCode, providerSubtype);
  return req !== 'Off';
}

/**
 * Check if a document is strictly MANDATORY before listing or booking
 */
export function isDocMandatoryForRole(
  role: string,
  docId: StandardDocId,
  countryCode: string = 'PK',
  providerSubtype?: string
): boolean {
  const req = getRoleDocRequirement(role, docId, countryCode, providerSubtype);
  return req === 'Upload';
}

/**
 * Returns list of standard documents that Super Admin has turned ON for this role
 * (Documents marked 'Off' are strictly excluded and hidden platform-wide)
 */
export function getRoleActiveDocList(
  role: string,
  countryCode: string = 'PK',
  providerSubtype?: string
): (StandardDocMeta & { requirement: DocRequirement; isMandatory: boolean })[] {
  return STANDARD_DOCUMENTS.map((doc) => {
    const requirement = getRoleDocRequirement(role, doc.id, countryCode, providerSubtype);
    return {
      ...doc,
      requirement,
      isMandatory: requirement === 'Upload',
    };
  }).filter((d) => d.requirement !== 'Off');
}

/**
 * Helper to check Renter (Customer) document requirements for a country.
 */
export function getRenterDocRequirement(
  countryCode: string,
  docType: 'licence' | 'id'
): { requirement: DocRequirement; docName: string } {
  const rules = getDocRulesForCountry(countryCode);
  if (docType === 'licence') {
    const found = rules.find((r) => mapDocNameToId(r.docName) === 'license');
    return {
      requirement: found ? found.renter : 'Off',
      docName: found ? found.docName : 'Driving licence',
    };
  }
  const found = rules.find((r) => mapDocNameToId(r.docName) === 'cnic');
  return {
    requirement: found ? found.renter : 'Off',
    docName: found ? found.docName : 'National ID (CNIC)',
  };
}

/**
 * Check if a vendor/host is blocked from publishing listings due to missing mandatory documents
 */
export function isListingBlockedByDocs(
  userRole: string,
  userDocs: {
    cnicUploaded?: boolean;
    licenseUploaded?: boolean;
    ntnUploaded?: boolean;
    ownerCardUploaded?: boolean;
  },
  countryCode: string = 'PK',
  providerSubtype?: string
): { isBlocked: boolean; missingDocs: string[] } {
  const missingDocs: string[] = [];
  const activeDocs = getRoleActiveDocList(userRole, countryCode, providerSubtype);

  activeDocs.forEach((doc) => {
    if (doc.isMandatory) {
      if (doc.id === 'cnic' && !userDocs.cnicUploaded) {
        missingDocs.push(doc.shortLabel);
      }
      if (doc.id === 'license' && !userDocs.licenseUploaded) {
        missingDocs.push(doc.shortLabel);
      }
      if (doc.id === 'ntn' && !userDocs.ntnUploaded) {
        missingDocs.push(doc.shortLabel);
      }
      if (doc.id === 'owner_card' && !userDocs.ownerCardUploaded) {
        missingDocs.push(doc.shortLabel);
      }
    }
  });

  return {
    isBlocked: missingDocs.length > 0,
    missingDocs,
  };
}

/**
 * Check if a Customer is blocked from completing a booking due to missing mandatory documents
 */
export function isBookingBlockedForCustomer(
  userDocs: {
    cnicUploaded?: boolean;
    licenseUploaded?: boolean;
  },
  isSelfDrive: boolean = true,
  countryCode: string = 'PK'
): { isBlocked: boolean; missingDocs: string[] } {
  const missingDocs: string[] = [];
  const cnicMandatory = isDocMandatoryForRole('CUSTOMER', 'cnic', countryCode);
  const licenseMandatory = isDocMandatoryForRole('CUSTOMER', 'license', countryCode);

  if (cnicMandatory && !userDocs.cnicUploaded) {
    missingDocs.push('CNIC');
  }
  if (isSelfDrive && licenseMandatory && !userDocs.licenseUploaded) {
    missingDocs.push('Driving License');
  }

  return {
    isBlocked: missingDocs.length > 0,
    missingDocs,
  };
}
