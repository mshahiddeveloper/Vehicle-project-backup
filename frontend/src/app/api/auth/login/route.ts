import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLogServer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VAULT_SALT = 'safarpk_sec_v2_9f83b1c8e2d4a7f05b19e6c384d2a1f7';

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function verifyPasswordPbkdf2(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;

  // 1. Check if hash is in standard format pbkdf2_sha256$<iter>$<salt>$<hash>
  if (storedHash.startsWith('pbkdf2_sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || 100000;
      const salt = parts[2];
      const expectedHash = parts[3];

      const derived = crypto.pbkdf2Sync(plainPassword, salt + VAULT_SALT, iterations, 32, 'sha256');
      return timingSafeEqual(derived.toString('hex'), expectedHash);
    }
  }

  // 2. Fallback check for legacy SHA-256 or demo passwords
  const enc = crypto.createHash('sha256').update(plainPassword + 'safarpk_salt_2026').digest('hex');
  if (timingSafeEqual(enc, storedHash)) return true;

  return timingSafeEqual(plainPassword, storedHash);
}

export async function GET() {
  return NextResponse.json({ status: 'healthy', route: 'auth/login' });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please enter your phone number or email address.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Please enter your account password.' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    const cleanPhone = trimmed.replace(/[\s\-\(\)]/g, '');
    const phoneSuffix = cleanPhone.replace(/^\+92|^0092|^0/, '').slice(-9);
    const cleanEmail = trimmed.toLowerCase();

    const sql = getNeonSqlClient();

    // 1. First check enterprise `users` table
    let users = await sql`
      SELECT 
        id, 
        phone, 
        email, 
        password_hash, 
        full_name, 
        business_name, 
        role, 
        provider_subtype, 
        city, 
        country_code, 
        kyc_status, 
        is_blocked, 
        created_at
      FROM users
      WHERE 
        phone = ${cleanPhone}
        OR phone LIKE ${'%' + phoneSuffix}
        OR (email IS NOT NULL AND email = ${cleanEmail})
      LIMIT 1;
    `;

    let matchedUser: any = null;

    if (users.length > 0) {
      const u = users[0];
      if (u.is_blocked) {
        return NextResponse.json(
          { success: false, error: 'This account has been temporarily suspended. Please contact SafarPK support.' },
          { status: 403 }
        );
      }

      const isValid = verifyPasswordPbkdf2(password, u.password_hash);
      if (!isValid) {
        await logAuditEvent({
          actorId: u.id,
          actorRole: u.role,
          actionType: 'USER_LOGIN_FAILED',
          targetResource: 'USER',
          resourceId: u.id,
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
          stateDelta: { reason: 'INVALID_CREDENTIALS' },
        });

        return NextResponse.json(
          { success: false, error: 'Incorrect password. Please verify and try again.' },
          { status: 401 }
        );
      }

      matchedUser = {
        id: u.id,
        phone: u.phone,
        email: u.email,
        name: u.full_name,
        businessName: u.business_name,
        role: u.role,
        providerSubtype: u.provider_subtype,
        city: u.city,
        countryCode: u.country_code || 'PK',
        kycStatus: u.kyc_status,
      };
    } else {
      // 2. Fallback check legacy `User` table
      const legacyUsers = await sql`
        SELECT 
          u.id, 
          u.phone, 
          u.email, 
          u."passwordHash", 
          u."userType", 
          u."accountStatus", 
          u.metadata,
          cp.city as cp_city,
          lp."businessName" as lp_business_name
        FROM "User" u
        LEFT JOIN "CustomerProfile" cp ON cp."userId" = u.id
        LEFT JOIN "ListerProfile" lp ON lp."userId" = u.id
        WHERE 
          u.phone = ${cleanPhone}
          OR u.phone LIKE ${'%' + phoneSuffix}
          OR (u.email IS NOT NULL AND LOWER(u.email) = ${cleanEmail})
        LIMIT 1;
      `;

      if (legacyUsers.length === 0) {
        // 3. Check platform_staff table (for agents logging in via regular login)
        const staffRows = await sql`
          SELECT id, username, email, phone, password_hash, role, full_name, is_active
          FROM platform_staff
          WHERE 
            LOWER(username) = ${cleanEmail}
            OR (email IS NOT NULL AND LOWER(email) = ${cleanEmail})
            OR phone = ${cleanPhone}
            OR phone LIKE ${'%' + phoneSuffix}
          LIMIT 1;
        `;

        if (staffRows.length > 0) {
          const staff = staffRows[0];
          if (!staff.is_active) {
            return NextResponse.json(
              { success: false, error: 'This administrative account has been deactivated.' },
              { status: 403 }
            );
          }

          const isValidStaff = verifyPasswordPbkdf2(password, staff.password_hash);
          if (!isValidStaff) {
            return NextResponse.json(
              { success: false, error: 'Incorrect password. Please verify and try again.' },
              { status: 401 }
            );
          }

          matchedUser = {
            id: staff.id,
            phone: staff.phone,
            email: staff.email,
            name: staff.full_name,
            role: staff.role,
            city: 'Islamabad',
            countryCode: 'PK',
          };
        } else {
          return NextResponse.json(
            { success: false, error: 'No account found with this phone number or email address.' },
            { status: 404 }
          );
        }
      } else {
        const lu = legacyUsers[0];
        const isValid = verifyPasswordPbkdf2(password, lu.passwordHash || '');
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Incorrect password. Please verify and try again.' },
            { status: 401 }
          );
        }

        const meta = typeof lu.metadata === 'string' ? JSON.parse(lu.metadata || '{}') : (lu.metadata || {});
        const role = lu.userType || 'CUSTOMER';
        const name = meta.name || 'SafarPK Member';
        const city = meta.city || lu.cp_city || 'Lahore';
        const businessName = meta.businessName || lu.lp_business_name || undefined;

        matchedUser = {
          id: lu.id,
          phone: lu.phone,
          email: lu.email,
          name,
          businessName,
          role,
          city,
          countryCode: 'PK',
        };
      }
    }

    // 3. Log audit event asynchronously without blocking login response (<150ms instant login)
    logAuditEvent({
      actorId: matchedUser.id,
      actorRole: matchedUser.role,
      actionType: 'USER_LOGIN_SUCCESS',
      targetResource: 'USER',
      resourceId: matchedUser.id,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    }).catch((e) => console.warn('Login audit log note:', e));

    // 4. Set HttpOnly, Secure, SameSite=Strict cookie
    const res = NextResponse.json(
      {
        success: true,
        user: matchedUser,
        message: 'Authentication successful.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );

    await setSessionCookie(res, matchedUser);
    return res;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal database authentication failure.' },
      { status: 500 }
    );
  }
}
