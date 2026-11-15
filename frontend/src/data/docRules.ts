'use client';

export type DocRequirement = 'Upload' | 'Type it' | 'Optional' | 'Off';

export interface DocRuleItem {
  docName: string;
  category?: 'all' | 'rent_car' | 'driver' | 'shuttle' | 'movers';
  owner: DocRequirement;
  driver: DocRequirement;
  shuttle: DocRequirement;
  mover: DocRequirement;
  renter: DocRequirement;
}

export const DEFAULT_DOC_RULES: Record<string, DocRuleItem[]> = {
  PK: [
    { docName: 'National ID (CNIC)', owner: 'Upload', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Type it' },
    { docName: 'Driving licence', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Business / trade licence', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Vehicle registration smart card', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Police verification character certificate', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Optional', renter: 'Off' },
  ],
  AE: [
    { docName: 'National ID (Emirates ID)', owner: 'Upload', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Driving licence (RTA)', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Business / trade licence', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Vehicle Mulkiya card', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Police clearance certificate', owner: 'Off', driver: 'Upload', shuttle: 'Upload', mover: 'Off', renter: 'Off' },
  ],
  SA: [
    { docName: 'National ID (Iqama / Muqeem)', owner: 'Upload', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Driving licence (Murroor)', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Commercial Registration (CR)', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Vehicle Istimara card', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Police clearance', owner: 'Off', driver: 'Upload', shuttle: 'Upload', mover: 'Off', renter: 'Off' },
  ],
  GB: [
    { docName: 'National Insurance / Proof of ID', owner: 'Upload', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Type it' },
    { docName: 'DVLA Driving licence', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Companies House Certificate', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'V5C Vehicle logbook', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'DBS Background check', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Optional', renter: 'Off' },
  ],
  DE: [
    { docName: 'Personalausweis / Reisepass', owner: 'Upload', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Type it' },
    { docName: 'Führerschein (EU Driving licence)', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Upload', renter: 'Upload' },
    { docName: 'Gewerbeanmeldung', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Fahrzeugschein (Zulassungsbescheinigung)', owner: 'Upload', driver: 'Off', shuttle: 'Upload', mover: 'Upload', renter: 'Off' },
    { docName: 'Polizeiliches Führungszeugnis', owner: 'Optional', driver: 'Upload', shuttle: 'Upload', mover: 'Optional', renter: 'Off' },
  ],
};

const STORAGE_DOC_RULES_KEY = 'safarpk_doc_rules_by_country';
const STORAGE_DOC_MASTER_ASK_KEY = 'safarpk_doc_master_ask';

/**
 * Get all document rules mapped by country
 */
export function getAllCountryDocRules(): Record<string, DocRuleItem[]> {
  if (typeof window === 'undefined') return DEFAULT_DOC_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_DOC_RULES_KEY);
    if (!raw) return DEFAULT_DOC_RULES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DOC_RULES, ...parsed };
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
    all[c] = rules;
    localStorage.setItem(STORAGE_DOC_RULES_KEY, JSON.stringify(all));
    window.dispatchEvent(
      new CustomEvent('safarpk_doc_rules_updated', {
        detail: { countryCode: c, rules },
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
    localStorage.setItem(STORAGE_DOC_RULES_KEY, JSON.stringify(all));
    window.dispatchEvent(
      new CustomEvent('safarpk_doc_rules_updated', {
        detail: { all },
      })
    );
  } catch (e) {
    console.error('Failed to save all doc rules', e);
  }
}

/**
 * Helper to check Renter (Customer) document requirements for a country.
 * e.g., 'licence' or 'id'
 */
export function getRenterDocRequirement(
  countryCode: string,
  docType: 'licence' | 'id'
): { requirement: DocRequirement; docName: string } {
  const rules = getDocRulesForCountry(countryCode);

  if (docType === 'licence') {
    const found = rules.find((r) =>
      /licence|license|führerschein|rta|murroor/i.test(r.docName)
    );
    return {
      requirement: found ? found.renter : 'Upload',
      docName: found ? found.docName : 'Driving licence',
    };
  }

  // 'id' (National ID / CNIC / Emirates ID / Iqama / Passport)
  const found = rules.find((r) =>
    /national id|cnic|emirates id|iqama|passport|personalausweis|insurance/i.test(
      r.docName
    )
  );
  return {
    requirement: found ? found.renter : 'Type it',
    docName: found ? found.docName : 'National ID (CNIC)',
  };
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

