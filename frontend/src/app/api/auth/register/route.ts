import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLogServer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VAULT_SALT = 'safarpk_sec_v2_9f83b1c8e2d4a7f05b19e6c384d2a1f7';

function hashPasswordPbkdf2(plainPassword: string, salt = 'safarpk_user_salt'): string {
  const iterations = 100000;
  const derived = crypto.pbkdf2Sync(plainPassword, salt + VAULT_SALT, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${derived.toString('hex')}`;
}

export async function GET() {
  return NextResponse.json({ status: 'healthy', route: 'auth/register' });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { name, phone, email, password, role, city, businessName, cnic, licenseNumber, providerSubtype } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { success: false, error: 'Name and phone number are required.' },
        { status: 400 }
      );
    }

    const rawDigits = phone.replace(/\D/g, '').trim();
    const standardWaPhone = rawDigits.startsWith('0')
      ? '92' + rawDigits.slice(1)
      : rawDigits.startsWith('92')
      ? rawDigits
      : rawDigits.length === 10 && rawDigits.startsWith('3')
      ? '92' + rawDigits
      : rawDigits;
    const localPhone = standardWaPhone.startsWith('92') ? '0' + standardWaPhone.slice(2) : standardWaPhone;
    const plusPhone = '+' + standardWaPhone;

    const cleanPhone = standardWaPhone;
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanCity = city ? city.trim() : 'Karachi';
    const cleanRole = role || 'CUSTOMER';
    const cleanSubtype = providerSubtype || (cleanRole === 'PROVIDER' ? 'PICK_AND_DROP' : null);

    const sql = getNeonSqlClient();
    const kmsKey = process.env.KMS_ENCRYPTION_KEY || 'safarpk_master_kms_key_2026';

    // 1. Strict Registration Duplicate Guard: NEVER OVERWRITE EXISTING ACCOUNTS
    const existing = await sql`
      SELECT id, role, full_name, phone, email 
      FROM users 
      WHERE phone = ${standardWaPhone}
         OR phone = ${localPhone}
         OR phone = ${plusPhone}
         OR phone = ${rawDigits}
         OR (email IS NOT NULL AND LOWER(email) = ${cleanEmail})
      LIMIT 1;
    `;

    if (existing.length > 0) {
      const match = existing[0];
      const matchType = (match.email && cleanEmail && match.email.toLowerCase() === cleanEmail)
        ? 'email address'
        : 'phone number';

      return NextResponse.json(
        {
          success: false,
          alreadyExists: true,
          error: `An account with this ${matchType} is already registered. Please sign in instead.`,
          existingRole: match.role,
        },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    let passwordHash = password ? hashPasswordPbkdf2(password) : hashPasswordPbkdf2('password123');

    // 2. Insert new user with optional pgcrypto encrypted PII
    const encCnicQuery = cnic ? sql`pgp_sym_encrypt(${cnic.trim()}, ${kmsKey})` : sql`NULL`;
    const encLicQuery = licenseNumber ? sql`pgp_sym_encrypt(${licenseNumber.trim()}, ${kmsKey})` : sql`NULL`;

    const insertRows = await sql`
      INSERT INTO users (
        phone,
        phone_verified,
        phone_locked,
        email,
        email_verified,
        password_hash,
        full_name,
        business_name,
        role,
        provider_subtype,
        city,
        country_code,
        kyc_status,
        encrypted_cnic,
        encrypted_license
      ) VALUES (
        ${cleanPhone},
        TRUE,
        TRUE,
        ${cleanEmail},
        FALSE,
        ${passwordHash},
        ${name.trim()},
        ${businessName ? businessName.trim() : null},
        ${cleanRole}::user_role_enum,
        ${cleanSubtype ? cleanSubtype : null}::provider_subtype_enum,
        ${cleanCity},
        'PK',
        'UNVERIFIED',
        ${encCnicQuery},
        ${encLicQuery}
      )
      RETURNING id;
    `;
    const userId: string = insertRows[0].id;

    // 3. Asynchronously dual-sync to legacy tables & log audit event without blocking client response (<150ms instant response)
    (async () => {
      try {
        let countryResult = await sql`SELECT id FROM "Country" WHERE code = 'PK' LIMIT 1`;
        let countryId = countryResult[0]?.id || 'country-pk';

        await sql`
          INSERT INTO "User" (
            id, phone, "phoneCountryCode", email, "passwordHash", "userType", "accountStatus", "countryId", metadata, "updatedAt"
          ) VALUES (
            ${userId},
            ${cleanPhone},
            '+92',
            ${cleanEmail},
            ${passwordHash},
            ${cleanRole},
            'APPROVED',
            ${countryId},
            ${JSON.stringify({ name: name.trim(), city: cleanCity, businessName: businessName || null })},
            NOW()
          )
          ON CONFLICT (phone) DO NOTHING;
        `;

        const parts = name.trim().split(' ');
        const firstName = parts[0] || name;
        const lastName = parts.slice(1).join(' ') || (cleanRole === 'CUSTOMER' ? 'Member' : 'Partner');

        if (cleanRole === 'CUSTOMER') {
          await sql`
            INSERT INTO "CustomerProfile" (id, "userId", "firstName", "lastName", city, "identityVerified", "updatedAt")
            VALUES (${`cp-${Date.now()}`}, ${userId}, ${firstName}, ${lastName}, ${cleanCity}, false, NOW())
            ON CONFLICT ("userId") DO NOTHING;
          `;
        } else if (cleanRole === 'LISTER') {
          await sql`
            INSERT INTO "ListerProfile" (id, "userId", "firstName", "lastName", "businessName", "listerType", city, "updatedAt")
            VALUES (${`lp-${Date.now()}`}, ${userId}, ${firstName}, ${lastName}, ${businessName || `${name}'s Fleet`}, 'INDIVIDUAL', ${cleanCity}, NOW())
            ON CONFLICT ("userId") DO NOTHING;
          `;
        } else if (cleanRole === 'DRIVER') {
          await sql`
            INSERT INTO "DriverProfile" (id, "userId", "firstName", "lastName", "licenseNumber", city, "driverStatus", "updatedAt")
            VALUES (${`dp-${Date.now()}`}, ${userId}, ${firstName}, ${lastName}, 'PENDING', ${cleanCity}, 'ACTIVE', NOW())
            ON CONFLICT ("userId") DO NOTHING;
          `;
        }
      } catch (e) {
        console.warn('Legacy table dual-sync note:', e);
      }

      // 4. Log audit event
      logAuditEvent({
        actorId: userId,
        actorRole: cleanRole,
        actionType: 'USER_REGISTERED',
        targetResource: 'USER',
        resourceId: userId,
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
        stateDelta: { phone: cleanPhone, role: cleanRole, city: cleanCity },
      }).catch((e) => console.warn('Audit log error:', e));
    })().catch(() => {});

    // 5. Build response and set HttpOnly, Secure, SameSite=Strict session cookie
    const userPayload = {
      id: userId,
      phone: cleanPhone,
      email: cleanEmail || undefined,
      name: name.trim(),
      role: cleanRole,
      providerSubtype: cleanSubtype || undefined,
      city: cleanCity,
    };

    const res = NextResponse.json(
      {
        success: true,
        userId,
        user: userPayload,
        message: 'Account successfully registered and persisted into Neon PostgreSQL 16.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );

    await setSessionCookie(res, userPayload);
    return res;
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal database registration failure.' },
      { status: 500 }
    );
  }
}
