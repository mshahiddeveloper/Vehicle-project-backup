import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function normalizePakistaniPhone(raw: string): { clean: string; waStandard: string; local: string; plusStandard: string } {
  const digits = String(raw).replace(/\D/g, '');
  let waStandard = digits;
  if (digits.startsWith('0')) {
    waStandard = '92' + digits.slice(1);
  } else if (digits.startsWith('92')) {
    waStandard = digits;
  } else if (digits.length === 10 && digits.startsWith('3')) {
    waStandard = '92' + digits;
  }
  const local = waStandard.startsWith('92') ? '0' + waStandard.slice(2) : waStandard;
  const plusStandard = '+' + waStandard;

  return {
    clean: digits,
    waStandard,
    local,
    plusStandard,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone') || '';
    const rawEmail = searchParams.get('email') || '';

    if (!rawPhone && !rawEmail) {
      return NextResponse.json(
        { exists: false, error: 'Phone or email parameter is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const sql = getNeonSqlClient();
    let phoneExists = false;
    let emailExists = false;
    let existingUser: any = null;

    if (rawPhone) {
      const norm = normalizePakistaniPhone(rawPhone);
      // Query Neon PostgreSQL `users` table
      const userRows = await sql`
        SELECT id, phone, email, full_name, role, provider_subtype, city
        FROM users
        WHERE phone = ${norm.waStandard}
           OR phone = ${norm.local}
           OR phone = ${norm.plusStandard}
           OR phone = ${norm.clean}
        LIMIT 1;
      `;

      if (userRows.length > 0) {
        phoneExists = true;
        existingUser = userRows[0];
      } else {
        // Also check legacy `User` table
        try {
          const legacyRows = await sql`
            SELECT id, phone, email, "userType" as role
            FROM "User"
            WHERE phone = ${norm.waStandard}
               OR phone = ${norm.local}
               OR phone = ${norm.plusStandard}
               OR phone = ${norm.clean}
            LIMIT 1;
          `;
          if (legacyRows.length > 0) {
            phoneExists = true;
            existingUser = legacyRows[0];
          }
        } catch {}
      }
    }

    if (rawEmail && !phoneExists) {
      const cleanEmail = rawEmail.trim().toLowerCase();
      const emailRows = await sql`
        SELECT id, phone, email, full_name, role, provider_subtype, city
        FROM users
        WHERE email IS NOT NULL AND LOWER(email) = ${cleanEmail}
        LIMIT 1;
      `;
      if (emailRows.length > 0) {
        emailExists = true;
        existingUser = emailRows[0];
      }
    }

    if (phoneExists || emailExists) {
      return NextResponse.json(
        {
          exists: true,
          matchType: phoneExists ? 'phone' : 'email',
          role: existingUser?.role || 'CUSTOMER',
          name: existingUser?.full_name || existingUser?.name || 'Existing User',
          phone: existingUser?.phone,
          message: phoneExists
            ? 'An account with this phone number is already registered. Please sign in instead.'
            : 'An account with this email address is already registered. Please sign in instead.',
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      {
        exists: false,
        message: 'Phone number and credentials are available for registration.',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('Check Phone Error:', error);
    return NextResponse.json(
      { exists: false, error: error?.message || 'Database lookup failure.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone || '';
    const rawEmail = body.email || '';

    const url = new URL(req.url);
    if (rawPhone) url.searchParams.set('phone', rawPhone);
    if (rawEmail) url.searchParams.set('email', rawEmail);

    return GET(new NextRequest(url.toString(), { headers: req.headers }));
  } catch (error: any) {
    return NextResponse.json(
      { exists: false, error: error?.message || 'Invalid payload.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
