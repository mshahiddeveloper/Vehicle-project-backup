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
    const { name, phone, email, password, role, city, businessName } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { success: false, error: 'Name and phone number are required.' },
        { status: 400 }
      );
    }

    const sql = getNeonSqlClient();

    // 1. Ensure Country PK exists
    let countryResult = await sql`SELECT id FROM "Country" WHERE code = 'PK' LIMIT 1`;
    let countryId: string;

    if (countryResult.length === 0) {
      countryId = 'country-pk';
      await sql`
        INSERT INTO "Country" (id, code, name, "phoneCode", "currencyCode", "currencySymbol", status, "isDefault", "updatedAt")
        VALUES (${countryId}, 'PK', 'Pakistan', '+92', 'PKR', 'Rs', 'ACTIVE', true, NOW())
        ON CONFLICT (code) DO UPDATE SET status = 'ACTIVE'
      `;
      const refetched = await sql`SELECT id FROM "Country" WHERE code = 'PK' LIMIT 1`;
      countryId = refetched[0]?.id || countryId;
    } else {
      countryId = countryResult[0].id;
    }

    // 2. Normalize phone
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').trim();

    // 3. Hash password
    const passwordHash = password
      ? crypto.createHash('sha256').update(password + 'safarpk_salt_2026').digest('hex')
      : null;

    const userId = `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const userType = role || 'CUSTOMER';

    // 4. Upsert User record
    await sql`
      INSERT INTO "User" (
        id, phone, "phoneCountryCode", email, "passwordHash", "userType", "accountStatus", "countryId", metadata, "updatedAt"
      ) VALUES (
        ${userId},
        ${cleanPhone},
        '+92',
        ${email || null},
        ${passwordHash},
        ${userType},
        'APPROVED',
        ${countryId},
        ${JSON.stringify({ name, city: city || 'Lahore', businessName: businessName || null })},
        NOW()
      )
      ON CONFLICT (phone) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, "User".email),
        "userType" = EXCLUDED."userType",
        metadata = EXCLUDED.metadata,
        "updatedAt" = NOW()
    `;

    // 5. Create Profile according to role
    const parts = name.split(' ');
    const firstName = parts[0] || name;
    const lastName = parts.slice(1).join(' ') || (userType === 'CUSTOMER' ? 'Member' : 'Partner');

    if (userType === 'CUSTOMER') {
      await sql`
        INSERT INTO "CustomerProfile" (id, "userId", "firstName", "lastName", city, "identityVerified", "updatedAt")
        VALUES (${`cp-${Date.now()}`}, ${userId}, ${firstName}, ${lastName}, ${city || 'Lahore'}, false, NOW())
        ON CONFLICT ("userId") DO NOTHING
      `;
    } else if (userType === 'LISTER') {
      await sql`
        INSERT INTO "ListerProfile" (id, "userId", "firstName", "lastName", "businessName", "listerType", city, "updatedAt")
        VALUES (${`lp-${Date.now()}`}, ${userId}, ${firstName}, ${lastName}, ${businessName || `${name} Fleet`}, 'BUSINESS_LISTER', ${city || 'Lahore'}, NOW())
        ON CONFLICT ("userId") DO NOTHING
      `;
    } else if (userType === 'DRIVER') {
      await sql`
        INSERT INTO "DriverProfile" (id, "userId", "firstName", "lastName", city, "updatedAt")
        VALUES (${`dp-${Date.now()}`}, ${userId}, ${firstName}, ${lastName}, ${city || 'Lahore'}, NOW())
        ON CONFLICT ("userId") DO NOTHING
      `;
    }

    const userPayload = {
      id: userId,
      name: name.trim(),
      businessName: businessName || undefined,
      phone: cleanPhone,
      email: email || undefined,
      city: city || 'Lahore',
      countryCode: 'PK',
      role: userType,
      registeredAt: new Date().toISOString(),
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

    return NextResponse.json({
      success: true,
      userId,
      user: userPayload,
      message: 'Account successfully registered and persisted in Neon PostgreSQL 16.',
    });
  } catch (error: any) {
    console.error('Error in registration API:', error);
    // Even if database has network jitter, return structured response so client is not blocked
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Database error during registration',
      },
      { status: 500 }
    );
  }
}

