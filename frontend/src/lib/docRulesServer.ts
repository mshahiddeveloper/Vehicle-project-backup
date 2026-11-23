/**
 * SafarPK Enterprise Dynamic Document Verification Rules Engine
 * 
 * Allows Super Admin toggles in `document_verification_rules` to immediately
 * control required KYC uploads per role across frontend and backend.
 */

import { getNeonSqlClient } from './db';

export interface DocumentVerificationRule {
  id: string;
  role: string;
  providerSubtype?: string | null;
  documentType: string;
  isMandatory: boolean;
  isHidden: boolean;
}

/**
 * Fetches dynamic document verification rules for a role
 */
export async function getRulesForRole(
  role: string,
  providerSubtype?: string | null
): Promise<DocumentVerificationRule[]> {
  const sql = getNeonSqlClient();
  const rows = await sql`
    SELECT id, role, provider_subtype, document_type, is_mandatory, is_hidden
    FROM document_verification_rules
    WHERE role = ${role}::user_role_enum
      AND (
        provider_subtype IS NULL 
        OR provider_subtype = ${providerSubtype || null}::provider_subtype_enum
      )
      AND is_hidden = FALSE;
  `;

  return rows.map((r: any) => ({
    id: r.id,
    role: r.role,
    providerSubtype: r.provider_subtype,
    documentType: r.document_type,
    isMandatory: r.is_mandatory,
    isHidden: r.is_hidden,
  }));
}

/**
 * Updates a document verification rule (Super Admin only)
 */
export async function updateRuleStatus(
  adminId: string,
  role: string,
  documentType: string,
  isMandatory: boolean,
  providerSubtype?: string | null
): Promise<boolean> {
  const sql = getNeonSqlClient();
  await sql`
    UPDATE document_verification_rules
    SET 
      is_mandatory = ${isMandatory},
      updated_by = ${adminId},
      updated_at = NOW()
    WHERE role = ${role}::user_role_enum
      AND document_type = ${documentType}
      AND (
        provider_subtype IS NULL 
        OR provider_subtype = ${providerSubtype || null}::provider_subtype_enum
      );
  `;
  return true;
}

