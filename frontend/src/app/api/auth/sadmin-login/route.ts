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

  const enc = crypto.createHash('sha256').update(plainPassword + 'safarpk_salt_2026').digest('hex');
  if (timingSafeEqual(enc, storedHash)) return true;

  return timingSafeEqual(plainPassword, storedHash);
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
        { success: false, error: 'Please enter staff username or email address.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Please enter staff master password.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const sql = getNeonSqlClient();

    // Query exclusively from isolated `platform_staff` table
    const staffMembers = await sql`
      SELECT 
        id,
        username,
        email,
        phone,
        password_hash,
        role,
        full_name,
        permissions,
        is_active
      FROM platform_staff
      WHERE 
        LOWER(username) = ${cleanIdentifier}
        OR LOWER(email) = ${cleanIdentifier}
        OR phone = ${identifier.trim()}
      LIMIT 1;
    `;

    if (staffMembers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrative credentials.' },
        { status: 401 }
      );
    }

    const staff = staffMembers[0];

    if (!staff.is_active) {
      return NextResponse.json(
        { success: false, error: 'This administrative account has been deactivated.' },
        { status: 403 }
      );
    }

    const isValid = verifyPasswordPbkdf2(password, staff.password_hash);
    if (!isValid) {
      await logAuditEvent({
        actorId: staff.id,
        actorRole: staff.role,
        actionType: 'STAFF_LOGIN_FAILED',
        targetResource: 'STAFF',
        resourceId: staff.id,
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
        stateDelta: { reason: 'INVALID_STAFF_PASSWORD' },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid administrative credentials.' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await sql`
      UPDATE platform_staff
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${staff.id};
    `;

    // Audit log successful login
    await logAuditEvent({
      actorId: staff.id,
      actorRole: staff.role,
      actionType: 'STAFF_LOGIN_SUCCESS',
      targetResource: 'STAFF',
      resourceId: staff.id,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
      stateDelta: { role: staff.role, username: staff.username },
    });

    const userPayload = {
      id: staff.id,
      username: staff.username,
      email: staff.email,
      phone: staff.phone,
      name: staff.full_name,
      role: staff.role as 'SUPER_ADMIN' | 'AGENT',
      permissions: staff.permissions || { all: true },
      city: 'Islamabad',
      countryCode: 'PK',
      isStaff: true,
    };

    const res = NextResponse.json(
      {
        success: true,
        message: 'Administrative authentication successful',
        user: userPayload,
        redirectUrl: '/sadmin',
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );

    await setSessionCookie(res, {
      id: staff.id,
      role: staff.role,
      phone: staff.phone,
      email: staff.email,
      name: staff.full_name,
    });

    return res;
  } catch (error: any) {
    console.error('Staff Login Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error occurred during administrative login.' },
      { status: 500 }
    );
  }
}

