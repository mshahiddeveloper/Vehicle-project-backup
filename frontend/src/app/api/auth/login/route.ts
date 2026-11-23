import { NextRequest, NextResponse } from 'next/server';
import { getNeonSqlClient } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const trimmed = identifier.trim();
    const cleanPhone = trimmed.replace(/[\s\-\(\)]/g, '');
    const phoneSuffix = cleanPhone.replace(/^\+92|^0092|^0/, '').slice(-9);
    const cleanEmail = trimmed.toLowerCase();

    const sql = getNeonSqlClient();

    // Query User by phone or email, joining their profile
    const users = await sql`
      SELECT 
        u.id, 
        u.phone, 
        u."phoneCountryCode", 
        u.email, 
        u."passwordHash", 
        u."userType", 
        u."accountStatus", 
        u.metadata,
        u."createdAt",
        cp.id as cp_id, 
        cp."firstName" as cp_first_name, 
        cp."lastName" as cp_last_name, 
        cp.city as cp_city,
        lp.id as lp_id, 
        lp."businessName" as lp_business_name, 
        lp.city as lp_city,
        dp.id as dp_id, 
        dp."firstName" as dp_first_name,
        dp."lastName" as dp_last_name, 
        dp.city as dp_city
      FROM "User" u
      LEFT JOIN "CustomerProfile" cp ON cp."userId" = u.id
      LEFT JOIN "ListerProfile" lp ON lp."userId" = u.id
      LEFT JOIN "DriverProfile" dp ON dp."userId" = u.id
      WHERE u.phone = ${cleanPhone}
         OR u.phone = ${'+92' + phoneSuffix}
         OR u.phone LIKE ${'%' + phoneSuffix}
         OR LOWER(u.email) = ${cleanEmail}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No account registered with this phone number or email address.' },
        { status: 404 }
      );
    }

    const dbUser = users[0];

    // Password verification
    if (dbUser.passwordHash && password) {
      const incomingHash = crypto
        .createHash('sha256')
        .update(password + 'safarpk_salt_2026')
        .digest('hex');

      const matchesHash = incomingHash === dbUser.passwordHash;
      const matchesPlain = password === dbUser.passwordHash; // Legacy fallback

      if (!matchesHash && !matchesPlain) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password. Please verify your password and try again.' },
          { status: 401 }
        );
      }
    }

    // Parse metadata
    let meta: any = {};
    if (dbUser.metadata) {
      try {
        meta = typeof dbUser.metadata === 'string' ? JSON.parse(dbUser.metadata) : dbUser.metadata;
      } catch (e) {
        meta = {};
      }
    }

    // Determine displayName
    let displayName = meta.name;
    if (!displayName) {
      if (dbUser.cp_first_name) {
        displayName = `${dbUser.cp_first_name} ${dbUser.cp_last_name || ''}`.trim();
      } else if (dbUser.dp_first_name) {
        displayName = `${dbUser.dp_first_name} ${dbUser.dp_last_name || ''}`.trim();
      } else if (dbUser.lp_business_name) {
        displayName = dbUser.lp_business_name;
      } else {
        displayName = 'Valued Member';
      }
    }

    const userPayload = {
      id: dbUser.id,
      name: displayName,
      businessName: dbUser.lp_business_name || meta.businessName || undefined,
      phone: dbUser.phone,
      email: dbUser.email || undefined,
      city: meta.city || dbUser.cp_city || dbUser.lp_city || dbUser.dp_city || 'Lahore',
      countryCode: 'PK',
      role: dbUser.userType || 'CUSTOMER',
      registeredAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
      subscription: {
        status: 'ACTIVE',
        quota: 10,
        usedQuota: 0,
      },
      metrics: {
        viewCount: 0,
        leadsCount: 0,
        clickCount: 0,
        lastActive: 'Just now',
      },
      activities: [],
    };

    // Update lastLoginAt asynchronously
    sql`UPDATE "User" SET "lastLoginAt" = NOW() WHERE id = ${dbUser.id}`.catch(() => {});

    return NextResponse.json({
      success: true,
      user: userPayload,
      message: 'Login successful.',
    });
  } catch (error: any) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Database error occurred during login.',
      },
      { status: 500 }
    );
  }
}
